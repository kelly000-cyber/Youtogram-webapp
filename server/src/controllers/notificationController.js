const notificationService = require('../services/notificationService');

exports.getNotifications = async (req, res, next) => {
  try {
    const { limit = 20, skip = 0 } = req.query;
    const result = await notificationService.getUserNotifications(req.user.id, parseInt(limit), parseInt(skip));
    res.json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    res.json({ status: 'success', data: { unreadCount: count } });
  } catch (error) {
    next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id);
    res.json({ status: 'success', data: notification });
  } catch (error) {
    next(error);
  }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user.id);
    res.json({ status: 'success', message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    await notificationService.deleteNotification(req.params.id);
    res.json({ status: 'success', message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
};
