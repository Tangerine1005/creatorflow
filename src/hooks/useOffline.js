/* ============================================
   useOffline — 오프라인 감지 + 로컬 큐 훅
   네트워크 상태 감지, 오프라인 시 로컬 큐 저장,
   재연결 시 자동 동기화
   ============================================ */

import { useState, useEffect, useCallback, useRef } from 'react';

const QUEUE_KEY = 'creatorflow-offline-queue';

/**
 * 오프라인 큐에서 대기 중인 작업 목록 가져오기
 */
function getQueue() {
  try {
    const stored = localStorage.getItem(QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * 큐에 작업 저장
 */
function saveQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/**
 * useOffline 훅
 * - isOnline: 현재 네트워크 상태
 * - queueAction: 오프라인일 때 작업을 큐에 저장
 * - pendingCount: 대기 중인 작업 수
 * - syncStatus: 'idle' | 'syncing' | 'done' | 'error'
 */
export function useOffline() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState(getQueue().length);
  const [syncStatus, setSyncStatus] = useState('idle');
  const syncingRef = useRef(false);

  // 네트워크 상태 리스너
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // 재연결 시 큐 동기화 시도
      syncQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 큐 동기화 (재연결 시)
  const syncQueue = useCallback(async () => {
    if (syncingRef.current) return;

    const queue = getQueue();
    if (queue.length === 0) return;

    syncingRef.current = true;
    setSyncStatus('syncing');

    try {
      // 각 큐 아이템을 순차적으로 처리
      const remaining = [];
      for (const item of queue) {
        try {
          // 실제 Supabase 연동 시 여기서 API 호출
          // 현재는 개발 모드이므로 성공으로 처리
          console.log('📤 동기화:', item.type, item.data);
          // await processQueueItem(item);
        } catch (err) {
          console.error('큐 동기화 실패:', err);
          remaining.push(item);
        }
      }

      saveQueue(remaining);
      setPendingCount(remaining.length);
      setSyncStatus(remaining.length > 0 ? 'error' : 'done');

      // 3초 후 상태 초기화
      setTimeout(() => setSyncStatus('idle'), 3000);
    } finally {
      syncingRef.current = false;
    }
  }, []);

  // 오프라인일 때 작업을 큐에 추가
  const queueAction = useCallback((type, data) => {
    const queue = getQueue();
    queue.push({
      id: crypto.randomUUID(),
      type,
      data,
      timestamp: new Date().toISOString(),
    });
    saveQueue(queue);
    setPendingCount(queue.length);
    console.log('📥 오프라인 큐에 저장:', type);
    return true;
  }, []);

  // 큐 비우기
  const clearQueue = useCallback(() => {
    saveQueue([]);
    setPendingCount(0);
  }, []);

  return {
    isOnline,
    pendingCount,
    syncStatus,
    queueAction,
    syncQueue,
    clearQueue,
  };
}

export default useOffline;
