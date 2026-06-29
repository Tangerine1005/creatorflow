// supabase/functions/generate-meta/index.js
// Gemini API로 제목/설명/해시태그를 생성하는 Edge Function

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export default async function handler(req) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const { topic, script, category } = await req.json();

    if (!topic) {
      return new Response(
        JSON.stringify({ error: 'topic is required' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const scriptContext = script
      ? `\n\n스크립트 내용:\n${script.slice(0, 2000)}`  // 토큰 절약
      : '';

    const prompt = `당신은 유튜브 SEO 전문가입니다.

다음 콘텐츠에 대한 메타데이터를 생성해주세요:

주제: ${topic}
카테고리: ${category || '일반'}${scriptContext}

반드시 아래 JSON 형식으로만 응답하세요:
{
  "titles": [
    "클릭을 유도하는 제목 1 (50자 이내, 호기심 유발)",
    "클릭을 유도하는 제목 2 (50자 이내, 키워드 중심)",
    "클릭을 유도하는 제목 3 (50자 이내, 감성적)"
  ],
  "description": "영상 설명 (500~1000자, SEO 최적화, 타임스탬프 포함, 관련 키워드 자연스럽게 삽입)",
  "hashtags": ["관련해시태그1", "관련해시태그2", "관련해시태그3", "관련해시태그4", "관련해시태그5", "관련해시태그6", "관련해시태그7", "관련해시태그8", "관련해시태그9", "관련해시태그10"]
}

제목 규칙:
- 숫자, 이모지, 질문형 등 클릭 유도 요소 활용
- 검색어 키워드를 앞부분에 배치
- 50자를 넘기지 않기

설명 규칙:
- 첫 2줄에 핵심 내용 요약
- 타임스탬프 3~5개 포함
- 관련 검색 키워드 자연스럽게 포함

해시태그 규칙:
- # 없이 키워드만
- 대중적인 태그 + 니치 태그 혼합
- 10개 이내`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.9,
          topP: 0.95,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!geminiRes.ok) {
      const errorBody = await geminiRes.text();
      console.error('Gemini API error:', geminiRes.status, errorBody);
      throw new Error(`Gemini API error: ${geminiRes.status}`);
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error('Empty response from Gemini API');
    }

    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleaned);

    // 결과 검증 및 정규화
    const titles = Array.isArray(result.titles) ? result.titles.slice(0, 3) : [];
    const description = typeof result.description === 'string' ? result.description : '';
    const hashtags = Array.isArray(result.hashtags)
      ? result.hashtags.map((tag) => tag.replace(/^#/, '').trim()).filter(Boolean).slice(0, 10)
      : [];

    return new Response(
      JSON.stringify({ titles, description, hashtags }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('generate-meta error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }
}
