const supabase = require('../integrations/supabase');

async function handleUpdateLevel(req, res) {
  const { creatorLevel } = req.body;

  const validLevels = ['new', 'growing', 'established'];
  if (!creatorLevel || !validLevels.includes(creatorLevel)) {
    return res.status(400).json({ error: 'Invalid creator level' });
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ creator_level: creatorLevel })
      .eq('id', req.user.id);

    if (error) throw error;

    return res.status(200).json({ updated: true });
  } catch (err) {
    console.error('[profileController] error:', err.message);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
}

module.exports = { handleUpdateLevel };