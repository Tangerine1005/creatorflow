// CreatorFlow — 상수 정의
// YouTube, 콘텐츠, UI 관련 상수들

// YouTube 제한사항
export const YOUTUBE = {
  TITLE_MAX_LENGTH: 100,
  TITLE_RECOMMENDED_LENGTH: 70,
  DESCRIPTION_MAX_LENGTH: 5000,
  HASHTAG_MAX_COUNT: 60,
  HASHTAG_RECOMMENDED_COUNT: 15,
  THUMBNAIL_WIDTH: 1280,
  THUMBNAIL_HEIGHT: 720,
  THUMBNAIL_MAX_SIZE_MB: 2,
  SHORTS_MAX_SECONDS: 60,
  DAILY_QUOTA_UNITS: 10000,
  UPLOAD_COST_UNITS: 1600,
  SEARCH_COST_UNITS: 100,
  STATS_COST_UNITS: 1,
};

// AI 이미지 크레딧
export const CREDITS = {
  DEFAULT_DAILY_IMAGE_LIMIT: 50,
  WARNING_THRESHOLD: 10,
  DANGER_THRESHOLD: 3,
  THUMBNAILS_PER_GENERATION: 3,
};

// 콘텐츠 상태
export const CONTENT_STATUS = {
  DRAFT: 'draft',
  COMPLETED: 'completed',
  SCHEDULED: 'scheduled',
  PUBLISHED: 'published',
};

// 콘텐츠 카테고리
export const CATEGORIES = [
  { value: 'work', label: '직장공감', labelEn: 'Work Life' },
  { value: 'daily', label: '일상공감', labelEn: 'Daily Life' },
  { value: 'trending', label: '시사/트렌드', labelEn: 'Trending' },
];

// 톤 옵션
export const TONES = [
  { value: 'funny', label: '재미있게', labelEn: 'Funny', emoji: '😂' },
  { value: 'empathy', label: '공감되게', labelEn: 'Empathetic', emoji: '🥺' },
  { value: 'direct', label: '직설적으로', labelEn: 'Direct', emoji: '💪' },
  { value: 'powerful', label: '팔력있게', labelEn: 'Powerful', emoji: '🔥' },
];

// 언어 옵션
export const LANGUAGES = [
  { value: 'ko', label: '한국어', flag: '🇰🇷' },
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'both', label: '한국어 + English', flag: '🌐' },
];

// 유튜브 공개 범위
export const PRIVACY_OPTIONS = [
  { value: 'public', label: '공개', labelEn: 'Public' },
  { value: 'unlisted', label: '미등록', labelEn: 'Unlisted' },
  { value: 'private', label: '비공개', labelEn: 'Private' },
];

// 팀 역할
export const TEAM_ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
};

export const ROLE_LABELS = {
  admin: { ko: '관리자', en: 'Admin' },
  editor: { ko: '에디터', en: 'Editor' },
  viewer: { ko: '뷰어', en: 'Viewer' },
};

// Creator Studio 단계
export const CREATOR_STEPS = [
  { key: 'step1', label: '주제 설정', labelEn: 'Topic', icon: 'Lightbulb' },
  { key: 'step2', label: '스크립트', labelEn: 'Script', icon: 'FileText' },
  { key: 'step3', label: '메타데이터', labelEn: 'Metadata', icon: 'Hash' },
  { key: 'step4', label: '썸네일', labelEn: 'Thumbnail', icon: 'Image' },
];

// 자동 저장 간격 (밀리초)
export const AUTO_SAVE_INTERVAL = 30000; // 30초

// YouTube 통계 캐싱 간격 (밀리초)
export const STATS_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24시간

// 페이지네이션
export const PAGE_SIZE = 20;

// 트렌드 소스
export const TREND_SOURCES = [
  { value: 'google', label: 'Google Trends', icon: 'Globe' },
  { value: 'youtube', label: 'YouTube', icon: 'Youtube' },
  { value: 'naver', label: '네이버 트렌드', icon: 'Search' },
];

// 라우트 경로
export const ROUTES = {
  LOGIN: '/login',
  SETUP: '/setup',
  DASHBOARD: '/',
  CREATE: '/create',
  LIBRARY: '/library',
  TEMPLATES: '/templates',
  CALENDAR: '/calendar',
  ANALYTICS: '/analytics',
  TRENDS: '/trends',
  TEAM: '/team',
  SETTINGS: '/settings',
};

// 페이지 제목 매핑
export const PAGE_TITLES = {
  '/': { ko: '대시보드', en: 'Dashboard' },
  '/create': { ko: '콘텐츠 생성', en: 'Creator Studio' },
  '/library': { ko: '라이브러리', en: 'Library' },
  '/templates': { ko: '템플릿', en: 'Templates' },
  '/calendar': { ko: '캘린더', en: 'Calendar' },
  '/analytics': { ko: '분석', en: 'Analytics' },
  '/trends': { ko: '트렌드', en: 'Trends' },
  '/team': { ko: '팀 관리', en: 'Team' },
  '/settings': { ko: '설정', en: 'Settings' },
};
