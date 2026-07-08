const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { handleEnhance } = require('../controllers/enhanceController');

router.post('/', requireAuth, handleEnhance);

module.exports = router;