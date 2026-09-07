const SavedPost = require('../models/SavedPost');
const Post = require('../models/Post');

exports.toggleSavePost = async (userId, postId) => {
  const existingPost = await SavedPost.findOne({ user: userId, post: postId });

  if (existingPost) {
    await SavedPost.deleteOne({ _id: existingPost._id });
    return { saved: false };
  }

  await SavedPost.create({ user: userId, post: postId });
  return { saved: true };
};

exports.getSavedPosts = async (userId, limit = 12, skip = 0) => {
  const posts = await SavedPost.find({ user: userId })
    .populate({
      path: 'post',
      populate: [
        { path: 'author', select: 'username avatar' },
        { path: 'comments.author', select: 'username avatar' }
      ]
    })
    .sort({ savedAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalCount = await SavedPost.countDocuments({ user: userId });

  return {
    items: posts.map(sp => sp.post),
    totalCount,
    limit,
    skip
  };
};

exports.isSaved = async (userId, postId) => {
  const saved = await SavedPost.findOne({ user: userId, post: postId });
  return !!saved;
};
