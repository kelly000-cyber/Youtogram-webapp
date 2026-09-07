const UserSettings = require('../models/UserSettings');
const User = require('../models/User');

exports.getOrCreateSettings = async (userId) => {
  let settings = await UserSettings.findOne({ user: userId });
  
  if (!settings) {
    settings = await UserSettings.create({ user: userId });
  }

  return settings;
};

exports.updateSettings = async (userId, updates) => {
  const allowedFields = [
    'isPrivateProfile',
    'allowMessagesFromStrangers',
    'allowFriendRequests',
    'showActivityStatus',
    'notificationsEnabled',
    'emailNotifications',
    'theme',
    'language'
  ];

  const filteredUpdates = {};
  for (const field of allowedFields) {
    if (field in updates) {
      filteredUpdates[field] = updates[field];
    }
  }

  filteredUpdates.updatedAt = new Date();

  const settings = await UserSettings.findOneAndUpdate(
    { user: userId },
    filteredUpdates,
    { new: true, upsert: true }
  );

  return settings;
};

exports.blockUser = async (userId, targetUserId) => {
  if (String(userId) === String(targetUserId)) {
    const error = new Error('Cannot block yourself');
    error.status = 400;
    throw error;
  }

  const settings = await this.getOrCreateSettings(userId);
  
  if (!settings.blockList.includes(targetUserId)) {
    settings.blockList.push(targetUserId);
    await settings.save();
  }

  return { blocked: true };
};

exports.unblockUser = async (userId, targetUserId) => {
  const settings = await this.getOrCreateSettings(userId);
  settings.blockList = settings.blockList.filter(id => String(id) !== String(targetUserId));
  await settings.save();
  
  return { unblocked: true };
};

exports.muteUser = async (userId, targetUserId) => {
  const settings = await this.getOrCreateSettings(userId);
  
  if (!settings.mutedUsers.includes(targetUserId)) {
    settings.mutedUsers.push(targetUserId);
    await settings.save();
  }

  return { muted: true };
};

exports.unmuteUser = async (userId, targetUserId) => {
  const settings = await this.getOrCreateSettings(userId);
  settings.mutedUsers = settings.mutedUsers.filter(id => String(id) !== String(targetUserId));
  await settings.save();
  
  return { unmuted: true };
};

exports.getBlockList = async (userId) => {
  const settings = await UserSettings.findOne({ user: userId }).populate('blockList', 'username avatar');
  return settings?.blockList || [];
};

exports.isUserBlocked = async (userId, targetUserId) => {
  const settings = await UserSettings.findOne({ user: userId });
  if (!settings) return false;
  
  return settings.blockList.some(id => String(id) === String(targetUserId));
};
