const videoService = require('../services/videoService');

exports.uploadVideo = async (req, res, next) => {
  try {
    const video = await videoService.uploadVideo(req.user.id, req.body);
    res.status(201).json({ status: 'success', data: video });
  } catch (error) {
    next(error);
  }
};

exports.getVideos = async (req, res, next) => {
  try {
    const videos = await videoService.getVideos(req.query);
    res.json({ status: 'success', data: videos });
  } catch (error) {
    next(error);
  }
};

exports.likeVideo = async (req, res, next) => {
  try {
    const video = await videoService.likeVideo(req.params.id, req.user.id);
    res.json({ status: 'success', data: video });
  } catch (error) {
    next(error);
  }
};

exports.commentVideo = async (req, res, next) => {
  try {
    const comment = await videoService.commentVideo(req.params.id, req.user.id, req.body);
    res.status(201).json({ status: 'success', data: comment });
  } catch (error) {
    next(error);
  }
};
