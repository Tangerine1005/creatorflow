/**
 * EmptyState 컴포넌트
 *
 * 데이터가 없을 때 표시하는 안내 화면.
 * - icon: lucide-react 아이콘 컴포넌트
 * - title, description 텍스트
 * - action: 선택적 액션 버튼 (ReactNode)
 *
 * @example
 * <EmptyState
 *   icon={Video}
 *   title="아직 영상이 없습니다"
 *   description="새 영상을 업로드하여 시작하세요."
 *   action={<Button onClick={handleUpload}>영상 업로드</Button>}
 * />
 */

import styles from './EmptyState.module.css';

export default function EmptyState({
  icon: IconComponent,
  title,
  description,
  action,
  className = '',
}) {
  return (
    <div className={`${styles.wrapper} ${className}`}>
      {/* 아이콘 */}
      {IconComponent && (
        <div className={styles.iconContainer}>
          <IconComponent size={32} />
        </div>
      )}

      {/* 제목 */}
      {title && <h3 className={styles.title}>{title}</h3>}

      {/* 설명 */}
      {description && <p className={styles.description}>{description}</p>}

      {/* 액션 버튼 */}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
