// supabase/functions/generate-script/index.js
// Gemini API를 호출하여 영상 스크립트를 생성하는 Edge Function

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

    const { topic, category, tone, language = 'ko', referenceUrl } = await req.json();

    if (!topic) {
      return new Response(
        JSON.stringify({ error: 'topic is required' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // 톤 매핑
    const toneDescriptions = {
      professional: '전문적이고 신뢰감 있는',
      funny: '유머러스하고 재미있는',
      casual: '친근하고 편안한',
      educational: '교육적이고 설명이 풍부한',
      dramatic: '드라마틱하고 몰입감 있는',
    };
    const toneDesc = toneDescriptions[tone] || '자연스러운';

    // 참고 URL 컨텍스트
    const refContext = referenceUrl
      ? `\n참고 URL: ${referenceUrl} (이 URL의 내용을 참고하여 스크립트를 작성하세요)`
      : '';

    const prompt = `당신은 유튜브 콘텐츠 전문 스크립트 작가입니다.

다음 조건에 맞는 유튜브 영상 스크립트를 작성해주세요:

주제: ${topic}
카테고리: ${category || '일반'}
톤앤매너: ${toneDesc}
언어: ${language === 'ko' ? '한국어' : language}${refContext}

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요:
{
  "narration": "내레이션 스크립트 전문 (1500~3000자, 자연스러운 말투)",
  "subtitle": "자막용 스크립트 (핵심 내용만, 간결하게, 줄바꿈으로 구분)",
  "direction": "연출 지시사항 (카메라 앵글, 편집 포인트, B-roll 제안 등)"
}`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          topP: 0.95,
          maxOutputTokens: 4096,
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

    // JSON 파싱 (코드 블록 래핑 대응)
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleaned);

    return new Response(
      JSON.stringify({
        narration: result.narration || '',
        subtitle: result.subtitle || '',
        direction: result.direction || '',
      }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('generate-script error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }
}
