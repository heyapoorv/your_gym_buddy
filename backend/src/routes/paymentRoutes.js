const express = require('express');
const { body } = require('express-validator');
const { getPayments, createPayment, updatePayment, getPaymentStats } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');
const { checkSubscriptionActive } = require('../middleware/subscriptionMiddleware');

const router = express.Router();

const paymentValidation = [
  body('memberId').notEmpty().withMessage('Member ID is required.'),
  body('amount').isNumeric().withMessage('Amount must be a number.').isFloat({ min: 0 }).withMessage('Amount cannot be negative.'),
];

router.use(protect);

router.get('/stats', getPaymentStats);

router.route('/')
  .get(getPayments)
  .post(authorize('gym_owner', 'superadmin'), checkSubscriptionActive, paymentValidation, createPayment);

router.route('/:id')
  .put(authorize('gym_owner', 'superadmin'), updatePayment);

module.exports = router;

