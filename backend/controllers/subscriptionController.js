const crypto = require('crypto');
const {
  getUserSubscription,
  initiateSubscription,
  cancelUserSubscription,
  handleWebhookEvent,
} = require('../services/subscriptionService');

async function handleGetSubscription(req, res) {
  try {
    const sub = await getUserSubscription(req.user.id);
    return res.status(200).json({
      status: sub?.status || 'free',
      currentPeriodEnd: sub?.current_period_end || null,
    });
  } catch (err) {
    console.error('[subscriptionController] get error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch subscription' });
  }
}

async function handleCreateSubscription(req, res) {
  try {
    const { data: { user } } = await require('../integrations/supabase')
      .auth.getUser(req.headers.authorization?.split(' ')[1]);

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

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(req.body)
    .digest('hex');

  if (signature !== expectedSignature) {
    console.error('[webhook] Invalid signature');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const body = JSON.parse(req.body.toString());
  const event = body.event;
  const payload = body.payload?.subscription?.entity || body.payload;

  try {
    await handleWebhookEvent(event, payload);
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[webhook] error:', err.message);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

module.exports = {
  handleGetSubscription,
  handleCreateSubscription,
  handleCancelSubscription,
  handleWebhook,
};