const liveService = require('../services/liveService');

exports.createLiveSession = async (req, res, next) => {
  try {
    const session = await liveService.createLiveSession(req.user.id, req.body);
    res.status(201).json({ status: 'success', data: session });
  } catch (error) {
    next(error);
  }
};

exports.getLiveSessions = async (req, res, next) => {
  try {
    const sessions = await liveService.getLiveSessions();
    res.json({ status: 'success', data: sessions });
  } catch (error) {
    next(error);
  }
};

exports.joinLiveSession = async (req, res, next) => {
  try {
    const result = await liveService.joinLiveSession(req.params.id, req.user.id);
    res.json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};
