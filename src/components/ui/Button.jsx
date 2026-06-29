/**
 * Button 컴포넌트
 *
 * @param {string}  variant   - 'primary' | 'secondary' | 'ghost' | 'danger'
 * @param {string}  size      - 'sm' | 'md' | 'lg'
 * @param {boolean} loading   - 로딩 스피너 표시
 * @param {boolean} disabled  - 비활성 상태
 * @param {boolean} fullWidth - 전체 너비 사용
 * @param {React.ReactNode} leftIcon  - 왼쪽 아이콘
 * @param {React.ReactNode} rightIcon - 오른쪽 아이콘
 * @param {React.ReactNode} children  - 버튼 텍스트/내용
 */

import { forwardRef } from 'react';
import styles from './Button.module.css';

const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    children,
    className = '',
    ...rest
  },
  ref
) {
  // 클래스 조합
  const classNames = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    loading && styles.loading,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      ref={ref}
      className={classNames}
      disabled={disabled || loading}
      {...rest}
    >
      {/* 로딩 스피너 - 절대 위치로 중앙에 표시 */}
      {loading && (
        <span className={styles.spinnerWrapper}>
          <span className={styles.spinner} />
        </span>
      )}

      {/* 버튼 내용 - 로딩 중엔 시각적으로 숨김(레이아웃 유지) */}
      <span className={loading ? styles.loadingContent : undefined}>
        {leftIcon && <span className={styles.iconLeft}>{leftIcon}</span>}
        {children}
        {rightIcon && <span className={styles.iconRight}>{rightIcon}</span>}
      </span>
    </button>
  );
});

export default Button;
