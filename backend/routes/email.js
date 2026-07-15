const express = require('express');
const router = express.Router();
const { handleTriggerDigest } = require('../controllers/emailController');

router.post('/digest/trigger', handleTriggerDigest);
router.get('/digest/trigger', handleTriggerDigest);

module.exports = router;