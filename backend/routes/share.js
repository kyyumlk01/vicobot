const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { handleCreateShare, handleGetShare } = require('../controllers/shareController');

router.post('/', requireAuth, handleCreateShare);
router.get('/:id', handleGetShare);

module.exports = router;