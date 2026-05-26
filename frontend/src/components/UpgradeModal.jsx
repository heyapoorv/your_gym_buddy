import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import subscriptionService from '../api/subscriptionService';

const PLANS = [
  {
    id: 'starter',
    label: 'Starter',
    price: 699,
    priceDisplay: '₹699',
    color: 'from-emerald-500 to-teal-500',
    borderColor: 'border-emerald-500/30',
    glowColor: 'shadow-[0_0_40px_rgba(16,185,129,0.15)]',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    features: [
      { label: 'Up to 150 members', icon: 'group' },
      { label: 'Up to 5 staff accounts', icon: 'badge' },
      { label: '1 branch', icon: 'store' },
      { label: 'Attendance & Payments', icon: 'how_to_reg' },
      { label: 'CRM & Leads', icon: 'diversity_3' },
      { label: 'Basic analytics', icon: 'bar_chart' },
    ],
  },
  {
    id: 'growth',
    label: 'Growth',
    price: 1799,
    priceDisplay: '₹1,799',
    color: 'from-blue-500 to-violet-500',
    borderColor: 'border-violet-500/40',
    glowColor: 'shadow-[0_0_40px_rgba(139,92,246,0.2)]',
    badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    popular: true,
    features: [
      { label: 'Up to 500 members', icon: 'group' },
      { label: 'Up to 15 staff accounts', icon: 'badge' },
      { label: '1 branch', icon: 'store' },
      { label: 'Everything in Starter', icon: 'check_circle' },
      { label: 'Advanced analytics', icon: 'insights' },
      { label: 'Trainer insights', icon: 'sports' },
      { label: 'Revenue reports', icon: 'trending_up' },
      { label: 'Priority support', icon: 'support_agent' },
    ],
  },
  {
    id: 'enterprise',
    label: 'Enterprise',
    price: 3999,
    priceDisplay: '₹3,999',
    color: 'from-amber-500 to-orange-500',
    borderColor: 'border-amber-500/30',
    glowColor: 'shadow-[0_0_40px_rgba(245,158,11,0.15)]',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    features: [
      { label: 'Unlimited members', icon: 'all_inclusive' },
      { label: 'Unlimited staff', icon: 'badge' },
      { label: 'Unlimited branches', icon: 'store' },
      { label: 'Everything in Growth', icon: 'check_circle' },
      { label: 'Multi-branch dashboard', icon: 'dashboard' },
      { label: 'White-label structure', icon: 'branding_watermark' },
      { label: 'Dedicated onboarding', icon: 'school' },
    ],
  },
];

// Payment step states
const STEP = {
  SELECT: 'select',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  ERROR: 'error',
};

/**
 * UpgradeModal
 *
 * Full Razorpay payment flow:
 * 1. User clicks "Upgrade to <Plan>"
 * 2. We call /api/subscription/create-order → get Razorpay order_id
 * 3. Open Razorpay Checkout widget
 * 4. On success → call /api/subscription/verify-payment (HMAC verified server-side)
 * 5. Only after verification does the plan activate
 * 6. Refresh user subscription state via AuthContext
 */
