const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const notificationService = require('./notificationService');
const { getDialCode } = require('../utils/countries');

const normalizePhone = (value = '') => String(value).replace(/[^\d+]/g, '').trim();
const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{10,}$/;

const validateStrongPassword = (password) => {
  if (!passwordRule.test(String(password || ''))) {
    const error = new Error('Password must be at least 10 characters and include 1 uppercase letter, 1 lowercase letter, 1 number, and 1 symbol.');
    error.status = 400;
    throw error;
  }
};

const createToken = (user) => {
  return jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'youtogram_secret', {
    expiresIn: '7d'
  });
};

exports.register = async ({ username, email, phone, phoneCountryCode = '', password, country = '' }) => {
  const cleanPhone = normalizePhone(phone);
  const expectedDialCode = getDialCode(country);

  if (!expectedDialCode || expectedDialCode !== phoneCountryCode || !cleanPhone.startsWith(normalizePhone(expectedDialCode))) {
    const error = new Error('Mobile number must match the selected country');
    error.status = 400;
    throw error;
  }

  const existing = await User.findOne({ $or: [{ email }, { phone: cleanPhone }] });
  if (existing) {
    const error = new Error(existing.email === email ? 'Email is already registered' : 'Mobile number is already registered');
    error.status = 400;
    throw error;
  }

  validateStrongPassword(password);

  const hashed = await bcrypt.hash(password, 12);
  const user = await User.create({ username, email, phone: cleanPhone, phoneCountryCode: expectedDialCode, password: hashed, country });
  return { id: user._id, username: user.username, email: user.email, phone: user.phone, phoneCountryCode: user.phoneCountryCode, country: user.country };
};

exports.login = async ({ email, phone, identifier, password }) => {
  const loginId = String(identifier || email || phone || '').trim();
  const phoneCandidate = normalizePhone(loginId);
  const user = await User.findOne({
    $or: [
      { email: loginId.toLowerCase() },
      { phone: phoneCandidate }
    ]
  });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    const error = new Error('Invalid email, mobile number, or password');
    error.status = 401;
    throw error;
  }

  return { token: createToken(user) };
};

exports.getProfile = async (userId) => {
  const user = await User.findById(userId)
    .select('-password')
    .populate('friends', 'username avatar')
    .populate('followers', 'username avatar')
    .populate('following', 'username avatar');

  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  user.followerCount = Math.max(user.followerCount || 0, user.followers?.length || 0, 1000);
  if (user.isModified('followerCount')) {
    await user.save();
  }

  return user;
};

exports.followUser = async (userId, targetUserId) => {
  if (String(userId) === String(targetUserId)) {
    const error = new Error('You cannot follow yourself');
    error.status = 400;
    throw error;
  }

  const [currentUser, targetUser] = await Promise.all([
    User.findById(userId),
    User.findById(targetUserId)
  ]);

  if (!currentUser || !targetUser) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  const isFollowing = currentUser.following.some((id) => String(id) === String(targetUserId));
  if (!isFollowing) {
    currentUser.following.push(targetUserId);
    targetUser.followers.push(userId);
    targetUser.followerCount = Math.max(targetUser.followerCount || 0, targetUser.followers.length, 1000);
    await Promise.all([currentUser.save(), targetUser.save()]);
    await notificationService.createNotification(
      targetUserId,
      userId,
      'follow',
      targetUserId,
      'user',
      `${currentUser.username} followed you`
    );
  }

  return {
    targetUserId,
    isFollowing: true,
    followerCount: targetUser.followerCount
  };
};

exports.unfollowUser = async (userId, targetUserId) => {
  if (String(userId) === String(targetUserId)) {
    const error = new Error('You cannot unfollow yourself');
    error.status = 400;
    throw error;
  }

  const [currentUser, targetUser] = await Promise.all([
    User.findById(userId),
    User.findById(targetUserId)
  ]);

  if (!currentUser || !targetUser) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  currentUser.following = currentUser.following.filter((id) => String(id) !== String(targetUserId));
  targetUser.followers = targetUser.followers.filter((id) => String(id) !== String(userId));
  targetUser.followerCount = Math.max(targetUser.followers.length, 1000);

  await Promise.all([currentUser.save(), targetUser.save()]);

  return {
    targetUserId,
    isFollowing: false,
    followerCount: targetUser.followerCount
  };
};

