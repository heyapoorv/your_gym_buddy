import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import UpgradeModal from './UpgradeModal';

/**
 * TrialBanner
 *
 * Sticky banner shown below Navbar for trial-plan users.
 * Shows urgency countdown with pulsing dot.
 * Orange → Red as days drop below threshold.
 * Hidden for superadmin, non-trial plans, and expired subscriptions.
 */
const TrialBanner = () => {
  const { user, daysRemaining } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (!user) return null;
  if (user.role === 'superadmin') return null;
  if (user.role === 'trainer') return null;
  if (user.gymSubscriptionStatus !== 'trial') return null;
  if (isDismissed) return null;

  const isUrgent = daysRemaining !== null && daysRemaining <= 2;
  const isWarning = daysRemaining !== null && daysRemaining <= 5;

  const bannerColor = isUrgent
    ? 'from-red-900/60 to-red-800/40 border-red-500/40'
    : isWarning
    ? 'from-orange-900/60 to-amber-800/40 border-amber-500/40'
    : 'from-indigo-900/50 to-violet-900/40 border-indigo-500/30';

  const dotColor = isUrgent
    ? 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]'
    : isWarning
    ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
    : 'bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]';

  const textColor = isUrgent ? 'text-red-200' : isWarning ? 'text-amber-100' : 'text-indigo-100';
  const highlightColor = isUrgent ? 'text-red-300 font-bold' : isWarning ? 'text-amber-300 font-bold' : 'text-violet-300 font-bold';

  const daysLabel =
    daysRemaining === null
      ? ''
      : daysRemaining === 0
      ? 'Expires today!'
      : daysRemaining === 1
      ? '1 day remaining'
      : `${daysRemaining} days remaining`;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className={`w-full bg-gradient-to-r ${bannerColor} border-b backdrop-blur-sm px-4 py-2.5 flex items-center justify-between gap-4 z-20`}
          role="banner"
          aria-label="Trial subscription status"
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Pulsing dot */}
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`}
              />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${dotColor}`} />
            </span>

            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className={`text-xs font-bold uppercase tracking-widest ${textColor} opacity-70`}>
                Free Trial
              </span>
              <span className="text-white/30 text-xs">·</span>
              <span className={`text-sm ${textColor}`}>
                <span className={highlightColor}>{daysLabel}</span>
                {daysRemaining !== null && daysRemaining > 0 && (
                  <span className="hidden sm:inline opacity-80">
                    {' '}— Upgrade to keep your gym running without interruption.
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="trial-banner-upgrade-btn"
              onClick={() => setShowUpgradeModal(true)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all duration-200 ${
                isUrgent
                  ? 'bg-red-500/20 border-red-400/50 text-red-200 hover:bg-red-500/30'
                  : isWarning
                  ? 'bg-amber-500/20 border-amber-400/50 text-amber-200 hover:bg-amber-500/30'
                  : 'bg-violet-500/20 border-violet-400/50 text-violet-200 hover:bg-violet-500/30'
              }`}
            >
              Upgrade Now
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="text-white/30 hover:text-white/60 transition-colors p-1 rounded"
              aria-label="Dismiss trial banner"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </>
  );
};

export default TrialBanner;
