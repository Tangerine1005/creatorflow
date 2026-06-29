// supabase/functions/generate-image/index.js
// → 변경: Imagen 대신 Gemini로 썸네일 프롬프트를 추천하는 Edge Function
// 비용: 무료 (Gemini Flash 사용)

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

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.');
    }

    const { topic, titles, category, tone } = await req.json();

    if (!topic) {
      return new Response(
        JSON.stringify({ error: '주제(topic)를 입력해주세요.' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const selectedTitle = titles?.[0] || topic;

    // Gemini에게 썸네일 프롬프트 3개를 추천받기
    const prompt = `당신은 유튜브 썸네일 전문 디자이너입니다.

다음 콘텐츠에 대해 3가지 스타일의 썸네일 제작 프롬프트를 한국어로 작성해주세요.
각 프롬프트는 사용자가 Gemini 이미지 생성에 직접 붙여넣기할 수 있도록 구체적이어야 합니다.

콘텐츠 정보:
- 주제: "${topic}"
- 제목: "${selectedTitle}"
- 카테고리: ${category || '일반'}
- 톤: ${tone || '재미있게'}

출력 형식 (JSON):
[
  {
    "style": "스타일 이름 (3글자 이내)",
    "prompt": "Gemini 이미지 생성용 프롬프트 (한국어, 100자 이상, 색감/구도/텍스트/사이즈 포함)",
    "tip": "💡 활용 팁 (한 줄)"
  },
  ...
]

3가지 서로 다른 비주얼 스타일로 작성하세요. JSON만 반환하세요.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API 오류: ${response.status} — ${errText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Gemini 응답에 텍스트가 없습니다.');
    }

    // JSON 파싱
    let prompts;
    try {
      prompts = JSON.parse(text);
    } catch {
      // JSON이 아닌 경우 텍스트에서 추출 시도
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        prompts = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('프롬프트 파싱 실패');
      }
    }

    return new Response(
      JSON.stringify({ prompts }),
      {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('프롬프트 추천 오류:', error);
    return new Response(
      JSON.stringify({ error: error.message || '프롬프트 생성 중 오류 발생' }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }
}
