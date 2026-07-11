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

async function initiateSubscription(userId, email) {
  const existing = await getUserSubscription(userId);
  if (existing?.status === 'active') {
    throw new Error('Already subscribed');
  }

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

  if (!sub) return;

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
  const subscriptionId = payload?.subscription?.id || payload?.id;
  if (!subscriptionId) return;

  if (event === 'subscription.activated' || event === 'subscription.charged') {
    await activateSubscription(subscriptionId);
  }

  if (event === 'subscription.cancelled' || event === 'subscription.halted') {
    await supabase
      .from('subscriptions')
      .update({
        status: event === 'subscription.cancelled' ? 'cancelled' : 'halted',
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_subscription_id', subscriptionId);
  }
}

module.exports = {
  getUserSubscription,
  initiateSubscription,
  cancelUserSubscription,
  handleWebhookEvent,
};