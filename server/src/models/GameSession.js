const mongoose = require('mongoose');

const gameSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gameId: { type: String, required: true },
  title: { type: String, required: true },
  durationSeconds: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GameSession', gameSessionSchema);
