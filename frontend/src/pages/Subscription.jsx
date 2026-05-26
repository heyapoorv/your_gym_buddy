import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import subscriptionService from '../api/subscriptionService';
import UpgradeModal from '../components/UpgradeModal';

const STATUS_CONFIG = {
  trial: {
    label: 'Trial',
    color: 'text-violet-300',
    bg: 'bg-violet-500/10 border-violet-500/30',
    dot: 'bg-violet-400',
    icon: 'science',
  },
  active: {
    label: 'Active',
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    dot: 'bg-emerald-400',
    icon: 'check_circle',
  },
  expired: {
    label: 'Expired',
    color: 'text-red-300',
    bg: 'bg-red-500/10 border-red-500/30',
    dot: 'bg-red-400',
    icon: 'cancel',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-zinc-400',
    bg: 'bg-zinc-500/10 border-zinc-500/30',
    dot: 'bg-zinc-400',
    icon: 'do_not_disturb_on',
  },
};

const PLAN_COLORS = {
  trial: 'from-slate-500 to-zinc-500',
  starter: 'from-emerald-500 to-teal-500',
  growth: 'from-blue-500 to-violet-500',
  enterprise: 'from-amber-500 to-orange-500',
};

/**
 * UsageBar
 * Visual bar showing current usage vs plan limit.
 */
const UsageBar = ({ label, current, limit, color = 'from-violet-500 to-blue-500' }) => {
  const isUnlimited = limit === null || limit === 'Infinity' || limit === Infinity;
  const percentage = isUnlimited ? 0 : Math.min(100, Math.round((current / limit) * 100));
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-text-secondary font-medium">{label}</span>
        <span className={`text-sm font-bold ${isAtLimit ? 'text-red-400' : isNearLimit ? 'text-amber-400' : 'text-text-main'}`}>
          {current}
          {!isUnlimited && <span className="text-text-muted font-normal"> / {limit}</span>}
          {isUnlimited && <span className="text-text-muted font-normal"> / ∞</span>}
        </span>
      </div>
      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
        {isUnlimited ? (
          <div className={`h-full w-full rounded-full bg-gradient-to-r ${color} opacity-40`} />
        ) : (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className={`h-full rounded-full bg-gradient-to-r ${
              isAtLimit ? 'from-red-500 to-red-600' : isNearLimit ? 'from-amber-500 to-orange-500' : color
            }`}
          />
        )}
      </div>
      {isAtLimit && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">warning</span>
          Limit reached — upgrade to add more
        </p>
      )}
    </div>
  );
};

/**
 * Subscription Page
 * Protected route showing plan details, usage stats, history, and upgrade options.
 */
