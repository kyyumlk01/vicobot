const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requirePro } = require('../middleware/requirePro');
const { handleBlueprint, handleThumbnail, handleSeoTags } = require('../controllers/proController');

router.post('/blueprint', requireAuth, requirePro, handleBlueprint);
router.post('/thumbnail', requireAuth, requirePro, handleThumbnail);
router.post('/seo', requireAuth, requirePro, handleSeoTags);

module.exports = router;