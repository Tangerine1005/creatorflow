// supabase/functions/fetch-trends/index.js
// Google Trends, YouTube, 네이버에서 트렌드 키워드를 수집하는 Edge Function

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// 24시간 인메모리 캐시
const cache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24시간

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

// ─── Google Trends RSS 파싱 ─────────────────────────
async function fetchGoogleTrends() {
  const cacheKey = 'google-trends';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const url = 'https://trends.google.co.kr/trending/rss?geo=KR';
    const res = await fetch(url);
    const xml = await res.text();

    // XML에서 트렌드 키워드 추출 (간단한 정규식 파싱)
    const keywords = [];
    const titleMatches = xml.matchAll(/<title><!\[CDATA\[(.+?)\]\]><\/title>/g);

    let rank = 1;
    for (const match of titleMatches) {
      const keyword = match[1].trim();
      // 첫 번째 <title>은 피드 제목이므로 스킵
      if (keyword === 'Daily Search Trends' || keyword.includes('Trending')) continue;

      keywords.push({
        keyword,
        rank,
        score: Math.max(100 - (rank - 1) * 5, 10), // 순위 기반 점수
        source: 'google',
      });
      rank++;
      if (rank > 20) break;
    }

    // CDATA가 없는 경우 대비 추가 파싱
    if (keywords.length === 0) {
      const simpleTitles = xml.matchAll(/<title>([^<]+)<\/title>/g);
      for (const match of simpleTitles) {
        const keyword = match[1].trim();
        if (keyword === 'Daily Search Trends' || keyword.includes('Trending')) continue;
        keywords.push({
          keyword,
          rank,
          score: Math.max(100 - (rank - 1) * 5, 10),
          source: 'google',
        });
        rank++;
        if (rank > 20) break;
      }
    }

    setCache(cacheKey, keywords);
    return keywords;
  } catch (error) {
    console.error('Google Trends fetch error:', error);
    return [];
  }
}

// ─── YouTube 인기 동영상 키워드 ─────────────────────
async function fetchYoutubeTrends() {
  const cacheKey = 'youtube-trends';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
  if (!YOUTUBE_API_KEY) {
    console.warn('YOUTUBE_API_KEY not set, skipping YouTube trends');
    return [];
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&regionCode=KR&maxResults=20&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(url);

    if (!res.ok) {
      console.error('YouTube API error:', res.status);
      return [];
    }

    const data = await res.json();
    const keywords = [];
    const seen = new Set();

    (data.items || []).forEach((item, index) => {
      const title = item.snippet?.title || '';
      // 제목에서 키워드 추출 (특수문자 제거, 주요 단어 추출)
      const words = title
        .replace(/[[\](){}|"'`~!@#$%^&*]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length >= 2 && w.length <= 20);

      // 상위 2개 키워드 추출
      for (const word of words.slice(0, 2)) {
        const normalized = word.toLowerCase();
        if (!seen.has(normalized)) {
          seen.add(normalized);
          keywords.push({
            keyword: word,
            rank: index + 1,
            score: Math.max(100 - index * 5, 10),
            source: 'youtube',
            videoTitle: title,
          });
        }
      }
    });

    const result = keywords.slice(0, 20);
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('YouTube trends fetch error:', error);
    return [];
  }
}

// ─── 네이버 검색어 트렌드 ──────────────────────────
async function fetchNaverTrends() {
  const cacheKey = 'naver-trends';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const NAVER_CLIENT_ID = Deno.env.get('NAVER_CLIENT_ID');
  const NAVER_CLIENT_SECRET = Deno.env.get('NAVER_CLIENT_SECRET');

  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    console.warn('Naver API credentials not set, skipping Naver trends');
    return [];
  }

  try {
    // 네이버 DataLab 검색어 트렌드 API
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 7);

    const formatDate = (d) => d.toISOString().slice(0, 10);

    // 기본 카테고리별 인기 검색어 조회
    const categories = ['생활', 'IT', '엔터테인먼트', '경제', '사회'];
    const keywords = [];

    for (const category of categories) {
      try {
        const url = 'https://openapi.naver.com/v1/datalab/search';
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Naver-Client-Id': NAVER_CLIENT_ID,
            'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
          },
          body: JSON.stringify({
            startDate: formatDate(startDate),
            endDate: formatDate(today),
            timeUnit: 'date',
            keywordGroups: [
              { groupName: category, keywords: [category] },
            ],
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const results = data.results || [];
          for (const result of results) {
            const latestRatio = result.data?.[result.data.length - 1]?.ratio || 0;
            keywords.push({
              keyword: result.title || category,
              rank: keywords.length + 1,
              score: Math.round(latestRatio),
              source: 'naver',
              category,
            });
          }
        }
      } catch (e) {
        console.error(`Naver trend fetch error for ${category}:`, e);
      }
    }

    setCache(cacheKey, keywords);
    return keywords;
  } catch (error) {
    console.error('Naver trends fetch error:', error);
    return [];
  }
}

// ─── 메인 핸들러 ─────────────────────────────────────
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
    const { source = 'all' } = await req.json().catch(() => ({}));

    let keywords = [];

    if (source === 'google' || source === 'all') {
      const googleKeywords = await fetchGoogleTrends();
      keywords = keywords.concat(googleKeywords);
    }

    if (source === 'youtube' || source === 'all') {
      const youtubeKeywords = await fetchYoutubeTrends();
      keywords = keywords.concat(youtubeKeywords);
    }

    if (source === 'naver' || source === 'all') {
      const naverKeywords = await fetchNaverTrends();
      keywords = keywords.concat(naverKeywords);
    }

    // 점수순 정렬
    keywords.sort((a, b) => b.score - a.score);

    return new Response(
      JSON.stringify({
        keywords,
        count: keywords.length,
        source,
        cachedUntil: new Date(Date.now() + CACHE_TTL).toISOString(),
      }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('fetch-trends error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }
}
