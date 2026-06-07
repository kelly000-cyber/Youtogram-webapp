const postService = require('../services/postService');

exports.createPost = async (req, res, next) => {
  try {
    const post = await postService.createPost(req.user.id, req.body);
    res.status(201).json({ status: 'success', data: post });
  } catch (error) {
    next(error);
  }
};

exports.getFeed = async (req, res, next) => {
  try {
    const feed = await postService.getFeed(req.user.id, req.query);
    res.json({ status: 'success', data: feed });
  } catch (error) {
    next(error);
  }
};

exports.toggleLike = async (req, res, next) => {
  try {
    const post = await postService.toggleLike(req.params.id, req.user.id);
    res.json({ status: 'success', data: post });
  } catch (error) {
    next(error);
  }
};

exports.addComment = async (req, res, next) => {
  try {
    const post = await postService.addComment(req.params.id, req.user.id, req.body);
    res.status(201).json({ status: 'success', data: post });
  } catch (error) {
    next(error);
  }
};

exports.getStories = async (req, res, next) => {
  try {
    const stories = await postService.getStories(req.user.id);
    res.json({ status: 'success', data: stories });
  } catch (error) {
    next(error);
  }
};
