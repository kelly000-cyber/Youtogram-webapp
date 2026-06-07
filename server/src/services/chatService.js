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

exports.sendMessage = async (senderId, { recipientId, content }) => {
  const chatId = [senderId.toString(), recipientId].sort().join('_');
  const message = await Message.create({ chatId, sender: senderId, recipient: recipientId, content });
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
