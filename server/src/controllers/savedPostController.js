const savedPostService = require('../services/savedPostService');

exports.toggleSave = async (req, res, next) => {
  try {
    const result = await savedPostService.toggleSavePost(req.user.id, req.params.postId);
    res.json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

exports.getSavedPosts = async (req, res, next) => {
  try {
    const { limit = 12, skip = 0 } = req.query;
    const result = await savedPostService.getSavedPosts(req.user.id, parseInt(limit), parseInt(skip));
    res.json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

exports.checkIfSaved = async (req, res, next) => {
  try {
    const isSaved = await savedPostService.isSaved(req.user.id, req.params.postId);
    res.json({ status: 'success', data: { saved: isSaved } });
  } catch (error) {
    next(error);
  }
};
