/**
 * ThemeToggle 컴포넌트
 *
 * 다크/라이트 테마를 전환하는 토글 스위치.
 * - document.documentElement 의 data-theme 속성 변경
 * - localStorage 에 테마 상태 저장 & 복원
 * - Sun ↔ Moon 아이콘 교차 애니메이션
 *
 * @example
 * <ThemeToggle showLabel />
 */

import { useState, useEffect, useCallback } from 'react';
import { Sun, Moon } from 'lucide-react';
import styles from './ThemeToggle.module.css';

const STORAGE_KEY = 'creatorflow-theme';

/**
 * 초기 테마를 결정합니다.
 * 1. localStorage 저장값 우선
 * 2. 시스템 prefers-color-scheme 참고
 * 3. 기본값: 'dark'
 */
function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark';

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;

  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
}

export default function ThemeToggle({ showLabel = false, className = '' }) {
  const [theme, setTheme] = useState(getInitialTheme);

  // 테마가 변경될 때마다 DOM & localStorage 동기화
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const isDark = theme === 'dark';

  return (
    <button
      className={`${styles.toggle} ${isDark ? styles.dark : ''} ${className}`}
      onClick={toggleTheme}
      aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
      type="button"
    >
      {/* 슬라이딩 트랙 */}
      <div className={styles.track}>
        <div className={styles.thumb}>
          <div className={styles.iconWrapper}>
            <span className={styles.sunIcon}>
              <Sun size={12} />
            </span>
            <span className={styles.moonIcon}>
              <Moon size={12} />
            </span>
          </div>
        </div>
      </div>

      {/* 선택적 라벨 */}
      {showLabel && (
        <span className={styles.label}>
          {isDark ? '다크 모드' : '라이트 모드'}
        </span>
      )}
    </button>
  );
}
