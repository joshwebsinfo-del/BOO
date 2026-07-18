const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, notificationsController.listNotifications);
router.put('/:id/read', verifyToken, notificationsController.markAsRead);

module.exports = router;
