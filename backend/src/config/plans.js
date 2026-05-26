/**
 * GymOS SaaS Plan Configuration
 *
 * Single source of truth for all plan tiers, limits, pricing,
 * and feature flags.
 *
 * Razorpay amounts are in PAISE (1 INR = 100 paise).
 * Enterprise contacts sales — no Razorpay order for it.
 */

const PLAN_CONFIG = {
  trial: {
    label: 'Trial',
    price: 0,
    priceDisplay: '₹0',
    billingCycle: null,
    durationDays: 7,
    maxMembers: 50,
    maxStaff: 3,
    maxBranches: 1,
    razorpayAmountPaise: 0,   // Not charged
    features: [
      'Full platform access',
      'Up to 50 members',
      'Up to 3 staff users',
      'Attendance tracking',
      'Payment recording',
      'CRM & Leads',
      'Dashboard & Analytics',
      'Notifications',
    ],
  },

  starter: {
    label: 'Starter',
    price: 699,
    priceDisplay: '₹699',
    billingCycle: 'monthly',
    durationDays: 30,
    maxMembers: 150,
    maxStaff: 5,
    maxBranches: 1,
    razorpayAmountPaise: 69900,   // ₹699 in paise
    features: [
      '1 branch',
      'Up to 150 members',
      'Up to 5 staff accounts',
      'Attendance tracking',
      'Payment recording',
      'CRM & Leads',
      'Dashboard',
      'Notifications',
      'Basic analytics',
    ],
  },

  growth: {
    label: 'Growth',
    price: 1799,
    priceDisplay: '₹1,799',
    billingCycle: 'monthly',
    durationDays: 30,
    maxMembers: 500,
    maxStaff: 15,
    maxBranches: 1,
    razorpayAmountPaise: 179900,  // ₹1,799 in paise
    features: [
      '1 branch',
      'Up to 500 members',
      'Up to 15 staff accounts',
      'Everything in Starter',
      'Advanced analytics',
      'Trainer performance insights',
      'Revenue trend reports',
      'Priority support',
    ],
  },

  enterprise: {
    label: 'Enterprise',
    price: 3999,
    priceDisplay: '₹3,999',
    billingCycle: 'monthly',
    durationDays: 30,
    maxMembers: Infinity,
    maxStaff: Infinity,
    maxBranches: Infinity,
    razorpayAmountPaise: 399900,  // ₹3,999 in paise
    // Enterprise goes via sales contact — handled separately
    features: [
      'Unlimited branches',
      'Unlimited members',
      'Unlimited staff',
      'Everything in Growth',
      'Multi-branch dashboard',
      'Branch comparison reports',
      'White-label structure',
      'Dedicated onboarding',
    ],
  },
};

/**
 * Get full plan config for a given plan name.
 * Falls back to trial limits if plan is unknown.
 */
const getPlanLimits = (planName) => {
  return PLAN_CONFIG[planName] || PLAN_CONFIG.trial;
};

module.exports = { PLAN_CONFIG, getPlanLimits };
