const supabase = require('../integrations/supabase');
const { createSubscription, cancelSubscription } = require('../integrations/razorpay');

async function getUserSubscription(userId) {
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();
  return data;
}

async function isProUser(userId) {
  const sub = await getUserSubscription(userId);
  if (!sub) return false;
  if (sub.status !== 'active') return false;
  if (sub.current_period_end && new Date(sub.current_period_end) < new Date()) return false;
  return true;
}

async function initiateSubscription(userId, email) {
  const existing = await getUserSubscription(userId);
  if (existing?.status === 'active') throw new Error('Already subscribed');

  const subscription = await createSubscription(userId, email);

  await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      razorpay_subscription_id: subscription.id,
      plan_id: process.env.RAZORPAY_PLAN_ID,
      status: 'free',
      updated_at: new Date().toISOString(),
    });

  return subscription;
}

async function activateSubscription(razorpaySubscriptionId) {
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('razorpay_subscription_id', razorpaySubscriptionId)
    .single();

  if (!sub) {
    console.error('[subscriptionService] No subscription found for:', razorpaySubscriptionId);
    return;
  }

  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_end: periodEnd.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('razorpay_subscription_id', razorpaySubscriptionId);

  if (error) console.error('[subscriptionService] activate error:', error.message);
  else console.log('[subscriptionService] Activated:', razorpaySubscriptionId);
}

async function renewSubscription(razorpaySubscriptionId) {
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_end: periodEnd.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('razorpay_subscription_id', razorpaySubscriptionId);

  console.log('[subscriptionService] Renewed:', razorpaySubscriptionId);
}

async function cancelUserSubscription(userId) {
  const sub = await getUserSubscription(userId);
  if (!sub?.razorpay_subscription_id) throw new Error('No active subscription');

  await cancelSubscription(sub.razorpay_subscription_id);

  await supabase
    .from('subscriptions')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('user_id', userId);
}

async function handleWebhookEvent(event, payload) {
  const subscriptionId = payload?.id || payload?.subscription?.id;
  if (!subscriptionId) {
    console.error('[webhook] No subscription ID in payload');
    return;
  }

  console.log('[webhook] Event:', event, 'Sub ID:', subscriptionId);

  if (event === 'subscription.activated') {
    await activateSubscription(subscriptionId);
  }

  if (event === 'subscription.charged') {
    await renewSubscription(subscriptionId);
  }

  if (event === 'subscription.cancelled') {
    await supabase
      .from('subscriptions')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('razorpay_subscription_id', subscriptionId);
  }

  if (event === 'subscription.halted') {
    await supabase
      .from('subscriptions')
      .update({ status: 'halted', updated_at: new Date().toISOString() })
      .eq('razorpay_subscription_id', subscriptionId);
  }
}

module.exports = {
  getUserSubscription,
  isProUser,
  initiateSubscription,
  cancelUserSubscription,
  handleWebhookEvent,
};