const UpgradeModal = ({ isOpen, onClose }) => {
  const { user, refreshSubscription } = useAuth();
  const [step, setStep] = useState(STEP.SELECT);
  const [processingPlanId, setProcessingPlanId] = useState(null);
  const [successPlan, setSuccessPlan] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const resetState = () => {
    setStep(STEP.SELECT);
    setProcessingPlanId(null);
    setSuccessPlan(null);
    setErrorMsg(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleUpgrade = async (plan) => {
    // Enterprise → contact sales
    if (plan.id === 'enterprise') {
      window.open('mailto:sales@gymos.app?subject=Enterprise Plan Inquiry', '_blank');
      return;
    }

    setStep(STEP.PROCESSING);
    setProcessingPlanId(plan.id);
    setErrorMsg(null);

    try {
      // ── Step 1: Load Razorpay script ────────────────────────────────
      const scriptLoaded = await subscriptionService.loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay payment gateway. Check your internet connection.');
      }

      // ── Step 2: Create order on backend ─────────────────────────────
      const orderRes = await subscriptionService.createOrder(plan.id);
      const orderData = orderRes.data.data;

      // ── Step 3: Open Razorpay Checkout ──────────────────────────────
      await new Promise((resolve, reject) => {
        const options = {
          key: orderData.razorpayKeyId,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'GymOS',
          description: `${plan.label} Plan — Monthly Subscription`,
          order_id: orderData.orderId,
          image: 'https://gymos.app/logo.png',
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
          },
          notes: {
            plan: plan.id,
            gymName: orderData.gymName || '',
          },
          theme: {
            color: '#7C3AED',
            backdrop_color: 'rgba(0,0,0,0.8)',
          },
          modal: {
            // Handle user pressing the close/back button in Razorpay
            ondismiss: () => {
              reject(new Error('DISMISSED'));
            },
          },
          // ── Step 4: Verify payment on server ────────────────────────
          handler: async (response) => {
            try {
              await subscriptionService.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan: plan.id,
              });
              resolve();
            } catch (verifyError) {
              reject(verifyError);
            }
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (response) => {
          reject(new Error(response.error?.description || 'Payment failed.'));
        });
        rzp.open();
      });

      // ── Step 5: Refresh subscription state ──────────────────────────
      await refreshSubscription();
      setSuccessPlan(plan);
      setStep(STEP.SUCCESS);

      // Auto-close after 2.5 seconds
      setTimeout(() => {
        handleClose();
      }, 2500);

    } catch (err) {
      if (err.message === 'DISMISSED') {
        // User cancelled — go back to plan selection silently
        setStep(STEP.SELECT);
        setProcessingPlanId(null);
        return;
      }

      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Payment failed. Please try again.';

      setErrorMsg(msg);
      setStep(STEP.ERROR);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && step === STEP.SELECT) handleClose();
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative w-full max-w-5xl bg-[rgba(12,12,16,0.97)] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Top gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-blue-500 to-emerald-500" />

            {/* ── SUCCESS STATE ────────────────────────────────────────── */}
            {step === STEP.SUCCESS && successPlan && (
              <div className="p-12 flex flex-col items-center text-center gap-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${successPlan.color} flex items-center justify-center shadow-2xl`}
                >
                  <span className="material-symbols-outlined text-white text-[40px]">check_circle</span>
                </motion.div>
                <h2 className="text-2xl font-display font-bold text-white">
                  Welcome to {successPlan.label}! 🎉
                </h2>
                <p className="text-text-muted text-sm max-w-sm">
                  Your payment was verified and your plan has been activated. All limits and features are now live.
                </p>
                <div className={`text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300`}>
                  Plan activated successfully
                </div>
              </div>
            )}

            {/* ── ERROR STATE ──────────────────────────────────────────── */}
            {step === STEP.ERROR && (
              <div className="p-12 flex flex-col items-center text-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-red-400 text-[40px]">error</span>
                </div>
                <h2 className="text-xl font-display font-bold text-white">Payment Failed</h2>
                <p className="text-red-300 text-sm max-w-sm">{errorMsg}</p>
                <p className="text-text-dim text-xs">Your account has not been charged. No plan changes were made.</p>
                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => { setStep(STEP.SELECT); setErrorMsg(null); }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-bold text-sm hover:opacity-90 transition-all"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={handleClose}
                    className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-text-secondary text-sm hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* ── PROCESSING STATE ─────────────────────────────────────── */}
            {step === STEP.PROCESSING && (
              <div className="p-12 flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
                <h2 className="text-xl font-display font-bold text-white">Opening Payment Gateway…</h2>
                <p className="text-text-muted text-sm">Connecting to Razorpay. Do not close this window.</p>
              </div>
            )}

            {/* ── SELECT PLAN STATE ────────────────────────────────────── */}
            {step === STEP.SELECT && (
              <>
                {/* Header */}
                <div className="relative px-8 pt-8 pb-6 border-b border-white/10">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-violet-400 text-[22px]">rocket_launch</span>
                        <span className="text-xs font-bold uppercase tracking-widest text-violet-400">Upgrade GymOS</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">
                        Choose Your Plan
                      </h2>
                      <p className="text-text-muted text-sm mt-1">
                        Currently on{' '}
                        <span className="text-violet-300 font-semibold capitalize">{user?.gymPlan || 'Trial'}</span>
                        {' '}· Payment is processed securely via Razorpay.
                      </p>
                    </div>
                    <button
                      onClick={handleClose}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                      aria-label="Close upgrade modal"
                    >
                      <span className="material-symbols-outlined text-text-muted text-[20px]">close</span>
                    </button>
                  </div>
                </div>

                {/* Plans Grid */}
                <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-3 gap-5 overflow-y-auto max-h-[65vh] custom-scrollbar">
                  {PLANS.map((plan) => {
                    const isCurrentPlan = user?.gymPlan === plan.id;
                    return (
                      <motion.div
                        key={plan.id}
                        whileHover={{ y: -4, scale: 1.01 }}
                        className={`relative rounded-2xl border bg-[rgba(255,255,255,0.03)] p-6 flex flex-col gap-4 transition-all duration-300 ${plan.borderColor} ${plan.glowColor} ${
                          plan.popular ? 'ring-1 ring-violet-500/40' : ''
                        }`}
                      >
                        {plan.popular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-violet-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full whitespace-nowrap">
                            Most Popular
                          </div>
                        )}

                        {/* Plan Header */}
                        <div>
                          <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border mb-3 ${plan.badgeColor}`}>
                            <span className="material-symbols-outlined text-[14px]">workspace_premium</span>
                            {plan.label}
                          </div>
                          <div className="flex items-end gap-1">
                            <span className="text-3xl font-display font-bold text-white">{plan.priceDisplay}</span>
                            <span className="text-text-muted text-sm mb-1">/mo</span>
                          </div>
                        </div>

                        {/* Features */}
                        <ul className="flex flex-col gap-2 flex-1">
                          {plan.features.map((feature) => (
                            <li key={feature.label} className="flex items-center gap-2.5 text-sm text-text-secondary">
                              <span className={`material-symbols-outlined text-[16px] bg-gradient-to-br ${plan.color} bg-clip-text text-transparent`}>
                                {feature.icon}
                              </span>
                              {feature.label}
                            </li>
                          ))}
                        </ul>

                        {/* Limits pill */}
                        <div className="flex flex-wrap gap-1.5 text-[10px]">
                          {plan.id !== 'enterprise' ? (
                            <>
                              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-text-muted">
                                {plan.id === 'starter' ? '150' : '500'} members
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-text-muted">
                                {plan.id === 'starter' ? '5' : '15'} staff
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-text-muted">1 branch</span>
                            </>
                          ) : (
                            <>
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300">∞ members</span>
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300">∞ staff</span>
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300">∞ branches</span>
                            </>
                          )}
                        </div>

                        {/* CTA */}
                        <button
                          id={`upgrade-to-${plan.id}-btn`}
                          onClick={() => handleUpgrade(plan)}
                          disabled={isCurrentPlan}
                          className={`mt-1 w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                            isCurrentPlan
                              ? 'bg-white/5 text-text-muted border border-white/10 cursor-default'
                              : `bg-gradient-to-r ${plan.color} text-white hover:opacity-90 active:scale-[0.98] shadow-lg`
                          } disabled:opacity-60`}
                        >
                          {isCurrentPlan ? (
                            <>
                              <span className="material-symbols-outlined text-[16px]">check_circle</span>
                              Current Plan
                            </>
                          ) : plan.id === 'enterprise' ? (
                            <>
                              <span className="material-symbols-outlined text-[16px]">mail</span>
                              Contact Sales
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-[16px]">payments</span>
                              Pay {plan.priceDisplay} · Upgrade
                            </>
                          )}
                        </button>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="px-8 py-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 bg-white/[0.02]">
                  <div className="flex items-center gap-4">
                    <p className="text-xs text-text-dim flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-text-muted">lock</span>
                      Payments via Razorpay — 256-bit SSL encrypted
                    </p>
                    <p className="text-xs text-text-dim flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-text-muted">verified_user</span>
                      Plan activates only after payment verified
                    </p>
                  </div>
                  <p className="text-xs text-text-dim">
                    Need help?{' '}
                    <a href="mailto:gymos@gmail.com" className="text-violet-400 hover:underline">
                      Contact support
                    </a>
                  </p>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UpgradeModal;
