const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { validateBody } = require('../middleware/validator');

router.post('/register', validateBody(['email', 'password', 'full_name']), authController.register);
router.post('/login', validateBody(['email', 'password']), authController.login);
router.post('/logout', authController.logout);
router.get('/me', verifyToken, authController.getCurrentUser);

module.exports = router;
