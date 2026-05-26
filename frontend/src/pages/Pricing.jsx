import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import UpgradeModal from '../components/UpgradeModal';

const PLANS = [
  {
    id: 'trial',
    label: 'Trial',
    price: 0,
    priceLabel: 'Free',
    color: 'from-slate-500 to-zinc-500',
    borderColor: 'border-white/10',
    badgeColor: 'bg-white/5 text-text-muted border-white/10',
    features: [
      'Full platform access',
      'Up to 50 members',
      'Up to 3 staff users',
      '7-day duration',
      'No credit card required',
    ],
    cta: 'Current for new signups',
    ctaDisabled: true,
  },
  {
    id: 'starter',
    label: 'Starter',
    price: 699,
    priceLabel: '₹699',
    color: 'from-emerald-500 to-teal-500',
    borderColor: 'border-emerald-500/20',
    glowColor: 'hover:shadow-[0_0_40px_rgba(16,185,129,0.1)]',
    badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    features: [
      'Up to 150 members',
      'Up to 5 staff accounts',
      '1 branch',
      'Attendance & Payments',
      'CRM & Leads',
      'Basic analytics',
    ],
    cta: 'Get Starter',
  },
  {
    id: 'growth',
    label: 'Growth',
    price: 1799,
    priceLabel: '₹1,799',
    color: 'from-blue-500 to-violet-500',
    borderColor: 'border-violet-500/30',
    glowColor: 'hover:shadow-[0_0_50px_rgba(139,92,246,0.15)]',
    badgeColor: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
    popular: true,
    features: [
      'Up to 500 members',
      'Up to 15 staff accounts',
      '1 branch',
      'Everything in Starter',
      'Advanced analytics',
      'Trainer performance insights',
      'Revenue trend reports',
      'Priority support',
    ],
    cta: 'Get Growth',
  },
  {
    id: 'enterprise',
    label: 'Enterprise',
    price: 4999,
    priceLabel: '₹4,999',
    color: 'from-amber-500 to-orange-500',
    borderColor: 'border-amber-500/20',
    glowColor: 'hover:shadow-[0_0_40px_rgba(245,158,11,0.1)]',
    badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    features: [
      'Unlimited members',
      'Unlimited staff',
      'Unlimited branches',
      'Everything in Growth',
      'Multi-branch dashboard',
      'White-label structure',
      'Dedicated onboarding',
    ],
    cta: 'Contact Sales',
    ctaEnterprise: true,
  },
];

const FEATURE_COMPARISON = [
  { feature: 'Members', trial: '50', starter: '150', growth: '500', enterprise: 'Unlimited' },
  { feature: 'Staff Accounts', trial: '3', starter: '5', growth: '15', enterprise: 'Unlimited' },
  { feature: 'Branches', trial: '1', starter: '1', growth: '1', enterprise: 'Unlimited' },
  { feature: 'Attendance Tracking', trial: '✓', starter: '✓', growth: '✓', enterprise: '✓' },
  { feature: 'Payment Recording', trial: '✓', starter: '✓', growth: '✓', enterprise: '✓' },
  { feature: 'CRM & Leads', trial: '✓', starter: '✓', growth: '✓', enterprise: '✓' },
  { feature: 'Basic Analytics', trial: '✓', starter: '✓', growth: '✓', enterprise: '✓' },
  { feature: 'Advanced Analytics', trial: '—', starter: '—', growth: '✓', enterprise: '✓' },
  { feature: 'Trainer Insights', trial: '—', starter: '—', growth: '✓', enterprise: '✓' },
  { feature: 'Revenue Reports', trial: '—', starter: '—', growth: '✓', enterprise: '✓' },
  { feature: 'Multi-branch Dashboard', trial: '—', starter: '—', growth: '—', enterprise: '✓' },
  { feature: 'White-label', trial: '—', starter: '—', growth: '—', enterprise: '✓' },
  { feature: 'Priority Support', trial: '—', starter: '—', growth: '✓', enterprise: '✓' },
  { feature: 'Dedicated Onboarding', trial: '—', starter: '—', growth: '—', enterprise: '✓' },
];

