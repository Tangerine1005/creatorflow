/**
 * Card 컴포넌트
 *
 * @param {string}  variant  - 'default' | 'elevated' | 'interactive'
 * @param {string}  padding  - 'none' | 'sm' | 'md' | 'lg'
 * @param {React.ReactNode} header   - 카드 상단 슬롯
 * @param {React.ReactNode} footer   - 카드 하단 슬롯
 * @param {React.ReactNode} children - 카드 본문 내용
 */

import { forwardRef } from 'react';
import styles from './Card.module.css';

/* 패딩 값을 CSS 클래스로 매핑 */
const paddingMap = {
  none: styles.paddingNone,
  sm: styles.paddingSm,
  md: styles.paddingMd,
  lg: styles.paddingLg,
};

const Card = forwardRef(function Card(
  {
    variant = 'default',
    padding = 'md',
    header,
    footer,
    children,
    className = '',
    ...rest
  },
  ref
) {
  const classNames = [
    styles.card,
    styles[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={ref} className={classNames} {...rest}>
      {/* 헤더 슬롯 */}
      {header && <div className={styles.header}>{header}</div>}

      {/* 본문 - padding 클래스 적용 */}
      <div className={`${styles.body} ${paddingMap[padding] || paddingMap.md}`}>
        {children}
      </div>

      {/* 푸터 슬롯 */}
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
});

export default Card;
