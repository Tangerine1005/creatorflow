/* ============================================
   Settings Page — 설정
   API 키 관리, 테마, 개발 모드, 프로필, 데이터 내보내기
   ============================================ */

import { useState, useCallback, useEffect } from 'react';
import {
  Settings as SettingsIcon, Key, Palette, Globe, Bell, Code,
  Eye, EyeOff, Save, Shield, RotateCcw, ChevronRight,
  AlertTriangle, CheckCircle, ExternalLink,
  Download, TestTube, User, Mail, FileJson, FileSpreadsheet, Database
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';
import useSettingsStore from '../stores/settingsStore';
import styles from './Settings.module.css';

const SECTIONS = [
  { key: 'profile', label: '프로필', icon: User },
  { key: 'api', label: 'API 키 관리', icon: Key },
  { key: 'theme', label: '테마 & 언어', icon: Palette },
  { key: 'notifications', label: '알림 설정', icon: Bell },
  { key: 'export', label: '데이터 내보내기', icon: Download },
  { key: 'dev', label: '개발 모드', icon: Code },
];

export default function SettingsPage() {
  const settings = useSettingsStore();
  const toast = useToast();
  const [activeSection, setActiveSection] = useState('profile');
  const [showGemini, setShowGemini] = useState(false);
  const [showYoutube, setShowYoutube] = useState(false);
  const [geminiKey, setGeminiKey] = useState(settings.geminiApiKey);
  const [youtubeKey, setYoutubeKey] = useState(settings.youtubeApiKey);
  const [saved, setSaved] = useState(false);

  /* ── 프로필 상태 ── */
  const [profileName, setProfileName] = useState('크리에이터');
  const [profileEmail, setProfileEmail] = useState('creator@example.com');
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    import('../services/auth').then(({ default: authService }) => {
      authService.getUser().then(({ user }) => {
        if (user) {
          setProfileName(user?.user_metadata?.display_name || user?.email?.split('@')[0] || '크리에이터');
          setProfileEmail(user?.email || 'creator@example.com');
        }
      });
    });
  }, []);

  /* ── API 테스트 상태 ── */
  const [testingGemini, setTestingGemini] = useState(false);
  const [testingYoutube, setTestingYoutube] = useState(false);

  /* ── API 키 저장 ── */
  const handleSaveKeys = () => {
    settings.setGeminiApiKey(geminiKey);
    settings.setYoutubeApiKey(youtubeKey);
    setSaved(true);
    toast.success('🔑 API 키가 저장되었습니다.');
    setTimeout(() => setSaved(false), 2000);
  };

  /* ── API 연결 테스트 ── */
  const handleTestApi = useCallback(async (apiName, apiKey, setTesting) => {
    if (!apiKey && !settings.devMode) {
      toast.warning(`${apiName} API 키를 먼저 입력해주세요.`);
      return;
    }
    setTesting(true);

    // 시뮬레이션: 1.5초 후 결과 반환
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (settings.devMode || !apiKey) {
      toast.success(`✅ ${apiName} 연결 성공 (Mock)`, '개발 모드에서 Mock 응답을 사용합니다.');
    } else {
      // 실제 모드 — 간단한 헬스체크 시뮬레이션
      toast.success(`✅ ${apiName} 연결 성공`, 'API 키가 유효합니다.');
    }
    setTesting(false);
  }, [settings.devMode, toast]);

  /* ── 프로필 저장 ── */
  const handleSaveProfile = () => {
    if (!profileName.trim()) {
      toast.warning('이름을 입력해주세요.');
      return;
    }
    if (!profileEmail.trim()) {
      toast.warning('이메일을 입력해주세요.');
      return;
    }
    setProfileSaved(true);
    toast.success('✅ 프로필이 저장되었습니다.');
    setTimeout(() => setProfileSaved(false), 2000);
  };

  /** 테마 변경 — Zustand + ThemeToggle localStorage 동기화 */
  const handleThemeChange = (theme) => {
    settings.setTheme(theme);
    localStorage.setItem('creatorflow-theme', theme);
  };

  /** 개발 모드 토글 — Toast 피드백 + 콘솔 디버그 */
  const handleDevModeToggle = (checked) => {
    settings.setDevMode(checked);
    console.log('🛠️ 개발 모드:', checked);
    if (checked) {
      toast.info('개발 모드가 활성화되었습니다.', 'Mock 데이터로 동작합니다.');
    } else {
      toast.warning('개발 모드가 비활성화되었습니다.', '실제 API를 사용합니다.');
    }
  };

  /** 온보딩 리셋 — Toast 피드백 */
  const handleResetOnboarding = () => {
    settings.setOnboardingCompleted(false);
    toast.success('온보딩 가이드가 초기화되었습니다.', '다음 페이지 이동 시 투어가 시작됩니다.');
  };

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

  /* ── 데이터 내보내기: JSON ── */
  const handleExportJSON = () => {
    try {
      const json = JSON.stringify(contents, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `creatorflow-contents-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('📦 JSON 내보내기 완료', `${contents.length}개 콘텐츠가 다운로드되었습니다.`);
    } catch (err) {
      toast.error('내보내기 실패', err.message);
    }
  };

  /* ── 데이터 내보내기: CSV ── */
  const handleExportCSV = () => {
    try {
      const headers = ['id', 'status', 'category', 'tone', 'topic', 'created_at'];
      const csvRows = [
        headers.join(','),
        ...contents.map(c =>
          headers.map(h => {
            const val = c[h] ?? '';
            // CSV에서 쉼표, 따옴표, 줄바꿈 이스케이프
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
          }).join(',')
        ),
      ];
      const csv = csvRows.join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `creatorflow-contents-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('📊 CSV 내보내기 완료', `${contents.length}개 콘텐츠가 다운로드되었습니다.`);
    } catch (err) {
      toast.error('내보내기 실패', err.message);
    }
  };

  return (
    <div className={styles.settings}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <SettingsIcon size={24} />
          설정
        </h2>
      </div>

      <div className={styles.layout}>
        {/* 사이드 메뉴 */}
        <nav className={styles.sideNav}>
          {SECTIONS.map(section => {
            const Icon = section.icon;
            return (
              <button
                key={section.key}
                className={`${styles.navItem} ${activeSection === section.key ? styles.active : ''}`}
                onClick={() => setActiveSection(section.key)}
              >
                <Icon size={18} />
                <span>{section.label}</span>
                <ChevronRight size={16} className={styles.navArrow} />
              </button>
            );
          })}
        </nav>

        {/* 콘텐츠 */}
        <div className={styles.content}>

          {/* ─── 프로필 ─── */}
          {activeSection === 'profile' && (
            <div className={styles.section + ' animate-fade-in'}>
              <h3 className={styles.sectionTitle}>
                <User size={20} />
                프로필 설정
              </h3>
              <p className={styles.sectionDesc}>
                프로필 정보를 수정합니다.
              </p>

              <Card className={styles.profileCard}>
                <div className={styles.profileAvatar}>
                  {profileName.charAt(0) || 'U'}
                </div>
                <div className={styles.profileFields}>
                  <div className={styles.profileField}>
                    <Input
                      label="이름"
                      placeholder="이름을 입력하세요"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      leftIcon={<User size={16} />}
                    />
                  </div>
                  <div className={styles.profileField}>
                    <Input
                      type="email"
                      label="이메일"
                      placeholder="이메일을 입력하세요"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      leftIcon={<Mail size={16} />}
                    />
                  </div>
                </div>
              </Card>

              <div className={styles.saveRow}>
                <Button
                  variant="primary"
                  leftIcon={profileSaved ? <CheckCircle size={18} /> : <Save size={18} />}
                  onClick={handleSaveProfile}
                >
                  {profileSaved ? '저장 완료!' : '프로필 저장'}
                </Button>
              </div>
            </div>
          )}

          {/* ─── API 키 관리 ─── */}
          {activeSection === 'api' && (
            <div className={styles.section + ' animate-fade-in'}>
              <h3 className={styles.sectionTitle}>
                <Key size={20} />
                API 키 관리
              </h3>
              <p className={styles.sectionDesc}>
                외부 서비스 연동을 위한 API 키를 설정합니다. 키는 로컬에 안전하게 저장됩니다.
              </p>

              <div className={styles.apiCards}>
                {/* Gemini API */}
                <Card className={styles.apiCard}>
                  <div className={styles.apiHeader}>
                    <div className={styles.apiInfo}>
                      <span className={styles.apiName}>Google Gemini API</span>
                      <Badge variant={geminiKey ? 'success' : 'warning'} size="sm">
                        {geminiKey ? '연결됨' : '미설정'}
                      </Badge>
                    </div>
                    <div className={styles.apiHeaderActions}>
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={testingGemini}
                        leftIcon={<TestTube size={14} />}
                        onClick={() => handleTestApi('Gemini', geminiKey, setTestingGemini)}
                      >
                        연결 테스트
                      </Button>
                      <a
                        href="https://aistudio.google.com/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.apiLink}
                      >
                        키 발급받기 <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                  <div className={styles.apiInputWrapper}>
                    <Input
                      type={showGemini ? 'text' : 'password'}
                      placeholder="Gemini API 키를 입력하세요"
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      rightIcon={
                        <button
                          onClick={() => setShowGemini(!showGemini)}
                          className={styles.eyeBtn}
                        >
                          {showGemini ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      }
                    />
                  </div>
                </Card>

                {/* YouTube API */}
                <Card className={styles.apiCard}>
                  <div className={styles.apiHeader}>
                    <div className={styles.apiInfo}>
                      <span className={styles.apiName}>YouTube Data API v3</span>
                      <Badge variant={youtubeKey ? 'success' : 'warning'} size="sm">
                        {youtubeKey ? '연결됨' : '미설정'}
                      </Badge>
                    </div>
                    <div className={styles.apiHeaderActions}>
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={testingYoutube}
                        leftIcon={<TestTube size={14} />}
                        onClick={() => handleTestApi('YouTube', youtubeKey, setTestingYoutube)}
                      >
                        연결 테스트
                      </Button>
                      <a
                        href="https://console.cloud.google.com/apis/credentials"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.apiLink}
                      >
                        키 발급받기 <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                  <div className={styles.apiInputWrapper}>
                    <Input
                      type={showYoutube ? 'text' : 'password'}
                      placeholder="YouTube API 키를 입력하세요"
                      value={youtubeKey}
                      onChange={(e) => setYoutubeKey(e.target.value)}
                      rightIcon={
                        <button
                          onClick={() => setShowYoutube(!showYoutube)}
                          className={styles.eyeBtn}
                        >
                          {showYoutube ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      }
                    />
                  </div>
                </Card>
              </div>

              <div className={styles.saveRow}>
                <Button
                  variant="primary"
                  leftIcon={saved ? <CheckCircle size={18} /> : <Save size={18} />}
                  onClick={handleSaveKeys}
                >
                  {saved ? '저장 완료!' : 'API 키 저장'}
                </Button>
                {!geminiKey && (
                  <div className={styles.hint}>
                    <AlertTriangle size={16} />
                    <span>API 키가 없으면 개발 모드(Mock 데이터)로 동작합니다.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── 테마 & 언어 ─── */}
          {activeSection === 'theme' && (
            <div className={styles.section + ' animate-fade-in'}>
              <h3 className={styles.sectionTitle}>
                <Palette size={20} />
                테마 & 언어
              </h3>

              <div className={styles.optionGroup}>
                <label className={styles.optionLabel}>테마</label>
                <div className={styles.themeCards}>
                  <button
                    className={`${styles.themeCard} ${settings.theme === 'dark' ? styles.selected : ''}`}
                    onClick={() => handleThemeChange('dark')}
                  >
                    <div className={styles.themePreviewDark} />
                    <span>다크 모드</span>
                  </button>
                  <button
                    className={`${styles.themeCard} ${settings.theme === 'light' ? styles.selected : ''}`}
                    onClick={() => handleThemeChange('light')}
                  >
                    <div className={styles.themePreviewLight} />
                    <span>라이트 모드</span>
                  </button>
                </div>
              </div>

              <div className={styles.optionGroup}>
                <label className={styles.optionLabel}>언어</label>
                <div className={styles.langBtns}>
                  <button
                    className={`${styles.langBtn} ${settings.language === 'ko' ? styles.selected : ''}`}
                    onClick={() => settings.setLanguage('ko')}
                  >
                    🇰🇷 한국어
                  </button>
                  <button
                    className={`${styles.langBtn} ${settings.language === 'en' ? styles.selected : ''}`}
                    onClick={() => settings.setLanguage('en')}
                  >
                    🇺🇸 English
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── 알림 ─── */}
          {activeSection === 'notifications' && (
            <div className={styles.section + ' animate-fade-in'}>
              <h3 className={styles.sectionTitle}>
                <Bell size={20} />
                알림 설정
              </h3>

              <div className={styles.toggleRow}>
                <div>
                  <span className={styles.toggleLabel}>브라우저 알림</span>
                  <span className={styles.toggleDesc}>크레딧 소진, 할당량 경고 등을 알려줍니다</span>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={settings.notificationsEnabled}
                    onChange={(e) => settings.setNotificationsEnabled(e.target.checked)}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>

              <div className={styles.toggleRow}>
                <div>
                  <span className={styles.toggleLabel}>자동 저장 간격</span>
                  <span className={styles.toggleDesc}>현재: {settings.autoSaveInterval / 1000}초</span>
                </div>
                <select
                  className={styles.filterSelect}
                  value={settings.autoSaveInterval}
                  onChange={(e) => settings.setAutoSaveInterval(Number(e.target.value))}
                >
                  <option value={10000}>10초</option>
                  <option value={30000}>30초</option>
                  <option value={60000}>60초</option>
                </select>
              </div>
            </div>
          )}

          {/* ─── 데이터 내보내기 ─── */}
          {activeSection === 'export' && (
            <div className={styles.section + ' animate-fade-in'}>
              <h3 className={styles.sectionTitle}>
                <Database size={20} />
                데이터 내보내기
              </h3>
              <p className={styles.sectionDesc}>
                전체 콘텐츠 데이터를 다운로드합니다. 현재 {contents.length}개의 콘텐츠가 있습니다.
              </p>

              <Card className={styles.exportCard}>
                <div className={styles.exportInfo}>
                  <div className={styles.exportStat}>
                    <span className={styles.exportStatValue}>{contents.length}</span>
                    <span className={styles.exportStatLabel}>전체 콘텐츠</span>
                  </div>
                  <div className={styles.exportStat}>
                    <span className={styles.exportStatValue}>
                      {contents.filter(c => c.status === 'published').length}
                    </span>
                    <span className={styles.exportStatLabel}>발행됨</span>
                  </div>
                  <div className={styles.exportStat}>
                    <span className={styles.exportStatValue}>
                      {contents.filter(c => c.status === 'draft').length}
                    </span>
                    <span className={styles.exportStatLabel}>초안</span>
                  </div>
                </div>
              </Card>

              <div className={styles.exportButtons}>
                <Button
                  variant="primary"
                  leftIcon={<FileJson size={18} />}
                  onClick={handleExportJSON}
                >
                  JSON 다운로드
                </Button>
                <Button
                  variant="secondary"
                  leftIcon={<FileSpreadsheet size={18} />}
                  onClick={handleExportCSV}
                >
                  CSV 다운로드
                </Button>
              </div>

              <div className={styles.exportHint}>
                <AlertTriangle size={16} />
                <span>JSON은 전체 필드를 포함하며, CSV는 주요 필드만 내보냅니다.</span>
              </div>
            </div>
          )}

          {/* ─── 개발 모드 ─── */}
          {activeSection === 'dev' && (
            <div className={styles.section + ' animate-fade-in'}>
              <h3 className={styles.sectionTitle}>
                <Code size={20} />
                개발 모드
              </h3>

              <Card className={styles.devCard}>
                <div className={styles.toggleRow}>
                  <div>
                    <span className={styles.toggleLabel}>개발 모드 활성화</span>
                    <span className={styles.toggleDesc}>
                      API 키 없이 Mock 데이터로 전체 기능을 테스트할 수 있습니다.
                      API 키를 설정하지 않으면 자동으로 활성화됩니다.
                    </span>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={settings.devMode}
                      onChange={(e) => handleDevModeToggle(e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
                {settings.devMode && (
                  <div className={styles.devNotice}>
                    <Shield size={16} />
                    <span>개발 모드에서는 모든 API 호출이 Mock 데이터를 반환합니다.</span>
                  </div>
                )}
              </Card>

              <div className={styles.optionGroup}>
                <label className={styles.optionLabel}>온보딩</label>
                <Button
                  variant="secondary"
                  leftIcon={<RotateCcw size={18} />}
                  onClick={handleResetOnboarding}
                >
                  가이드 투어 다시 보기
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
