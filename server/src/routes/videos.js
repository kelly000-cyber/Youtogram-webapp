const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const videoController = require('../controllers/videoController');

router.post('/', authMiddleware, videoController.uploadVideo);
router.get('/', authMiddleware, videoController.getVideos);
router.put('/:id/like', authMiddleware, videoController.likeVideo);
router.post('/:id/comment', authMiddleware, videoController.commentVideo);

module.exports = router;
