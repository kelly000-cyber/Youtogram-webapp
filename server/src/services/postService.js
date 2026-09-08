const Post = require('../models/Post');
const User = require('../models/User');
const notificationService = require('./notificationService');

const emotionWeights = {
  like: 3,
  comment: 4,
  share: 6,
  save: 5,
  watch: 4,
  skip: -2,
  notInterested: -8
};

const populatePostQuery = (query) =>
  query
    .populate('author', 'username avatar')
    .populate('comments.author', 'username avatar');

const normalizeMedia = (media = []) => media.map((item) => {
  const mimeType = String(item.mimeType || '').toLowerCase();
  const inferredType = item.type || (mimeType.startsWith('video/') ? 'video' : 'image');

  if (!mimeType.startsWith('image/') && !mimeType.startsWith('video/')) {
    const error = new Error('Only image and video media are supported');
    error.status = 400;
    throw error;
  }

  return {
    url: item.url,
    type: inferredType,
    mimeType,
    fileName: item.fileName || '',
    sizeBytes: item.sizeBytes || 0,
    width: item.width || 0,
    height: item.height || 0,
    durationSeconds: item.durationSeconds || 0,
    thumbnailUrl: item.thumbnailUrl || '',
    qualityLabel: item.qualityLabel || 'HD',
    isHighDefinition: item.isHighDefinition !== false
  };
});

const getConnectedAuthorIds = async (userId) => {
  const currentUser = await User.findById(userId).select('friends following');
  const connectedIds = [
    userId,
    ...((currentUser?.friends || []).map((id) => id.toString())),
    ...((currentUser?.following || []).map((id) => id.toString()))
  ];

  return [...new Set(connectedIds)];
};

exports.createPost = async (userId, { text, media = [], isStory = false, emotionTags = [] }) => {
  const allowedTags = ['funny', 'romantic', 'emotional', 'angry', 'relaxing', 'exciting', 'motivational', 'educational', 'entertainment'];
  const tags = [...new Set((Array.isArray(emotionTags) ? emotionTags : String(emotionTags).split(',')).filter((tag) => allowedTags.includes(tag)))];
  const post = await Post.create({ author: userId, text, media: normalizeMedia(media), isStory, emotionTags: tags });
  return await populatePostQuery(Post.findById(post._id));
};

exports.getFeed = async (userId, query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 12;
  const skip = (page - 1) * limit;
  const allowedAuthors = await getConnectedAuthorIds(userId);

  const posts = await populatePostQuery(
    Post.find()
      .where('author').in(allowedAuthors)
      .where('isStory').ne(true)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
  );

  const currentUser = await User.findById(userId).select('emotionPreferences').lean();
  const preferences = currentUser?.emotionPreferences || {};
  const now = Date.now();
  const rankedPosts = posts
    .map((post) => {
      const ageHours = Math.max(0, (now - new Date(post.createdAt).getTime()) / 3600000);
      const interestScore = (post.emotionTags || []).reduce((score, tag) => score + Number(preferences[tag] || 0), 0);
      const engagementScore = (post.likes?.length || 0) * 0.5 + (post.comments?.length || 0) * 0.8;
      const freshnessScore = Math.max(0, 24 - ageHours) * 0.15;
      return { post, recommendationScore: interestScore + engagementScore + freshnessScore };
    })
    .sort((left, right) => right.recommendationScore - left.recommendationScore)
    .map(({ post }) => post);

  return { page, limit, items: rankedPosts };
};

exports.trackInterest = async (postId, userId, action) => {
  const weight = emotionWeights[action];
  if (!weight) {
    const error = new Error('Unsupported recommendation action');
    error.status = 400;
    throw error;
  }

  const post = await Post.findById(postId).select('emotionTags');
  if (!post) {
    const error = new Error('Post not found');
    error.status = 404;
    throw error;
  }

  const user = await User.findById(userId).select('emotionPreferences');
  if (!user.emotionPreferences) user.emotionPreferences = new Map();
  post.emotionTags.forEach((tag) => {
    const current = Number(user.emotionPreferences.get(tag) || 0);
    user.emotionPreferences.set(tag, Math.max(-100, Math.min(100, current + weight)));
  });
  await user.save();
  return { tracked: true };
};

exports.toggleLike = async (postId, userId) => {
  const post = await Post.findById(postId);
  if (!post) {
    const error = new Error('Post not found');
    error.status = 404;
    throw error;
  }

  const liked = post.likes.some((likeId) => String(likeId) === String(userId));
  if (liked) {
    post.likes.pull(userId);
  } else {
    post.likes.push(userId);
  }

  await post.save();
  if (!liked) {
    await notificationService.createNotification(
      post.author,
      userId,
      'like',
      post._id,
      'post',
      'liked your post'
    );
  }
  return await populatePostQuery(Post.findById(post._id));
};

exports.addComment = async (postId, userId, { text }) => {
  const post = await Post.findById(postId);
  if (!post) {
    const error = new Error('Post not found');
    error.status = 404;
    throw error;
  }

  const comment = { author: userId, text };
  post.comments.push(comment);
  await post.save();
  await notificationService.createNotification(
    post.author,
    userId,
    'comment',
    post._id,
    'post',
    'commented on your post'
  );

  return await populatePostQuery(Post.findById(post._id));
};

exports.getStories = async (userId) => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const allowedAuthors = await getConnectedAuthorIds(userId);

  const stories = await populatePostQuery(
    Post.find()
      .where('author').in(allowedAuthors)
      .where('isStory').equals(true)
      .where('createdAt').gte(since)
      .sort({ createdAt: -1 })
  );

  return stories;
};
