const supabase = require('../integrations/supabase');
const { createSubscription, cancelSubscription } = require('../integrations/razorpay');

function throwDatabaseError(operation, error) {
  if (!error) return;
  console.error(`[subscriptionService] ${operation} failed`, error.code || 'unknown');
  const failure = new Error(`Could not ${operation}`);
  failure.code = 'SUBSCRIPTION_PERSISTENCE_FAILED';
  throw failure;
}

function nextPeriodEnd() {
  const end = new Date();
  end.setMonth(end.getMonth() + 1);
  return end.toISOString();
}

function periodEndFromEntity(entity) {
  const value = entity?.current_end;
  if (value == null) return null;

  const date = typeof value === 'number' || /^\d+$/.test(String(value))
    ? new Date(Number(value) * 1000)
    : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function getUserSubscription(userId) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  throwDatabaseError('read subscription', error);
  return data;
}

async function getSubscriptionByRazorpayId(razorpaySubscriptionId) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('razorpay_subscription_id', razorpaySubscriptionId)
    .maybeSingle();
  throwDatabaseError('read subscription', error);
  return data;
}

async function updateSubscriptionByRazorpayId(razorpaySubscriptionId, values) {
  const { data, error } = await supabase
    .from('subscriptions')
    .update(values)
    .eq('razorpay_subscription_id', razorpaySubscriptionId)
    .select('user_id')
    .maybeSingle();
  throwDatabaseError('update subscription', error);
  if (!data) {
    const failure = new Error('Subscription record not found');
    failure.code = 'SUBSCRIPTION_NOT_FOUND';
    throw failure;
  }
}

async function isProUser(userId) {
  const sub = await getUserSubscription(userId);
  if (!sub || sub.status !== 'active' || !sub.current_period_end) return false;
  const periodEnd = new Date(sub.current_period_end).getTime();
  return Number.isFinite(periodEnd) && periodEnd > Date.now();
}

async function initiateSubscription(userId, email) {
  const existing = await getUserSubscription(userId);
  if (existing?.status === 'active') {
    const failure = new Error('Already subscribed');
    failure.code = 'ALREADY_SUBSCRIBED';
    throw failure;
  }

  const subscription = await createSubscription(userId, email);

  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      razorpay_subscription_id: subscription.id,
      plan_id: process.env.RAZORPAY_PLAN_ID,
      status: 'free',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select('user_id')
    .single();
  throwDatabaseError('save subscription', error);

  return subscription;
}

async function activateSubscription(razorpaySubscriptionId, entity = {}) {
  const sub = await getSubscriptionByRazorpayId(razorpaySubscriptionId);
  if (!sub) {
    const failure = new Error('Subscription record not found');
    failure.code = 'SUBSCRIPTION_NOT_FOUND';
    throw failure;
  }

  const eventPeriodEnd = periodEndFromEntity(entity);
  const storedPeriodEnd = sub.current_period_end && new Date(sub.current_period_end).getTime() > Date.now()
    ? sub.current_period_end
    : null;
  const periodEnd = [eventPeriodEnd, storedPeriodEnd]
    .filter(Boolean)
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0];
  await updateSubscriptionByRazorpayId(razorpaySubscriptionId, {
    status: 'active',
    current_period_end: periodEnd || nextPeriodEnd(),
    updated_at: new Date().toISOString(),
  });
}

async function activateVerifiedSubscription(userId, razorpaySubscriptionId) {
  const { data: sub, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('razorpay_subscription_id', razorpaySubscriptionId)
    .maybeSingle();
  throwDatabaseError('verify subscription ownership', error);
  if (!sub) {
    const failure = new Error('Subscription record not found for this account');
    failure.code = 'SUBSCRIPTION_NOT_FOUND';
    throw failure;
  }

  await activateSubscription(razorpaySubscriptionId);
}

async function renewSubscription(razorpaySubscriptionId, entity) {
  const currentPeriodEnd = periodEndFromEntity(entity);
  if (!currentPeriodEnd) {
    const failure = new Error('Renewal event is missing its billing period end');
    failure.code = 'INVALID_SUBSCRIPTION_EVENT';
    throw failure;
  }

  await updateSubscriptionByRazorpayId(razorpaySubscriptionId, {
    status: 'active',
    current_period_end: currentPeriodEnd,
    updated_at: new Date().toISOString(),
  });
}

async function cancelUserSubscription(userId) {
  const sub = await getUserSubscription(userId);
  if (!sub?.razorpay_subscription_id) throw new Error('No active subscription');

  await cancelSubscription(sub.razorpay_subscription_id);

  const { data, error } = await supabase
    .from('subscriptions')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select('user_id')
    .maybeSingle();
  throwDatabaseError('cancel subscription', error);
  if (!data) {
    const failure = new Error('Subscription record not found');
    failure.code = 'SUBSCRIPTION_NOT_FOUND';
    throw failure;
  }
}

async function handleWebhookEvent(event, payload) {
  const supportedEvents = new Set([
    'subscription.activated',
    'subscription.charged',
    'subscription.cancelled',
    'subscription.halted',
  ]);
  if (!supportedEvents.has(event)) return;

  const subscriptionId = payload?.id || payload?.subscription?.id;
  if (!subscriptionId) {
    const failure = new Error('Subscription event is missing its subscription ID');
    failure.code = 'INVALID_SUBSCRIPTION_EVENT';
    throw failure;
  }

  if (event === 'subscription.activated') return activateSubscription(subscriptionId, payload);
  if (event === 'subscription.charged') return renewSubscription(subscriptionId, payload);
  if (event === 'subscription.cancelled') {
    return updateSubscriptionByRazorpayId(subscriptionId, {
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    });
  }
  return updateSubscriptionByRazorpayId(subscriptionId, {
    status: 'halted',
    updated_at: new Date().toISOString(),
  });
}

module.exports = {
  getUserSubscription,
  isProUser,
  initiateSubscription,
  activateVerifiedSubscription,
  cancelUserSubscription,
  handleWebhookEvent,
};