const Gym = require('../models/Gym');
const Member = require('../models/Member');
const Trainer = require('../models/Trainer');
const AppError = require('../utils/AppError');

/**
 * checkSubscriptionActive
 *
 * Enforces SaaS subscription gating on ALL write/mutating operations.
 *
 * ─── Rules ──────────────────────────────────────────────────────────────────
 * • GET requests → always allowed (read access is never gated)
 * • superadmin   → bypasses all checks
 * • expired / cancelled → HTTP 402 SUBSCRIPTION_EXPIRED
 * • trial expired (real-time check, even before cron runs) → HTTP 402
 * • paid plan expired (real-time, before midnight cron) → HTTP 402
 *
 * Frontend: client.js dispatches 'gymos:subscription_expired' on 402.
 * SubscriptionExpiredModal reacts to gymSubscriptionStatus from AuthContext.
 */
const checkSubscriptionActive = async (req, res, next) => {
  try {
    // Allow all reads through
    if (req.method === 'GET') return next();

    // Superadmin bypasses all subscription checks
    if (req.user.role === 'superadmin') return next();

    const gymId = req.user.gymId;
    if (!gymId) return next();

    const gym = await Gym.findById(gymId).select(
      'subscriptionStatus plan trialEndsAt planExpiresAt'
    );
    if (!gym) return next(new AppError('Gym not found.', 404));

    const now = new Date();
    const { subscriptionStatus } = gym;

    // ── Already marked expired/cancelled in DB ──────────────────────────────
    if (subscriptionStatus === 'expired' || subscriptionStatus === 'cancelled') {
      return res.status(402).json({
        success: false,
        code: 'SUBSCRIPTION_EXPIRED',
        message:
          'Your GymOS subscription has expired. Please upgrade your plan to continue using this feature.',
        currentPlan: gym.plan,
        subscriptionStatus,
      });
    }

    // ── Real-time trial expiry check ────────────────────────────────────────
    // Cron runs once daily; this catches expiry mid-day before the next run.
    if (subscriptionStatus === 'trial' && gym.trialEndsAt) {
      const trialEnd = new Date(gym.trialEndsAt);
      // Compare date-only (trial expires at end of the last day)
      trialEnd.setHours(23, 59, 59, 999);
      if (now > trialEnd) {
        // Mark immediately so subsequent checks don't need to re-evaluate
        await Gym.findByIdAndUpdate(gymId, { subscriptionStatus: 'expired' });
        return res.status(402).json({
          success: false,
          code: 'SUBSCRIPTION_EXPIRED',
          message: 'Your 7-day GymOS trial has ended. Upgrade to a paid plan to continue.',
          currentPlan: 'trial',
          subscriptionStatus: 'expired',
        });
      }
    }

    // ── Real-time paid plan expiry check ────────────────────────────────────
    if (subscriptionStatus === 'active' && gym.planExpiresAt) {
      const planEnd = new Date(gym.planExpiresAt);
      planEnd.setHours(23, 59, 59, 999);
      if (now > planEnd) {
        await Gym.findByIdAndUpdate(gymId, { subscriptionStatus: 'expired' });
        return res.status(402).json({
          success: false,
          code: 'SUBSCRIPTION_EXPIRED',
          message: `Your GymOS ${gym.plan} plan has expired. Please renew to continue.`,
          currentPlan: gym.plan,
          subscriptionStatus: 'expired',
        });
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * checkLimit(resource)
 *
 * Factory middleware that enforces per-gym resource caps on create operations.
 * resource: 'members' | 'staff'
 *
 * Usage: router.post('/', checkSubscriptionActive, checkLimit('members'), createMember)
 *
 * Returns HTTP 403 with code LIMIT_REACHED when the gym hits its plan cap.
 * Frontend: client.js dispatches 'gymos:limit_reached' on 403 → LimitReachedNotifier shows toast.
 *
 * Limits enforced:
 *   Trial    → 50 members, 3 staff
 *   Starter  → 150 members, 5 staff
 *   Growth   → 500 members, 15 staff
 *   Enterprise → Unlimited
 */
const checkLimit = (resource) => async (req, res, next) => {
  try {
    // Superadmin has no limits
    if (req.user.role === 'superadmin') return next();

    const gymId = req.user.gymId;
    if (!gymId) return next();

    const gym = await Gym.findById(gymId).select(
      'plan maxMembers maxStaff subscriptionStatus'
    );
    if (!gym) return next(new AppError('Gym not found.', 404));

    // Skip limit check for expired — checkSubscriptionActive handles that gate
    if (gym.subscriptionStatus === 'expired' || gym.subscriptionStatus === 'cancelled') {
      return next();
    }

    let currentCount = 0;
    let limit = 0;
    let resourceLabel = '';

    if (resource === 'members') {
      currentCount = await Member.countDocuments({ gymId, status: { $ne: 'inactive' } });
      limit = gym.maxMembers;
      resourceLabel = 'member';
    } else if (resource === 'staff') {
      currentCount = await Trainer.countDocuments({ gymId });
      limit = gym.maxStaff;
      resourceLabel = 'staff account';
    }

    // Infinity means unlimited — skip check
    if (limit === null || limit === undefined || limit === Infinity) return next();

    if (currentCount >= limit) {
      return res.status(403).json({
        success: false,
        code: 'LIMIT_REACHED',
        resource,
        current: currentCount,
        limit,
        message: `You've reached the ${limit}-${resourceLabel} limit on the ${gym.plan} plan. Upgrade your plan to add more.`,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { checkSubscriptionActive, checkLimit };