const PlanCard = ({ plan, onSelect }) => (
  <motion.div
    whileHover={{ y: -6 }}
    transition={{ duration: 0.2 }}
    className={`relative rounded-2xl border bg-[rgba(255,255,255,0.02)] p-6 flex flex-col gap-5 transition-all duration-300 ${plan.borderColor} ${plan.glowColor || ''} ${
      plan.popular ? 'ring-1 ring-violet-500/40' : ''
    }`}
  >
    {plan.popular && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-violet-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full whitespace-nowrap">
        Most Popular
      </div>
    )}

    <div>
      <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg border mb-4 ${plan.badgeColor}`}>
        {plan.label}
      </span>
      <div className="flex items-end gap-1 mb-1">
        <span className="text-4xl font-display font-bold text-white">{plan.priceLabel}</span>
        {plan.price > 0 && <span className="text-text-muted text-sm mb-1.5">/month</span>}
      </div>
      {plan.price === 0 && (
        <p className="text-text-dim text-xs">7-day free trial — no card required</p>
      )}
    </div>

    <ul className="flex flex-col gap-2.5 flex-1">
      {plan.features.map((f) => (
        <li key={f} className="flex items-center gap-2.5 text-sm text-text-secondary">
          <span className={`material-symbols-outlined text-[16px] bg-gradient-to-br ${plan.color} bg-clip-text text-transparent`}>
            check_circle
          </span>
          {f}
        </li>
      ))}
    </ul>

    <button
      id={`pricing-${plan.id}-btn`}
      disabled={plan.ctaDisabled}
      onClick={() => {
        if (plan.ctaDisabled) return;
        if (plan.ctaEnterprise) {
          window.open('mailto:sales@gymos.app?subject=Enterprise Plan Inquiry', '_blank');
          return;
        }
        onSelect(plan.id);
      }}
      className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
        plan.ctaDisabled
          ? 'bg-white/5 text-text-muted border border-white/10 cursor-default'
          : `bg-gradient-to-r ${plan.color} text-white hover:opacity-90 active:scale-[0.98] shadow-lg`
      }`}
    >
      {plan.cta}
    </button>
  </motion.div>
);

/**
 * Pricing Page
 * Public-accessible pricing overview with plan cards and feature comparison table.
 */
const Pricing = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [preSelectedPlan, setPreSelectedPlan] = useState(null);

  const handlePlanSelect = (planId) => {
    setPreSelectedPlan(planId);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-blue-900/10 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-600/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
              <span className="material-symbols-outlined text-[14px]">workspace_premium</span>
              Simple, Transparent Pricing
            </div>
            <h1 className="text-4xl sm:text-5xl font-display font-extrabold text-white mb-4 leading-tight">
              Plans for Every Gym,<br />
              <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                No Hidden Fees
              </span>
            </h1>
            <p className="text-text-muted text-lg max-w-2xl mx-auto">
              Start free. Upgrade as you grow. GymOS scales with your business — from your first member to a multi-branch empire.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="max-w-6xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <PlanCard plan={plan} onSelect={handlePlanSelect} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-display font-bold text-white">Full Feature Comparison</h2>
          <p className="text-text-muted text-sm mt-1">See exactly what's included in each plan.</p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-6 py-4 text-text-muted font-semibold w-[30%]">Feature</th>
                {['Trial', 'Starter', 'Growth', 'Enterprise'].map((h) => (
                  <th key={h} className="px-4 py-4 text-center text-white font-bold font-display text-sm">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURE_COMPARISON.map((row, i) => (
                <tr
                  key={row.feature}
                  className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] ${
                    i % 2 === 0 ? '' : 'bg-white/[0.01]'
                  }`}
                >
                  <td className="px-6 py-3.5 text-text-secondary font-medium">{row.feature}</td>
                  {[row.trial, row.starter, row.growth, row.enterprise].map((val, j) => (
                    <td key={j} className="px-4 py-3.5 text-center">
                      <span
                        className={
                          val === '✓'
                            ? 'text-emerald-400 font-bold'
                            : val === '—'
                            ? 'text-white/20'
                            : 'text-text-secondary font-medium'
                        }
                      >
                        {val}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Back button */}
      <div className="fixed bottom-6 left-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[rgba(18,18,20,0.9)] border border-white/10 rounded-xl text-sm text-text-muted hover:text-text-main hover:border-white/20 transition-all backdrop-blur-sm"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back
        </button>
      </div>

      <UpgradeModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
};

export default Pricing;
