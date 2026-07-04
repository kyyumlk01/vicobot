const { getTrending } = require('../services/trendingService');

async function handleTrending(req, res) {
  const { category = 'All' } = req.query;

  try {
    const { videos, fromCache } = await getTrending(category);
    return res.status(200).json({ videos, fromCache });
  } catch (err) {
    console.error('[trendingController] error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch trending videos' });
  }
}

module.exports = { handleTrending };