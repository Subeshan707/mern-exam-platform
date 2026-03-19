const router = require('express').Router();
const { body } = require('express-validator');
const examController = require('../controllers/examController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Get all exams
router.get('/', authenticate, examController.getAllExams);

// Get student's ongoing exams
router.get('/student/ongoing', authenticate, examController.getStudentOngoingExams);

// Get exam by ID
router.get('/:id', authenticate, examController.getExamById);

// Get exam results
router.get('/:id/results', authenticate, authorizeAdmin, examController.getExamResults);

// Get exam assignments
router.get('/:id/assignments', authenticate, authorizeAdmin, examController.getExamAssignments);

// Download exam report
router.get('/:id/download-report', authenticate, authorizeAdmin, examController.downloadExamReport);

// Create exam
router.post('/', [
  authenticate,
  authorizeAdmin,
  body('name').notEmpty().withMessage('Exam name is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time is required'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be at least 1 minute'),
  body('passMark').isInt({ min: 0 }).withMessage('Pass mark must be a positive number'),
  body('questions').isArray({ min: 1 }).withMessage('At least one question is required')
], examController.createExam);

// Upload questions via Excel
router.post('/upload-questions', authenticate, authorizeAdmin, upload.single('file'), examController.uploadQuestions);

// Assign exam
router.post('/assign', authenticate, authorizeAdmin, examController.assignExam);

// Update exam
router.put('/:id', authenticate, authorizeAdmin, examController.updateExam);

// Delete exam
router.delete('/:id', authenticate, authorizeAdmin, examController.deleteExam);

// Student exam routes
router.post('/:id/start', authenticate, examController.startExam);
router.post('/:attemptId/save-answer', authenticate, examController.saveAnswer);
router.post('/:attemptId/submit', authenticate, examController.submitExam);
router.post('/:attemptId/auto-submit', authenticate, examController.autoSubmitExam);
router.post('/:attemptId/violation', authenticate, examController.recordViolation);

module.exports = router;