exports.updateProfile = async (userId, updates) => {
  const { currentPassword, newPassword, email, phone, phoneCountryCode, country, bio, avatar } = updates;
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  const needsAuth = Boolean(newPassword || (email && email !== user.email) || (phone && phone !== user.phone));
  if (needsAuth) {
    if (!currentPassword) {
      const error = new Error('Current password is required to update sensitive account details');
      error.status = 401;
      throw error;
    }

    const passwordMatches = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatches) {
      const error = new Error('Current password is incorrect');
      error.status = 401;
      throw error;
    }
  }

  if (newPassword) {
    validateStrongPassword(newPassword);
    user.password = await bcrypt.hash(newPassword, 12);
  }

  if (email && email !== user.email) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing && String(existing._id) !== String(user._id)) {
      const error = new Error('Email is already registered');
      error.status = 400;
      throw error;
    }
    user.email = email.toLowerCase();
  }

  if (phone && phone !== user.phone) {
    const cleanPhone = normalizePhone(phone);
    const existing = await User.findOne({ phone: cleanPhone });
    if (existing && String(existing._id) !== String(user._id)) {
      const error = new Error('Phone number is already registered');
      error.status = 400;
      throw error;
    }
    user.phone = cleanPhone;
    if (phoneCountryCode) {
      user.phoneCountryCode = phoneCountryCode;
    }
  }

  if (country) {
    user.country = country;
  }

  if (typeof bio !== 'undefined') {
    user.bio = bio;
  }

  if (typeof avatar !== 'undefined') {
    user.avatar = avatar;
  }

  await user.save();
  return await User.findById(userId).select('-password').populate('friends', 'username avatar');
};

exports.listUsers = async (userId) => {
  const currentUser = await User.findById(userId).select('friends friendRequestsSent country following followers');
  if (!currentUser) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  const users = await User.find({ _id: { $ne: userId } })
    .select('username avatar bio country friends followers following followerCount')
    .lean();

  return users.map((user) => {
    const isFriend = (currentUser.friends || []).some((id) => String(id) === String(user._id));
    const isFollowing = (currentUser.following || []).some((id) => String(id) === String(user._id));
    const isFollowedBy = (currentUser.followers || []).some((id) => String(id) === String(user._id));
    const mutualFriends = (user.friends || []).filter((friendId) =>
      (currentUser.friends || []).some((myFriendId) => String(myFriendId) === String(friendId))
    ).length;

    return {
      ...user,
      sameCountry: Boolean(currentUser.country && user.country && currentUser.country.toLowerCase() === user.country.toLowerCase()),
      isFriend,
      isRequested: (currentUser.friendRequestsSent || []).some((id) => String(id) === String(user._id)),
      isFollowing,
      isFollowedBy,
      mutualFriends,
      followerCount: user.followerCount || (user.followers || []).length
    };
  });
};

exports.sendFriendRequest = async (userId, targetUserId) => {
  if (String(userId) === String(targetUserId)) {
    const error = new Error('You cannot add yourself');
    error.status = 400;
    throw error;
  }

  const [currentUser, targetUser] = await Promise.all([
    User.findById(userId),
    User.findById(targetUserId)
  ]);

  if (!currentUser || !targetUser) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  const alreadyFriends = currentUser.friends.some((id) => String(id) === String(targetUserId));

  if (!alreadyFriends) {
    currentUser.friends.push(targetUserId);
    targetUser.friends.push(userId);
    currentUser.friendRequestsSent = currentUser.friendRequestsSent.filter((id) => String(id) !== String(targetUserId));
    await Promise.all([currentUser.save(), targetUser.save()]);
    await notificationService.createNotification(
      targetUserId,
      userId,
      'friend_request',
      targetUserId,
      'user',
      `${currentUser.username} sent you a friend request`
    );
  }

  return { targetUserId, requested: true, isFriend: true };
};
