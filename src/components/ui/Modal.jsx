/**
 * Modal 컴포넌트
 *
 * 글래스모피즘 스타일의 모달 다이얼로그.
 * - isOpen / onClose 로 열림/닫힘 제어
 * - ESC 키 & 백드롭 클릭으로 닫기
 * - size: 'sm' | 'md' | 'lg' | 'fullscreen'
 * - footer 슬롯 지원
 *
 * @example
 * <Modal isOpen={open} onClose={() => setOpen(false)} title="확인" size="md">
 *   <p>본문 내용</p>
 *   <Modal.Footer>
 *     <Button>취소</Button>
 *     <Button variant="primary">확인</Button>
 *   </Modal.Footer>
 * </Modal>
 */

import { useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

/* ── 메인 Modal 컴포넌트 ── */
export default function Modal({
  isOpen = false,
  onClose,
  title,
  size = 'md',          // 'sm' | 'md' | 'lg' | 'fullscreen'
  children,
  footer,               // footer 슬롯 (별도 prop 방식)
  className = '',
}) {
  const modalRef = useRef(null);

  // ESC 키로 닫기
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // 모달 열릴 때 body 스크롤 잠금
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  // 열릴 때 모달에 포커스 이동
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  // 백드롭 클릭 핸들러
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && onClose) onClose();
  };

  // children 에서 Modal.Footer 를 분리
  const footerContent = footer;

  const sizeClass = styles[size] || styles.md;

  const modalMarkup = (
    <div
      className={`${styles.backdrop} ${isOpen ? styles.open : ''}`}
      onClick={handleBackdropClick}
      aria-hidden={!isOpen}
    >
      <div
        ref={modalRef}
        className={`${styles.modal} ${sizeClass} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        {/* 헤더 */}
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="닫기"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        {/* 본문 */}
        <div className={styles.body}>{children}</div>

        {/* 푸터 (옵션) */}
        {footerContent && (
          <div className={styles.footer}>{footerContent}</div>
        )}
      </div>
    </div>
  );

  // Portal 로 document.body 에 렌더
  return createPortal(modalMarkup, document.body);
}
