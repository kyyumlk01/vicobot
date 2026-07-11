const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function createSubscription(userId, email) {
  const subscription = await razorpay.subscriptions.create({
    plan_id: process.env.RAZORPAY_PLAN_ID,
    total_count: 12,
    quantity: 1,
    notes: {
      user_id: userId,
      email: email,
    },
  });
  return subscription;
}

async function cancelSubscription(subscriptionId) {
  return await razorpay.subscriptions.cancel(subscriptionId);
}

async function fetchSubscription(subscriptionId) {
  return await razorpay.subscriptions.fetch(subscriptionId);
}

module.exports = { createSubscription, cancelSubscription, fetchSubscription };