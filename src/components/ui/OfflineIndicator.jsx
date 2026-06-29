/* ============================================
   OfflineIndicator — 오프라인 상태 배너
   네트워크 끊김 시 상단에 경고 배너 표시
   ============================================ */

import { Wifi, WifiOff, RefreshCw, CloudOff, Check } from 'lucide-react';
import { useOffline } from '../../hooks/useOffline';
import styles from './OfflineIndicator.module.css';

export default function OfflineIndicator() {
  const { isOnline, pendingCount, syncStatus } = useOffline();

  // 온라인 + 큐 없음 → 표시 안 함
  if (isOnline && pendingCount === 0 && syncStatus === 'idle') {
    return null;
  }

  return (
    <div className={`${styles.banner} ${
      !isOnline ? styles.offline :
      syncStatus === 'syncing' ? styles.syncing :
      syncStatus === 'done' ? styles.done :
      styles.pending
    }`}>
      <div className={styles.content}>
        {!isOnline && (
          <>
            <WifiOff size={16} />
            <span>오프라인 상태입니다. 변경 사항은 로컬에 저장됩니다.</span>
          </>
        )}

        {isOnline && syncStatus === 'syncing' && (
          <>
            <RefreshCw size={16} className={styles.spinning} />
            <span>동기화 중... ({pendingCount}개 항목)</span>
          </>
        )}

        {isOnline && syncStatus === 'done' && (
          <>
            <Check size={16} />
            <span>동기화 완료!</span>
          </>
        )}

        {isOnline && pendingCount > 0 && syncStatus === 'idle' && (
          <>
            <CloudOff size={16} />
            <span>{pendingCount}개의 미동기화 항목이 있습니다.</span>
          </>
        )}
      </div>
    </div>
  );
}
