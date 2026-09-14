const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  iframeUrl: { type: String, required: true, trim: true },
  category: { type: String, default: 'Arcade', trim: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Game', gameSchema);
