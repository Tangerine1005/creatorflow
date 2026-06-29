/**
 * Input 컴포넌트
 *
 * @param {string}  type       - 'text' | 'email' | 'password' | 'search' | 'url'
 * @param {string}  label      - 인풋 라벨
 * @param {string}  placeholder
 * @param {string}  error      - 에러 메시지 (있으면 에러 스타일 적용)
 * @param {string}  helperText - 보조 설명 텍스트
 * @param {number}  maxLength  - 최대 글자 수 (카운터 표시)
 * @param {string}  value      - 현재 값
 * @param {boolean} disabled
 * @param {React.ReactNode} leftIcon
 * @param {React.ReactNode} rightIcon
 */

import { forwardRef } from 'react';
import styles from './Input.module.css';

const Input = forwardRef(function Input(
  {
    type = 'text',
    label,
    placeholder,
    error,
    helperText,
    maxLength,
    value,
    disabled = false,
    leftIcon,
    rightIcon,
    className = '',
    id,
    ...rest
  },
  ref
) {
  // 고유 ID 생성 (label ↔ input 연결용)
  const inputId = id || (label ? `input-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

  // 글자 수 계산
  const currentLength = typeof value === 'string' ? value.length : 0;
  const showCounter = maxLength != null;

  // 카운터 색상 결정
  const counterClass = (() => {
    if (!showCounter) return '';
    const ratio = currentLength / maxLength;
    if (ratio >= 1) return styles.counterDanger;
    if (ratio >= 0.8) return styles.counterWarning;
    return '';
  })();

  // 인풋 클래스 조합
  const inputClassNames = [
    styles.input,
    leftIcon && styles.hasLeftIcon,
    rightIcon && styles.hasRightIcon,
    error && styles.inputError,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.wrapper}>
      {/* 라벨 */}
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}

      {/* 인풋 + 아이콘 컨테이너 */}
      <div className={styles.inputContainer}>
        <input
          ref={ref}
          id={inputId}
          type={type}
          placeholder={placeholder}
          value={value}
          maxLength={maxLength}
          disabled={disabled}
          className={inputClassNames}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...rest}
        />
        {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
        {rightIcon && <span className={styles.rightIcon}>{rightIcon}</span>}
      </div>

      {/* 하단 행: 에러/헬퍼 텍스트 + 카운터 */}
      {(error || helperText || showCounter) && (
        <div className={styles.bottomRow}>
          {error ? (
            <span id={`${inputId}-error`} className={styles.errorMessage} role="alert">
              {error}
            </span>
          ) : helperText ? (
            <span className={styles.helperText}>{helperText}</span>
          ) : (
            <span /> /* 카운터 우측 정렬용 빈 공간 */
          )}

          {showCounter && (
            <span className={`${styles.counter} ${counterClass}`}>
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

export default Input;
