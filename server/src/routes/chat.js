const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const chatController = require('../controllers/chatController');
const { upload } = require('../config/cloudinary');

router.get('/conversations', authMiddleware, chatController.getConversations);
router.get('/messages/:chatId', authMiddleware, chatController.getMessages);
router.post('/messages', authMiddleware, (req, res, next) => {
  // Text-only messages must not depend on Cloudinary being configured.
  // Only invoke the upload middleware when the multipart request actually carries files.
  if (req.is('multipart/form-data')) return upload.array('media', 5)(req, res, next);
  return next();
}, chatController.sendMessage);

module.exports = router;
