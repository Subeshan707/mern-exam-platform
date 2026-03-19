const router = require('express').Router();
const { body } = require('express-validator');
const groupController = require('../controllers/groupController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

// Get all groups
router.get('/', authenticate, authorizeAdmin, groupController.getAllGroups);

// Get group statistics
router.get('/stats', authenticate, authorizeAdmin, groupController.getGroupStats);

// Get group by ID
router.get('/:id', authenticate, authorizeAdmin, groupController.getGroupById);

router.patch('/:id/deactivate', authenticate, authorizeAdmin, groupController.deactivateGroup);

// Create group
router.post('/', [
  authenticate,
  authorizeAdmin,
  body('name').notEmpty().withMessage('Group name is required').trim(),
  body('year').notEmpty().withMessage('Year is required'),
  body('batch').notEmpty().withMessage('Batch is required'),
  body('section').notEmpty().withMessage('Section is required')
], groupController.createGroup);

// Update group
router.put('/:id', authenticate, authorizeAdmin, groupController.updateGroup);

// Delete group
router.delete('/:id', authenticate, authorizeAdmin, groupController.deleteGroup);

module.exports = router;