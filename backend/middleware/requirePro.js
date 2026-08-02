const { isProUser } = require('../services/subscriptionService');

async function requirePro(req, res, next) {
  try {
    const pro = await isProUser(req.user.id);
    if (pro) {
      next();
    } else {
      return res.status(403).json({
        error: 'Pro subscription required',
        code: 'PRO_REQUIRED',
      });
    }
  } catch (err) {
    console.error('[requirePro] error:', err.message);
    return res.status(403).json({
      error: 'Pro subscription required',
      code: 'PRO_REQUIRED',
    });
  }
}

module.exports = { requirePro };