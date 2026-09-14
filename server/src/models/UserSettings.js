const mongoose = require('mongoose');

const userSettingsSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  isPrivateProfile: { type: Boolean, default: false },
  allowMessagesFromStrangers: { type: Boolean, default: true },
  allowFriendRequests: { type: Boolean, default: true },
  showActivityStatus: { type: Boolean, default: true },
  notificationsEnabled: { type: Boolean, default: true },
  emailNotifications: { type: Boolean, default: true },
  blockList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  mutedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  theme: { type: String, enum: ['light', 'dark'], default: 'light' },
  language: { type: String, default: 'en' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserSettings', userSettingsSchema);
