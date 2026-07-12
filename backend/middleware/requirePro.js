const supabase = require('../integrations/supabase');

async function requirePro(req, res, next) {
  try {
    const { data } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', req.user.id)
      .single();

    if (data?.status === 'active') {
      next();
    } else {
      return res.status(403).json({
        error: 'Pro subscription required',
        code: 'PRO_REQUIRED',
      });
    }
  } catch {
    return res.status(403).json({
      error: 'Pro subscription required',
      code: 'PRO_REQUIRED',
    });
  }
}

module.exports = { requirePro };