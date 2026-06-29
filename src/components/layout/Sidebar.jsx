/* ============================================
   Sidebar — 사이드바 네비게이션
   접기/펼치기, 글래스모피즘, NavLink 활성 표시
   ============================================ */

import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  FolderOpen,
  FileText,
  CalendarDays,
  BarChart3,
  TrendingUp,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import styles from './Sidebar.module.css';

/* 네비게이션 메뉴 아이템 정의 */
const navItems = [
  { to: '/', icon: LayoutDashboard, label: '대시보드' },
  { to: '/create', icon: Sparkles, label: '콘텐츠 생성', id: 'nav-create' },
  { to: '/library', icon: FolderOpen, label: '라이브러리', id: 'nav-library' },
  { to: '/templates', icon: FileText, label: '템플릿' },
  { to: '/calendar', icon: CalendarDays, label: '캘린더' },
  { to: '/analytics', icon: BarChart3, label: '분석' },
  { to: '/trends', icon: TrendingUp, label: '트렌드', id: 'nav-trends' },
  { to: '/team', icon: Users, label: '팀' },
];

const bottomItems = [
  { to: '/settings', icon: Settings, label: '설정', id: 'nav-settings' },
];

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      {/* 로고 영역 */}
      <div className={styles.logoArea}>
        {!collapsed && (
          <h1 className={styles.logo}>
            <span className={styles.logoText}>Creator</span>
            <span className={styles.logoAccent}>Flow</span>
          </h1>
        )}
        {collapsed && (
          <span className={styles.logoIcon}>C</span>
        )}
        <button
          className={styles.toggleBtn}
          onClick={onToggle}
          aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
          title={collapsed ? '펼치기' : '접기'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* 메인 네비게이션 */}
      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {navItems.map((item) => (
            <li key={item.to} className={styles.navItem}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                id={item.id}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.active : ''}`
                }
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={20} className={styles.navIcon} />
                {!collapsed && (
                  <span className={styles.navLabel}>{item.label}</span>
                )}
                {/* collapsed 상태 툴팁 */}
                {collapsed && (
                  <span className={styles.tooltip}>{item.label}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* 구분선 */}
        <div className={styles.divider} />

        {/* 하단 메뉴 (설정) */}
        <ul className={styles.navList}>
          {bottomItems.map((item) => (
            <li key={item.to} className={styles.navItem}>
              <NavLink
                to={item.to}
                id={item.id}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.active : ''}`
                }
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={20} className={styles.navIcon} />
                {!collapsed && (
                  <span className={styles.navLabel}>{item.label}</span>
                )}
                {collapsed && (
                  <span className={styles.tooltip}>{item.label}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
