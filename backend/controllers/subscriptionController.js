const {
  getUserSubscription,
  initiateSubscription,
  activateVerifiedSubscription,
  cancelUserSubscription,
  handleWebhookEvent,
} = require('../services/subscriptionService');
const supabase = require('../integrations/supabase');
const {
  verifySubscriptionCheckoutSignature,
  verifyWebhookSignature,
} = require('../integrations/razorpaySignatures');

async function handleGetSubscription(req, res) {
  try {
    const sub = await getUserSubscription(req.user.id);

    let status = sub?.status || 'free';

    // Expired check
    if (status === 'active') {
      const periodEnd = new Date(sub?.current_period_end).getTime();
      if (!Number.isFinite(periodEnd) || periodEnd <= Date.now()) {
        status = 'expired';
        const { error } = await supabase
          .from('subscriptions')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('user_id', req.user.id)
          .select('user_id')
          .maybeSingle();
        if (error) throw new Error('Could not update expired subscription');
      }
    }

    return res.status(200).json({
      status,
      currentPeriodEnd: sub?.current_period_end || null,
    });
  } catch (err) {
    console.error('[subscriptionController] get failed', err.code || 'unknown');
    return res.status(500).json({ error: 'Failed to fetch subscription' });
  }
}

async function handleCreateSubscription(req, res) {
  try {
    const subscription = await initiateSubscription(req.user.id, req.user.email || '');
    return res.status(200).json({
      subscriptionId: subscription.id,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('[subscriptionController] create failed', err.code || 'unknown');
    const status = err.code === 'ALREADY_SUBSCRIBED' ? 409 : 500;
    const message = status === 409 ? 'Already subscribed' : 'Failed to create subscription';
    return res.status(status).json({ error: message });
  }
}

async function handleVerifyCheckout(req, res) {
  const {
    razorpay_payment_id: paymentId,
    razorpay_subscription_id: subscriptionId,
    razorpay_signature: signature,
  } = req.body || {};
  if (!paymentId || !subscriptionId || !signature) {
    return res.status(400).json({ error: 'Payment verification details are required' });
  }

  if (!verifySubscriptionCheckoutSignature(paymentId, subscriptionId, signature)) {
    return res.status(400).json({ error: 'Payment signature is invalid' });
  }

  try {
    await activateVerifiedSubscription(req.user.id, subscriptionId);
    return res.status(200).json({ verified: true });
  } catch (err) {
    console.error('[subscriptionController] verification persistence failed', err.code || 'unknown');
    if (err.code === 'SUBSCRIPTION_NOT_FOUND') {
      return res.status(404).json({ error: 'Subscription does not belong to this account' });
    }
    return res.status(500).json({ error: 'Could not activate the verified subscription' });
  }
}

async function handleCancelSubscription(req, res) {
  try {
    await cancelUserSubscription(req.user.id);
    return res.status(200).json({ cancelled: true });
  } catch (err) {
    console.error('[subscriptionController] cancel failed', err.code || 'unknown');
    return res.status(500).json({ error: 'Failed to cancel subscription' });
  }
}

async function handleWebhook(req, res) {
  const signature = req.headers['x-razorpay-signature'];
  const body = Buffer.isBuffer(req.body)
    ? req.body
    : Buffer.from(JSON.stringify(req.body));

  if (!verifyWebhookSignature(body, signature)) {
    console.error('[webhook] Invalid signature');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    const parsed = JSON.parse(body.toString());
    const event = parsed.event;
    const payload = parsed.payload?.subscription?.entity || parsed.payload;
    await handleWebhookEvent(event, payload);
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[webhook] processing failed', err.code || 'unknown');
    if (err.code === 'INVALID_SUBSCRIPTION_EVENT') {
      return res.status(400).json({ error: 'Invalid subscription event' });
    }
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

module.exports = {
  handleGetSubscription,
  handleCreateSubscription,
  handleVerifyCheckout,
  handleCancelSubscription,
  handleWebhook,
};