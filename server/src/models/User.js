const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, unique: true, sparse: true, trim: true },
  phoneCountryCode: { type: String, default: '', trim: true },
  password: { type: String, required: true },
  googleId: { type: String, unique: true, sparse: true, trim: true },
  passwordResetTokenHash: { type: String, default: '' },
  passwordResetExpiresAt: { type: Date, default: null },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' },
  country: { type: String, default: '', trim: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  points: { type: Number, default: 300 },
  followerCount: { type: Number, default: 0 },
  emotionPreferences: {
    type: Map,
    of: { type: Number, min: -100, max: 100 },
    default: {}
  },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  friendRequestsSent: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  online: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
