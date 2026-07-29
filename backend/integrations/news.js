const https = require('https');

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('Failed to parse news response')); }
      });
    }).on('error', reject);
  });
}

async function getTopicNews(topic) {
  try {
    if (!process.env.NEWS_API_KEY) return [];

    const query = encodeURIComponent(topic);
    const url = `https://gnews.io/api/v4/search?q=${query}&lang=en&country=in&max=3&apikey=${process.env.NEWS_API_KEY}`;

    const data = await fetchJSON(url);
    if (!data.articles?.length) return [];

    return data.articles.map(a => ({
      title: a.title,
      description: a.description,
      publishedAt: a.publishedAt,
      source: a.source?.name,
    }));
  } catch (err) {
    console.error('[news] error:', err.message);
    return [];
  }
}

module.exports = { getTopicNews };