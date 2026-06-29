/**
 * Skeleton 로딩 플레이스홀더 컴포넌트
 *
 * 데이터 로딩 중 컨텐츠 영역을 시각적으로 대체합니다.
 * - variant: 'text' | 'circular' | 'rectangular' | 'card'
 * - width, height 으로 크기 지정
 * - lines (text 변형 전용): 여러 줄 스켈레톤
 *
 * @example
 * <Skeleton variant="circular" width={48} height={48} />
 * <Skeleton variant="text" lines={3} />
 * <Skeleton variant="card" width="100%" height={200} />
 */

import styles from './Skeleton.module.css';

export default function Skeleton({
  variant = 'text',       // 'text' | 'circular' | 'rectangular' | 'card'
  width,
  height,
  lines = 1,             // text 변형에서 줄 수
  className = '',
  style: customStyle = {},
}) {
  // 크기를 px 또는 원시 값으로 변환
  const toUnit = (v) => (typeof v === 'number' ? `${v}px` : v);

  const baseStyle = {
    width: toUnit(width),
    height: toUnit(height),
    ...customStyle,
  };

  const variantClass = styles[variant] || styles.text;

  // text 변형에서 여러 줄 렌더
  if (variant === 'text' && lines > 1) {
    return (
      <div className={`${styles.textGroup} ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${styles.skeleton} ${styles.text}`}
            style={i === lines - 1 ? { ...baseStyle, width: '60%' } : baseStyle}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${styles.skeleton} ${variantClass} ${className}`}
      style={baseStyle}
    />
  );
}
