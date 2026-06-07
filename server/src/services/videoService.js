const Video = require('../models/Video');
const notificationService = require('./notificationService');

exports.uploadVideo = async (userId, { title, description, url, thumbnail = '' }) => {
  const video = await Video.create({ author: userId, title, description, url, thumbnail });
  return video;
};

exports.getVideos = async (query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const videos = await Video.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('author', 'username avatar');

  return { page, limit, items: videos };
};

exports.likeVideo = async (videoId, userId) => {
  const video = await Video.findById(videoId);
  if (!video) {
    const error = new Error('Video not found');
    error.status = 404;
    throw error;
  }

  const liked = video.likes.some((likeId) => String(likeId) === String(userId));
  if (liked) {
    video.likes.pull(userId);
  } else {
    video.likes.push(userId);
  }

  await video.save();
  if (!liked) {
    await notificationService.createNotification(
      video.author,
      userId,
      'like',
      video._id,
      'video',
      'liked your video'
    );
  }
  return video;
};

exports.commentVideo = async (videoId, userId, { text }) => {
  const video = await Video.findById(videoId);
  if (!video) {
    const error = new Error('Video not found');
    error.status = 404;
    throw error;
  }

  const comment = { author: userId, text };
  video.comments.push(comment);
  await video.save();
  await notificationService.createNotification(
    video.author,
    userId,
    'comment',
    video._id,
    'video',
    'commented on your video'
  );
  return comment;
};
