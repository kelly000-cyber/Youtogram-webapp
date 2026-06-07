const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const searchController = require('../controllers/searchController');

router.get('/global', authMiddleware, searchController.globalSearch);
router.get('/users', authMiddleware, searchController.searchUsers);
router.get('/posts', authMiddleware, searchController.searchPosts);
router.get('/history', authMiddleware, searchController.getSearchHistory);
router.delete('/history', authMiddleware, searchController.clearSearchHistory);

module.exports = router;
