const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const liveController = require('../controllers/liveController');

router.post('/session', authMiddleware, liveController.createLiveSession);
router.get('/sessions', authMiddleware, liveController.getLiveSessions);
router.post('/session/:id/join', authMiddleware, liveController.joinLiveSession);

module.exports = router;
