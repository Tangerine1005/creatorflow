/* ============================================
   Trends Page — 트렌드 분석 (전면 개편)
   ============================================ */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Search, Sparkles, ArrowUpRight, Check
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid
} from 'recharts';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Tabs from '../components/ui/Tabs';
import { useToast } from '../components/ui/Toast';
import { mockTrends } from '../mocks/mockData';
import { formatCompactNumber } from '../utils/helpers';
import styles from './Trends.module.css';

const SOURCES = [
  { key: 'google', label: 'Google Trends', emoji: '🔍' },
  { key: 'youtube', label: 'YouTube', emoji: '▶️' },
  { key: 'naver', label: '네이버', emoji: '🇰🇷' },
];

const PIE_COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

const COMBO_SUGGESTIONS = [
  { combo: '직장인 번아웃 + 조용한 퇴사', score: 95 },
  { combo: '자취생 꿀팁 + 자취 요리', score: 88 },
  { combo: 'MZ세대 재테크 + 월급 관리', score: 82 },
];

/* ── Custom Tooltip ── */
const CustomChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.chartTooltip}>
      <p className={styles.chartTooltipLabel}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className={styles.chartTooltipValue}>
          점수: {entry.value}
        </p>
      ))}
    </div>
  );
};

export default function Trends() {
  const navigate = useNavigate();
  const toast = useToast();
  const [activeSource, setActiveSource] = useState('google');
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [hoveredKeyword, setHoveredKeyword] = useState(null);

  const currentTrends = mockTrends[activeSource] || [];

  /* 키워드 체크박스 토글 */
  const toggleKeyword = (keyword) => {
    setSelectedKeywords(prev => {
      if (prev.includes(keyword)) {
        return prev.filter(k => k !== keyword);
      }
      if (prev.length >= 3) {
        toast.warning('최대 3개까지 선택 가능', '비교할 키워드를 3개까지만 선택할 수 있습니다.');
        return prev;
      }
      return [...prev, keyword];
    });
  };

  /* 키워드로 콘텐츠 만들기 */
  const handleCreateContent = (keyword) => {
    toast.success('콘텐츠 만들기', `"${keyword}" 키워드로 콘텐츠를 생성합니다.`);
    navigate('/create');
  };

  /* 비교 차트 데이터 */
  const comparisonData = useMemo(() => {
    return selectedKeywords.map(kw => {
      const trend = currentTrends.find(t => t.keyword === kw);
      return { keyword: kw, score: trend?.score || 0 };
    });
  }, [selectedKeywords, currentTrends]);

  /* YouTube 카테고리 분포 데이터 */
  const categoryDistribution = useMemo(() => {
    if (activeSource !== 'youtube') return [];
    const catMap = {};
    currentTrends.forEach(t => {
      catMap[t.category] = (catMap[t.category] || 0) + 1;
    });
    return Object.entries(catMap).map(([name, value]) => ({ name, value }));
  }, [activeSource, currentTrends]);

  /* 소스 탭 변경 시 선택 초기화 */
  const handleSourceChange = (source) => {
    setActiveSource(source);
    setSelectedKeywords([]);
  };

  return (
    <div className={styles.trends}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <TrendingUp size={24} />
          트렌드 분석
        </h2>
        <Badge variant="accent">실시간</Badge>
      </div>

      <Tabs
        tabs={SOURCES.map(s => ({ key: s.key, label: `${s.emoji} ${s.label}` }))}
        activeTab={activeSource}
        onChange={handleSourceChange}
      />

      {selectedKeywords.length > 0 && (
        <div className={styles.selectionInfo}>
          <Check size={14} />
          {selectedKeywords.length}개 키워드 선택됨 (최대 3개)
        </div>
      )}

      <div className={styles.sourceContent}>
        {/* ── Google 레이아웃 ── */}
        {activeSource === 'google' && (
          <div className={styles.keywordGrid}>
            {currentTrends.map((trend, index) => (
              <Card
                key={trend.keyword}
                variant="interactive"
                className={`${styles.keywordCard} ${
                  selectedKeywords.includes(trend.keyword) ? styles.keywordSelected : ''
                } animate-fade-in-up stagger-${Math.min(index + 1, 6)}`}
                onMouseEnter={() => setHoveredKeyword(trend.keyword)}
                onMouseLeave={() => setHoveredKeyword(null)}
              >
                <div className={styles.keywordHeader}>
                  <div className={styles.keywordLeft}>
                    <button
                      className={`${styles.checkbox} ${
                        selectedKeywords.includes(trend.keyword) ? styles.checked : ''
                      }`}
                      onClick={() => toggleKeyword(trend.keyword)}
                    >
                      {selectedKeywords.includes(trend.keyword) && <Check size={12} />}
                    </button>
                    <span className={styles.keywordRank}>#{index + 1}</span>
                  </div>
                  <Badge variant="success" size="sm">
                    <ArrowUpRight size={12} /> {trend.change}
                  </Badge>
                </div>

                <h3 className={styles.keyword}>{trend.keyword}</h3>

                <div className={styles.scoreBar}>
                  <div className={styles.scoreFill} style={{ width: `${trend.score}%` }} />
                </div>
                <span className={styles.scoreLabel}>검색량 {trend.score}/100</span>

                <Badge variant="info" size="sm" className={styles.categoryTag}>
                  {trend.category}
                </Badge>

                {trend.relatedQueries && (
                  <div className={styles.relatedQueries}>
                    <span className={styles.relatedTitle}>관련 검색어</span>
                    {trend.relatedQueries.map((q, qi) => (
                      <span key={qi} className={styles.relatedQuery}>
                        <Search size={10} /> {q}
                      </span>
                    ))}
                  </div>
                )}

                {hoveredKeyword === trend.keyword && (
                  <div className={styles.hoverAction}>
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Sparkles size={14} />}
                      onClick={() => handleCreateContent(trend.keyword)}
                    >
                      콘텐츠 만들기
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* ── YouTube 레이아웃 ── */}
        {activeSource === 'youtube' && (
          <>
            <div className={styles.keywordGrid}>
              {currentTrends.map((trend, index) => (
                <Card
                  key={trend.keyword}
                  variant="interactive"
                  className={`${styles.keywordCard} ${
                    selectedKeywords.includes(trend.keyword) ? styles.keywordSelected : ''
                  } animate-fade-in-up stagger-${Math.min(index + 1, 6)}`}
                  onMouseEnter={() => setHoveredKeyword(trend.keyword)}
                  onMouseLeave={() => setHoveredKeyword(null)}
                >
                  <div className={styles.keywordHeader}>
                    <div className={styles.keywordLeft}>
                      <button
                        className={`${styles.checkbox} ${
                          selectedKeywords.includes(trend.keyword) ? styles.checked : ''
                        }`}
                        onClick={() => toggleKeyword(trend.keyword)}
                      >
                        {selectedKeywords.includes(trend.keyword) && <Check size={12} />}
                      </button>
                      <span className={styles.keywordRank}>#{index + 1}</span>
                    </div>
                    <Badge variant="success" size="sm">
                      <ArrowUpRight size={12} /> {trend.change}
                    </Badge>
                  </div>

                  <h3 className={styles.keyword}>{trend.keyword}</h3>

                  <div className={styles.scoreBar}>
                    <div className={styles.scoreFill} style={{ width: `${trend.score}%` }} />
                  </div>

                  <div className={styles.youtubeStats}>
                    <span className={styles.viewsCount}>
                      ▶ {formatCompactNumber(trend.views)} views
                    </span>
                    <Badge variant="info" size="sm">{trend.category}</Badge>
                  </div>

                  {hoveredKeyword === trend.keyword && (
                    <div className={styles.hoverAction}>
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<Sparkles size={14} />}
                        onClick={() => handleCreateContent(trend.keyword)}
                      >
                        콘텐츠 만들기
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {/* 카테고리 분포 도넛 차트 */}
            <Card className={styles.chartSection}>
              <h3 className={styles.chartSectionTitle}>
                📊 카테고리 분포
              </h3>
              <div className={styles.pieWrapper}>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={categoryDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {categoryDistribution.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </>
        )}

        {/* ── 네이버 레이아웃 ── */}
        {activeSource === 'naver' && (
          <>
            <Card className={styles.tableSection}>
              <table className={styles.naverTable}>
                <thead>
                  <tr>
                    <th>순위</th>
                    <th>키워드</th>
                    <th>카테고리</th>
                    <th>점수</th>
                    <th>변동</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {currentTrends.map((trend, index) => (
                    <tr
                      key={trend.keyword}
                      className={selectedKeywords.includes(trend.keyword) ? styles.rowSelected : ''}
                      onMouseEnter={() => setHoveredKeyword(trend.keyword)}
                      onMouseLeave={() => setHoveredKeyword(null)}
                    >
                      <td>
                        <div className={styles.rankCell}>
                          <button
                            className={`${styles.checkbox} ${
                              selectedKeywords.includes(trend.keyword) ? styles.checked : ''
                            }`}
                            onClick={() => toggleKeyword(trend.keyword)}
                          >
                            {selectedKeywords.includes(trend.keyword) && <Check size={10} />}
                          </button>
                          <span className={styles.rankNum}>{index + 1}</span>
                        </div>
                      </td>
                      <td className={styles.keywordCell}>{trend.keyword}</td>
                      <td>
                        <Badge variant="info" size="sm">{trend.category}</Badge>
                      </td>
                      <td>
                        <div className={styles.scoreCell}>
                          <div className={styles.miniBar}>
                            <div className={styles.miniFill} style={{ width: `${trend.score}%` }} />
                          </div>
                          <span>{trend.score}</span>
                        </div>
                      </td>
                      <td className={styles.changePositive}>
                        <ArrowUpRight size={14} /> +{trend.change}
                      </td>
                      <td>
                        {hoveredKeyword === trend.keyword && (
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Sparkles size={12} />}
                            onClick={() => handleCreateContent(trend.keyword)}
                          >
                            만들기
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* 연령대별 관심도 히트맵 */}
            <Card className={styles.heatmapSection}>
              <h3 className={styles.chartSectionTitle}>
                🎯 연령대별 관심도
              </h3>
              <div className={styles.heatmapGrid}>
                <div className={styles.heatmapRow}>
                  <div className={styles.heatmapCorner}></div>
                  {['10대', '20대', '30대', '40대', '50대'].map(age => (
                    <div key={age} className={styles.heatmapHeader}>{age}</div>
                  ))}
                </div>
                {currentTrends.slice(0, 6).map((trend) => (
                  <div key={trend.keyword} className={styles.heatmapRow}>
                    <div className={styles.heatmapLabel}>{trend.keyword}</div>
                    {['10대', '20대', '30대', '40대', '50대'].map(age => {
                      const value = trend.ageInterest?.[age] || 0;
                      return (
                        <div
                          key={age}
                          className={styles.heatmapCell}
                          style={{
                            backgroundColor: `rgba(139, 92, 246, ${value / 100})`,
                            color: value > 50 ? '#fff' : 'var(--text-secondary)',
                          }}
                        >
                          {value}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {/* ── 키워드 비교 차트 ── */}
        {selectedKeywords.length >= 2 && (
          <Card className={styles.comparisonCard}>
            <h3 className={styles.chartSectionTitle}>
              📈 키워드 비교
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="keyword" stroke="var(--text-tertiary)" fontSize={12} />
                <YAxis stroke="var(--text-tertiary)" fontSize={12} domain={[0, 100]} />
                <Tooltip content={<CustomChartTooltip />} />
                <Bar dataKey="score" fill="var(--accent-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* ── AI 추천 키워드 조합 ── */}
        <Card className={styles.comboCard}>
          <h3 className={styles.comboTitle}>
            <Sparkles size={20} />
            AI 추천 키워드 조합
          </h3>
          <div className={styles.comboList}>
            {COMBO_SUGGESTIONS.map((item, i) => (
              <div key={i} className={styles.comboItem}>
                <div className={styles.comboInfo}>
                  <span className={styles.comboText}>{item.combo}</span>
                  <Badge variant="accent" size="sm">매칭도 {item.score}%</Badge>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Sparkles size={14} />}
                  onClick={() => {
                    toast.success('콘텐츠 만들기', `"${item.combo}" 조합으로 콘텐츠를 생성합니다.`);
                    navigate('/create');
                  }}
                >
                  이 조합으로 만들기
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
