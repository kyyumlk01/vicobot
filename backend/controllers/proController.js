const { getBlueprint, getThumbnailConcepts, getSeoTags } = require('../services/proService');

async function handleBlueprint(req, res) {
  const { topic, category, language } = req.body;

  if (!topic || !category || !language) {
    return res.status(400).json({ error: 'topic, category, and language are required' });
  }

  try {
    const blueprint = await getBlueprint(topic, category, language);
    return res.status(200).json({ blueprint });
  } catch (err) {
    console.error('[proController] blueprint error:', err.message);
    return res.status(500).json({ error: 'Failed to generate blueprint' });
  }
}

async function handleThumbnail(req, res) {
  const { topic, category, language } = req.body;

  if (!topic || !category || !language) {
    return res.status(400).json({ error: 'topic, category, and language are required' });
  }

  try {
    const thumbnail = await getThumbnailConcepts(topic, category, language);
    return res.status(200).json({ thumbnail });
  } catch (err) {
    console.error('[proController] thumbnail error:', err.message);
    return res.status(500).json({ error: 'Failed to generate thumbnail concepts' });
  }
}

async function handleSeoTags(req, res) {
  const { topic, category, language } = req.body;

  if (!topic || !category || !language) {
    return res.status(400).json({ error: 'topic, category, and language are required' });
  }

  try {
    const seo = await getSeoTags(topic, category, language);
    return res.status(200).json({ seo });
  } catch (err) {
    console.error('[proController] seo error:', err.message);
    return res.status(500).json({ error: 'Failed to generate SEO tags' });
  }
}

module.exports = { handleBlueprint, handleThumbnail, handleSeoTags };