import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

/**
 * LimitReachedNotifier
 *
 * Listens for the `gymos:limit_reached` custom DOM event dispatched by
 * client.js when the backend returns HTTP 403 with code LIMIT_REACHED.
 *
 * Shows a non-blocking toast banner with the plan restriction details
 * and a direct link to the Subscription page to upgrade.
 *
 * Mount this once in AppLayout.jsx (inside <Router>).
 */
const LimitReachedNotifier = () => {
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);

  const handleLimitReached = useCallback((e) => {
    setToast({
      resource: e.detail?.resource || 'resource',
      current: e.detail?.current,
      limit: e.detail?.limit,
      message: e.detail?.message || 'Plan limit reached. Upgrade to continue.',
      id: Date.now(),
    });
  }, []);

  useEffect(() => {
    window.addEventListener('gymos:limit_reached', handleLimitReached);
    return () => window.removeEventListener('gymos:limit_reached', handleLimitReached);
  }, [handleLimitReached]);

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast?.id]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] w-[95vw] max-w-md"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-start gap-4 bg-[rgba(14,14,20,0.97)] border border-amber-500/40 rounded-2xl p-4 shadow-[0_8px_40px_rgba(245,158,11,0.2)] backdrop-blur-xl">
            {/* Icon */}
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-amber-400 text-[20px]">workspace_premium</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-tight mb-1 capitalize">
                {toast.resource} Limit Reached
              </p>
              <p className="text-xs text-text-muted leading-relaxed">{toast.message}</p>

              {/* Upgrade CTA */}
              <button
                onClick={() => {
                  setToast(null);
                  navigate('/subscription');
                }}
                className="mt-2.5 text-xs font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">rocket_launch</span>
                Upgrade Plan →
              </button>
            </div>

            {/* Dismiss */}
            <button
              onClick={() => setToast(null)}
              className="text-white/30 hover:text-white/60 transition-colors p-1 rounded-lg hover:bg-white/5 shrink-0"
              aria-label="Dismiss"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>

          {/* Auto-dismiss progress bar */}
          <motion.div
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: 6, ease: 'linear' }}
            className="h-0.5 bg-amber-500/50 rounded-full mt-1.5 origin-left"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LimitReachedNotifier;
