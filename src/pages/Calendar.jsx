/* ============================================
   Calendar Page — 콘텐츠 캘린더
   ============================================ */

import { useState, useMemo, useEffect } from 'react';
import {
  CalendarDays, ChevronLeft, ChevronRight
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { getMonthDays, formatKST, isSameDayCheck } from '../utils/dateUtils';
import styles from './Calendar.module.css';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const days = useMemo(() => getMonthDays(year, month), [year, month]);

  const [contents, setContents] = useState([]);
  
  useEffect(() => {
    import('../services/auth').then(({ default: authService }) => {
      authService.getUser().then(({ user }) => {
        if (!user) return;
        import('../services/db').then(({ contentService }) => {
          contentService.list(user.id).then(({ data, error }) => {
            if (!error && data) {
              setContents(data);
            }
          });
        });
      });
    });
  }, []);

  // 콘텐츠를 날짜별로 그룹핑
  const contentsByDate = useMemo(() => {
    const map = {};
    contents.forEach(content => {
      const dateStr = content.scheduledAt || content.publishedAt || content.created_at || content.createdAt;
      if (dateStr) {
        const key = new Date(dateStr).toDateString();
        if (!map[key]) map[key] = [];
        map[key].push(content);
      }
    });
    return map;
  }, [contents]);

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date) => isSameDayCheck(date, new Date());
  const isCurrentMonth = (date) => date.getMonth() === month;

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'var(--warning)';
      case 'completed': return 'var(--success)';
      case 'scheduled': return 'var(--info)';
      case 'published': return 'var(--accent-primary)';
      default: return 'var(--text-tertiary)';
    }
  };

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <CalendarDays size={24} />
          콘텐츠 캘린더
        </h2>
        <div className={styles.controls}>
          <Button variant="ghost" size="sm" onClick={goToPrevMonth}>
            <ChevronLeft size={18} />
          </Button>
          <span className={styles.monthLabel}>
            {formatKST(currentDate, 'yyyy년 M월')}
          </span>
          <Button variant="ghost" size="sm" onClick={goToNextMonth}>
            <ChevronRight size={18} />
          </Button>
          <Button variant="secondary" size="sm" onClick={goToToday}>
            오늘
          </Button>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className={styles.weekdays}>
        {WEEKDAYS.map(day => (
          <div key={day} className={styles.weekday}>{day}</div>
        ))}
      </div>

      {/* 캘린더 그리드 */}
      <div className={styles.grid}>
        {days.map((day, index) => {
          const dayContents = contentsByDate[day.toDateString()] || [];
          return (
            <div
              key={index}
              className={`${styles.cell} ${
                !isCurrentMonth(day) ? styles.otherMonth : ''
              } ${isToday(day) ? styles.today : ''}`}
            >
              <span className={styles.dayNumber}>
                {day.getDate()}
              </span>
              <div className={styles.events}>
                {dayContents.slice(0, 3).map((content, ci) => (
                  <div
                    key={ci}
                    className={styles.event}
                    style={{ borderLeftColor: getStatusColor(content.status) }}
                    title={content.topic}
                  >
                    <span className={styles.eventTitle}>
                      {content.titles?.[0] || content.topic}
                    </span>
                  </div>
                ))}
                {dayContents.length > 3 && (
                  <span className={styles.moreCount}>
                    +{dayContents.length - 3}개 더
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: 'var(--warning)' }} />
          초안
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: 'var(--success)' }} />
          완성
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: 'var(--info)' }} />
          예약
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: 'var(--accent-primary)' }} />
          발행
        </div>
      </div>
    </div>
  );
}
