const userSettingsService = require('../services/userSettingsService');

exports.getSettings = async (req, res, next) => {
  try {
    const settings = await userSettingsService.getOrCreateSettings(req.user.id);
    res.json({ status: 'success', data: settings });
  } catch (error) {
    next(error);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const settings = await userSettingsService.updateSettings(req.user.id, req.body);
    res.json({ status: 'success', data: settings });
  } catch (error) {
    next(error);
  }
};

exports.blockUser = async (req, res, next) => {
  try {
    const result = await userSettingsService.blockUser(req.user.id, req.params.targetUserId);
    res.json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

exports.unblockUser = async (req, res, next) => {
  try {
    const result = await userSettingsService.unblockUser(req.user.id, req.params.targetUserId);
    res.json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

exports.muteUser = async (req, res, next) => {
  try {
    const result = await userSettingsService.muteUser(req.user.id, req.params.targetUserId);
    res.json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

exports.unmuteUser = async (req, res, next) => {
  try {
    const result = await userSettingsService.unmuteUser(req.user.id, req.params.targetUserId);
    res.json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

exports.getBlockList = async (req, res, next) => {
  try {
    const blockList = await userSettingsService.getBlockList(req.user.id);
    res.json({ status: 'success', data: blockList });
  } catch (error) {
    next(error);
  }
};
