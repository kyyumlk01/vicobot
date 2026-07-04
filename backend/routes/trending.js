const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { handleTrending } = require('../controllers/trendingController');

router.get('/', requireAuth, handleTrending);

module.exports = router;