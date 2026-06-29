// supabase/functions/youtube-stats/index.js
// YouTube Data API v3로 채널 통계를 조회하는 Edge Function

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// 24시간 캐시
const cache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000;

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
    const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
    if (!YOUTUBE_API_KEY) {
      throw new Error('YOUTUBE_API_KEY is not configured');
    }

    const { channelId } = await req.json();

    if (!channelId) {
      return new Response(
        JSON.stringify({ error: 'channelId is required' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // 캐시 확인
    const cacheKey = `stats:${channelId}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return new Response(
        JSON.stringify({ ...cached, cached: true }),
        {
          status: 200,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      );
    }

    // ─── 1. 채널 기본 통계 조회 ─────────────────────
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet,contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`;
    const channelRes = await fetch(channelUrl);

    if (!channelRes.ok) {
      const errorBody = await channelRes.text();
      console.error('YouTube Channels API error:', channelRes.status, errorBody);
      throw new Error(`YouTube API error: ${channelRes.status}`);
    }

    const channelData = await channelRes.json();
    const channel = channelData.items?.[0];

    if (!channel) {
      return new Response(
        JSON.stringify({ error: 'Channel not found' }),
        { status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const stats = channel.statistics || {};
    const snippet = channel.snippet || {};
    const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;

    // ─── 2. 최근 동영상 퍼포먼스 조회 ──────────────────
    let recentPerformance = [];

    if (uploadsPlaylistId) {
      try {
        // 최근 10개 업로드 조회
        const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=10&key=${YOUTUBE_API_KEY}`;
        const playlistRes = await fetch(playlistUrl);

        if (playlistRes.ok) {
          const playlistData = await playlistRes.json();
          const videoIds = (playlistData.items || [])
            .map((item) => item.contentDetails?.videoId)
            .filter(Boolean);

          if (videoIds.length > 0) {
            // 동영상 상세 통계 조회
            const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,contentDetails&id=${videoIds.join(',')}&key=${YOUTUBE_API_KEY}`;
            const videosRes = await fetch(videosUrl);

            if (videosRes.ok) {
              const videosData = await videosRes.json();

              recentPerformance = (videosData.items || []).map((video) => {
                const vStats = video.statistics || {};
                const views = parseInt(vStats.viewCount || '0', 10);
                const likes = parseInt(vStats.likeCount || '0', 10);
                const comments = parseInt(vStats.commentCount || '0', 10);

                return {
                  videoId: video.id,
                  title: video.snippet?.title || '',
                  publishedAt: video.snippet?.publishedAt || '',
                  duration: video.contentDetails?.duration || '',
                  views,
                  likes,
                  comments,
                  engagementRate: views > 0
                    ? parseFloat(((likes + comments) / views * 100).toFixed(2))
                    : 0,
                };
              });
            }
          }
        }
      } catch (e) {
        console.error('Recent performance fetch error:', e);
      }
    }

    // ─── 3. 집계 통계 ──────────────────────────────────
    const totalViews = recentPerformance.reduce((sum, v) => sum + v.views, 0);
    const totalLikes = recentPerformance.reduce((sum, v) => sum + v.likes, 0);
    const totalComments = recentPerformance.reduce((sum, v) => sum + v.comments, 0);
    const avgViews = recentPerformance.length > 0
      ? Math.round(totalViews / recentPerformance.length)
      : 0;
    const avgEngagement = recentPerformance.length > 0
      ? parseFloat(
          (recentPerformance.reduce((sum, v) => sum + v.engagementRate, 0) /
            recentPerformance.length).toFixed(2)
        )
      : 0;

    const result = {
      channel: {
        id: channelId,
        title: snippet.title || '',
        thumbnail: snippet.thumbnails?.default?.url || '',
        customUrl: snippet.customUrl || '',
      },
      subscribers: parseInt(stats.subscriberCount || '0', 10),
      views: parseInt(stats.viewCount || '0', 10),
      videos: parseInt(stats.videoCount || '0', 10),
      recentPerformance,
      aggregated: {
        recentAvgViews: avgViews,
        recentTotalViews: totalViews,
        recentTotalLikes: totalLikes,
        recentTotalComments: totalComments,
        recentAvgEngagementRate: avgEngagement,
      },
      fetchedAt: new Date().toISOString(),
      cached: false,
    };

    // 캐시 저장
    setCache(cacheKey, result);

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('youtube-stats error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }
}
