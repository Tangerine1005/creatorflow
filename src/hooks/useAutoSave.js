/* ============================================
   useAutoSave — 자동 저장 훅 (30초 간격)
   변경 감지 + 자동 저장 + 시각적 인디케이터 상태
   ============================================ */

import { useState, useEffect, useCallback, useRef } from 'react';
import useSettingsStore from '../stores/settingsStore';

/**
 * useAutoSave 훅
 * @param {Function} saveFn - 저장 실행 함수 (async 가능)
 * @param {any} data - 변경 감지할 데이터
 * @param {Object} options - { enabled, interval }
 * @returns {Object} { saveStatus, lastSavedAt, save, isDirty }
 */
export function useAutoSave(saveFn, data, options = {}) {
  const { enabled = true } = options;
  const interval = useSettingsStore((s) => s.autoSaveInterval);

  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  const lastDataRef = useRef(JSON.stringify(data));
  const timerRef = useRef(null);
  const saveFnRef = useRef(saveFn);
  saveFnRef.current = saveFn;

  // 데이터 변경 감지
  useEffect(() => {
    const current = JSON.stringify(data);
    if (current !== lastDataRef.current) {
      setIsDirty(true);
      lastDataRef.current = current;
    }
  }, [data]);

  // 수동 저장
  const save = useCallback(async () => {
    if (!isDirty) return;

    setSaveStatus('saving');
    try {
      await saveFnRef.current();
      setSaveStatus('saved');
      setLastSavedAt(new Date());
      setIsDirty(false);

      // 2초 후 idle로 복귀
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('자동 저장 실패:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [isDirty]);

  // 자동 저장 타이머
  useEffect(() => {
    if (!enabled || !isDirty) return;

    timerRef.current = setInterval(() => {
      if (isDirty) {
        save();
      }
    }, interval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [enabled, isDirty, interval, save]);

  // 페이지 이탈 시 저장 경고
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '저장되지 않은 변경사항이 있습니다.';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  /**
   * 마지막 저장 시간 텍스트
   */
  const getLastSavedText = useCallback(() => {
    if (!lastSavedAt) return '';
    const diff = Math.round((Date.now() - lastSavedAt.getTime()) / 1000);
    if (diff < 5) return '방금 저장됨';
    if (diff < 60) return `${diff}초 전 저장됨`;
    const mins = Math.floor(diff / 60);
    return `${mins}분 전 저장됨`;
  }, [lastSavedAt]);

  return {
    saveStatus,
    lastSavedAt,
    save,
    isDirty,
    getLastSavedText,
  };
}

export default useAutoSave;
