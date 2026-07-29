const crypto = require('crypto');
const supabase = require('../integrations/supabase');
const { analyzeTopicWithGroq } = require('../integrations/groq');
const { searchTopicVideos } = require('../integrations/youtube');
const { getTopicTrend } = require('../integrations/trends');
const { getVideoTranscripts } = require('../integrations/transcripts');
const { getTopicNews } = require('../integrations/news');

function generateHash(topic, category, language) {
  return crypto
    .createHash('md5')
    .update(`${topic.toLowerCase().trim()}:${category}:${language}`)
    .digest('hex');
}

async function checkDailyLimit(userId) {
  const today = new Date().toISOString().split('T')[0];
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('daily_searches, last_search_date')
    .eq('id', userId)
    .single();

  if (error) throw new Error('Failed to fetch user profile');
  if (profile.last_search_date === today && profile.daily_searches >= 3) return false;
  return true;
}

async function incrementSearchCount(userId) {
  const today = new Date().toISOString().split('T')[0];
  const { data: profile } = await supabase
    .from('profiles')
    .select('daily_searches, last_search_date')
    .eq('id', userId)
    .single();

  const isNewDay = profile.last_search_date !== today;
  await supabase
    .from('profiles')
    .update({
      daily_searches: isNewDay ? 1 : profile.daily_searches + 1,
      last_search_date: today,
    })
    .eq('id', userId);
}

async function searchTopic(userId, topic, category, language, bypassCache = false, variation = 0) {
  const hash = generateHash(topic, category, language);

  if (!bypassCache) {
    const { data: cached } = await supabase
      .from('cache')
      .select('result')
      .eq('topic_hash', hash)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cached) return { result: cached.result, fromCache: true };
  }

  // Sab data sources parallel mein fetch karo
  const [realData, trendData, newsData] = await Promise.allSettled([
    searchTopicVideos(topic, language),
    getTopicTrend(topic),
    getTopicNews(topic),
  ]);

  const youtubeData = realData.status === 'fulfilled' ? realData.value : null;
  const trend = trendData.status === 'fulfilled' ? trendData.value : { trend: 'stable', score: 50 };
  const news = newsData.status === 'fulfilled' ? newsData.value : [];

  // Transcripts fetch karo agar YouTube data hai
  let transcripts = [];
  if (youtubeData?.topVideos?.length) {
    const videoIds = youtubeData.topVideos.map(v => v.videoId);
    try {
      transcripts = await getVideoTranscripts(videoIds);
    } catch {
      // silent fail
    }
  }

  // Groq ko real data + transcripts + news dono do
  const groqAnalysis = await analyzeTopicWithGroq(
    topic, category, language, variation,
    youtubeData, transcripts, news, trend
  );

  const result = {
    demandScore: youtubeData?.demandScore ?? 50,
    expectedViewsMin: youtubeData?.expectedViewsMin ?? 5000,
    expectedViewsMax: youtubeData?.expectedViewsMax ?? 50000,
    competitionLevel: youtubeData?.competitionLevel ?? 'Medium',
    uploadDay: groqAnalysis.uploadDay,
    uploadTime: groqAnalysis.uploadTime,
    analysis: groqAnalysis.analysis,
    contentGaps: groqAnalysis.contentGaps,
    titleIdeas: groqAnalysis.titleIdeas,
    verdict: groqAnalysis.verdict,
    topVideos: youtubeData?.topVideos ?? [],
    dataSource: youtubeData ? 'youtube' : 'ai',
    medianViews: youtubeData?.medianViews ?? null,
    trend: trend.trend,
    trendScore: trend.score,
    newsContext: news.slice(0, 2),
  };

  if (!bypassCache) {
    await supabase
      .from('cache')
      .upsert({
        topic_hash: hash,
        topic,
        category,
        language,
        result,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
  }

  return { result, fromCache: false };
}

module.exports = { searchTopic, checkDailyLimit, incrementSearchCount };