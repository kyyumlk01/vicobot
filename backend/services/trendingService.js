const supabase = require('../integrations/supabase');
const { fetchTrendingVideos } = require('../integrations/youtube');

const CATEGORY_MAP = {
  'Tech': '28',
  'Gaming': '20',
  'Entertainment': '24',
  'Education': '27',
  'Music': '10',
  'Sports': '17',
  'News': '25',
  'All': '0',
};

async function getTrending(category = 'All') {
  const categoryId = CATEGORY_MAP[category] || '0';
  const cacheKey = `trending:${category}`;
  const now = new Date().toISOString();

  const { data: cached } = await supabase
    .from('cache')
    .select('result, created_at')
    .eq('topic_hash', cacheKey)
    .gt('expires_at', now)
    .single();

  if (cached) {
    return { videos: cached.result, fromCache: true };
  }

  const videos = await fetchTrendingVideos(categoryId, 'IN', 10);

  await supabase
    .from('cache')
    .upsert({
      topic_hash: cacheKey,
      topic: `trending:${category}`,
      category,
      language: 'all',
      result: videos,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });

  return { videos, fromCache: false };
}

module.exports = { getTrending };