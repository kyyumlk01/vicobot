const https = require('https');

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(new Error('Failed to parse YouTube response'));
        }
      });
    }).on('error', reject);
  });
}

async function fetchTrendingVideos(categoryId = '0', regionCode = 'IN', maxResults = 10) {
  const url = `${BASE_URL}/videos?part=snippet,statistics&chart=mostPopular&regionCode=${regionCode}&videoCategoryId=${categoryId}&maxResults=${maxResults}&key=${process.env.YOUTUBE_API_KEY}`;

  const data = await fetchJSON(url);

  if (!data.items) {
    throw new Error('YouTube API returned no items');
  }

  return data.items.map(item => ({
    videoId: item.id,
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    views: parseInt(item.statistics.viewCount || '0'),
    likes: parseInt(item.statistics.likeCount || '0'),
    publishedAt: item.snippet.publishedAt,
    thumbnail: item.snippet.thumbnails.medium?.url || '',
  }));
}

async function searchTopicVideos(topic, language = 'english') {
  const relevanceLang = language === 'hindi' ? 'hi' : 'en';
  const searchUrl = `${BASE_URL}/search?part=snippet&q=${encodeURIComponent(topic)}&type=video&regionCode=IN&relevanceLanguage=${relevanceLang}&maxResults=10&order=viewCount&key=${process.env.YOUTUBE_API_KEY}`;

  const searchData = await fetchJSON(searchUrl);
  if (!searchData.items || searchData.items.length === 0) return null;

  const videoIds = searchData.items
    .map(item => item.id?.videoId)
    .filter(Boolean)
    .join(',');

  const statsUrl = `${BASE_URL}/videos?part=statistics,snippet&id=${videoIds}&key=${process.env.YOUTUBE_API_KEY}`;
  const statsData = await fetchJSON(statsUrl);
  if (!statsData.items) return null;

  const videos = statsData.items.map(item => ({
    videoId: item.id,
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    views: parseInt(item.statistics.viewCount || '0'),
    likes: parseInt(item.statistics.likeCount || '0'),
    comments: parseInt(item.statistics.commentCount || '0'),
    publishedAt: item.snippet.publishedAt,
    thumbnail: item.snippet.thumbnails.medium?.url || '',
  }));

  const views = videos.map(v => v.views).filter(v => v > 0);
  if (views.length === 0) return null;

  views.sort((a, b) => a - b);
  const medianViews = views[Math.floor(views.length / 2)];
  const avgViews = views.reduce((a, b) => a + b, 0) / views.length;
  const maxViews = Math.max(...views);

  const now = new Date();
  const recentVideos = videos.filter(v => {
    const diff = (now - new Date(v.publishedAt)) / (1000 * 60 * 60 * 24);
    return diff <= 90;
  }).length;

  let demandScore;
  if (avgViews >= 1000000) demandScore = 92 + Math.min(8, Math.floor(avgViews / 1000000));
  else if (avgViews >= 500000) demandScore = 84 + Math.floor((avgViews - 500000) / 62500);
  else if (avgViews >= 100000) demandScore = 72 + Math.floor((avgViews - 100000) / 25000);
  else if (avgViews >= 50000) demandScore = 62 + Math.floor((avgViews - 50000) / 5000);
  else if (avgViews >= 10000) demandScore = 48 + Math.floor((avgViews - 10000) / 2000);
  else if (avgViews >= 1000) demandScore = 28 + Math.floor((avgViews - 1000) / 450);
  else demandScore = Math.max(10, Math.floor(avgViews / 100));
  demandScore = Math.min(100, demandScore);

  let competitionLevel;
  const highViewVideos = videos.filter(v => v.views > 100000).length;
  if (highViewVideos >= 7) competitionLevel = 'Hard';
  else if (highViewVideos >= 3) competitionLevel = 'Medium';
  else competitionLevel = 'Easy';

  const expectedViewsMin = Math.round(medianViews * 0.05);
  const expectedViewsMax = Math.round(medianViews * 0.3);

  return {
    demandScore,
    competitionLevel,
    expectedViewsMin,
    expectedViewsMax,
    medianViews,
    avgViews,
    maxViews,
    recentVideos,
    topVideos: videos.slice(0, 3),
    totalAnalyzed: videos.length,
  };
}

module.exports = { fetchTrendingVideos, searchTopicVideos };


module.exports = { fetchTrendingVideos };