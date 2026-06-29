/* ============================================
   API 서비스 레이어
   개발 모드: Mock 데이터 반환
   프로덕션 모드: Google Generative AI (Gemini) 직접 호출
   ============================================ */

import { GoogleGenerativeAI } from '@google/generative-ai';
import useSettingsStore from '../stores/settingsStore';
import { mockAIResponses, mockTrends, mockAnalytics } from '../mocks/mockData';

const API_DELAY = 1500; // Mock 응답 지연 (ms)

// Gemini API 초기화 (VITE_GEMINI_API_KEY 사용)
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

/**
 * 개발 모드 여부 확인
 */
function isDevMode() {
  return useSettingsStore.getState().devMode;
}

/**
 * Mock 응답 지연 헬퍼
 */
function delay(ms = API_DELAY) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ============================================
   AI 서비스 (Gemini 직접 호출)
   ============================================ */

export const aiService = {
  /**
   * 스크립트 생성
   */
  async generateScript({ topic, category, tone, language, referenceUrl }) {
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    const prompt = `당신은 전문 유튜브 쇼츠 기획자입니다.
다음 조건에 맞춰서 매력적인 쇼츠 스크립트를 작성해주세요.

- 주제: ${topic}
- 카테고리: ${category}
- 톤앤매너: ${tone}
- 언어: ${language}
${referenceUrl ? `- 참고 자료: ${referenceUrl}` : ''}

결과는 반드시 아래 JSON 형식으로만 출력해주세요 (마크다운 백틱 없이 순수 JSON만 반환):
{
  "narration": "[나레이션 텍스트]",
  "subtitle": "[화면에 표시될 자막]",
  "direction": "[영상 연출/화면 지시사항]"
}`;

    let retries = 3;
    let delayMs = 1000;
    while (retries > 0) {
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(text);
      } catch (error) {
        if (error.status === 503 && retries > 1) {
          retries--;
          await new Promise(res => setTimeout(res, delayMs));
          delayMs *= 2; // Exponential backoff
        } else {
          throw error;
        }
      }
    }
  },

  async generateMeta({ topic, script, category }) {
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    const prompt = `당신은 유튜브 SEO 전문가입니다.
다음 스크립트를 바탕으로 유튜브 메타데이터를 작성해주세요.

- 카테고리: ${category}
- 스크립트 내용: ${script.narration}

결과는 반드시 아래 JSON 형식으로만 출력해주세요 (마크다운 백틱 없이 순수 JSON만 반환):
{
  "titles": [
    { "text": "첫번째 제목 후보", "score": 95, "reason": "어그로성 높은 훅" },
    { "text": "두번째 제목 후보", "score": 88, "reason": "검색에 유리한 키워드 조합" },
    { "text": "세번째 제목 후보", "score": 85, "reason": "궁금증 유발" }
  ],
  "description": "유튜브 영상 설명문 (해시태그 포함하지 말 것)",
  "hashtags": ["#키워드1", "#키워드2", "#키워드3"]
}`;

    let retries = 3;
    let delayMs = 1000;
    while (retries > 0) {
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(text);
      } catch (error) {
        if (error.status === 503 && retries > 1) {
          retries--;
          await new Promise(res => setTimeout(res, delayMs));
          delayMs *= 2;
        } else {
          throw error;
        }
      }
    }
  },

  /**
   * 썸네일 프롬프트 추천 (무료 - Gemini Flash)
   */
  async generatePrompts({ topic, titles, category, tone }) {
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    const prompt = `당신은 썸네일 디자이너이자 AI 프롬프트 엔지니어입니다.
다음 주제로 유튜브 쇼츠 썸네일을 만들기 위한 AI 이미지 생성 프롬프트를 3가지 스타일로 추천해주세요.

- 주제: ${topic}
- 톤앤매너: ${tone}

결과는 반드시 아래 JSON 형식으로만 출력해주세요 (마크다운 백틱 없이 순수 JSON만 반환):
{
  "prompts": [
    {
      "style": "스타일 이름 (예: 일러스트/시네마틱 등)",
      "prompt": "AI 이미지 생성기(Midjourney/DALL-E 등)에 입력할 영문 프롬프트 상세 내용",
      "tip": "디자인 팁 1줄"
    }
  ]
}`;

    let retries = 3;
    let delayMs = 1000;
    while (retries > 0) {
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(text);
      } catch (error) {
        if (error.status === 503 && retries > 1) {
          retries--;
          await new Promise(res => setTimeout(res, delayMs));
          delayMs *= 2;
        } else {
          throw error;
        }
      }
    }
  },
};

/* ============================================
   트렌드 서비스 (Mock 고정)
   ============================================ */

export const trendService = {
  async fetchTrends(source = 'google') {
    await delay(800);
    return mockTrends[source] || [];
  },
};

/* ============================================
   YouTube 서비스 (Mock 고정)
   ============================================ */

export const youtubeService = {
  async getChannelStats() {
    await delay(800);
    return mockAnalytics;
  },
};

export default {
  ai: aiService,
  trend: trendService,
  youtube: youtubeService,
};
