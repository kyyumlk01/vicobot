const { enhanceTopicWithGroq } = require('../integrations/groq');

async function handleEnhance(req, res) {
  const { topic, category } = req.body;

  if (!topic || topic.trim().length < 3) {
    return res.status(400).json({ error: 'Topic too short' });
  }

  try {
    const result = await enhanceTopicWithGroq(topic.trim(), category || 'General');
    return res.status(200).json(result);
  } catch (err) {
    console.error('[enhanceController] error:', err.message);
    return res.status(500).json({ error: 'Failed to enhance topic' });
  }
}

module.exports = { handleEnhance };