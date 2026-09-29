const crypto = require('crypto');

function isValidSignature(expected, received) {
  if (typeof received !== 'string' || !/^[a-f0-9]{64}$/i.test(received)) return false;

  const expectedBytes = Buffer.from(expected, 'hex');
  const receivedBytes = Buffer.from(received, 'hex');
  return expectedBytes.length === receivedBytes.length
    && crypto.timingSafeEqual(expectedBytes, receivedBytes);
}

function verifySubscriptionCheckoutSignature(paymentId, subscriptionId, signature, secret = process.env.RAZORPAY_KEY_SECRET) {
  if (!paymentId || !subscriptionId || !secret) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${paymentId}|${subscriptionId}`)
    .digest('hex');

  return isValidSignature(expected, signature);
}

function verifyWebhookSignature(body, signature, secret = process.env.RAZORPAY_WEBHOOK_SECRET) {
  if (!secret) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return isValidSignature(expected, signature);
}

module.exports = { verifySubscriptionCheckoutSignature, verifyWebhookSignature };