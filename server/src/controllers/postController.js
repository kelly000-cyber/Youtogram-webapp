const postService = require('../services/postService');

exports.createPost = async (req, res, next) => {
  try {
    const media = req.files ? req.files.map(file => ({
      url: file.path,
      mimeType: file.mimetype,
      fileName: file.originalname,
      sizeBytes: file.size,
    })) : [];

    const postData = { ...req.body, media };
    const post = await postService.createPost(req.user.id, postData);
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

exports.getMyPosts = async (req, res, next) => {
  try {
    const posts = await postService.getPostsForAuthor(req.user.id, req.query);
    res.json({ status: 'success', data: posts });
  } catch (error) {
    next(error);
  }
};

exports.getUserPosts = async (req, res, next) => {
  try {
    const posts = await postService.getPostsForAuthor(req.params.userId, req.query);
    res.json({ status: 'success', data: posts });
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

exports.trackInterest = async (req, res, next) => {
  try {
    const result = await postService.trackInterest(req.params.id, req.user.id, req.body.action);
    res.json({ status: 'success', data: result });
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
