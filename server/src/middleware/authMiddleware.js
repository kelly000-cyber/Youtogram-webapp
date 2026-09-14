const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];

  const jwtSecret = process.env.JWT_SECRET || 'youtogram_secret';

  if (!process.env.JWT_SECRET) {
    // eslint-disable-next-line no-console
    console.warn('Warning: JWT_SECRET not set, using insecure default. Set JWT_SECRET in production.');
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = { id: payload.id, email: payload.email };
    next();
  } catch (error) {
    return res.status(401).json({ status: 'error', message: 'Invalid token' });
  }
};

module.exports = authMiddleware;
