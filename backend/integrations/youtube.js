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

module.exports = { fetchTrendingVideos };