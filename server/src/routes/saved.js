const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const savedPostController = require('../controllers/savedPostController');

router.get('/', authMiddleware, savedPostController.getSavedPosts);
router.get('/:postId/check', authMiddleware, savedPostController.checkIfSaved);
router.post('/:postId', authMiddleware, savedPostController.toggleSave);
router.delete('/:postId', authMiddleware, savedPostController.toggleSave);

module.exports = router;