const Subscription = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await subscriptionService.getStatus();
        setData(res.data.data);
      } catch (err) {
        setError('Failed to load subscription details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-text-muted text-sm">Loading subscription...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-red-400">
          <span className="material-symbols-outlined text-5xl mb-2">error</span>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[data?.subscriptionStatus] || STATUS_CONFIG.trial;
  const planColor = PLAN_COLORS[data?.plan] || PLAN_COLORS.trial;

  const expiryDate =
    data?.subscriptionStatus === 'trial'
      ? data?.trialEndsAt
      : data?.planExpiresAt;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-1">Subscription</h1>
        <p className="text-text-muted text-sm">Manage your GymOS plan and view usage details.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Plan Details */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Current Plan Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.03)] overflow-hidden"
          >
            {/* Plan color bar */}
            <div className={`h-1 w-full bg-gradient-to-r ${planColor}`} />
            <div className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-text-muted text-xs uppercase tracking-widest font-semibold mb-2">Current Plan</p>
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className={`text-3xl font-display font-bold bg-gradient-to-r ${planColor} bg-clip-text text-transparent capitalize`}>
                      {data?.planLabel}
                    </h2>
                    {/* Status badge */}
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${statusConfig.bg} ${statusConfig.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Expiry / Days remaining */}
                  {expiryDate && (
                    <p className="text-text-muted text-sm">
                      {data?.subscriptionStatus === 'trial' ? 'Trial ends' : 'Renews on'}{' '}
                      <span className="text-text-main font-semibold">
                        {new Date(expiryDate).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </p>
                  )}
                  {data?.daysRemaining !== null && data?.daysRemaining >= 0 && (
                    <p className={`text-sm font-bold mt-1 ${data.daysRemaining <= 2 ? 'text-red-400' : data.daysRemaining <= 7 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {data.daysRemaining === 0 ? 'Expires today!' : `${data.daysRemaining} day${data.daysRemaining !== 1 ? 's' : ''} remaining`}
                    </p>
                  )}
                </div>

                {/* Upgrade button */}
                {data?.subscriptionStatus !== 'cancelled' && data?.plan !== 'enterprise' && (
                  <button
                    id="subscription-upgrade-btn"
                    onClick={() => setShowUpgradeModal(true)}
                    className={`px-5 py-2.5 rounded-xl bg-gradient-to-r ${planColor} text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg flex items-center gap-2`}
                  >
                    <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                    {data?.subscriptionStatus === 'trial' ? 'Upgrade Plan' : 'Change Plan'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Usage Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-6"
          >
            <h3 className="text-base font-display font-bold text-white mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary">monitoring</span>
              Usage
            </h3>
            <div className="flex flex-col gap-5">
              <UsageBar
                label="Members"
                current={data?.usage?.members?.current ?? 0}
                limit={data?.usage?.members?.limit}
                color="from-blue-500 to-violet-500"
              />
              <UsageBar
                label="Staff Accounts"
                current={data?.usage?.staff?.current ?? 0}
                limit={data?.usage?.staff?.limit}
                color="from-emerald-500 to-teal-500"
              />
              <UsageBar
                label="Branches"
                current={data?.usage?.branches?.current ?? 1}
                limit={data?.usage?.branches?.limit}
                color="from-amber-500 to-orange-500"
              />
            </div>
          </motion.div>

          {/* History Timeline */}
          {data?.history && data.history.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-6"
            >
              <h3 className="text-base font-display font-bold text-white mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">history</span>
                Subscription History
              </h3>
              <div className="relative">
                <div className="absolute left-[19px] top-0 bottom-0 w-px bg-white/10" />
                <div className="flex flex-col gap-4">
                  {[...data.history].reverse().map((entry, i) => {
                    const eConfig = STATUS_CONFIG[entry.status] || STATUS_CONFIG.trial;
                    return (
                      <div key={i} className="flex gap-4 items-start pl-1">
                        <div className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 ${eConfig.bg}`}>
                          <span className={`material-symbols-outlined text-[16px] ${eConfig.color}`}>
                            {eConfig.icon}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-0.5">
                            <span className="text-sm font-bold text-text-main capitalize">{entry.plan} Plan</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${eConfig.bg} ${eConfig.color}`}>
                              {eConfig.label}
                            </span>
                          </div>
                          <p className="text-xs text-text-muted">{entry.note}</p>
                          <p className="text-xs text-text-dim mt-0.5">
                            {new Date(entry.startedAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                            {entry.endedAt && (
                              <> → {new Date(entry.endedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Column — Plan Summary + Quick Plans */}
        <div className="flex flex-col gap-6">
          {/* Plan limits summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-6"
          >
            <h3 className="text-sm font-display font-bold text-white mb-4">Plan Limits</h3>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Members', value: data?.usage?.members?.limit === Infinity || data?.usage?.members?.limit > 999 ? 'Unlimited' : data?.usage?.members?.limit, icon: 'group' },
                { label: 'Staff', value: data?.usage?.staff?.limit === Infinity || data?.usage?.staff?.limit > 99 ? 'Unlimited' : data?.usage?.staff?.limit, icon: 'badge' },
                { label: 'Branches', value: data?.usage?.branches?.limit === Infinity || data?.usage?.branches?.limit > 10 ? 'Unlimited' : data?.usage?.branches?.limit, icon: 'store' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <span className="material-symbols-outlined text-[16px] text-text-muted">{item.icon}</span>
                    {item.label}
                  </div>
                  <span className="text-sm font-bold text-text-main">{item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Need help card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-6"
          >
            <h3 className="text-sm font-display font-bold text-white mb-2">Need Help?</h3>
            <p className="text-text-muted text-xs mb-4 leading-relaxed">
              Questions about billing, plan limits, or custom requirements? Our team is here.
            </p>
            <a
              href="mailto:gymos@gmail.com"
              className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors font-medium"
            >
              <span className="material-symbols-outlined text-[16px]">mail</span>
              Contact Support
            </a>
          </motion.div>
        </div>
      </div>

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  );
};

export default Subscription;
