const User = require('../models/User');
const Post = require('../models/Post');
const Search = require('../models/Search');

exports.searchUsers = async (query, userId, limit = 10) => {
  const regex = new RegExp(query, 'i');

  const [currentUser, users] = await Promise.all([
    User.findById(userId).select('following friends').lean(),
    User.find({
      $and: [
        { _id: { $ne: userId } },
        {
          $or: [
            { username: regex },
            { email: regex }
          ]
        }
      ]
    })
      .select('username avatar bio country followers')
      .limit(limit)
      .lean()
  ]);

  // Log search
  await Search.create({ user: userId, query, type: 'user' });

  return users.map((user) => ({
    _id: user._id,
    username: user.username,
    avatar: user.avatar,
    bio: user.bio,
    country: user.country,
    followerCount: (user.followers || []).length,
    isFollowing: (currentUser?.following || []).some((id) => String(id) === String(user._id)),
    isFriend: (currentUser?.friends || []).some((id) => String(id) === String(user._id))
  }));
};

exports.searchPosts = async (query, userId, limit = 10) => {
  const regex = new RegExp(query, 'i');
  
  const posts = await Post.find({
    $or: [
      { text: regex },
      { 'comments.text': regex }
    ]
  })
    .populate('author', 'username avatar')
    .limit(limit)
    .lean();

  // Log search
  await Search.create({ user: userId, query, type: 'post' });

  return posts;
};

exports.globalSearch = async (query, userId, limit = 5) => {
  if (!query || query.trim().length < 2) {
    return { users: [], posts: [], tags: [] };
  }

  const [users, posts] = await Promise.all([
    this.searchUsers(query, userId, limit),
    this.searchPosts(query, userId, limit)
  ]);

  return { users, posts };
};

exports.getSearchHistory = async (userId, limit = 20) => {
  return await Search.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .distinct('query');
};

exports.clearSearchHistory = async (userId) => {
  await Search.deleteMany({ user: userId });
  return { cleared: true };
};
