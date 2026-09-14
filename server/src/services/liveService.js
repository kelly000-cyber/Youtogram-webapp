const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');

const sessions = [];

const attachHostInfo = async (session) => {
  const host = await User.findById(session.host).select('username avatar').lean();
  return {
    ...session,
    hostName: host?.username || 'Host',
    hostAvatar: host?.avatar || ''
  };
};

exports.createLiveSession = async (userId, { title, description = '' }) => {
  const host = await User.findById(userId).select('username avatar followerCount points role').lean();

  if (!host) {
    const error = new Error('Host account not found');
    error.status = 404;
    throw error;
  }

  if (host.role !== 'admin' && (host.followerCount || 0) < 1000) {
    const error = new Error('You need at least 1,000 followers to go live. Keep growing your audience.');
    error.status = 403;
    throw error;
  }

  const session = {
    id: uuidv4(),
    host: userId,
    hostName: host.username || 'Host',
    hostAvatar: host.avatar || '',
    title,
    description,
    viewers: 0,
    gifts: [],
    messages: [],
    startedAt: new Date(),
    isActive: true
  };
  sessions.push(session);
  return session;
};

exports.getLiveSessions = async () => {
  const activeSessions = sessions.filter((session) => session.isActive);
  return Promise.all(activeSessions.map((session) => attachHostInfo(session)));
};

exports.joinLiveSession = async (sessionId, userId) => {
  const session = sessions.find((item) => item.id === sessionId);
  if (!session) {
    const error = new Error('Live session not found');
    error.status = 404;
    throw error;
  }

  session.viewers += 1;
  return { sessionId, userId, viewers: session.viewers };
};

exports.leaveLiveSession = async (sessionId) => {
  const session = sessions.find((item) => item.id === sessionId);
  if (!session) return null;

  session.viewers = Math.max(0, session.viewers - 1);
  return session;
};

exports.addGiftToSession = async (sessionId, gift) => {
  const session = sessions.find((item) => item.id === sessionId);
  if (!session) {
    const error = new Error('Live session not found');
    error.status = 404;
    throw error;
  }

  const sender = await User.findById(gift.senderId).select('points username');
  if (!sender) {
    const error = new Error('Sender account not found');
    error.status = 404;
    throw error;
  }

  if ((sender.points || 0) < gift.amount) {
    const error = new Error('Not enough points to send this gift');
    error.status = 403;
    throw error;
  }

  const host = await User.findById(session.host).select('points username');
  if (!host) {
    const error = new Error('Live host not found');
    error.status = 404;
    throw error;
  }

  sender.points -= gift.amount;
  host.points += gift.amount;
  await Promise.all([sender.save(), host.save()]);

  session.gifts.unshift(gift);
  if (session.gifts.length > 20) {
    session.gifts.pop();
  }

  return gift;
};
