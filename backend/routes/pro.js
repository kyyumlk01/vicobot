const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { handleBlueprint, handleThumbnail, handleSeoTags } = require('../controllers/proController');

router.post('/blueprint', requireAuth, handleBlueprint);
router.post('/thumbnail', requireAuth, handleThumbnail);
router.post('/seo', requireAuth, handleSeoTags);

module.exports = router;