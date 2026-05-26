const express = require('express');
const { body } = require('express-validator');
const { getPlans, createPlan, getPlan, updatePlan, deletePlan } = require('../controllers/planController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

const planValidation = [
  body('name').trim().notEmpty().withMessage('Plan name is required.'),
  body('price').isNumeric().withMessage('Price must be a number.').isFloat({ min: 0 }).withMessage('Price cannot be negative.'),
  body('durationDays').isInt({ min: 1 }).withMessage('Duration must be at least 1 day.'),
];

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getPlans)
  .post(authorize('gym_owner', 'superadmin'), planValidation, createPlan);

router.route('/:id')
  .get(getPlan)
  .put(authorize('gym_owner', 'superadmin'), updatePlan)
  .delete(authorize('gym_owner', 'superadmin'), deletePlan);

module.exports = router;
