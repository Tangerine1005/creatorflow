/* ============================================
   API 서비스 레이어
   개발 모드: Mock 데이터 반환
   프로덕션 모드: Supabase Edge Functions 호출
   ============================================ */

import useSettingsStore from '../stores/settingsStore';
import { mockAIResponses, mockTrends, mockAnalytics } from '../mocks/mockData';

const API_DELAY = 1500; // Mock 응답 지연 (ms)

/**
 * 개발 모드 여부 확인
 */
function isDevMode() {
  const state = useSettingsStore.getState();
  return state.devMode || !state.geminiApiKey;
}

/**
 * Edge Function 호출 헬퍼
 */
async function callEdgeFunction(functionName, body) {
  const settings = useSettingsStore.getState();
  const baseUrl = settings.supabaseUrl;

  if (!baseUrl) {
    throw new Error('Supabase URL이 설정되지 않았습니다.');
  }

  const response = await fetch(`${baseUrl}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.supabaseAnonKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `API 오류: ${response.status}`);
  }

  return response.json();
}

/**
 * Mock 응답 지연 헬퍼
 */
function delay(ms = API_DELAY) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ============================================
   AI 서비스
   ============================================ */

export const aiService = {
  /**
   * 스크립트 생성
   */
  async generateScript({ topic, category, tone, language, referenceUrl }) {
    if (isDevMode()) {
      await delay();
      return {
        narration: mockAIResponses.script.narration,
        subtitle: mockAIResponses.script.subtitle,
        direction: mockAIResponses.script.direction,
      };
    }

    return callEdgeFunction('generate-script', {
      topic, category, tone, language, referenceUrl,
    });
  },

  /**
   * 메타데이터 생성 (제목, 설명, 해시태그)
   */
  async generateMeta({ topic, script, category }) {
    if (isDevMode()) {
      await delay();
      return {
        titles: mockAIResponses.titles,
        description: mockAIResponses.description,
        hashtags: mockAIResponses.hashtags,
      };
    }

    return callEdgeFunction('generate-meta', { topic, script, category });
  },

  /**
   * 썸네일 프롬프트 추천 (무료 - Gemini Flash)
   */
  async generatePrompts({ topic, titles, category, tone }) {
    if (isDevMode()) {
      await delay();
      const topicText = topic || '직장인 공감 콘텐츠';
      return {
        prompts: [
          {
            style: '일러스트/카툰',
            prompt: `유튜브 쇼츠 썸네일, 일러스트 스타일. 주제: "${topicText}". 밝은 보라색+시안 그라디언트 배경, 귀여운 캐릭터, 굵은 한국어 텍스트, 1280x720px`,
            tip: '💡 Gemini에서 "일러스트 스타일"을 강조하세요',
          },
          {
            style: '밈/텍스트',
            prompt: `유튜브 쇼츠 썸네일, 밈 스타일. 주제: "${topicText}". 다크 배경에 네온 컬러 텍스트, 이모지 장식, 충격적 문구, 1280x720px`,
            tip: '💡 텍스트가 큰 밈형 썸네일은 클릭률이 높습니다',
          },
          {
            style: '시네마틱',
            prompt: `유튜브 쇼츠 썸네일, 시네마틱 스타일. 주제: "${topicText}". 영화 포스터풍, 따뜻한 톤 색감, 한글 타이틀, 1280x720px`,
            tip: '💡 공감/감성 콘텐츠에 적합합니다',
          },
        ],
      };
    }

    return callEdgeFunction('generate-image', { topic, titles, category, tone });
  },
};

/* ============================================
   트렌드 서비스
   ============================================ */

export const trendService = {
  /**
   * 트렌드 키워드 조회
   */
  async fetchTrends(source = 'google') {
    if (isDevMode()) {
      await delay(800);
      return mockTrends[source] || [];
    }

    const result = await callEdgeFunction('fetch-trends', { source });
    return result.keywords || [];
  },
};

/* ============================================
   YouTube 서비스
   ============================================ */

export const youtubeService = {
  /**
   * 채널 통계 조회
   */
  async getChannelStats() {
    if (isDevMode()) {
      await delay(800);
      return mockAnalytics;
    }

    return callEdgeFunction('youtube-stats', {});
  },
};

/* ============================================
   통합 export
   ============================================ */

export default {
  ai: aiService,
  trend: trendService,
  youtube: youtubeService,
};
