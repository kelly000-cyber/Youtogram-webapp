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
    const message = await chatService.sendMessage(req.user.id, req.body);
    res.status(201).json({ status: 'success', data: message });
  } catch (error) {
    next(error);
  }
};
