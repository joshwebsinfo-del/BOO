const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/student', verifyToken, dashboardController.getStudentDashboard);
router.get('/admin', verifyToken, requireRole(['Admin']), dashboardController.getAdminDashboard);

module.exports = router;
