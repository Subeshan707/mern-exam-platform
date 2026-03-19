const router = require('express').Router();
const resultController = require('../controllers/resultController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

// Get all results (admin)
router.get('/', authenticate, authorizeAdmin, resultController.getAllResults);

// Get student's results
router.get('/my-results', authenticate, resultController.getMyResults);

// Get result analytics
router.get('/analytics/:examId', authenticate, authorizeAdmin, resultController.getResultAnalytics);

// Get result by ID
router.get('/:id', authenticate, resultController.getResultById);

// Publish results
router.put('/publish/:examId', authenticate, authorizeAdmin, resultController.publishResults);

// Unpublish results
router.put('/unpublish/:examId', authenticate, authorizeAdmin, resultController.unpublishResults);

// Update result manually
router.put('/:id', authenticate, authorizeAdmin, resultController.updateResult);

module.exports = router;