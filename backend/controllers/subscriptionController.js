const crypto = require('crypto');
const {
  getUserSubscription,
  initiateSubscription,
  cancelUserSubscription,
  handleWebhookEvent,
} = require('../services/subscriptionService');
const supabase = require('../integrations/supabase');

async function handleGetSubscription(req, res) {
  try {
    const sub = await getUserSubscription(req.user.id);

    let status = sub?.status || 'free';

    // Expired check
    if (status === 'active' && sub?.current_period_end) {
      if (new Date(sub.current_period_end) < new Date()) {
        status = 'expired';
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('user_id', req.user.id);
      }
    }

    return res.status(200).json({
      status,
      currentPeriodEnd: sub?.current_period_end || null,
    });
  } catch (err) {
    console.error('[subscriptionController] get error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch subscription' });
  }
}

async function handleCreateSubscription(req, res) {
  try {
    const { data: { user } } = await supabase.auth.getUser(
      req.headers.authorization?.split(' ')[1]
    );

    const subscription = await initiateSubscription(req.user.id, user?.email || '');
    return res.status(200).json({
      subscriptionId: subscription.id,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('[subscriptionController] create error:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to create subscription' });
  }
}

async function handleCancelSubscription(req, res) {
  try {
    await cancelUserSubscription(req.user.id);
    return res.status(200).json({ cancelled: true });
  } catch (err) {
    console.error('[subscriptionController] cancel error:', err.message);
    return res.status(500).json({ error: 'Failed to cancel subscription' });
  }
}

async function handleWebhook(req, res) {
  const signature = req.headers['x-razorpay-signature'];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  const body = Buffer.isBuffer(req.body)
    ? req.body
    : Buffer.from(JSON.stringify(req.body));

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  if (signature !== expectedSignature) {
    console.error('[webhook] Invalid signature');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const parsed = JSON.parse(body.toString());
  const event = parsed.event;
  const payload = parsed.payload?.subscription?.entity || parsed.payload;

  console.log('[webhook] Received event:', event);

  try {
    await handleWebhookEvent(event, payload);
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[webhook] processing error:', err.message);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

module.exports = {
  handleGetSubscription,
  handleCreateSubscription,
  handleCancelSubscription,
  handleWebhook,
};