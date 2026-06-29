// CreatorFlow — 설정 스토어 (테마, 언어, API 키 등)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useSettingsStore = create(
  persist(
    (set, get) => ({
      // 테마
      theme: 'dark',
      toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        set({ theme: newTheme });
      },
      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        set({ theme });
      },

      // 언어
      language: 'ko',
      setLanguage: (language) => set({ language }),

      // API 키
      geminiApiKey: '',
      youtubeApiKey: '',
      naverClientId: '',
      naverClientSecret: '',
      setGeminiApiKey: (key) => set({ geminiApiKey: key }),
      setYoutubeApiKey: (key) => set({ youtubeApiKey: key }),
      setNaverCredentials: (clientId, clientSecret) =>
        set({ naverClientId: clientId, naverClientSecret: clientSecret }),

      // Supabase 설정
      supabaseUrl: '',
      supabaseAnonKey: '',
      setSupabaseConfig: (url, anonKey) =>
        set({ supabaseUrl: url, supabaseAnonKey: anonKey }),

      // 개발 모드
      devMode: true, // API 키 없을 때 자동으로 Mock 데이터 사용
      setDevMode: (mode) => set({ devMode: mode }),
      isDevMode: () => {
        const state = get();
        return state.devMode || !state.geminiApiKey;
      },

      // 기본값 설정
      defaults: {
        tone: 'funny',
        category: 'work',
        language: 'ko',
        privacy: 'private',
        aiDisclosure: true,
      },
      setDefaults: (defaults) =>
        set({ defaults: { ...get().defaults, ...defaults } }),

      // 자동 저장 간격 (밀리초)
      autoSaveInterval: 30000,
      setAutoSaveInterval: (interval) => set({ autoSaveInterval: interval }),

      // YouTube 통계 캐싱 간격 (밀리초)
      statsCacheInterval: 24 * 60 * 60 * 1000, // 24시간
      setStatsCacheInterval: (interval) => set({ statsCacheInterval: interval }),

      // 알림 설정
      notificationsEnabled: true,
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),

      // 온보딩 완료 여부
      onboardingCompleted: false,
      setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),

      // 사이드바 접힘 상태
      sidebarCollapsed: false,
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    }),
    {
      name: 'creatorflow-settings',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        geminiApiKey: state.geminiApiKey,
        youtubeApiKey: state.youtubeApiKey,
        naverClientId: state.naverClientId,
        naverClientSecret: state.naverClientSecret,
        supabaseUrl: state.supabaseUrl,
        supabaseAnonKey: state.supabaseAnonKey,
        devMode: state.devMode,
        defaults: state.defaults,
        autoSaveInterval: state.autoSaveInterval,
        statsCacheInterval: state.statsCacheInterval,
        notificationsEnabled: state.notificationsEnabled,
        onboardingCompleted: state.onboardingCompleted,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);

// 앱 시작 시 테마 초기화
const initTheme = () => {
  const stored = localStorage.getItem('creatorflow-settings');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      const theme = parsed?.state?.theme || 'dark';
      document.documentElement.setAttribute('data-theme', theme);
    } catch {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
};

initTheme();

export default useSettingsStore;
