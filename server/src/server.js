const http = require('http');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const socketio = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const configureChatSocket = require('./sockets/chatSocket');
const configureLiveSocket = require('./sockets/liveSocket');
const User = require('./models/User');
const Post = require('./models/Post');

dotenv.config();

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

const getAllowedOrigins = () => {
  if (!process.env.FRONTEND_URL) return '*';

  return process.env.FRONTEND_URL
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const createDefaultAdmin = async () => {
  const email = process.env.DEFAULT_ADMIN_EMAIL || 'admin@massblogga.local';
  const existingAdmin = await User.findOne({ email });
  if (existingAdmin) {
    return;
  }

  const password = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123!';
  const hashedPassword = await bcrypt.hash(password, 12);

  await User.create({
    username: 'admin',
    email,
    phone: '+11234567890',
    phoneCountryCode: '+1',
    password: hashedPassword,
    avatar: '',
    bio: 'Default admin account for demo and review access.',
    country: 'United States',
    role: 'admin',
    points: 10000,
    followerCount: 1200
  });

  console.log(`Default admin created: ${email}`);
};

const createDefaultTestPost = async () => {
  try {
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@massblogga.local';
    const admin = await User.findOne({ email: adminEmail });
    if (!admin) return;

    const existing = await Post.findOne({ author: admin._id, 'text': /default test post/i });
    if (existing) return;

    await Post.create({
      author: admin._id,
      text: 'Default test post — visible only to this admin account for testing.',
      media: [],
      // createdAt will be now; only admin (author) will see their own post in feed
    });

    console.log('Default test post created for admin.');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Failed to create default test post:', e.message);
  }
};

const startServer = async () => {
  await connectDB();
  await createDefaultAdmin();
  await createDefaultTestPost();

  const server = http.createServer(app);
  const io = new socketio.Server(server, {
    cors: {
      origin: getAllowedOrigins(),
      methods: ['GET', 'POST']
    }
  });

  configureChatSocket(io);
  configureLiveSocket(io);

  server.listen(PORT, HOST, () => {
    console.log(`Youtogram backend listening on ${HOST}:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
