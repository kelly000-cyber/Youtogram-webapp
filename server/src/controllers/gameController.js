const gameService = require('../services/gameService');

exports.getGames = async (req, res, next) => {
  try {
    const games = await gameService.getGames();
    res.json({ status: 'success', data: games });
  } catch (error) {
    next(error);
  }
};

exports.createGame = async (req, res, next) => {
  try {
    const game = await gameService.createGame(req.user.id, req.body);
    res.status(201).json({ status: 'success', data: game });
  } catch (error) {
    next(error);
  }
};

exports.createGameSession = async (req, res, next) => {
  try {
    const session = await gameService.createGameSession(req.user.id, req.body);
    res.status(201).json({ status: 'success', data: session });
  } catch (error) {
    next(error);
  }
};

exports.getSessionHistory = async (req, res, next) => {
  try {
    const history = await gameService.getSessionHistory(req.user.id);
    res.json({ status: 'success', data: history });
  } catch (error) {
    next(error);
  }
};
