const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const test = require('node:test');

const signatureHelpers = require('../integrations/razorpaySignatures');
const frontendUpgrade = fs.readFileSync(
  path.join(__dirname, '../../frontend/app/upgrade/page.tsx'),
  'utf8',
);

function makeDb(initialRows = [], failures = {}) {
  const rows = initialRows.map((row) => ({ ...row }));

  function result(operation, filters, values, columns) {
    if (failures[operation]) return { data: null, error: failures[operation] };
    const rowIndex = rows.findIndex((row) => Object.entries(filters).every(([key, value]) => row[key] === value));

    if (operation === 'upsert') {
      const existingIndex = rows.findIndex((row) => row.user_id === values.user_id);
      if (existingIndex >= 0) Object.assign(rows[existingIndex], values);
      else rows.push({ ...values });
      return { data: { user_id: values.user_id }, error: null };
    }

    if (operation === 'update' && rowIndex >= 0) Object.assign(rows[rowIndex], values);
    const row = rows[rowIndex] || null;
    const data = row && columns === 'user_id' ? { user_id: row.user_id } : row;
    return { data, error: null };
  }

  const client = {
    from() {
      let operation = 'select';
      let filters = {};
      let values = null;
      let columns = '*';
      const builder = {
        select(selectedColumns) { columns = selectedColumns; return builder; },
        eq(key, value) { filters[key] = value; return builder; },
        upsert(record) { operation = 'upsert'; values = record; return builder; },
        update(record) { operation = 'update'; values = record; return builder; },
        maybeSingle() { return Promise.resolve(result(operation, filters, values, columns)); },
        single() { return Promise.resolve(result(operation, filters, values, columns)); },
      };
      return builder;
    },
  };

  return { client, rows };
}

async function withService(db, callback) {
  const supabasePath = require.resolve('../integrations/supabase');
  const razorpayPath = require.resolve('../integrations/razorpay');
  const servicePath = require.resolve('../services/subscriptionService');
  const originals = [require.cache[supabasePath], require.cache[razorpayPath], require.cache[servicePath]];
  const supabaseModule = new Module(supabasePath);
  supabaseModule.filename = supabasePath;
  supabaseModule.loaded = true;
  supabaseModule.exports = db.client;
  const razorpayModule = new Module(razorpayPath);
  razorpayModule.filename = razorpayPath;
  razorpayModule.loaded = true;
  razorpayModule.exports = {
    createSubscription: async () => ({ id: 'sub_test_123' }),
    cancelSubscription: async () => ({}),
  };

  require.cache[supabasePath] = supabaseModule;
  require.cache[razorpayPath] = razorpayModule;
  delete require.cache[servicePath];
  try {
    await callback(require('../services/subscriptionService'));
  } finally {
    delete require.cache[servicePath];
    [supabasePath, razorpayPath, servicePath].forEach((file, index) => {
      if (originals[index]) require.cache[file] = originals[index];
      else delete require.cache[file];
    });
  }
}

const activeRow = (overrides = {}) => ({
  user_id: 'user-a',
  razorpay_subscription_id: 'sub_test_123',
  plan_id: 'plan-test',
  status: 'free',
  current_period_end: null,
  ...overrides,
});

test('verifies subscription checkout signatures and rejects invalid signatures', () => {
  const secret = 'unit-test-secret-not-a-credential';
  const paymentId = 'pay_test_123';
  const subscriptionId = 'sub_test_123';
  const signature = crypto.createHmac('sha256', secret)
    .update(`${paymentId}|${subscriptionId}`)
    .digest('hex');

  assert.equal(signatureHelpers.verifySubscriptionCheckoutSignature(paymentId, subscriptionId, signature, secret), true);
  assert.equal(signatureHelpers.verifySubscriptionCheckoutSignature(paymentId, subscriptionId, '0'.repeat(64), secret), false);
  assert.equal(signatureHelpers.verifySubscriptionCheckoutSignature(paymentId, subscriptionId, signature, 'wrong-secret'), false);
});

