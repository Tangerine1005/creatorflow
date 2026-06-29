/* ============================================
   MobileTabBar — 모바일 하단 탭 네비게이션
   768px 미만에서만 표시, 글래스모피즘
   ============================================ */

import { NavLink } from 'react-router-dom';
import {
  Home,
  Sparkles,
  FolderOpen,
  CalendarDays,
  Settings,
} from 'lucide-react';
import styles from './MobileTabBar.module.css';

/* 탭 메뉴 정의 */
const tabs = [
  { to: '/', icon: Home, label: '홈' },
  { to: '/create', icon: Sparkles, label: '생성' },
  { to: '/library', icon: FolderOpen, label: '라이브러리' },
  { to: '/calendar', icon: CalendarDays, label: '캘린더' },
  { to: '/settings', icon: Settings, label: '설정' },
];

export default function MobileTabBar() {
  return (
    <nav className={styles.tabBar}>
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.active : ''}`
          }
          aria-label={tab.label}
        >
          <tab.icon size={20} className={styles.tabIcon} />
          <span className={styles.tabLabel}>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
