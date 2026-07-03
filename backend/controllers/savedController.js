const { saveTopicForUser, getSavedTopics, deleteSavedTopic } = require('../services/savedService');

async function handleSave(req, res) {
  const { topic, score, category } = req.body;

  if (!topic || !category) {
    return res.status(400).json({ error: 'topic and category are required' });
  }

  try {
    const result = await saveTopicForUser(req.user.id, topic, score, category);
    return res.status(200).json(result);
  } catch (err) {
    console.error('[savedController] save error:', err.message);
    return res.status(500).json({ error: 'Failed to save topic' });
  }
}

async function handleGetSaved(req, res) {
  try {
    const topics = await getSavedTopics(req.user.id);
    return res.status(200).json({ topics });
  } catch (err) {
    console.error('[savedController] get error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch saved topics' });
  }
}

async function handleDelete(req, res) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Topic id is required' });
  }

  try {
    await deleteSavedTopic(req.user.id, id);
    return res.status(200).json({ deleted: true });
  } catch (err) {
    console.error('[savedController] delete error:', err.message);
    return res.status(500).json({ error: 'Failed to delete topic' });
  }
}

module.exports = { handleSave, handleGetSaved, handleDelete };