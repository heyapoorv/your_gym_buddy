const express = require('express');
const { getSubscription, createOrder, verifyPaymentAndActivate } = require('../controllers/subscriptionController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All subscription routes require authentication
router.use(protect);
router.use(authorize('gym_owner', 'superadmin'));

/**
 * GET  /api/subscription
 *   → Get current plan, usage stats, history, allPlans, razorpayKeyId
 *
 * POST /api/subscription/create-order
 *   → Step 1: Create Razorpay order for plan upgrade
 *   → Body: { plan: 'starter' | 'growth' | 'enterprise' }
 *   → Returns: { orderId, amount, currency, razorpayKeyId, ... }
 *
 * POST /api/subscription/verify-payment
 *   → Step 2: Verify Razorpay payment + activate plan
 *   → Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan }
 *   → HMAC signature verified before ANY plan change is made
 */
router.get('/', getSubscription);
router.post('/create-order', createOrder);
router.post('/verify-payment', verifyPaymentAndActivate);

module.exports = router;
