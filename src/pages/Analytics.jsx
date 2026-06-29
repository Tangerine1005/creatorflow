/* ============================================
   Analytics Page — 채널 성과 분석 (고도화)
   ============================================ */

import { useState, useMemo } from 'react';
import {
  BarChart3, TrendingUp, Eye, ThumbsUp, Users, Video,
  ArrowUpRight, ArrowDownRight, Award
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Tabs from '../components/ui/Tabs';
import { mockAnalytics } from '../mocks/mockData';
import { formatCompactNumber } from '../utils/helpers';
import styles from './Analytics.module.css';

/* ── 기간 탭 정의 ── */
const PERIOD_TABS = [
  { key: 'daily', label: '일간 (7일)' },
  { key: 'weekly', label: '주간 (30일)' },
  { key: 'monthly', label: '월간 (90일)' },
];

const CHART_TABS = [
  { key: 'views', label: '조회수' },
  { key: 'likes', label: '좋아요' },
  { key: 'comments', label: '댓글' },
];

/* ── 비교 기준 텍스트 ── */
const COMPARISON_TEXT = {
  daily: '전주 대비',
  weekly: '전월 대비',
  monthly: '전분기 대비',
};

const PERIOD_BADGE_TEXT = {
  daily: '최근 7일',
  weekly: '최근 30일',
  monthly: '최근 90일',
};

/* ── 커스텀 툴팁 ── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className={styles.tooltipValue}>
          {entry.name}: {formatCompactNumber(entry.value)}
        </p>
      ))}
    </div>
  );
};

/* ── 데이터 집계 헬퍼 ── */
function aggregateWeekly(data) {
  const weeks = [];
  for (let i = 0; i < data.length; i += 7) {
    const chunk = data.slice(i, i + 7);
    if (chunk.length === 0) break;
    const avg = (key) => Math.round(chunk.reduce((s, d) => s + d[key], 0) / chunk.length);
    weeks.push({
      date: `${chunk[0].date}~${chunk[chunk.length - 1].date}`,
      views: avg('views'),
      likes: avg('likes'),
      comments: avg('comments'),
    });
  }
  return weeks;
}

function aggregateMonthly(data) {
  const months = [];
  for (let i = 0; i < data.length; i += 30) {
    const chunk = data.slice(i, i + 30);
    if (chunk.length === 0) break;
    const avg = (key) => Math.round(chunk.reduce((s, d) => s + d[key], 0) / chunk.length);
    const label = chunk.length > 0 ? chunk[0].date.split('/')[0] + '월' : '';
    months.push({
      date: label,
      views: avg('views'),
      likes: avg('likes'),
      comments: avg('comments'),
    });
  }
  return months;
}

export default function Analytics() {
  const [period, setPeriod] = useState('daily');
  const [chartTab, setChartTab] = useState('views');
  const [topSortBy, setTopSortBy] = useState('views');

  /* 기간별 raw 데이터 slice */
  const periodData = useMemo(() => {
    const all = mockAnalytics.recentPerformance;
    switch (period) {
      case 'daily': return all.slice(-7);
      case 'weekly': return all.slice(-30);
      case 'monthly': return all;
      default: return all.slice(-7);
    }
  }, [period]);

  /* 차트 데이터 (집계) */
  const chartData = useMemo(() => {
    switch (period) {
      case 'daily': return periodData;
      case 'weekly': return aggregateWeekly(periodData);
      case 'monthly': return aggregateMonthly(periodData);
      default: return periodData;
    }
  }, [period, periodData]);

  /* 통계 카드 데이터 */
  const STAT_CARDS = [
    {
      label: '구독자',
      value: mockAnalytics.channelStats.subscribers,
      change: mockAnalytics.channelStats.subscriberChange,
      icon: Users,
      color: 'var(--accent-primary)',
    },
    {
      label: '총 조회수',
      value: mockAnalytics.channelStats.totalViews,
      change: mockAnalytics.channelStats.viewsChange,
      icon: Eye,
      color: 'var(--accent-secondary)',
    },
    {
      label: '총 영상 수',
      value: mockAnalytics.channelStats.totalVideos,
      change: 3,
      icon: Video,
      color: 'var(--success)',
    },
    {
      label: '평균 좋아요율',
      value: '8.5%',
      change: 1.2,
      icon: ThumbsUp,
      color: 'var(--warning)',
      isPercent: true,
    },
  ];

  /* 인기 콘텐츠 정렬 */
  const sortedTopContents = useMemo(() => {
    return [...mockAnalytics.topContents]
      .sort((a, b) => b[topSortBy] - a[topSortBy])
      .slice(0, 5);
  }, [topSortBy]);

  /* 하이라이트 계산 */
  const highlights = useMemo(() => {
    const totalViews = periodData.reduce((s, d) => s + d.views, 0);
    const totalLikes = periodData.reduce((s, d) => s + d.likes, 0);
    const avgViews = Math.round(totalViews / periodData.length);
    const bestDay = [...periodData].sort((a, b) => b.views - a.views)[0];
    const growthRate = ((mockAnalytics.channelStats.subscriberChange / mockAnalytics.channelStats.subscribers) * 100).toFixed(1);

    return {
      bestContent: mockAnalytics.topContents[0],
      growthRate,
      avgViews,
      totalLikes,
      bestDay,
    };
  }, [periodData]);

  const chartTitleMap = {
    daily: '일간 성과',
    weekly: '주간 성과',
    monthly: '월간 성과',
  };

  return (
    <div className={styles.analytics}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>
            <BarChart3 size={24} />
            채널 분석
          </h2>
          <Badge variant="info">{PERIOD_BADGE_TEXT[period]}</Badge>
        </div>
        <div className={styles.periodSection}>
          <Tabs
            tabs={PERIOD_TABS}
            activeTab={period}
            onChange={setPeriod}
            variant="pills"
          />
        </div>
      </div>

      {/* 통계 카드 */}
      <div className={styles.statsGrid}>
        {STAT_CARDS.map((stat, index) => {
          const Icon = stat.icon;
          const isPositive = typeof stat.change === 'number' ? stat.change > 0 : true;
          return (
            <Card
              key={stat.label}
              variant="interactive"
              className={`${styles.statCard} animate-fade-in-up stagger-${index + 1}`}
            >
              <div className={styles.statIcon} style={{ background: `${stat.color}20`, color: stat.color }}>
                <Icon size={22} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>{stat.label}</span>
                <span className={styles.statValue}>
                  {typeof stat.value === 'number' ? formatCompactNumber(stat.value) : stat.value}
                </span>
                <span className={`${styles.statChange} ${isPositive ? styles.positive : styles.negative}`}>
                  {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {stat.isPercent ? `${stat.change}%` : `+${formatCompactNumber(stat.change)}`}
                </span>
                <span className={styles.comparisonText}>{COMPARISON_TEXT[period]}</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 차트 */}
      <Card className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h3 className={styles.chartTitle}>{chartTitleMap[period]}</h3>
          <Tabs
            tabs={CHART_TABS}
            activeTab={chartTab}
            onChange={setChartTab}
            variant="pills"
          />
        </div>
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={12} />
              <YAxis stroke="var(--text-tertiary)" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey={chartTab}
                name={CHART_TABS.find(t => t.key === chartTab)?.label}
                stroke="var(--accent-primary)"
                strokeWidth={2}
                fill="url(#chartGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 인기 콘텐츠 */}
      <Card className={styles.topCard}>
        <div className={styles.topHeader}>
          <h3 className={styles.chartTitle}>인기 콘텐츠 TOP 5</h3>
          <div className={styles.toggleGroup}>
            <Button
              variant={topSortBy === 'views' ? 'primary' : 'ghost'}
              size="sm"
              leftIcon={<Eye size={14} />}
              onClick={() => setTopSortBy('views')}
            >
              조회수
            </Button>
            <Button
              variant={topSortBy === 'likes' ? 'primary' : 'ghost'}
              size="sm"
              leftIcon={<ThumbsUp size={14} />}
              onClick={() => setTopSortBy('likes')}
            >
              좋아요
            </Button>
          </div>
        </div>
        <div className={styles.topList}>
          {sortedTopContents.map((content, index) => (
            <div key={index} className={styles.topItem}>
              <span className={styles.rank}>{index + 1}</span>
              <div className={styles.topInfo}>
                <span className={styles.topTitle}>{content.title}</span>
                <div className={styles.topStats}>
                  <span><Eye size={14} /> {formatCompactNumber(content.views)}</span>
                  <span><ThumbsUp size={14} /> {formatCompactNumber(content.likes)}</span>
                </div>
              </div>
              <Badge variant={topSortBy === 'views' ? 'accent' : 'success'} size="sm">
                {topSortBy === 'views'
                  ? formatCompactNumber(content.views)
                  : formatCompactNumber(content.likes)}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* 이번 달 하이라이트 */}
      <div className={styles.highlightSection}>
        <h3 className={styles.highlightTitle}>
          <Award size={20} />
          이번 달 하이라이트
        </h3>
        <div className={styles.highlightGrid}>
          <Card variant="interactive" className={styles.highlightCard}>
            <div className={styles.highlightIcon} style={{ background: 'var(--accent-primary)20', color: 'var(--accent-primary)' }}>
              <TrendingUp size={20} />
            </div>
            <span className={styles.highlightLabel}>최고 조회수 콘텐츠</span>
            <span className={styles.highlightValue}>{formatCompactNumber(highlights.bestContent.views)}</span>
            <span className={styles.highlightDesc}>{highlights.bestContent.title}</span>
          </Card>
          <Card variant="interactive" className={styles.highlightCard}>
            <div className={styles.highlightIcon} style={{ background: 'var(--success)20', color: 'var(--success)' }}>
              <Users size={20} />
            </div>
            <span className={styles.highlightLabel}>구독자 성장률</span>
            <span className={styles.highlightValue}>+{highlights.growthRate}%</span>
            <span className={styles.highlightDesc}>
              +{formatCompactNumber(mockAnalytics.channelStats.subscriberChange)}명 증가
            </span>
          </Card>
          <Card variant="interactive" className={styles.highlightCard}>
            <div className={styles.highlightIcon} style={{ background: 'var(--info)20', color: 'var(--info)' }}>
              <Eye size={20} />
            </div>
            <span className={styles.highlightLabel}>평균 일일 조회수</span>
            <span className={styles.highlightValue}>{formatCompactNumber(highlights.avgViews)}</span>
            <span className={styles.highlightDesc}>
              최고 기록: {highlights.bestDay?.date} ({formatCompactNumber(highlights.bestDay?.views)})
            </span>
          </Card>
          <Card variant="interactive" className={styles.highlightCard}>
            <div className={styles.highlightIcon} style={{ background: 'var(--warning)20', color: 'var(--warning)' }}>
              <ThumbsUp size={20} />
            </div>
            <span className={styles.highlightLabel}>총 좋아요</span>
            <span className={styles.highlightValue}>{formatCompactNumber(highlights.totalLikes)}</span>
            <span className={styles.highlightDesc}>기간 내 누적 좋아요 수</span>
          </Card>
        </div>
      </div>
    </div>
  );
}
