import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UpgradeModal from './UpgradeModal';

/**
 * SubscriptionExpiredModal
 *
 * Non-dismissable overlay shown when gymSubscriptionStatus === 'expired'.
 * Allows navigation only to /subscription and /settings.
 * Blocks all other functionality via the UI overlay.
 */
const SubscriptionExpiredModal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Only show for expired/cancelled subscriptions for gym owners
  if (!user) return null;
  if (user.role === 'superadmin') return null;
  if (
    user.gymSubscriptionStatus !== 'expired' &&
    user.gymSubscriptionStatus !== 'cancelled'
  )
    return null;

  const isPlanTrial = user.gymPlan === 'trial';
  const isExpired = user.gymSubscriptionStatus === 'expired';

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[90] flex items-center justify-center p-4"
        aria-modal="true"
        role="alertdialog"
        aria-label="Subscription expired"
      >
        {/* Dark backdrop */}
        <div className="absolute inset-0 bg-black/85 backdrop-blur-lg" />

        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-[rgba(14,14,18,0.98)] border border-red-500/30 rounded-3xl shadow-[0_0_60px_rgba(239,68,68,0.15)] overflow-hidden"
        >
          {/* Top accent line */}
          <div className="h-1 w-full bg-gradient-to-r from-red-600 via-orange-500 to-red-600" />

          <div className="p-8 text-center">
            {/* Icon */}
            <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-red-400 text-[32px]">
                {isExpired ? 'lock' : 'cancel'}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-xl font-display font-bold text-white mb-2">
              {isPlanTrial
                ? 'Your Free Trial Has Ended'
                : 'Your Subscription Has Expired'}
            </h2>

            {/* Description */}
            <p className="text-text-muted text-sm leading-relaxed mb-2">
              {user.role === 'trainer'
                ? 'Your gym\'s GymOS software subscription has ended. Please contact your gym owner to restore access to the platform.'
                : isPlanTrial
                ? 'Your 7-day GymOS trial has ended. Upgrade to a paid plan to continue managing your gym without interruption.'
                : `Your GymOS ${user.gymPlan} plan has expired. Renew your subscription to restore full access.`}
            </p>

            {user.gymPlanExpiresAt && user.role !== 'trainer' && (
              <p className="text-text-dim text-xs mb-6">
                Expired on{' '}
                <span className="text-red-400">
                  {new Date(user.gymPlanExpiresAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </p>
            )}
            {user.gymTrialEndsAt && isPlanTrial && user.role !== 'trainer' && (
              <p className="text-text-dim text-xs mb-6">
                Trial ended on{' '}
                <span className="text-red-400">
                  {new Date(user.gymTrialEndsAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </p>
            )}

            {/* CTAs */}
            <div className="flex flex-col gap-3">
              {user.role === 'gym_owner' && (
                <>
                  <button
                    id="expired-modal-upgrade-btn"
                    onClick={() => setShowUpgradeModal(true)}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                    Upgrade Plan
                  </button>

                  <div className="flex gap-3">
                    <button
                      id="expired-modal-subscription-btn"
                      onClick={() => navigate('/subscription')}
                      className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-text-secondary text-sm font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                      Billing
                    </button>
                    <button
                      id="expired-modal-settings-btn"
                      onClick={() => navigate('/settings')}
                      className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-text-secondary text-sm font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[16px]">settings</span>
                      Settings
                    </button>
                  </div>
                </>
              )}

              {user.role === 'trainer' && (
                <button
                  onClick={() => {
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                  }}
                  className="w-full py-3.5 rounded-xl bg-white/5 border border-white/10 text-text-secondary text-sm font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2 mt-4"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Log Out
                </button>
              )}

              <a
                href="mailto:gymos@gmail.com"
                className="text-xs text-text-dim hover:text-text-muted transition-colors mt-1"
              >
                Need help? Contact support →
              </a>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </>
  );
};

export default SubscriptionExpiredModal;
