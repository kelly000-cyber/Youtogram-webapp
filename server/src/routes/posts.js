const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const postController = require('../controllers/postController');
const { upload } = require('../config/cloudinary');

router.post('/', authMiddleware, upload.array('media', 10), postController.createPost);
router.get('/', authMiddleware, postController.getFeed);
router.get('/stories', authMiddleware, postController.getStories);
router.put('/:id/like', authMiddleware, postController.toggleLike);
router.post('/:id/comment', authMiddleware, postController.addComment);

module.exports = router;