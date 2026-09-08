const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { Resend } = require('resend');
const User = require('../models/User');
const notificationService = require('./notificationService');
const { getDialCode } = require('../utils/countries');

const normalizePhone = (value = '') => String(value).replace(/[^\d+]/g, '').trim();
const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{10,}$/;

const getGoogleClient = () => process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI)
  : null;

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
  const cleanUsername = String(username || '').trim();
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPhone = normalizePhone(phone);
  const expectedDialCode = getDialCode(country);

  if (!cleanUsername || !cleanEmail) {
    const error = new Error('Username and email are required');
    error.status = 400;
    throw error;
  }

  if (!expectedDialCode || expectedDialCode !== phoneCountryCode || !cleanPhone.startsWith(normalizePhone(expectedDialCode))) {
    const error = new Error('Mobile number must match the selected country');
    error.status = 400;
    throw error;
  }

  const existing = await User.findOne({
    $or: [{ username: cleanUsername }, { email: cleanEmail }, { phone: cleanPhone }]
  });
  if (existing) {
    const message = existing.username === cleanUsername
      ? 'Username is already taken'
      : existing.email === cleanEmail
        ? 'Email is already registered'
        : 'Mobile number is already registered';
    const error = new Error(message);
    error.status = 400;
    throw error;
  }

  validateStrongPassword(password);

  const hashed = await bcrypt.hash(password, 12);
  const user = await User.create({ username: cleanUsername, email: cleanEmail, phone: cleanPhone, phoneCountryCode: expectedDialCode, password: hashed, country });
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

exports.getGoogleAuthUrl = () => {
  const client = getGoogleClient();
  if (!client) {
    const error = new Error('Google sign-in is not configured yet');
    error.status = 503;
    throw error;
  }
  return client.generateAuthUrl({ access_type: 'offline', scope: ['openid', 'email', 'profile'], prompt: 'select_account' });
};

exports.loginWithGoogle = async (code) => {
  const client = getGoogleClient();
  if (!client) {
    const error = new Error('Google sign-in is not configured yet');
    error.status = 503;
    throw error;
  }
  const { tokens } = await client.getToken(code);
  const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: process.env.GOOGLE_CLIENT_ID });
  const profile = ticket.getPayload();
  if (!profile?.sub || !profile.email || !profile.email_verified) {
    const error = new Error('Google account email could not be verified');
    error.status = 400;
    throw error;
  }

  const email = profile.email.toLowerCase();
  let user = await User.findOne({ $or: [{ googleId: profile.sub }, { email }] });
  if (!user) {
    const base = (profile.name || email.split('@')[0]).replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20) || 'youtogram_user';
    let username = base;
    let suffix = 1;
    while (await User.exists({ username })) username = `${base}${suffix++}`;
    user = await User.create({
      username,
      email,
      phone: `google:${profile.sub}`,
      password: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12),
      googleId: profile.sub,
      avatar: profile.picture || ''
    });
  } else if (!user.googleId) {
    user.googleId = profile.sub;
    if (profile.picture && !user.avatar) user.avatar = profile.picture;
    await user.save();
  }
  return { token: createToken(user) };
};

exports.requestPasswordReset = async (email) => {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const user = await User.findOne({ email: cleanEmail });
  const response = { message: 'If an account exists for that email, reset instructions have been sent.' };
  if (!user) return response;

  const rawToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  user.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
  await user.save();

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.warn('Password reset requested but Resend is not fully configured.');
    return response;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/?reset=${rawToken}`;
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: user.email,
    subject: 'Reset your Youtogram password',
    text: `Reset your Youtogram password here: ${resetUrl}\n\nThis link expires in 30 minutes.`
  });
  return response;
};

exports.resetPassword = async (token, password) => {
  validateStrongPassword(password);
  const tokenHash = crypto.createHash('sha256').update(String(token || '')).digest('hex');
  const user = await User.findOne({ passwordResetTokenHash: tokenHash, passwordResetExpiresAt: { $gt: new Date() } });
  if (!user) {
    const error = new Error('This reset link is invalid or has expired');
    error.status = 400;
    throw error;
  }
  user.password = await bcrypt.hash(password, 12);
  user.passwordResetTokenHash = '';
  user.passwordResetExpiresAt = null;
  await user.save();
  return { message: 'Password updated successfully' };
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
