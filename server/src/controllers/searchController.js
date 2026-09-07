const searchService = require('../services/searchService');

exports.globalSearch = async (req, res, next) => {
  try {
    const { q, limit = 5 } = req.query;
    if (!q) {
      return res.status(400).json({ status: 'error', message: 'Search query required' });
    }

    const results = await searchService.globalSearch(q, req.user.id, parseInt(limit));
    res.json({ status: 'success', data: results });
  } catch (error) {
    next(error);
  }
};

exports.searchUsers = async (req, res, next) => {
  try {
    const { q, limit = 10 } = req.query;
    if (!q) {
      return res.status(400).json({ status: 'error', message: 'Search query required' });
    }

    const users = await searchService.searchUsers(q, req.user.id, parseInt(limit));
    res.json({ status: 'success', data: users });
  } catch (error) {
    next(error);
  }
};

exports.searchPosts = async (req, res, next) => {
  try {
    const { q, limit = 10 } = req.query;
    if (!q) {
      return res.status(400).json({ status: 'error', message: 'Search query required' });
    }

    const posts = await searchService.searchPosts(q, req.user.id, parseInt(limit));
    res.json({ status: 'success', data: posts });
  } catch (error) {
    next(error);
  }
};

exports.getSearchHistory = async (req, res, next) => {
  try {
    const history = await searchService.getSearchHistory(req.user.id);
    res.json({ status: 'success', data: history });
  } catch (error) {
    next(error);
  }
};

exports.clearSearchHistory = async (req, res, next) => {
  try {
    const result = await searchService.clearSearchHistory(req.user.id);
    res.json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};
