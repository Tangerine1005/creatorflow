/**
 * Toast 알림 시스템
 *
 * - ToastProvider 로 앱을 감싸고, useToast 훅으로 토스트를 발행합니다.
 * - type: 'success' | 'error' | 'warning' | 'info'
 * - 자동 사라짐 (기본 3000ms, duration prop 으로 조정)
 * - slideInRight 진입 애니메이션
 *
 * @example
 * // App.jsx
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 *
 * // 사용처
 * const toast = useToast();
 * toast.success('저장 완료!', '영상이 성공적으로 저장되었습니다.');
 * toast.error('오류 발생', '네트워크 연결을 확인하세요.');
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';
import styles from './Toast.module.css';

/* ── 타입별 아이콘 매핑 ── */
const ICON_MAP = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

/* ── Toast Context ── */
const ToastContext = createContext(null);

/* ── 개별 Toast 아이템 ── */
function ToastItem({ id, type = 'info', message, description, duration = 3000, onRemove }) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef(null);
  const IconComponent = ICON_MAP[type] || Info;

  // 자동 닫기 타이머
  useEffect(() => {
    if (duration > 0) {
      timerRef.current = setTimeout(() => {
        handleClose();
      }, duration);
    }
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  const handleClose = useCallback(() => {
    setExiting(true);
    // 퇴장 애니메이션 후 제거
    setTimeout(() => onRemove(id), 300);
  }, [id, onRemove]);

  return (
    <div
      className={`${styles.toast} ${styles[type]} ${exiting ? styles.exiting : ''}`}
      role="alert"
    >
      {/* 아이콘 */}
      <div className={styles.icon}>
        <IconComponent size={20} />
      </div>

      {/* 텍스트 */}
      <div className={styles.content}>
        <p className={styles.message}>{message}</p>
        {description && <p className={styles.description}>{description}</p>}
      </div>

      {/* 닫기 버튼 */}
      <button
        className={styles.closeButton}
        onClick={handleClose}
        aria-label="닫기"
        type="button"
      >
        <X size={16} />
      </button>

      {/* 프로그레스 바 */}
      {duration > 0 && (
        <div
          className={styles.progressBar}
          style={{ animationDuration: `${duration}ms` }}
        />
      )}
    </div>
  );
}

/* ── ToastProvider ── */
let toastIdCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // 편의 메서드 모음
  const toastApi = useRef({
    success: (message, description, duration) =>
      addToast({ type: 'success', message, description, duration }),
    error: (message, description, duration) =>
      addToast({ type: 'error', message, description, duration }),
    warning: (message, description, duration) =>
      addToast({ type: 'warning', message, description, duration }),
    info: (message, description, duration) =>
      addToast({ type: 'info', message, description, duration }),
    custom: (toast) => addToast(toast),
    dismiss: (id) => removeToast(id),
  });

  // addToast / removeToast 가 변경되면 ref 갱신
  useEffect(() => {
    toastApi.current = {
      success: (message, description, duration) =>
        addToast({ type: 'success', message, description, duration }),
      error: (message, description, duration) =>
        addToast({ type: 'error', message, description, duration }),
      warning: (message, description, duration) =>
        addToast({ type: 'warning', message, description, duration }),
      info: (message, description, duration) =>
        addToast({ type: 'info', message, description, duration }),
      custom: (toast) => addToast(toast),
      dismiss: (id) => removeToast(id),
    };
  }, [addToast, removeToast]);

  return (
    <ToastContext.Provider value={toastApi}>
      {children}
      {createPortal(
        <div className={styles.container} aria-live="polite">
          {toasts.map((t) => (
            <ToastItem key={t.id} {...t} onRemove={removeToast} />
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

/* ── useToast 훅 ── */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast 는 <ToastProvider> 내부에서 사용해야 합니다.');
  }
  return ctx.current;
}
