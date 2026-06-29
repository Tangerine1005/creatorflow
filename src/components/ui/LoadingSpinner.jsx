/**
 * LoadingSpinner — 전역 로딩 스피너
 * React.lazy 코드 스플리팅의 Suspense fallback으로 사용
 */

import styles from './LoadingSpinner.module.css';

export default function LoadingSpinner({ fullScreen = false, size = 'md', text }) {
  return (
    <div className={`${styles.container} ${fullScreen ? styles.fullScreen : ''}`}>
      <div className={`${styles.spinner} ${styles[size]}`}>
        <div className={styles.ring} />
        <div className={styles.ring} />
        <div className={styles.ring} />
      </div>
      {text && <p className={styles.text}>{text}</p>}
    </div>
  );
}
