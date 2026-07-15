const { sendWeeklyDigest } = require('../services/emailService');

async function handleTriggerDigest(req, res) {
  try {
    const result = await sendWeeklyDigest();
    return res.status(200).json({ success: true, sent: result.sent });
  } catch (err) {
    console.error('[emailController] error:', err.message);
    return res.status(500).json({ error: 'Failed to send digest' });
  }
}

module.exports = { handleTriggerDigest };