test('verifies webhook signatures against the exact raw payload', () => {
  const secret = 'unit-test-webhook-secret-not-a-credential';
  const payload = Buffer.from('{"event":"subscription.activated"}');
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  assert.equal(signatureHelpers.verifyWebhookSignature(payload, signature, secret), true);
  assert.equal(signatureHelpers.verifyWebhookSignature(payload, 'f'.repeat(64), secret), false);
  assert.equal(signatureHelpers.verifyWebhookSignature(Buffer.from('{}'), signature, secret), false);
});

test('subscription creation rejects a failed database upsert', async () => {
  const db = makeDb([], { upsert: { code: 'TEST_WRITE_FAILURE' } });
  await withService(db, async (service) => {
    await assert.rejects(
      service.initiateSubscription('user-a', 'creator@example.test'),
      (error) => error.code === 'SUBSCRIPTION_PERSISTENCE_FAILED',
    );
  });
});

test('checkout verification binds the subscription to the authenticated user', async () => {
  const db = makeDb([activeRow()]);
  await withService(db, async (service) => {
    await assert.rejects(
      service.activateVerifiedSubscription('user-b', 'sub_test_123'),
      (error) => error.code === 'SUBSCRIPTION_NOT_FOUND',
    );
    assert.equal(db.rows[0].status, 'free');

    await service.activateVerifiedSubscription('user-a', 'sub_test_123');
    assert.equal(db.rows[0].status, 'active');
    assert.ok(new Date(db.rows[0].current_period_end).getTime() > Date.now());
  });
});

test('activation persistence failures propagate to webhook processing', async () => {
  const db = makeDb([activeRow()], { update: { code: 'TEST_WRITE_FAILURE' } });
  await withService(db, async (service) => {
    await assert.rejects(
      service.handleWebhookEvent('subscription.activated', { id: 'sub_test_123' }),
      (error) => error.code === 'SUBSCRIPTION_PERSISTENCE_FAILED',
    );
  });
});

test('duplicate activation and charge events preserve their billing period end', async () => {
  const db = makeDb([activeRow()]);
  const cycleEnd = Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000);
  await withService(db, async (service) => {
    const activated = { id: 'sub_test_123', current_end: cycleEnd };
    await service.handleWebhookEvent('subscription.activated', activated);
    const activationEnd = db.rows[0].current_period_end;
    await service.handleWebhookEvent('subscription.activated', activated);
    assert.equal(db.rows[0].current_period_end, activationEnd);

    const charged = { id: 'sub_test_123', current_end: cycleEnd + 30 * 24 * 60 * 60 };
    await service.handleWebhookEvent('subscription.charged', charged);
    const renewalEnd = db.rows[0].current_period_end;
    await service.handleWebhookEvent('subscription.charged', charged);
    assert.equal(db.rows[0].current_period_end, renewalEnd);

    await service.handleWebhookEvent('subscription.activated', activated);
    assert.equal(db.rows[0].current_period_end, renewalEnd);
  });
});

test('cancelled and halted events update the same entitlement row', async () => {
  const db = makeDb([activeRow({ status: 'active', current_period_end: new Date(Date.now() + 86400000).toISOString() })]);
  await withService(db, async (service) => {
    await service.handleWebhookEvent('subscription.cancelled', { id: 'sub_test_123' });
    assert.equal(db.rows[0].status, 'cancelled');
    await service.handleWebhookEvent('subscription.halted', { id: 'sub_test_123' });
    assert.equal(db.rows[0].status, 'halted');
    assert.equal(await service.isProUser('user-a'), false);
  });
});

test('frontend verifies payment and refreshes backend subscription state', () => {
  assert.match(frontendUpgrade, /\/api\/subscription\/verify/);
  assert.match(frontendUpgrade, /refreshSubscription\(session\.access_token\)/);
  assert.match(frontendUpgrade, /handler:\s*\(response:\s*RazorpayCheckoutSuccess\)\s*=>\s*\{\s*void verifyPayment\(response\);\s*\}/);
  assert.doesNotMatch(frontendUpgrade, /setSubStatus\('active'\)/);
});