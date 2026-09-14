const Message = require('../models/Message');
const notificationService = require('./notificationService');

exports.getConversations = async (userId) => {
  const conversations = await Message.aggregate([
    { $match: { $or: [{ sender: userId }, { recipient: userId }] } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$chatId',
        latestMessage: { $first: '$$ROOT' }
      }
    }
  ]);
  return conversations;
};

exports.getMessages = async (chatId) => {
  return await Message.find({ chatId })
    .sort({ createdAt: 1 })
    .populate('sender', 'username avatar')
    .populate('recipient', 'username avatar');
};

exports.sendMessage = async (senderId, { recipientId, content = '', media = [], messageType = 'text' }) => {
  const chatId = [senderId.toString(), recipientId].sort().join('_');
  const normalizedContent = String(content || '').trim();
  const allowedTypes = ['text', 'image', 'video', 'gif', 'sticker', 'document'];
  const safeType = allowedTypes.includes(messageType) ? messageType : 'text';

  if (!normalizedContent && (!Array.isArray(media) || !media.length)) {
    const error = new Error('Message cannot be empty');
    error.status = 400;
    throw error;
  }

  const message = await Message.create({
    chatId,
    sender: senderId,
    recipient: recipientId,
    content: normalizedContent,
    media: Array.isArray(media) ? media : [],
    messageType: safeType
  });
  await notificationService.createNotification(
    recipientId,
    senderId,
    'message',
    recipientId,
    'user',
    'sent you a message'
  );
  return await Message.findById(message._id)
    .populate('sender', 'username avatar')
    .populate('recipient', 'username avatar');
};
