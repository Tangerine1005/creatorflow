/**
 * Tabs 컴포넌트
 *
 * - tabs: [{ key, label, icon? }] 배열로 탭 정의
 * - activeTab, onChange 로 상태 제어
 * - variant: 'default' (하단 인디케이터) | 'pills' (둥근 배경)
 * - 모바일에서 가로 스크롤 지원
 *
 * @example
 * <Tabs
 *   tabs={[
 *     { key: 'overview', label: '개요', icon: BarChart },
 *     { key: 'videos',   label: '영상', icon: Video },
 *   ]}
 *   activeTab="overview"
 *   onChange={(key) => setTab(key)}
 *   variant="default"
 * />
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import styles from './Tabs.module.css';

export default function Tabs({
  tabs = [],
  activeTab,
  onChange,
  variant = 'default',   // 'default' | 'pills'
  className = '',
}) {
  const tabListRef = useRef(null);
  const tabRefs = useRef({});
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // 활성 탭 위치를 계산하여 인디케이터 이동
  const updateIndicator = useCallback(() => {
    const activeEl = tabRefs.current[activeTab];
    const listEl = tabListRef.current;
    if (!activeEl || !listEl) return;

    const listRect = listEl.getBoundingClientRect();
    const tabRect = activeEl.getBoundingClientRect();

    setIndicatorStyle({
      left: tabRect.left - listRect.left + listEl.scrollLeft,
      width: tabRect.width,
    });
  }, [activeTab]);

  useEffect(() => {
    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [updateIndicator]);

  // 활성 탭이 보이도록 스크롤
  useEffect(() => {
    const activeEl = tabRefs.current[activeTab];
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeTab]);

  return (
    <div className={`${styles.wrapper} ${styles[variant]} ${className}`}>
      <div className={styles.tabList} ref={tabListRef} role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          const IconComponent = tab.icon;

          return (
            <button
              key={tab.key}
              ref={(el) => { tabRefs.current[tab.key] = el; }}
              className={`${styles.tab} ${isActive ? styles.active : ''}`}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange?.(tab.key)}
              type="button"
            >
              {IconComponent && (
                <span className={styles.tabIcon}>
                  <IconComponent size={16} />
                </span>
              )}
              {tab.label}
            </button>
          );
        })}

        {/* default 변형에서만 슬라이딩 인디케이터 표시 */}
        {variant === 'default' && (
          <span
            className={styles.indicator}
            style={{
              left: `${indicatorStyle.left}px`,
              width: `${indicatorStyle.width}px`,
            }}
          />
        )}
      </div>
    </div>
  );
}
