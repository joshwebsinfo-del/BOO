const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { verifyToken } = require('../middleware/auth');
const { validateBody } = require('../middleware/validator');

router.post('/chat', verifyToken, validateBody(['message']), aiController.chat);
router.post('/explain', verifyToken, validateBody(['topic']), aiController.explain);
router.post('/summarize', verifyToken, validateBody(['text']), aiController.summarize);
router.get('/history', verifyToken, aiController.getHistory);

module.exports = router;
