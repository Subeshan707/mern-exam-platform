const router = require('express').Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Admin registration
router.post('/admin/register', [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters').trim(),
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], authController.adminRegister);

// Student registration
router.post('/student/register', [
  body('name').notEmpty().withMessage('Name is required').trim(),
  body('rollNumber').notEmpty().withMessage('Roll number is required').trim().toUpperCase(),
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('group').isMongoId().withMessage('Valid group ID is required')
], authController.studentRegister);

// Admin login
router.post('/admin/login', [
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
], authController.adminLogin);

// Student login
router.post('/student/login', [
  body('rollNumber').notEmpty().withMessage('Roll number is required').trim().toUpperCase(),
  body('password').notEmpty().withMessage('Password is required')
], authController.studentLogin);

// Refresh token
router.post('/refresh', authController.refreshToken);

// Logout
router.post('/logout', authenticate, authController.logout);

// Change password
router.put('/change-password', authenticate, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], authController.changePassword);

// Forgot password
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('role').isIn(['admin', 'student']).withMessage('Invalid role')
], authController.forgotPassword);

module.exports = router;