const User = require('../models/User');
const GameSession = require('../models/GameSession');
const Game = require('../models/Game');

exports.getGames = async () => {
  return await Game.find().sort({ createdAt: -1 }).populate('postedBy', 'username avatar country');
};

exports.createGame = async (userId, { title, description = '', iframeUrl, category = 'Arcade' }) => {
  if (!title || !iframeUrl) {
    const error = new Error('Game title and link are required');
    error.status = 400;
    throw error;
  }

  const user = await User.findById(userId).select('role');
  if (!user || user.role !== 'admin') {
    const error = new Error('Only admin users can post games');
    error.status = 403;
    throw error;
  }

  return await Game.create({ postedBy: userId, title, description, iframeUrl, category });
};

exports.createGameSession = async (userId, { gameId, title, durationSeconds = 0, score = 0 }) => {
  return await GameSession.create({
    user: userId,
    gameId,
    title: title || 'Embedded Game',
    durationSeconds,
    score
  });
};

exports.getSessionHistory = async (userId) => {
  return await GameSession.find({ user: userId }).sort({ createdAt: -1 });
};
