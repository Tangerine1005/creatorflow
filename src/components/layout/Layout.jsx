/* ============================================
   Layout — 전체 레이아웃 래퍼
   Sidebar + Header + main content + MobileTabBar
   ============================================ */

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileTabBar from './MobileTabBar';
import Onboarding from '../Onboarding';
import OfflineIndicator from '../ui/OfflineIndicator';
import styles from './Layout.module.css';

export default function Layout() {
  /* 사이드바 접기/펼치기 상태 */
  const [collapsed, setCollapsed] = useState(false);

  const handleToggleSidebar = () => {
    setCollapsed((prev) => !prev);
  };

  return (
    <div className={styles.layout}>
      {/* 사이드바 (데스크톱) */}
      <Sidebar collapsed={collapsed} onToggle={handleToggleSidebar} />

      {/* 메인 영역 (헤더 + 콘텐츠) */}
      <div
        className={styles.mainWrapper}
        style={{
          '--current-sidebar-width': collapsed
            ? 'var(--sidebar-collapsed)'
            : 'var(--sidebar-width)',
        }}
      >
        <Header onMenuToggle={handleToggleSidebar} />

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>

      {/* 모바일 하단 탭바 */}
      <MobileTabBar />

      {/* 온보딩 가이드 투어 */}
      <Onboarding />

      {/* 오프라인 상태 배너 */}
      <OfflineIndicator />
    </div>
  );
}
