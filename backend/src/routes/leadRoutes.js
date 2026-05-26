const express = require('express');
const { body } = require('express-validator');
const { getLeads, createLead, updateLead, getLeadStats } = require('../controllers/leadController');
const { protect, authorize } = require('../middleware/auth');
const { checkSubscriptionActive } = require('../middleware/subscriptionMiddleware');

const router = express.Router();

const leadValidation = [
  body('fullName').trim().notEmpty().withMessage('Full name is required.'),
  body('phone').notEmpty().withMessage('Phone number is required.'),
];

router.use(protect);
router.use(authorize('gym_owner', 'superadmin'));

router.get('/stats', getLeadStats);

router.route('/')
  .get(getLeads)
  .post(checkSubscriptionActive, leadValidation, createLead);

router.route('/:id')
  .put(checkSubscriptionActive, updateLead);

module.exports = router;

