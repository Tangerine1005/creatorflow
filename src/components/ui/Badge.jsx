/**
 * Badge 컴포넌트
 *
 * @param {string}  variant - 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent'
 * @param {string}  size    - 'sm' | 'md'
 * @param {boolean} dot     - dot 인디케이터 표시 여부
 * @param {boolean} pulse   - dot 펄스 애니메이션 활성화
 * @param {React.ReactNode} children - 뱃지 텍스트
 */

import styles from './Badge.module.css';

function Badge({
  variant = 'default',
  size = 'md',
  dot = false,
  pulse = false,
  children,
  className = '',
  ...rest
}) {
  // children이 없고 dot만 있으면 dot-only 모드
  const isDotOnly = dot && !children;

  const classNames = [
    styles.badge,
    styles[variant],
    styles[size],
    pulse && styles.pulse,
    isDotOnly && styles.dotOnly,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classNames} {...rest}>
      {dot && <span className={styles.dot} />}
      {children}
    </span>
  );
}

export default Badge;
