const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const postController = require('../controllers/postController');

router.post('/', authMiddleware, postController.createPost);
router.get('/', authMiddleware, postController.getFeed);
router.get('/stories', authMiddleware, postController.getStories);
router.put('/:id/like', authMiddleware, postController.toggleLike);
router.post('/:id/comment', authMiddleware, postController.addComment);

module.exports = router;
