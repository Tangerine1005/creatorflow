/**
 * Select 컴포넌트
 *
 * @param {string}  label       - 셀렉트 라벨
 * @param {Array}   options     - [{value, label}] 형태의 옵션 배열
 * @param {string}  placeholder - 미선택 시 표시 텍스트
 * @param {string}  value       - 현재 선택된 값
 * @param {string}  error       - 에러 메시지
 * @param {boolean} disabled
 * @param {function} onChange
 */

import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './Select.module.css';

const Select = forwardRef(function Select(
  {
    label,
    options = [],
    placeholder = '선택하세요',
    value,
    error,
    disabled = false,
    className = '',
    id,
    ...rest
  },
  ref
) {
  const selectId = id || (label ? `select-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

  const selectClassNames = [
    styles.select,
    error && styles.selectError,
    !value && styles.placeholderSelected,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.wrapper}>
      {/* 라벨 */}
      {label && (
        <label htmlFor={selectId} className={styles.label}>
          {label}
        </label>
      )}

      {/* 셀렉트 + 커스텀 화살표 */}
      <div className={styles.selectContainer}>
        <select
          ref={ref}
          id={selectId}
          value={value}
          disabled={disabled}
          className={selectClassNames}
          aria-invalid={!!error}
          {...rest}
        >
          {/* placeholder 옵션 */}
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}

          {/* 옵션 목록 렌더링 */}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* 커스텀 화살표 아이콘 */}
        <span className={styles.arrow}>
          <ChevronDown size={18} />
        </span>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <span className={styles.errorMessage} role="alert">
          {error}
        </span>
      )}
    </div>
  );
});

export default Select;
