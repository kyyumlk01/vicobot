const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  handleGetSubscription,
  handleCreateSubscription,
  handleVerifyCheckout,
  handleCancelSubscription,
  handleWebhook,
} = require('../controllers/subscriptionController');

router.get('/', requireAuth, handleGetSubscription);
router.post('/create', requireAuth, handleCreateSubscription);
router.post('/verify', requireAuth, handleVerifyCheckout);
router.post('/cancel', requireAuth, handleCancelSubscription);
router.post('/webhook', handleWebhook);

module.exports = router;