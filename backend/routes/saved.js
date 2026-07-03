const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { handleSave, handleGetSaved, handleDelete } = require('../controllers/savedController');

router.get('/', requireAuth, handleGetSaved);
router.post('/', requireAuth, handleSave);
router.delete('/:id', requireAuth, handleDelete);

module.exports = router;