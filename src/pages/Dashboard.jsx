/**
 * Dashboard 페이지
 *
 * CreatorFlow 메인 대시보드
 * - 시간대별 환영 메시지 + 새 콘텐츠 CTA
 * - 콘텐츠 현황 카드 4종 (초안/완성/예약/발행)
 * - 채널 성과 AreaChart (Recharts)
 * - 트렌드 키워드 (Google 상위 5개)
 * - 최근 콘텐츠 목록 + 팀 활동 로그
 */

import { useMemo, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  FileEdit,
  CheckCircle,
  Clock,
  Upload,
  TrendingUp,
  Plus,
  ArrowUpRight,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { formatCompactNumber, getRelativeTime } from '../utils/helpers';
import { mockContents, mockAnalytics, mockTrends, mockActivityLogs } from '../mocks/mockData';

import styles from './Dashboard.module.css';

/* ── 시간대별 인사말 ── */
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return { text: '좋은 아침이에요', emoji: '☀️' };
  if (hour < 18) return { text: '좋은 오후예요', emoji: '🌤️' };
  return { text: '좋은 저녁이에요', emoji: '🌙' };
}

/* ── 콘텐츠 status → 한글 매핑 ── */
const STATUS_CONFIG = {
  draft: { label: '초안', variant: 'warning', icon: FileEdit, colorClass: 'Warning' },
  completed: { label: '완성', variant: 'success', icon: CheckCircle, colorClass: 'Success' },
  scheduled: { label: '예약', variant: 'info', icon: Clock, colorClass: 'Info' },
  published: { label: '발행', variant: 'accent', icon: Upload, colorClass: 'Accent' },
};

/* ── 카테고리 한글 매핑 ── */
const CATEGORY_MAP = {
  work: '직장',
  daily: '일상',
  trending: '트렌드',
};

/* ── action 한글 매핑 ── */
const ACTION_MAP = {
  created: '생성',
  edited: '수정',
  published: '발행',
};

/* ── 커스텀 차트 툴팁 ── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.chartTooltip}>
      <p className={styles.chartTooltipLabel}>{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className={styles.chartTooltipItem}>
          {entry.name === 'views' ? '조회수' : entry.name === 'likes' ? '좋아요' : '댓글'}:{' '}
          {formatCompactNumber(entry.value)}
        </p>
      ))}
    </div>
  );
}

/* ============================================
   Dashboard 컴포넌트
   ============================================ */

