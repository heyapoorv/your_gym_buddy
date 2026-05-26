const express = require('express');
const { body } = require('express-validator');
const { getMembers, createMember, getMember, updateMember, deleteMember, getMemberStats } = require('../controllers/memberController');
const { protect, authorize } = require('../middleware/auth');
const { checkSubscriptionActive, checkLimit } = require('../middleware/subscriptionMiddleware');

const router = express.Router();

const memberValidation = [
  body('name').trim().notEmpty().withMessage('Member name is required.'),
  body('email').optional().isEmail().withMessage('Please enter a valid email.'),
  body('phone').optional().trim(),
];

// All routes require authentication
router.use(protect);

router.get('/stats', getMemberStats);

router.route('/')
  .get(getMembers)
  .post(checkSubscriptionActive, checkLimit('members'), memberValidation, createMember);

router.route('/:id')
  .get(getMember)
  .put(updateMember)
  .delete(authorize('gym_owner', 'superadmin'), deleteMember);

module.exports = router;

