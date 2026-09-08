const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/google', authController.google);
router.get('/google/callback', authController.googleCallback);
router.post('/forgot-password', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);
router.get('/me', authMiddleware, authController.getProfile);
router.patch('/me', authMiddleware, authController.updateProfile);
router.get('/users', authMiddleware, authController.listUsers);
router.post('/follow/:id', authMiddleware, authController.followUser);
router.delete('/follow/:id', authMiddleware, authController.unfollowUser);
router.post('/friends/:id', authMiddleware, authController.sendFriendRequest);

module.exports = router;
