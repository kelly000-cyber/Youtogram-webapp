const mongoose = require('mongoose');

const searchSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  query: { type: String, required: true, trim: true },
  type: { type: String, enum: ['user', 'post', 'tag'], default: 'user' },
  resultId: { type: mongoose.Schema.Types.ObjectId },
  createdAt: { type: Date, default: Date.now }
});

searchSchema.index({ user: 1, createdAt: -1 });
searchSchema.index({ query: 1, type: 1 });

module.exports = mongoose.model('Search', searchSchema);
