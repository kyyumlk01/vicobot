const supabase = require('../integrations/supabase');
const { sendWelcomeEmail } = require('../services/emailService');

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

    try {
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', req.user.id)
    .single();
  if (profile?.email) await sendWelcomeEmail(profile.email);
} catch {
  // Welcome email fail hone pe koi problem nahi, silently ignore
}

    return res.status(200).json({ updated: true });
  } catch (err) {
    console.error('[profileController] error:', err.message);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
}

module.exports = { handleUpdateLevel };