const authService = require('../services/authService');

exports.register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({ status: 'success', message: 'User created', data: user });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const token = await authService.login(req.body);
    res.json({ status: 'success', message: 'Login successful', data: token });
  } catch (error) {
    next(error);
  }
};

exports.google = (req, res, next) => {
  try {
    res.redirect(authService.getGoogleAuthUrl());
  } catch (error) {
    next(error);
  }
};

exports.googleCallback = async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  try {
    const result = await authService.loginWithGoogle(req.query.code);
    res.redirect(`${frontendUrl}/?token=${encodeURIComponent(result.token)}`);
  } catch (error) {
    res.redirect(`${frontendUrl}/?authError=${encodeURIComponent(error.message || 'Google sign-in failed')}`);
  }
};

exports.requestPasswordReset = async (req, res, next) => {
  try {
    res.json({ status: 'success', ...(await authService.requestPasswordReset(req.body.email)) });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    res.json({ status: 'success', ...(await authService.resetPassword(req.body.token, req.body.password)) });
  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const profile = await authService.getProfile(req.user.id);
    res.json({ status: 'success', data: profile });
  } catch (error) {
    next(error);
  }
};

exports.listUsers = async (req, res, next) => {
  try {
    const users = await authService.listUsers(req.user.id);
    res.json({ status: 'success', data: users });
  } catch (error) {
    next(error);
  }
};

exports.followUser = async (req, res, next) => {
  try {
    const result = await authService.followUser(req.user.id, req.params.id);
    res.json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

exports.unfollowUser = async (req, res, next) => {
  try {
    const result = await authService.unfollowUser(req.user.id, req.params.id);
    res.json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const profile = await authService.updateProfile(req.user.id, req.body);
    res.json({ status: 'success', message: 'Profile updated successfully', data: profile });
  } catch (error) {
    next(error);
  }
};

exports.sendFriendRequest = async (req, res, next) => {
  try {
    const result = await authService.sendFriendRequest(req.user.id, req.params.id);
    res.json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};
