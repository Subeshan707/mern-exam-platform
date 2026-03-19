const router = require('express').Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

// Get admin dashboard
router.get('/admin', authenticate, dashboardController.getAdminDashboard);

// Get student dashboard
router.get('/student', authenticate, dashboardController.getStudentDashboard);

// Get student exam statistics
router.get('/student/exam-stats', authenticate, dashboardController.getStudentExamStats);

module.exports = router;