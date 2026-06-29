/* ============================================
   App — React Router 설정 + 코드 스플리팅
   React.lazy로 페이지별 동적 import → 초기 번들 사이즈 대폭 감소
   ============================================ */

import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/ui/LoadingSpinner';

// 페이지 lazy imports (코드 스플리팅)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CreatorStudio = lazy(() => import('./pages/CreatorStudio'));
const Library = lazy(() => import('./pages/Library'));
const Templates = lazy(() => import('./pages/Templates'));
const CalendarPage = lazy(() => import('./pages/Calendar'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Trends = lazy(() => import('./pages/Trends'));
const Team = lazy(() => import('./pages/Team'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const LoginPage = lazy(() => import('./pages/Login'));
const TeamSetupPage = lazy(() => import('./pages/TeamSetup'));

// i18n 초기화
import './i18n';

/* ============================================
   라우트 설정
   ============================================ */
export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <Routes>
        {/* Layout 내부 라우트 (사이드바 + 헤더 포함) */}
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="create" element={<CreatorStudio />} />
          <Route path="library" element={<Library />} />
          <Route path="templates" element={<Templates />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="trends" element={<Trends />} />
          <Route path="team" element={<Team />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Layout 밖 라우트 (독립 페이지) */}
        <Route path="login" element={<LoginPage />} />
        <Route path="setup" element={<TeamSetupPage />} />
      </Routes>
    </Suspense>
  );
}
