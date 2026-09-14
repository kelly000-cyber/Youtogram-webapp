const Notification = require('../models/Notification');
const User = require('../models/User');

exports.createNotification = async (recipientId, actorId, type, targetId, targetType, message = '') => {
  if (String(recipientId) === String(actorId)) return null;

  const notification = await Notification.create({
    recipient: recipientId,
    actor: actorId,
    type,
    targetId,
    targetType,
    message
  });

  return await Notification.findById(notification._id).populate('actor', 'username avatar');
};

exports.getUserNotifications = async (userId, limit = 20, skip = 0) => {
  const notifications = await Notification.find({ recipient: userId })
    .populate('actor', 'username avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const unreadCount = await Notification.countDocuments({ recipient: userId, read: false });

  return { notifications, unreadCount };
};

exports.markAsRead = async (notificationId) => {
  return await Notification.findByIdAndUpdate(notificationId, { read: true }, { new: true });
};

exports.markAllAsRead = async (userId) => {
  return await Notification.updateMany({ recipient: userId, read: false }, { read: true });
};

exports.deleteNotification = async (notificationId) => {
  return await Notification.findByIdAndDelete(notificationId);
};

exports.getUnreadCount = async (userId) => {
  return await Notification.countDocuments({ recipient: userId, read: false });
};
