/* ============================================
   Header — 상단 헤더
   검색바 (실시간 검색), 테마 전환, 알림 패널, 프로필 드롭다운
   ============================================ */

import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search, Bell, Menu, Settings, Users, LogOut,
  AlertTriangle, UserPlus, Clock, Check,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import ThemeToggle from '../ui/ThemeToggle';
import { mockContents } from '../../mocks/mockData';
import styles from './Header.module.css';

/* 경로별 페이지 제목 매핑 */
const pageTitles = {
  '/': '대시보드',
  '/create': '콘텐츠 생성',
  '/library': '라이브러리',
  '/templates': '템플릿',
  '/calendar': '캘린더',
  '/analytics': '분석',
  '/trends': '트렌드',
  '/team': '팀',
  '/settings': '설정',
};

/* 알림 목 데이터 */
const initialNotifications = [
  {
    id: 'notif-1',
    icon: AlertTriangle,
    color: 'warning',
    title: '크레딧 알림',
    message: '오늘 이미지 생성 47/50 잔여',
    time: new Date(Date.now() - 1000 * 60 * 12), // 12분 전
    read: false,
  },
  {
    id: 'notif-2',
    icon: UserPlus,
    color: 'info',
    title: '새 팀원',
    message: '이에디터님이 팀에 참여했습니다',
    time: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2시간 전
    read: false,
  },
  {
    id: 'notif-3',
    icon: Clock,
    color: 'accent',
    title: '예약 콘텐츠',
    message: "'MZ세대 퇴사 이유' 발행 예정",
    time: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5시간 전
    read: false,
  },
];

