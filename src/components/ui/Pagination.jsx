/**
 * Pagination 컴포넌트
 *
 * - currentPage, totalPages, onPageChange 로 제어
 * - 이전/다음 버튼 (ChevronLeft, ChevronRight)
 * - 페이지 번호 + 생략(...) 표시
 * - 반응형 (모바일에서 네비게이션 텍스트 숨김)
 *
 * @example
 * <Pagination
 *   currentPage={3}
 *   totalPages={20}
 *   onPageChange={(page) => setPage(page)}
 * />
 */

import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Pagination.module.css';

/**
 * 표시할 페이지 번호 배열을 생성합니다.
 * 앞/뒤 생략(...) 을 포함합니다.
 *
 * @param {number} current - 현재 페이지
 * @param {number} total   - 전체 페이지 수
 * @param {number} siblings - 현재 페이지 좌우 표시 개수 (기본 1)
 * @returns {(number|string)[]} 페이지 번호 또는 '...'
 */
function generatePages(current, total, siblings = 1) {
  // 전체 페이지가 작으면 모두 표시
  const totalSlots = siblings * 2 + 5; // 1 ... [s] [c] [s] ... last
  if (total <= totalSlots) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(current - siblings, 1);
  const rightSibling = Math.min(current + siblings, total);

  const showLeftDots = leftSibling > 2;
  const showRightDots = rightSibling < total - 1;

  const pages = [];

  // 첫 페이지
  pages.push(1);

  // 왼쪽 생략
  if (showLeftDots) {
    pages.push('left-dots');
  } else {
    // 2부터 leftSibling-1 까지 추가
    for (let i = 2; i < leftSibling; i++) pages.push(i);
  }

  // 현재 주변 페이지
  for (let i = leftSibling; i <= rightSibling; i++) {
    if (i !== 1 && i !== total) pages.push(i);
  }

  // 오른쪽 생략
  if (showRightDots) {
    pages.push('right-dots');
  } else {
    for (let i = rightSibling + 1; i < total; i++) pages.push(i);
  }

  // 마지막 페이지
  if (total > 1) pages.push(total);

  return pages;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblings = 1,
  className = '',
}) {
  const pages = useMemo(
    () => generatePages(currentPage, totalPages, siblings),
    [currentPage, totalPages, siblings],
  );

  if (totalPages <= 1) return null;

  return (
    <nav className={`${styles.pagination} ${className}`} aria-label="페이지네이션">
      {/* 이전 버튼 */}
      <button
        className={`${styles.pageButton} ${styles.navButton}`}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="이전 페이지"
        type="button"
      >
        <ChevronLeft size={16} />
        <span className={styles.navLabel}>이전</span>
      </button>

      {/* 페이지 번호 */}
      {pages.map((page) => {
        if (typeof page === 'string') {
          // 생략 기호
          return (
            <span key={page} className={styles.ellipsis} aria-hidden="true">
              ···
            </span>
          );
        }

        const isActive = page === currentPage;
        return (
          <button
            key={page}
            className={`${styles.pageButton} ${isActive ? styles.active : ''}`}
            onClick={() => !isActive && onPageChange(page)}
            aria-current={isActive ? 'page' : undefined}
            aria-label={`페이지 ${page}`}
            type="button"
          >
            {page}
          </button>
        );
      })}

      {/* 다음 버튼 */}
      <button
        className={`${styles.pageButton} ${styles.navButton}`}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="다음 페이지"
        type="button"
      >
        <span className={styles.navLabel}>다음</span>
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
