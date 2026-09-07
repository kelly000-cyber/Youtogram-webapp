const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const gameController = require('../controllers/gameController');

router.get('/', authMiddleware, gameController.getGames);
router.post('/', authMiddleware, gameController.createGame);
router.post('/session', authMiddleware, gameController.createGameSession);
router.get('/history', authMiddleware, gameController.getSessionHistory);

module.exports = router;