export default function Header({ onMenuToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitle = pageTitles[location.pathname] || '페이지';

  /* ── 드롭다운 상태 ── */
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);

  /* ── Ref (바깥 클릭 감지) ── */
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const searchRef = useRef(null);

  const [currentUser, setCurrentUser] = useState(null);
  
  useEffect(() => {
    import('../../services/auth').then(({ default: authService }) => {
      authService.getUser().then(({ user }) => {
        if (user) {
          setCurrentUser(user);
        }
      });
    });
  }, []);

  /* ── 상호 배타적 드롭다운 열기 ── */
  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev);
    setShowProfile(false);
    setShowSearch(false);
  };

  const toggleProfile = () => {
    setShowProfile((prev) => !prev);
    setShowNotifications(false);
    setShowSearch(false);
  };

  /* ── 바깥 클릭 닫기 ── */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ── 검색 로직 ── */
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return mockContents.filter(
      (c) =>
        c.topic?.toLowerCase().includes(q) ||
        c.titles?.some((t) => t.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setShowSearch(true);
    setShowNotifications(false);
    setShowProfile(false);
  };

  const handleSearchResultClick = (content) => {
    setShowSearch(false);
    setSearchQuery('');
    // status에 따라 적절한 페이지로 이동
    if (content.status === 'draft') {
      navigate('/create');
    } else {
      navigate('/library');
    }
  };

  /* ── 알림 관련 ── */
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  /* ── 프로필 네비게이션 ── */
  const handleProfileNav = (path) => {
    setShowProfile(false);
    navigate(path);
  };

  const handleLogout = async () => {
    const { default: authService } = await import('../../services/auth');
    await authService.signOut();
    navigate('/login', { replace: true });
  };

  const displayName = currentUser?.user_metadata?.display_name || '유저';
  const initialChar = displayName.charAt(0);

  return (
    <header className={styles.header}>
      {/* 모바일 햄버거 메뉴 */}
      <button
        className={styles.menuBtn}
        onClick={onMenuToggle}
        aria-label="메뉴 열기"
      >
        <Menu size={22} />
      </button>

      {/* 왼쪽: 페이지 제목 */}
      <div className={styles.left}>
        <h2 className={styles.pageTitle}>{pageTitle}</h2>
      </div>

      {/* 가운데: 검색바 */}
      <div className={styles.center} ref={searchRef}>
        <div className={styles.searchBar}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="검색..."
            className={styles.searchInput}
            aria-label="검색"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => {
              if (searchQuery.trim()) setShowSearch(true);
            }}
          />
          <kbd className={styles.shortcutHint}>⌘K</kbd>
        </div>

        {/* 검색 결과 드롭다운 */}
        {showSearch && searchQuery.trim() && (
          <div className={styles.dropdown}>
            {searchResults.length > 0 ? (
              <ul className={styles.searchResults}>
                {searchResults.map((item) => (
                  <li key={item.id}>
                    <button
                      className={styles.searchResultItem}
                      onClick={() => handleSearchResultClick(item)}
                    >
                      <Search size={14} className={styles.searchResultIcon} />
                      <div className={styles.searchResultText}>
                        <span className={styles.searchResultTitle}>
                          {item.titles?.[item.selectedTitleIndex] || item.topic}
                        </span>
                        <span className={styles.searchResultMeta}>
                          {item.category} · {item.status}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.emptyState}>
                <Search size={20} />
                <span>검색 결과 없음</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 오른쪽: ThemeToggle + 알림 + 프로필 */}
      <div className={styles.right}>
        <ThemeToggle />

        {/* ── 알림 ── */}
        <div className={styles.dropdownWrapper} ref={notifRef}>
          <button
            className={styles.iconBtn}
            aria-label="알림"
            onClick={toggleNotifications}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className={`${styles.badge} ${styles.badgePulse}`} />
            )}
          </button>

          {showNotifications && (
            <div className={`${styles.dropdown} ${styles.notifPanel}`}>
              {/* 헤더 */}
              <div className={styles.dropdownHeader}>
                <h3 className={styles.dropdownTitle}>알림</h3>
                {unreadCount > 0 && (
                  <button className={styles.markReadBtn} onClick={markAllRead}>
                    <Check size={14} />
                    모두 읽음
                  </button>
                )}
              </div>

              {/* 알림 목록 */}
              {notifications.length > 0 ? (
                <ul className={styles.notifList}>
                  {notifications.map((notif) => {
                    const Icon = notif.icon;
                    return (
                      <li
                        key={notif.id}
                        className={`${styles.notifItem} ${
                          notif.read ? styles.notifRead : ''
                        }`}
                      >
                        <span
                          className={`${styles.notifIcon} ${
                            styles[`notifIcon_${notif.color}`]
                          }`}
                        >
                          <Icon size={16} />
                        </span>
                        <div className={styles.notifContent}>
                          <span className={styles.notifTitle}>
                            {notif.title}
                          </span>
                          <span className={styles.notifMessage}>
                            {notif.message}
                          </span>
                          <span className={styles.notifTime}>
                            {formatDistanceToNow(notif.time, {
                              addSuffix: true,
                              locale: ko,
                            })}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className={styles.emptyState}>
                  <Bell size={24} />
                  <span>새 알림이 없습니다</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 프로필 ── */}
        <div className={styles.dropdownWrapper} ref={profileRef}>
          <button
            className={styles.avatar}
            aria-label="프로필"
            onClick={toggleProfile}
          >
            <span className={styles.avatarText}>{initialChar}</span>
          </button>

          {showProfile && (
            <div className={`${styles.dropdown} ${styles.profilePanel}`}>
              {/* 유저 정보 */}
              <div className={styles.profileHeader}>
                <div className={styles.profileAvatar}>
                  <span>{initialChar}</span>
                </div>
                <div className={styles.profileInfo}>
                  <span className={styles.profileName}>{displayName}</span>
                  <span className={styles.profileEmail}>
                    {currentUser?.email || ''}
                  </span>
                </div>
                <span className={styles.profileBadge}>유저</span>
              </div>

              <div className={styles.dropdownDivider} />

              {/* 메뉴 링크 */}
              <ul className={styles.profileMenu}>
                <li>
                  <button
                    className={styles.profileMenuItem}
                    onClick={() => handleProfileNav('/settings')}
                  >
                    <Settings size={16} />
                    설정
                  </button>
                </li>
                <li>
                  <button
                    className={styles.profileMenuItem}
                    onClick={() => handleProfileNav('/team')}
                  >
                    <Users size={16} />
                    팀 관리
                  </button>
                </li>
              </ul>

              <div className={styles.dropdownDivider} />

              {/* 로그아웃 */}
              <button
                className={`${styles.profileMenuItem} ${styles.logoutBtn}`}
                onClick={handleLogout}
              >
                <LogOut size={16} />
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
