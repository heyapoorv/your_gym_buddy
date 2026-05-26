const express = require('express');
const { body } = require('express-validator');
const { getTrainers, createTrainer, updateTrainer, assignMember, deleteTrainer } = require('../controllers/trainerController');
const { protect, authorize } = require('../middleware/auth');
const { checkSubscriptionActive, checkLimit } = require('../middleware/subscriptionMiddleware');

const router = express.Router();

const trainerValidation = [
  body('fullName').trim().notEmpty().withMessage('Full name is required.'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address.'),
  body('phone').notEmpty().withMessage('Phone number is required.'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  body('salary').optional().isNumeric().withMessage('Salary must be a number.'),
];

router.use(protect);

router.route('/')
  .get(authorize('gym_owner', 'superadmin', 'trainer'), getTrainers)
  .post(authorize('gym_owner', 'superadmin'), checkSubscriptionActive, checkLimit('staff'), trainerValidation, createTrainer);

router.route('/:id')
  .put(authorize('gym_owner', 'superadmin'), updateTrainer)
  .delete(authorize('gym_owner', 'superadmin'), deleteTrainer);

router.post('/:id/assign', authorize('gym_owner', 'superadmin'), assignMember);

module.exports = router;

