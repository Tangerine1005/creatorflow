// CreatorFlow — 헬퍼 함수 모음

/**
 * 클래스 이름 조합 유틸리티
 * 조건부 클래스 이름 적용에 사용
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * 글자 수 포맷팅 (예: 1,234)
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  return num.toLocaleString('ko-KR');
}

/**
 * 큰 숫자 포맷팅 (예: 1.2만, 35.4만, 120만)
 */
export function formatCompactNumber(num) {
  if (num === null || num === undefined) return '0';
  if (num < 1000) return num.toString();
  if (num < 10000) return `${(num / 1000).toFixed(1)}천`;
  if (num < 100000000) return `${(num / 10000).toFixed(1)}만`;
  return `${(num / 100000000).toFixed(1)}억`;
}

/**
 * 날짜 포맷팅 (KST 기준)
 */
export function formatDate(date, format = 'short') {
  const d = new Date(date);
  const options = { timeZone: 'Asia/Seoul' };

  switch (format) {
    case 'full':
      return d.toLocaleDateString('ko-KR', { ...options, year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    case 'short':
      return d.toLocaleDateString('ko-KR', { ...options, year: 'numeric', month: '2-digit', day: '2-digit' });
    case 'time':
      return d.toLocaleTimeString('ko-KR', { ...options, hour: '2-digit', minute: '2-digit' });
    case 'datetime':
      return d.toLocaleString('ko-KR', { ...options, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    case 'relative':
      return getRelativeTime(d);
    default:
      return d.toLocaleDateString('ko-KR', options);
  }
}

/**
 * 상대 시간 표시 (예: "3분 전", "2시간 전", "어제")
 */
export function getRelativeTime(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days === 1) return '어제';
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  if (days < 365) return `${Math.floor(days / 30)}개월 전`;
  return `${Math.floor(days / 365)}년 전`;
}

/**
 * UUID 생성
 */
export function generateId() {
  return crypto.randomUUID();
}

/**
 * 초대 코드 생성 (8자리 영숫자)
 */
export function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * 예상 재생 시간 계산 (한국어 기준 분당 약 300자)
 */
export function estimateReadingTime(text) {
  if (!text) return 0;
  const charCount = text.replace(/\s/g, '').length;
  const seconds = Math.round((charCount / 300) * 60);
  return seconds;
}

/**
 * 초를 "MM:SS" 형태로 포맷
 */
export function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 텍스트 글자 수 (공백 제외)
 */
export function countChars(text) {
  if (!text) return 0;
  return text.replace(/\s/g, '').length;
}

/**
 * 파일 사이즈 포맷팅
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * 디바운스
 */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * 쓰로틀
 */
export function throttle(fn, limit = 300) {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * 클립보드 복사
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * 색상 랜덤 생성 (썸네일 배색용)
 */
export function generateRandomPalette() {
  const hue = Math.floor(Math.random() * 360);
  return {
    primary: `hsl(${hue}, 70%, 55%)`,
    secondary: `hsl(${(hue + 30) % 360}, 65%, 60%)`,
    accent: `hsl(${(hue + 180) % 360}, 60%, 50%)`,
    background: `hsl(${hue}, 25%, 15%)`,
  };
}

/**
 * 슬러그 생성 (URL용)
 */
export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣ㄱ-ㅎ\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * 배열 셔플
 */
export function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
