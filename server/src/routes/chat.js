const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const chatController = require('../controllers/chatController');
const { upload } = require('../config/cloudinary');

router.get('/conversations', authMiddleware, chatController.getConversations);
router.get('/messages/:chatId', authMiddleware, chatController.getMessages);
router.post('/messages', authMiddleware, upload.array('media', 5), chatController.sendMessage);

module.exports = router;
