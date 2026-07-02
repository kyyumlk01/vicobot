const { searchTopic, checkDailyLimit, incrementSearchCount } = require('../services/searchService');

async function handleSearch(req, res) {
  const { topic, category, language } = req.body;

  if (!topic || !category || !language) {
    return res.status(400).json({ error: 'topic, category, and language are required' });
  }

  if (topic.trim().length < 3) {
    return res.status(400).json({ error: 'Topic must be at least 3 characters' });
  }

  try {
    const allowed = await checkDailyLimit(req.user.id);
    if (!allowed) {
      return res.status(429).json({ error: 'Daily search limit reached. Come back tomorrow.' });
    }

    const { result, fromCache } = await searchTopic(req.user.id, topic.trim(), category, language);

    await incrementSearchCount(req.user.id);

    return res.status(200).json({ result, fromCache });
  } catch (err) {
    console.error('[searchController] error:', err.message);
    return res.status(500).json({ error: 'Search failed. Please try again.' });
  }
}

module.exports = { handleSearch };