/* ============================================
   ThemeToggle — 다크/라이트 테마 전환 버튼
   data-theme 속성을 토글하여 CSS 변수 테마 전환
   ============================================ */

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import styles from './ThemeToggle.module.css';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    // 로컬스토리지에서 저장된 테마 확인, 없으면 dark
    if (typeof window !== 'undefined') {
      return localStorage.getItem('creatorflow-theme') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('creatorflow-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <button
      className={styles.toggle}
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
      title={theme === 'dark' ? '라이트 모드' : '다크 모드'}
    >
      <span className={styles.iconWrapper}>
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </span>
    </button>
  );
}
