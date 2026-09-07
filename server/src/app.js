const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const chatRoutes = require('./routes/chat');
const videoRoutes = require('./routes/videos');
const gameRoutes = require('./routes/games');
const searchRoutes = require('./routes/search');
const liveRoutes = require('./routes/live');
const savedRoutes = require('./routes/saved');
const notificationRoutes = require('./routes/notifications');
const errorHandler = require('./middleware/errorHandler');

const app = express();

const getAllowedOrigins = () => {
  if (!process.env.FRONTEND_URL) return '*';

  return process.env.FRONTEND_URL
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

// Basic security middleware
app.use(cors({ origin: getAllowedOrigins() }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(morgan('dev'));

// Sanitize user input to prevent NoSQL injection
app.use(mongoSanitize());
// Basic XSS protection for incoming payloads
app.use(xss());

// Global rate limiter (apply conservative defaults)
const globalLimiter = rateLimit({ windowMs: 60 * 1000, max: 120 });
app.use(globalLimiter);

// Tighter limits for auth-related endpoints
const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });
app.use('/api/auth', authLimiter, authRoutes);
// Moderate limits on posting to prevent abuse
const postsLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 });
app.use('/api/posts', postsLimiter, postRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/saved', savedRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(errorHandler);

app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusLabel = dbStatus === 1 ? 'connected' : dbStatus === 2 ? 'connecting' : dbStatus === 0 ? 'disconnected' : 'disconnecting';

  res.json({
    status: 'success',
    message: 'Youtogram API is running',
    database: {
      state: statusLabel,
      code: dbStatus
    }
  });
});

module.exports = app;
