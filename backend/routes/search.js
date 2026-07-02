const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { handleSearch } = require('../controllers/searchController');

router.post('/', requireAuth, handleSearch);

module.exports = router;