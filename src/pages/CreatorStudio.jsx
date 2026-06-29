/**
 * CreatorStudio — 4-Step 콘텐츠 파이프라인 페이지
 *
 * 핵심 플로우:
 *   Step 1: 주제 설정 (카테고리, 톤, 언어, 리퍼런스)
 *   Step 2: 스크립트 생성 (AI 생성 → 나레이션/자막/디렉션 탭)
 *   Step 3: 메타데이터 (제목 A/B, 설명, 해시태그)
 *   Step 4: 썸네일 (AI 생성 → 3개 후보 선택)
 */

import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ui/Toast';
import Modal from '../components/ui/Modal';
import {
  Lightbulb,
  FileText,
  Hash,
  Image,
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Link,
  RotateCcw,
  Eye,
  Save,
  Calendar,
  X,
  Loader,
  Upload,
  Copy,
  Wand2,
} from 'lucide-react';

import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Tabs from '../components/ui/Tabs';

import { mockAIResponses, mockTrends } from '../mocks/mockData';
import { countChars, estimateReadingTime, formatDuration } from '../utils/helpers';
import { CATEGORIES, TONES, LANGUAGES, YOUTUBE } from '../utils/constants';

import styles from './CreatorStudio.module.css';

/* ---------- 스텝 아이콘 매핑 ---------- */
const STEP_ICONS = [Lightbulb, FileText, Hash, Image];
const STEP_LABELS = ['주제 설정', '스크립트', '메타데이터', '썸네일'];

