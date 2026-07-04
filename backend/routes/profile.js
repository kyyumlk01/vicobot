const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { handleUpdateLevel } = require('../controllers/profileController');

router.post('/level', requireAuth, handleUpdateLevel);

module.exports = router;