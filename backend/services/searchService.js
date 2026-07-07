const crypto = require('crypto');
const supabase = require('../integrations/supabase');
const { analyzeTopicWithGroq } = require('../integrations/groq');
const { searchTopicVideos } = require('../integrations/youtube');

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

  if (profile.last_search_date === today && profile.daily_searches >= 3) {
    return false;
  }
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

    if (cached) {
      return { result: cached.result, fromCache: true };
    }
  }

  let realData = null;
  try {
    realData = await searchTopicVideos(topic, language);
  } catch (err) {
    console.error('[searchService] YouTube API error:', err.message);
  }

  const groqAnalysis = await analyzeTopicWithGroq(topic, category, language, variation, realData);

  const result = {
    demandScore: realData?.demandScore ?? groqAnalysis.demandScore ?? 50,
    expectedViewsMin: realData?.expectedViewsMin ?? 5000,
    expectedViewsMax: realData?.expectedViewsMax ?? 50000,
    competitionLevel: realData?.competitionLevel ?? 'Medium',
    uploadDay: groqAnalysis.uploadDay,
    uploadTime: groqAnalysis.uploadTime,
    analysis: groqAnalysis.analysis,
    contentGaps: groqAnalysis.contentGaps,
    titleIdeas: groqAnalysis.titleIdeas,
    verdict: groqAnalysis.verdict,
    topVideos: realData?.topVideos ?? [],
    dataSource: realData ? 'youtube' : 'ai',
    medianViews: realData?.medianViews ?? null,
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