const router = require('express').Router();
const { body } = require('express-validator');
const studentController = require('../controllers/studentController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

// Get all students
router.get('/', authenticate, authorizeAdmin, studentController.getAllStudents);

// Get student by ID
router.get('/:id', authenticate, authorizeAdmin, studentController.getStudentById);

// Get student exam history
router.get('/:id/exam-history', authenticate, authorizeAdmin, studentController.getStudentExamHistory);

// Create student
router.post('/', [
  authenticate,
  authorizeAdmin,
  body('name').notEmpty().withMessage('Name is required').trim(),
  body('rollNumber').notEmpty().withMessage('Roll number is required').trim().toUpperCase(),
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('group').isMongoId().withMessage('Valid group ID is required')
], studentController.createStudent);

// Bulk create students
router.post('/bulk', authenticate, authorizeAdmin, studentController.bulkCreateStudents);

// Update student
router.put('/:id', authenticate, authorizeAdmin, studentController.updateStudent);

// Delete student
router.delete('/:id', authenticate, authorizeAdmin, studentController.deleteStudent);

// Toggle student status
router.patch('/:id/toggle-status', authenticate, authorizeAdmin, studentController.toggleStudentStatus);

// Reset student password
router.post('/:id/reset-password', authenticate, authorizeAdmin, [
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], studentController.resetPassword);

module.exports = router;