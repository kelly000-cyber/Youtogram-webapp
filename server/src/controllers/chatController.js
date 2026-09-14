const chatService = require('../services/chatService');

exports.getConversations = async (req, res, next) => {
  try {
    const conversations = await chatService.getConversations(req.user.id);
    res.json({ status: 'success', data: conversations });
  } catch (error) {
    next(error);
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    const messages = await chatService.getMessages(req.params.chatId);
    res.json({ status: 'success', data: messages });
  } catch (error) {
    next(error);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const media = req.files ? req.files.map((file) => ({
      url: file.path,
      type: file.mimetype === 'image/gif' ? 'gif' : file.mimetype.startsWith('image/') ? 'image' : file.mimetype.startsWith('video/') ? 'video' : 'document',
      mimeType: file.mimetype,
      fileName: file.originalname,
      sizeBytes: file.size
    })) : [];

    const requestedType = String(req.body.messageType || '').trim();
    const messageType = requestedType || (media[0]?.type || 'text');
    const message = await chatService.sendMessage(req.user.id, {
      recipientId: req.body.recipientId,
      content: req.body.content,
      media,
      messageType
    });
    const io = req.app.get('io');
    if (io) io.to(message.chatId).emit('message', message);
    res.status(201).json({ status: 'success', data: message });
  } catch (error) {
    next(error);
  }
};