/* ---------- 썸네일 placeholder 데이터 ---------- */
const THUMB_PLACEHOLDERS = [
  {
    emoji: '😂',
    text: '월요일 출근길',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    emoji: '🔥',
    text: '직장인 공감',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  {
    emoji: '💪',
    text: '레전드 모음',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  },
];

/* ---------- 스크립트 탭 정의 ---------- */
const SCRIPT_TABS = [
  { key: 'narration', label: '나레이션' },
  { key: 'subtitle', label: '자막' },
  { key: 'direction', label: '디렉션' },
];

export default function CreatorStudio() {
  const navigate = useNavigate();
  const toast = useToast();

  // ── 공통 상태 ──
  const [currentStep, setCurrentStep] = useState(1);

  // ── Step 1 상태 ──
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('');
  const [tone, setTone] = useState('');
  const [language, setLanguage] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [customCategories, setCustomCategories] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cf-custom-categories') || '[]'); } catch { return []; }
  });
  const [customTones, setCustomTones] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cf-custom-tones') || '[]'); } catch { return []; }
  });
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddTone, setShowAddTone] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newToneName, setNewToneName] = useState('');

  // 트렌드 키워드 (Step 1 하단 칩)
  const trendKeywords = useMemo(() => mockTrends?.google?.slice(0, 5) || [], []);

  // ── Step 2 상태 ──
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [scriptTab, setScriptTab] = useState('narration');
  const [scripts, setScripts] = useState({
    narration: '',
    subtitle: '',
    direction: '',
  });
  const [lastSaved, setLastSaved] = useState(null);
  const [scriptHistory, setScriptHistory] = useState([]);
  const [scriptConfirmed, setScriptConfirmed] = useState(false);

  // ── Step 3 상태 ──
  const [isGeneratingMeta, setIsGeneratingMeta] = useState(false);
  const [titles, setTitles] = useState([]);
  const [selectedTitleIndex, setSelectedTitleIndex] = useState(0);
  const [description, setDescription] = useState('');
  const [descriptions, setDescriptions] = useState([]);
  const [selectedDescIndex, setSelectedDescIndex] = useState(0);
  const [hashtags, setHashtags] = useState([]);

  // ── Step 4 상태 ──
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [thumbPrompts, setThumbPrompts] = useState([]);
  const [uploadedThumbnail, setUploadedThumbnail] = useState(null);
  const [uploadedThumbnailName, setUploadedThumbnailName] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  /* ============================================
     핸들러: 카테고리/톤 커스텀 추가
     ============================================ */
  const handleAddCategory = useCallback(() => {
    if (!newCategoryName.trim()) return;
    const updated = [...customCategories, { value: `custom-${Date.now()}`, label: newCategoryName.trim(), emoji: '📌' }];
    setCustomCategories(updated);
    localStorage.setItem('cf-custom-categories', JSON.stringify(updated));
    setNewCategoryName('');
    setShowAddCategory(false);
    toast.success('카테고리 추가됨', newCategoryName.trim());
  }, [newCategoryName, customCategories, toast]);

  const handleAddTone = useCallback(() => {
    if (!newToneName.trim()) return;
    const updated = [...customTones, { value: `custom-${Date.now()}`, label: newToneName.trim(), emoji: '✨' }];
    setCustomTones(updated);
    localStorage.setItem('cf-custom-tones', JSON.stringify(updated));
    setNewToneName('');
    setShowAddTone(false);
    toast.success('톤 추가됨', newToneName.trim());
  }, [newToneName, customTones, toast]);

  /* ============================================
     핸들러: AI 스크립트 생성 (Mock)
     ============================================ */
  const handleGenerateScript = useCallback(() => {
    // 현재 스크립트를 히스토리에 저장
    if (scripts.narration) {
      setScriptHistory(prev => [scripts, ...prev].slice(0, 3));
    }
    setIsGeneratingScript(true);
    setScriptConfirmed(false);
    setTimeout(() => {
      setScripts({
        narration: mockAIResponses.script.narration,
        subtitle: mockAIResponses.script.subtitle,
        direction: mockAIResponses.script.direction,
      });
      setLastSaved(new Date());
      setIsGeneratingScript(false);
    }, 1500);
  }, [scripts]);

  /* ============================================
     핸들러: AI 메타데이터 생성 (Mock)
     ============================================ */
  const handleGenerateMeta = useCallback(() => {
    setIsGeneratingMeta(true);
    setTimeout(() => {
      setTitles(mockAIResponses.titles);
      const descList = [
        mockAIResponses.description,
        `${topic || '주제'}에 대한 직장인 공감 콘텐츠! \n\n🔥 어디서도 본 적 없는 리얼한 직장인 이야기\n😂 공감 100% 리액션 보장\n\n구독과 좋아요는 큰 힘이 됩니다!\n\n#직장인 #콘텐츠 #공감 #쇼츠`,
        `⭐ ${topic || '주제'} | 직장인 콘텐츠\n\n오늘도 회사에서 살아남은 당신을 위한 콘텐츠 💪\n
✅ 매일 새로운 직장인 콘텐츠 업로드!\n
#직장인일상 #회사생활 #콘텐츠마이닝`,
      ];
      setDescriptions(descList);
      setDescription(descList[0]);
      setSelectedDescIndex(0);
      setHashtags([...mockAIResponses.hashtags]);
      setSelectedTitleIndex(0);
      setIsGeneratingMeta(false);
    }, 1500);
  }, [topic]);

  /* ============================================
     핸들러: 해시태그 삭제
     ============================================ */
  const handleRemoveHashtag = useCallback((index) => {
    setHashtags((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /* ============================================
     핸들러: 썸네일 프롬프트 추천 (Gemini - 무료)
     ============================================ */
  const handleGeneratePrompts = useCallback(() => {
    setIsGeneratingPrompts(true);
    setTimeout(() => {
      const topicText = topic || '직장인 공감 콘텐츠';
      setThumbPrompts([
        {
          style: '일러스트/카툰',
          prompt: `유튜브 쇼츠 썸네일, 일러스트 스타일. 주제: "${topicText}". 밝은 보라색+시안 그라디언트 배경, 귀여운 캐릭터가 과장된 표정을 짓는 모습, 굵은 한국어 텍스트 오버레이, 1280x720px`,
          tip: '💡 Gemini에서 이미지 생성 시 "일러스트 스타일"을 강조하세요',
        },
        {
          style: '밈/텍스트 중심',
          prompt: `유튜브 쇼츠 썸네일, 밈 스타일. 주제: "${topicText}". 진한 다크 배경에 네온 컬러 텍스트, 이모지 장식, 충격적인 숫자나 문구 강조, 1280x720px`,
          tip: '💡 텍스트가 큰 밈형 썸네일은 클릭률이 높습니다',
        },
        {
          style: '시네마틱/감성',
          prompt: `유튜브 쇼츠 썸네일, 시네마틱 스타일. 주제: "${topicText}". 영화 포스터 같은 드라마틱 조명, 따뜻한 톤 색감, 감성적 분위기, 한글 타이틀 하단 배치, 1280x720px`,
          tip: '💡 공감/감성 콘텐츠에 적합한 스타일입니다',
        },
      ]);
      setIsGeneratingPrompts(false);
      toast.success('프롬프트 생성 완료', '프롬프트를 복사해서 Gemini에서 이미지를 만들어보세요!');
    }, 1200);
  }, [topic, toast]);

  /* ============================================
     핸들러: 프롬프트 복사
     ============================================ */
  const handleCopyPrompt = useCallback(async (prompt, index) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedIndex(index);
      toast.success('복사 완료!', '클립보드에 복사되었습니다. Gemini에 붙여넣기 하세요.');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error('복사 실패', '수동으로 복사해주세요.');
    }
  }, [toast]);

  /* ============================================
     핸들러: 썸네일 업로드
     ============================================ */
  const handleThumbnailUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('이미지만 업로드 가능합니다');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('파일 크기 초과', '썸네일은 10MB 이하여야 합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedThumbnail(ev.target.result);
      setUploadedThumbnailName(file.name);
      toast.success('썸네일 업로드 완료', file.name);
    };
    reader.readAsDataURL(file);
  }, [toast]);

  /* ============================================
     핸들러: 스텝 이동
     ============================================ */
  const goNext = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  }, []);

  const goPrev = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  /* ============================================
     마지막 저장 시간 표시
     ============================================ */
  const getLastSavedText = () => {
    if (!lastSaved) return '';
    const diff = Math.round((Date.now() - lastSaved.getTime()) / 1000);
    if (diff < 5) return '방금 저장됨';
    return `마지막 저장: ${diff}초 전`;
  };

  /* ============================================
     스크립트 통계 계산
     ============================================ */
  const currentScriptText = scripts[scriptTab] || '';
  const charCount = countChars(currentScriptText);
  const readingSeconds = estimateReadingTime(currentScriptText);

  /* ============================================
     렌더: 스텝 인디케이터
     ============================================ */
  const renderStepIndicator = () => (
    <div className={styles.stepIndicator}>
      {STEP_LABELS.map((label, index) => {
        const stepNum = index + 1;
        const Icon = STEP_ICONS[index];

        // 상태 분류
        const isCompleted = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;

        // 원형 클래스
        const circleClass = [
          styles.stepCircle,
          isCompleted && styles.stepCompleted,
          isCurrent && styles.stepCurrent,
          !isCompleted && !isCurrent && styles.stepFuture,
        ]
          .filter(Boolean)
          .join(' ');

        // 라벨 클래스
        const labelClass = [
          styles.stepLabel,
          isCurrent && styles.stepLabelCurrent,
          isCompleted && styles.stepLabelCompleted,
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <div key={stepNum} className={styles.stepItem}>
            {/* 스텝 원 + 라벨 */}
            <div className={styles.stepItemWrapper}>
              <div className={circleClass}>
                {isCompleted ? <Check size={20} /> : <Icon size={20} />}
              </div>
              <span className={labelClass}>{label}</span>
            </div>

            {/* 연결선 (마지막 스텝엔 없음) */}
            {index < 3 && (
              <div
                className={`${styles.stepLine} ${
                  isCompleted ? styles.stepLineCompleted : ''
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  /* ============================================
     렌더: Step 1 — 주제 설정
     ============================================ */
  const renderStep1 = () => (
    <div className={styles.stepContent} key="step1">
      <div className={styles.stepCard}>
        <h2 className={styles.sectionTitle}>💡 주제 설정</h2>

        {/* 주제 입력 */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>어떤 주제로 콘텐츠를 만들까요?</label>
          <textarea
            className={`${styles.textarea} ${styles.textareaSmall}`}
            placeholder="예: 월요일 아침 회의 때 멍하니 앉아있는 직장인..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />

          {/* 🔥 트렌드 키워드 칩 */}
          {trendKeywords.length > 0 && (
            <div className={styles.trendChips}>
              <span className={styles.trendLabel}>🔥 트렌드</span>
              {trendKeywords.map((kw, i) => (
                <button
                  key={i}
                  type="button"
                  className={styles.trendChip}
                  onClick={() => setTopic(prev => prev ? `${prev} ${kw.keyword}` : kw.keyword)}
                >
                  {kw.keyword}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 카테고리 */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>카테고리</label>
          <div className={styles.toggleGroup}>
            {[...CATEGORIES, ...customCategories].map((cat) => (
              <button
                key={cat.value}
                type="button"
                className={`${styles.toggleBtn} ${
                  category === cat.value ? styles.toggleBtnActive : ''
                }`}
                onClick={() => setCategory(category === cat.value ? '' : cat.value)}
              >
                {cat.label}
              </button>
            ))}
            {!showAddCategory ? (
              <button type="button" className={styles.addToggleBtn} onClick={() => setShowAddCategory(true)}>+ 추가</button>
            ) : (
              <div className={styles.addInputGroup}>
                <input
                  type="text"
                  className={styles.addInput}
                  placeholder="카테고리 이름"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                  autoFocus
                />
                <button type="button" className={styles.addConfirmBtn} onClick={handleAddCategory}>✓</button>
                <button type="button" className={styles.addCancelBtn} onClick={() => { setShowAddCategory(false); setNewCategoryName(''); }}>✕</button>
              </div>
            )}
          </div>
        </div>

        {/* 톤 */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>톤</label>
          <div className={styles.toggleGroup}>
            {[...TONES, ...customTones].map((t) => (
              <button
                key={t.value}
                type="button"
                className={`${styles.toggleBtn} ${
                  tone === t.value ? styles.toggleBtnActive : ''
                }`}
                onClick={() => setTone(tone === t.value ? '' : t.value)}
              >
                {t.label} {t.emoji}
              </button>
            ))}
            {!showAddTone ? (
              <button type="button" className={styles.addToggleBtn} onClick={() => setShowAddTone(true)}>+ 추가</button>
            ) : (
              <div className={styles.addInputGroup}>
                <input
                  type="text"
                  className={styles.addInput}
                  placeholder="톤 이름"
                  value={newToneName}
                  onChange={(e) => setNewToneName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTone()}
                  autoFocus
                />
                <button type="button" className={styles.addConfirmBtn} onClick={handleAddTone}>✓</button>
                <button type="button" className={styles.addCancelBtn} onClick={() => { setShowAddTone(false); setNewToneName(''); }}>✕</button>
              </div>
            )}
          </div>
        </div>

        {/* 언어 */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>언어</label>
          <div className={styles.toggleGroup}>
            {LANGUAGES.map((lang) => (
              <button
                key={lang.value}
                type="button"
                className={`${styles.toggleBtn} ${
                  language === lang.value ? styles.toggleBtnActive : ''
                }`}
                onClick={() => setLanguage(language === lang.value ? '' : lang.value)}
              >
                {lang.flag} {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* 리퍼런스 URL */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>리퍼런스 URL (선택)</label>
          <div className={styles.urlInputWrapper}>
            <Link size={16} className={styles.urlIcon} />
            <input
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={referenceUrl}
              onChange={(e) => setReferenceUrl(e.target.value)}
            />
          </div>
          {referenceUrl && (
            <p className={styles.urlHint}>✅ AI가 이 URL의 내용을 참고하여 스크립트를 생성합니다</p>
          )}
        </div>

        {/* 다음 버튼 */}
        <div className={styles.navButtons}>
          <Button
            variant="primary"
            size="lg"
            rightIcon={<ChevronRight size={18} />}
            onClick={goNext}
            disabled={!topic.trim()}
          >
            다음 단계
          </Button>
        </div>
      </div>
    </div>
  );

  /* ============================================
     렌더: Step 2 — 스크립트
     ============================================ */
  const renderStep2 = () => (
    <div className={styles.stepContent} key="step2">
      <div className={styles.stepCard}>
        <h2 className={styles.sectionTitle}>📝 스크립트</h2>

        {/* 3탭 통합 안내 */}
        <div className={styles.infoBox}>
          📋 3가지 탭(나레이션/자막/디렉션)은 동일한 콘텐츠를 각 관점으로 분리한 것입니다. AI가 한 번에 모두 생성합니다.
        </div>

        {/* AI 생성 + 다른 버전 추천 */}
        <div className={styles.scriptBtnGroup}>
          <button
            type="button"
            className={`${styles.generateBtn} ${
              isGeneratingScript ? styles.generateBtnLoading : ''
            }`}
            onClick={handleGenerateScript}
            disabled={isGeneratingScript}
          >
            {isGeneratingScript ? (
              <>
                <Loader size={22} className={styles.loader} />
                AI가 스크립트를 작성하고 있어요...
              </>
            ) : scripts.narration ? (
              <>
                <RotateCcw size={22} />
                🔄 다른 버전 추천받기
              </>
            ) : (
              <>
                <Sparkles size={22} />
                🤖 AI로 스크립트 생성
              </>
            )}
          </button>
        </div>

        {/* 버전 히스토리 */}
        {scriptHistory.length > 0 && (
          <div className={styles.versionHistory}>
            <span className={styles.versionLabel}>📂 이전 버전 ({scriptHistory.length}개)</span>
            {scriptHistory.map((hist, i) => (
              <button
                key={i}
                className={styles.versionBtn}
                onClick={() => {
                  setScripts(hist);
                  setScriptConfirmed(false);
                  toast.info('이전 버전 복원', `버전 ${scriptHistory.length - i} 복원됨`);
                }}
              >
                버전 {scriptHistory.length - i} ({hist.narration.slice(0, 20)}...)
              </button>
            ))}
          </div>
        )}

        {/* 탭: 나레이션 / 자막 / 디렉션 */}
        <Tabs
          tabs={SCRIPT_TABS}
          activeTab={scriptTab}
          onChange={setScriptTab}
          variant="pills"
        />

        {/* 텍스트 편집 영역 */}
        <textarea
          className={`${styles.textarea} ${styles.textareaLarge}`}
          placeholder={
            scriptTab === 'narration'
              ? '나레이션 스크립트를 입력하세요...'
              : scriptTab === 'subtitle'
              ? '자막 텍스트를 입력하세요...'
              : '장면 디렉션을 입력하세요...'
          }
          value={scripts[scriptTab]}
          onChange={(e) => {
            setScripts((prev) => ({ ...prev, [scriptTab]: e.target.value }));
            setScriptConfirmed(false);
          }}
          style={{ marginTop: 'var(--space-4)' }}
        />

        {/* 통계 바 */}
        <div className={styles.scriptStats}>
          <div className={styles.statItem}>
            글자 수: <span className={styles.statValue}>{charCount}</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            예상 재생시간:{' '}
            <span className={styles.statValue}>{formatDuration(readingSeconds)}</span>
          </div>
          {lastSaved && (
            <>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <Calendar size={12} />
                {getLastSavedText()}
              </div>
            </>
          )}
        </div>

        {/* 확정 버튼 */}
        {scripts.narration && (
          <button
            type="button"
            className={`${styles.confirmBtn} ${scriptConfirmed ? styles.confirmBtnActive : ''}`}
            onClick={() => {
              setScriptConfirmed(true);
              toast.success('스크립트 확정!', '이 스크립트 기반으로 메타데이터를 생성합니다.');
            }}
          >
            {scriptConfirmed ? (
              <><Check size={16} /> 스크립트 확정됨 ✅</>
            ) : (
              <><Check size={16} /> 이 스크립트로 확정</>
            )}
          </button>
        )}

        {/* 이전/다음 버튼 */}
        <div className={styles.navButtons}>
          <Button
            variant="ghost"
            leftIcon={<ChevronLeft size={18} />}
            onClick={goPrev}
          >
            이전
          </Button>
          <Button
            variant="primary"
            rightIcon={<ChevronRight size={18} />}
            onClick={goNext}
          >
            다음 단계
          </Button>
        </div>
      </div>
    </div>
  );

  /* ============================================
     렌더: Step 3 — 메타데이터
     ============================================ */
  const renderStep3 = () => (
    <div className={styles.stepContent} key="step3">
      <div className={styles.stepCard}>
        <h2 className={styles.sectionTitle}>🏷️ 메타데이터</h2>

        {/* AI 제목/설명 생성 버튼 */}
        <button
          type="button"
          className={`${styles.generateBtn} ${
            isGeneratingMeta ? styles.generateBtnLoading : ''
          }`}
          onClick={handleGenerateMeta}
          disabled={isGeneratingMeta}
        >
          {isGeneratingMeta ? (
            <>
              <Loader size={22} className={styles.loader} />
              제목과 설명을 만들고 있어요...
            </>
          ) : (
            <>
              <Sparkles size={22} />
              🤖 제목/설명 생성
            </>
          )}
        </button>

        {/* 제목 A/B 카드 */}
        {titles.length > 0 && (
          <>
            <h3 className={styles.sectionSubtitle}>제목 후보 (택 1)</h3>
            <div className={styles.titleCards}>
              {titles.map((title, index) => {
                const isSelected = selectedTitleIndex === index;
                const titleLen = countChars(title);
                const ratio = titleLen / YOUTUBE.TITLE_MAX_LENGTH;
                const seoStatus = ratio >= 1 ? 'danger' : ratio >= 0.8 ? 'warning' : 'good';

                return (
                  <div
                    key={index}
                    className={`${styles.titleCard} ${
                      isSelected ? styles.titleCardSelected : ''
                    }`}
                    onClick={() => setSelectedTitleIndex(index)}
                  >
                    {/* Radio */}
                    <div
                      className={`${styles.titleRadio} ${
                        isSelected ? styles.titleRadioSelected : ''
                      }`}
                    >
                      {isSelected && <div className={styles.titleRadioDot} />}
                    </div>

                    {/* 라벨 */}
                    <span className={styles.titleLabel}>
                      {String.fromCharCode(65 + index)}
                    </span>

                    {/* 제목 텍스트 */}
                    <span className={styles.titleText}>{title}</span>

                    {/* SEO 뱃지 */}
                    <Badge variant={seoStatus === 'good' ? 'success' : seoStatus === 'warning' ? 'warning' : 'danger'} size="sm">
                      {seoStatus === 'good' ? '🟢 SEO 적합' : seoStatus === 'warning' ? '🟡 길이 조정 권장' : '🔴 길이 초과'}
                    </Badge>

                    {/* 글자수 */}
                    <span
                      className={`${styles.titleCharCount} ${
                        ratio >= 1
                          ? styles.titleCharDanger
                          : ratio >= 0.8
                          ? styles.titleCharWarning
                          : ''
                      }`}
                    >
                      {titleLen}/{YOUTUBE.TITLE_MAX_LENGTH}
                    </span>
                  </div>
                );
              })}
            </div>
            <button className={styles.regenerateBtn} onClick={handleGenerateMeta} disabled={isGeneratingMeta}>
              <RotateCcw size={14} /> 추가 제안 받기
            </button>
          </>
        )}

        {/* 설명문 A/B 후보 */}
        <div className={styles.descriptionField}>
          <label className={styles.fieldLabel}>설명문</label>
          <p className={styles.seoHint}>💡 상위 3줄이 YouTube 검색 결과에 노출됩니다. CTA와 핵심 키워드를 포함하세요.</p>

          {descriptions.length > 1 && (
            <div className={styles.descVersionTabs}>
              {descriptions.map((_, i) => (
                <button
                  key={i}
                  className={`${styles.descVersionBtn} ${selectedDescIndex === i ? styles.descVersionBtnActive : ''}`}
                  onClick={() => { setSelectedDescIndex(i); setDescription(descriptions[i]); }}
                >
                  버전 {String.fromCharCode(65 + i)}
                </button>
              ))}
            </div>
          )}

          <textarea
            className={`${styles.textarea} ${styles.textareaLarge}`}
            placeholder="영상 설명을 입력하세요..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={YOUTUBE.DESCRIPTION_MAX_LENGTH}
          />
          <div className={styles.charCounter}>
            {countChars(description)}/{YOUTUBE.DESCRIPTION_MAX_LENGTH}
          </div>
        </div>

        {/* 해시태그 */}
        {hashtags.length > 0 && (
          <div className={styles.hashtagArea}>
            <label className={styles.fieldLabel}>해시태그</label>
            <p className={styles.seoHint}>💡 최대 15개 권장. 상위 3개는 제목 아래 표시됩니다.</p>
            <div className={styles.hashtagList}>
              {hashtags.map((tag, index) => (
                <span key={index} className={styles.hashtagBadge}>
                  #{tag}
                  <button
                    type="button"
                    className={styles.hashtagRemove}
                    onClick={() => handleRemoveHashtag(index)}
                    aria-label={`${tag} 삭제`}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
            <div className={styles.hashtagCount}>
              {hashtags.length}/15 해시태그
              {hashtags.length <= 15 ? <Badge variant="success" size="sm">적정</Badge> : <Badge variant="warning" size="sm">초과</Badge>}
            </div>
          </div>
        )}

        {/* SEO 점수 */}
        {titles.length > 0 && (
          <div className={styles.seoScoreCard}>
            <span className={styles.seoScoreLabel}>📊 예상 SEO 점수</span>
            <span className={styles.seoScoreValue}>
              {Math.min(100, Math.round(
                (titles[selectedTitleIndex]?.length <= 60 ? 30 : 15) +
                (description.length >= 100 ? 25 : description.length / 4) +
                (hashtags.length >= 5 && hashtags.length <= 15 ? 25 : 10) +
                (description.includes('#') ? 10 : 0) +
                (titles[selectedTitleIndex]?.includes('?') || titles[selectedTitleIndex]?.includes('!') ? 10 : 5)
              ))}
              <span className={styles.seoScoreMax}>/100</span>
            </span>
          </div>
        )}

        {/* 이전/다음 */}
        <div className={styles.navButtons}>
          <Button
            variant="ghost"
            leftIcon={<ChevronLeft size={18} />}
            onClick={goPrev}
          >
            이전
          </Button>
          <Button
            variant="primary"
            rightIcon={<ChevronRight size={18} />}
            onClick={goNext}
          >
            다음 단계
          </Button>
        </div>
      </div>
    </div>
  );

  /* ============================================
     렌더: Step 4 — 썸네일 (프롬프트 추천 + 업로드)
     ============================================ */
  const renderStep4 = () => (
    <div className={styles.stepContent} key="step4">
      <div className={styles.stepCard}>
        <h2 className={styles.sectionTitle}>🎨 썸네일</h2>
        <p className={styles.stepDescription}>
          AI가 추천하는 프롬프트로 Gemini에서 썸네일을 만들고, 완성된 이미지를 업로드하세요.
        </p>

        {/* 프롬프트 추천 버튼 */}
        <button
          type="button"
          className={`${styles.generateBtn} ${
            isGeneratingPrompts ? styles.generateBtnLoading : ''
          }`}
          onClick={handleGeneratePrompts}
          disabled={isGeneratingPrompts}
        >
          {isGeneratingPrompts ? (
            <>
              <Loader size={22} className={styles.loader} />
              프롬프트를 만들고 있어요...
            </>
          ) : (
            <>
              <Wand2 size={22} />
              ✨ 썸네일 프롬프트 추천받기
            </>
          )}
        </button>

        {/* 프롬프트 카드들 */}
        {thumbPrompts.length > 0 && (
          <div className={styles.promptCards}>
            {thumbPrompts.map((item, index) => (
              <div key={index} className={styles.promptCard}>
                <div className={styles.promptHeader}>
                  <Badge variant={index === 0 ? 'accent' : index === 1 ? 'info' : 'success'} size="sm">
                    {item.style}
                  </Badge>
                  <button
                    className={styles.copyBtn}
                    onClick={() => handleCopyPrompt(item.prompt, index)}
                  >
                    {copiedIndex === index ? (
                      <><Check size={14} /> 복사됨!</>
                    ) : (
                      <><Copy size={14} /> 복사</>
                    )}
                  </button>
                </div>
                <p className={styles.promptText}>{item.prompt}</p>
                <p className={styles.promptTip}>{item.tip}</p>
              </div>
            ))}

            <div className={styles.promptGuide}>
              <Sparkles size={16} />
              <span>
                프롬프트를 복사 → <strong>Gemini</strong>에서 이미지 생성 → 다운로드 → 아래에서 업로드
              </span>
            </div>
          </div>
        )}

        {/* 썸네일 업로드 영역 */}
        <div className={styles.uploadSection}>
          <h3 className={styles.uploadTitle}>
            <Upload size={18} />
            완성된 썸네일 업로드
          </h3>

          {!uploadedThumbnail ? (
            <label className={styles.uploadArea}>
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailUpload}
                className={styles.fileInput}
              />
              <div className={styles.uploadPlaceholder}>
                <Upload size={32} />
                <span className={styles.uploadMainText}>클릭하여 썸네일 업로드</span>
                <span className={styles.uploadSubText}>PNG, JPG, WebP · 최대 10MB · 권장 1280×720</span>
              </div>
            </label>
          ) : (
            <div className={styles.uploadedPreview}>
              <img
                src={uploadedThumbnail}
                alt="업로드된 썸네일"
                className={styles.previewImage}
              />
              <div className={styles.previewInfo}>
                <span className={styles.previewName}>{uploadedThumbnailName}</span>
                <button
                  className={styles.removeBtn}
                  onClick={() => {
                    setUploadedThumbnail(null);
                    setUploadedThumbnailName('');
                  }}
                >
                  <X size={14} /> 제거
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 비용 안내 */}
        <div className={styles.creditInfo}>
          <Sparkles size={16} />
          <span>프롬프트 추천은 <strong>무료</strong>입니다 · Gemini Pro에서 직접 이미지를 생성하세요</span>
        </div>

        {/* 최종 액션 버튼 */}
        <div className={styles.navButtons}>
          <Button
            variant="ghost"
            leftIcon={<ChevronLeft size={18} />}
            onClick={goPrev}
          >
            이전
          </Button>
          <div className={styles.finalActions}>
            <Button
              variant="secondary"
              leftIcon={<Eye size={18} />}
              disabled={!uploadedThumbnail && thumbPrompts.length === 0}
              onClick={() => setShowPreview(true)}
            >
              완성 미리보기
            </Button>
            <Button
              variant="primary"
              leftIcon={<Save size={18} />}
              disabled={!uploadedThumbnail && thumbPrompts.length === 0}
              onClick={() => {
                toast.success('저장 완료!', '콘텐츠가 라이브러리에 저장되었습니다.');
                setTimeout(() => navigate('/library'), 1000);
              }}
            >
              라이브러리에 저장
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  /* ============================================
     메인 렌더
     ============================================ */
  return (
    <div className={styles.page}>
      {/* 스텝 인디케이터 */}
      {renderStepIndicator()}

      {/* 현재 스텝 렌더 */}
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
      {currentStep === 4 && renderStep4()}

      {/* 완성 미리보기 모달 */}
      <Modal isOpen={showPreview} onClose={() => setShowPreview(false)} title="📺 YouTube 미리보기" size="lg">
        <div className={styles.previewModal}>
          {/* 썸네일 */}
          <div className={styles.previewThumbArea}>
            {uploadedThumbnail ? (
              <img src={uploadedThumbnail} alt="썸네일" className={styles.previewThumbImg} />
            ) : (
              <div className={styles.previewThumbPlaceholder}>
                <Image size={48} />
                <span>썸네일을 업로드하면 여기에 표시됩니다</span>
              </div>
            )}
          </div>

          {/* 영상 정보 */}
          <div className={styles.previewVideoInfo}>
            <h3 className={styles.previewVideoTitle}>
              {titles[selectedTitleIndex] || '제목을 생성해주세요'}
            </h3>
            <div className={styles.previewVideoMeta}>
              <span>조회수 0회</span>
              <span>·</span>
              <span>방금 전</span>
            </div>
            <div className={styles.previewChannelRow}>
              <div className={styles.previewChannelAvatar}>C</div>
              <span>CreatorFlow 채널</span>
            </div>
            <p className={styles.previewDesc}>
              {description ? description.split('\n').slice(0, 3).join('\n') : '설명문을 생성해주세요'}
            </p>
            {hashtags.length > 0 && (
              <div className={styles.previewHashtags}>
                {hashtags.slice(0, 3).map((tag, i) => (
                  <span key={i} className={styles.previewHashtag}>#{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
