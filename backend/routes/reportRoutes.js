const router = require('express').Router();
const reportController = require('../controllers/reportController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

// Get analytics data
router.get('/analytics', authenticate, authorizeAdmin, reportController.getAnalyticsData);

// Generate students report
router.get('/students', authenticate, authorizeAdmin, reportController.generateStudentsReport);

// Generate exams report
router.get('/exams', authenticate, authorizeAdmin, reportController.generateExamsReport);

// Generate results report
router.get('/results', authenticate, authorizeAdmin, reportController.generateResultsReport);

// Generate group report
router.get('/groups/:groupId', authenticate, authorizeAdmin, reportController.generateGroupReport);

// Generate performance report
router.get('/performance', authenticate, authorizeAdmin, reportController.generatePerformanceReport);

module.exports = router;