export default function Dashboard() {
  const navigate = useNavigate();
  const greeting = getGreeting();

  /* status별 콘텐츠 수 집계 */
  const statusCounts = useMemo(() => {
    const counts = { draft: 0, completed: 0, scheduled: 0, published: 0 };
    mockContents.forEach((c) => {
      if (counts[c.status] !== undefined) counts[c.status]++;
    });
    return counts;
  }, []);

  /* 최근 콘텐츠 5개 (최신순) */
  const recentContents = useMemo(
    () =>
      [...mockContents]
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 5),
    []
  );

  /* 트렌드 상위 5개 */
  const topTrends = mockTrends.google.slice(0, 5);

  /* 채널 통계 */
  const { channelStats, recentPerformance } = mockAnalytics;

  /* 실제 로그인 유저 정보 */
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    import('../services/auth').then(({ default: authService }) => {
      authService.getUser().then(({ user }) => {
        setUser(user);
      });
    });
  }, []);

  return (
    <div className={styles.page}>
      {/* ────────────────────────────────
          1) 상단 환영 메시지 + CTA
         ──────────────────────────────── */}
      <header className={`${styles.header} ${styles.stagger} ${styles.stagger1}`}>
        <div className={styles.greetingArea}>
          <h1 className={styles.greeting}>
            <span className={styles.greetingEmoji}>{greeting.emoji}</span>
            {greeting.text}, {user?.user_metadata?.display_name || user?.email?.split('@')[0] || '크리에이터'}님
          </h1>
          <p className={styles.subGreeting}>
            오늘도 멋진 콘텐츠를 만들어볼까요?
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus size={18} />}
          onClick={() => navigate('/create')}
        >
          새 콘텐츠
        </Button>
      </header>

      {/* ────────────────────────────────
          2) 콘텐츠 현황 카드 4개
         ──────────────────────────────── */}
      <section className={`${styles.statsGrid} ${styles.stagger} ${styles.stagger2}`}>
        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
          const Icon = config.icon;
          return (
            <div
              key={status}
              className={`${styles.statCard} ${styles[`statCard${config.colorClass}`]}`}
            >
              <div className={styles.statTop}>
                <div className={`${styles.statIconWrap} ${styles[`statIcon${config.colorClass}`]}`}>
                  <Icon size={22} />
                </div>
              </div>
              <span className={styles.statNumber}>{statusCounts[status]}</span>
              <span className={styles.statLabel}>{config.label}</span>
            </div>
          );
        })}
      </section>

      {/* ────────────────────────────────
          3) 성과 차트 + 트렌드 키워드
         ──────────────────────────────── */}
      <section className={`${styles.midSection} ${styles.stagger} ${styles.stagger3}`}>
        {/* 왼쪽: 채널 성과 AreaChart */}
        <div className={styles.performanceCard}>
          <div className={styles.performanceHeader}>
            <h2 className={styles.sectionTitle}>채널 성과</h2>
            <div className={styles.channelStats}>
              {/* 구독자 */}
              <div className={styles.channelStat}>
                <span className={styles.channelStatLabel}>구독자</span>
                <span className={styles.channelStatValue}>
                  {formatCompactNumber(channelStats.subscribers)}
                  <span className={styles.channelStatChange}>
                    <TrendingUp size={12} />
                    ▲{formatCompactNumber(channelStats.subscriberChange)}
                  </span>
                </span>
              </div>
              {/* 총 조회수 */}
              <div className={styles.channelStat}>
                <span className={styles.channelStatLabel}>조회수</span>
                <span className={styles.channelStatValue}>
                  {formatCompactNumber(channelStats.totalViews)}
                  <span className={styles.channelStatChange}>
                    <TrendingUp size={12} />
                    ▲{formatCompactNumber(channelStats.viewsChange)}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Recharts Area 그래프 */}
          <div className={styles.chartWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={recentPerformance}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="var(--accent-primary)"
                  strokeWidth={2}
                  fill="url(#colorViews)"
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0, fill: 'var(--accent-primary)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 오른쪽: 트렌드 키워드 */}
        <div className={styles.trendCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Sparkles size={18} style={{ display: 'inline', marginRight: 6, verticalAlign: '-3px' }} />
              트렌드 키워드
            </h2>
          </div>

          {topTrends.map((trend, idx) => (
            <div key={trend.keyword} className={styles.trendItem}>
              <span className={styles.trendRank}>{idx + 1}</span>
              <div className={styles.trendBody}>
                <span className={styles.trendKeyword}>{trend.keyword}</span>
                <div className={styles.trendBarWrap}>
                  <div
                    className={styles.trendBar}
                    style={{ width: `${trend.score}%` }}
                  />
                </div>
              </div>
              <div className={styles.trendMeta}>
                <span className={styles.trendChange}>{trend.change}</span>
                <ArrowUpRight size={14} className={styles.trendIcon} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ────────────────────────────────
          4) 최근 콘텐츠 + 활동 로그
         ──────────────────────────────── */}
      <section className={`${styles.bottomSection} ${styles.stagger} ${styles.stagger4}`}>
        {/* 왼쪽: 최근 콘텐츠 */}
        <div className={styles.recentCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>최근 콘텐츠</h2>
            <Link to="/library" className={styles.viewAllLink}>
              전체 보기 <ChevronRight size={16} />
            </Link>
          </div>

          <div className={styles.contentList}>
            {recentContents.map((content) => {
              const cfg = STATUS_CONFIG[content.status];
              const title =
                content.titles?.[content.selectedTitleIndex] || content.topic;
              return (
                <div key={content.id} className={styles.contentItem}>
                  <div className={styles.contentInfo}>
                    <p className={styles.contentTitle}>{title}</p>
                    <div className={styles.contentMeta}>
                      <Badge variant="default" size="sm">
                        {CATEGORY_MAP[content.category] || content.category}
                      </Badge>
                      <Badge variant={cfg.variant} size="sm" dot>
                        {cfg.label}
                      </Badge>
                      <span className={styles.contentDate}>
                        {getRelativeTime(content.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 오른쪽: 팀 활동 로그 */}
        <div className={styles.activityCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>팀 활동</h2>
          </div>

          <div className={styles.activityList}>
            {mockActivityLogs.map((log) => {
              /* 이름 첫 글자로 아바타 */
              const initial = log.userName?.charAt(0) || '?';
              const actionLabel = ACTION_MAP[log.action] || log.action;

              return (
                <div key={log.id} className={styles.activityItem}>
                  <div className={styles.activityAvatar}>{initial}</div>
                  <div className={styles.activityBody}>
                    <p className={styles.activityText}>
                      <span className={styles.activityName}>{log.userName}</span>
                      {' 님이 '}
                      <span className={styles.activityAction}>{actionLabel}</span>
                      {' — '}
                      {log.details}
                    </p>
                    <span className={styles.activityTime}>
                      {getRelativeTime(log.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
