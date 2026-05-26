const crypto = require('crypto');
const Razorpay = require('razorpay');
const Gym = require('../models/Gym');
const Member = require('../models/Member');
const Trainer = require('../models/Trainer');
const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');
const { PLAN_CONFIG, getPlanLimits } = require('../config/plans');

// ─── Razorpay Client ────────────────────────────────────────────────────────
// Lazily initialized so the server starts even without keys configured.
let razorpay = null;
const getRazorpay = () => {
  if (!razorpay) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret || keyId.includes('YourKeyId')) {
      throw new Error('Razorpay keys are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
    }
    razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return razorpay;
};

/**
 * @desc    Get current subscription status + real-time usage stats
 * @route   GET /api/subscription
 * @access  Private (gym_owner)
 */
const getSubscription = async (req, res, next) => {
  try {
    const gymId = req.user.gymId;
    if (!gymId) return next(new AppError('No gym associated with this account.', 404));

    const gym = await Gym.findById(gymId).select(
      'name plan subscriptionStatus trialEndsAt planStartsAt planExpiresAt maxMembers maxStaff maxBranches subscriptionHistory createdAt'
    );
    if (!gym) return next(new AppError('Gym not found.', 404));

    // Real-time usage
    const [memberCount, staffCount] = await Promise.all([
      Member.countDocuments({ gymId, status: { $ne: 'inactive' } }),
      Trainer.countDocuments({ gymId }),
    ]);

    // Days remaining
    let daysRemaining = null;
    const now = new Date();
    if (gym.subscriptionStatus === 'trial' && gym.trialEndsAt) {
      const diff = new Date(gym.trialEndsAt) - now;
      daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    } else if (gym.subscriptionStatus === 'active' && gym.planExpiresAt) {
      const diff = new Date(gym.planExpiresAt) - now;
      daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    const planConfig = PLAN_CONFIG[gym.plan] || PLAN_CONFIG.trial;

    return sendSuccess(res, 200, 'Subscription fetched successfully.', {
      plan: gym.plan,
      planLabel: planConfig.label,
      planPrice: planConfig.price,
      planPriceDisplay: planConfig.priceDisplay,
      subscriptionStatus: gym.subscriptionStatus,
      trialEndsAt: gym.trialEndsAt,
      planStartsAt: gym.planStartsAt,
      planExpiresAt: gym.planExpiresAt,
      daysRemaining,
      usage: {
        members: {
          current: memberCount,
          limit: gym.maxMembers,
          percentage: gym.maxMembers === Infinity ? 0 : Math.round((memberCount / gym.maxMembers) * 100),
        },
        staff: {
          current: staffCount,
          limit: gym.maxStaff,
          percentage: gym.maxStaff === Infinity ? 0 : Math.round((staffCount / gym.maxStaff) * 100),
        },
        branches: {
          current: 1,
          limit: gym.maxBranches,
          percentage: gym.maxBranches === Infinity ? 0 : Math.round((1 / gym.maxBranches) * 100),
        },
      },
      history: gym.subscriptionHistory,
      allPlans: PLAN_CONFIG,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a Razorpay order for plan upgrade
 *
 *          Step 1 of the payment flow:
 *          Client calls this to get an order_id which is passed
 *          to Razorpay Checkout on the frontend.
 *
 * @route   POST /api/subscription/create-order
 * @body    { plan: 'starter' | 'growth' | 'enterprise' }
 * @access  Private (gym_owner)
 */
const createOrder = async (req, res, next) => {
  try {
    const gymId = req.user.gymId;
    if (!gymId) return next(new AppError('No gym associated with this account.', 404));

    const { plan } = req.body;
    const validPlans = ['starter', 'growth', 'enterprise'];
    if (!plan || !validPlans.includes(plan)) {
      return next(new AppError(`Invalid plan. Choose from: ${validPlans.join(', ')}`, 400));
    }

    const gym = await Gym.findById(gymId).select('name plan subscriptionStatus');
    if (!gym) return next(new AppError('Gym not found.', 404));

    // Don't allow downgrade if already on enterprise
    if (gym.plan === 'enterprise' && plan !== 'enterprise') {
      return next(new AppError('Cannot downgrade from Enterprise. Contact support.', 400));
    }

    const planConfig = getPlanLimits(plan);
    const amountPaise = planConfig.razorpayAmountPaise;

    if (!amountPaise || amountPaise <= 0) {
      return next(new AppError('This plan cannot be purchased via online payment.', 400));
    }

    let rzp;
    try {
      rzp = getRazorpay();
    } catch (err) {
      return next(new AppError(err.message, 503));
    }

    // Create Razorpay order
    const receiptId = `gymos_${gymId.toString().slice(-6)}_${Date.now()}`;
    const order = await rzp.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: receiptId,
      notes: {
        gymId: gymId.toString(),
        gymName: gym.name,
        plan,
        currentPlan: gym.plan,
      },
    });

    return sendSuccess(res, 200, 'Razorpay order created.', {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      plan,
      planLabel: planConfig.label,
      planPrice: planConfig.price,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      gymName: gym.name,
    });
  } catch (error) {
    // Razorpay SDK error
    if (error.error) {
      return next(new AppError(`Razorpay: ${error.error.description}`, 502));
    }
    next(error);
  }
};

/**
 * @desc    Verify Razorpay payment signature and activate the plan
 *
 *          Step 2 of the payment flow:
 *          After Razorpay Checkout succeeds, the frontend sends
 *          razorpay_order_id, razorpay_payment_id, razorpay_signature
 *          here. We verify the HMAC signature, then — and ONLY then —
 *          activate the new plan on the gym.
 *
 * @route   POST /api/subscription/verify-payment
 * @body    { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan }
 * @access  Private (gym_owner)
 */
const verifyPaymentAndActivate = async (req, res, next) => {
  try {
    const gymId = req.user.gymId;
    if (!gymId) return next(new AppError('No gym associated with this account.', 404));

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;

    // All four fields are mandatory
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan) {
      return next(new AppError('Missing payment verification fields.', 400));
    }

    const validPlans = ['starter', 'growth', 'enterprise'];
    if (!validPlans.includes(plan)) {
      return next(new AppError(`Invalid plan: ${plan}`, 400));
    }

    // ── HMAC-SHA256 Signature Verification ────────────────────────────────
    // Razorpay's documented verification: HMAC_SHA256(order_id + "|" + payment_id, key_secret)
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret || keySecret.includes('YourKeySecret')) {
      return next(new AppError('Payment gateway not configured on server.', 503));
    }

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        code: 'PAYMENT_SIGNATURE_INVALID',
        message: 'Payment verification failed. Signature mismatch. Your card was NOT charged.',
      });
    }

    // ── Payment verified — now activate the plan ───────────────────────────
    const gym = await Gym.findById(gymId);
    if (!gym) return next(new AppError('Gym not found.', 404));

    const planConfig = getPlanLimits(plan);
    const now = new Date();
    const planStartsAt = now;
    const planExpiresAt = new Date(now);
    planExpiresAt.setDate(planExpiresAt.getDate() + planConfig.durationDays);

    // Close the previous subscription history entry
    if (gym.subscriptionHistory.length > 0) {
      const last = gym.subscriptionHistory[gym.subscriptionHistory.length - 1];
      if (!last.endedAt) last.endedAt = now;
    }

    // Append verified payment entry
    gym.subscriptionHistory.push({
      plan,
      status: 'active',
      startedAt: now,
      note: `Upgraded from ${gym.plan} to ${plan}. Razorpay Order: ${razorpay_order_id} | Payment: ${razorpay_payment_id}`,
    });

    // Apply the plan
    gym.plan = plan;
    gym.subscriptionStatus = 'active';
    gym.planStartsAt = planStartsAt;
    gym.planExpiresAt = planExpiresAt;
    gym.maxMembers = planConfig.maxMembers;
    gym.maxStaff = planConfig.maxStaff;
    gym.maxBranches = planConfig.maxBranches;

    await gym.save();

    // Create a success notification for the gym owner
    try {
      await Notification.create({
        gymId,
        userId: req.user._id,
        title: `Plan Activated: ${planConfig.label}`,
        description: `Your GymOS subscription has been upgraded to the ${planConfig.label} plan. Valid until ${planExpiresAt.toLocaleDateString()}.`,
        type: 'billing',
      });
    } catch (_) {
      // Non-critical — don't fail the response
    }

    return sendSuccess(res, 200, `Plan upgraded to ${planConfig.label} successfully.`, {
      plan: gym.plan,
      planLabel: planConfig.label,
      subscriptionStatus: gym.subscriptionStatus,
      planStartsAt: gym.planStartsAt,
      planExpiresAt: gym.planExpiresAt,
      maxMembers: gym.maxMembers,
      maxStaff: gym.maxStaff,
      maxBranches: gym.maxBranches,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSubscription, createOrder, verifyPaymentAndActivate };
