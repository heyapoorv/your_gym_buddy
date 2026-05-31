import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

/**
 * Merges user + gym data from the API response into a single
 * flat session object that all components can read from.
 */
const buildSessionUser = (user, gym = null) => ({
  ...user,
  gymName: user.gymName || gym?.name || null,
  // ─── SaaS Subscription Fields ──────────────────────────────────
  gymPlan: user.gymPlan || gym?.plan || null,
  gymSubscriptionStatus: user.gymSubscriptionStatus || gym?.subscriptionStatus || null,
  gymOnboardingComplete: user.gymOnboardingComplete || gym?.onboardingComplete || false,
  gymTrialEndsAt: user.gymTrialEndsAt || gym?.trialEndsAt || null,
  gymPlanStartsAt: user.gymPlanStartsAt || gym?.planStartsAt || null,
  gymPlanExpiresAt: user.gymPlanExpiresAt || gym?.planExpiresAt || null,
  gymMaxMembers: user.gymMaxMembers ?? gym?.maxMembers ?? null,
  gymMaxStaff: user.gymMaxStaff ?? gym?.maxStaff ?? null,
  gymMaxBranches: user.gymMaxBranches ?? gym?.maxBranches ?? null,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: verify stored token is still valid against the backend
  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/api/auth/profile');
        if (data.success) {
          const sessionUser = buildSessionUser(data.data.user, data.data.gym);
          setUser(sessionUser);
        } else {
          clearSession();
        }
      } catch {
        // Token is invalid or expired — clear everything
        clearSession();
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  const clearSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('gymos_user');
    setUser(null);
  };

  const persistSession = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('gymos_user', JSON.stringify(userData));
    setUser(userData);
  };

  /**
   * Login the user.
   * On success: stores JWT + user object, returns { success: true }.
   * On failure: returns { success: false, message }.
   */
  const login = async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    const sessionUser = buildSessionUser(data.data.user);
    persistSession(sessionUser, data.data.token);
    return { success: true };
  };

  /**
   * Register a new gym owner.
   * Creates the user and their gym in one call, bootstraps trial.
   */
  const signup = async (userData) => {
    const { data } = await api.post('/api/auth/signup', userData);
    const sessionUser = buildSessionUser(data.data.user);
    persistSession(sessionUser, data.data.token);
    return { success: true };
  };

  const loginAsDemo = async () => {
    const { data } = await api.post('/api/auth/demo');
    const sessionUser = buildSessionUser(data.data.user);
    persistSession(sessionUser, data.data.token);
    return { success: true };
  };

  const completeOnboarding = async () => {
    try {
      await api.put('/api/auth/onboarding');
      // Update local state instead of doing full refresh
      const updatedUser = { ...user, gymOnboardingComplete: true };
      persistSession(updatedUser, localStorage.getItem('token'));
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  };

  /**
   * Refresh subscription fields in the session user context.
   * Call this after a successful plan upgrade so UI updates instantly.
   */
  const refreshSubscription = useCallback(async () => {
    try {
      const { data } = await api.get('/api/auth/profile');
      if (data.success) {
        const sessionUser = buildSessionUser(data.data.user, data.data.gym);
        localStorage.setItem('gymos_user', JSON.stringify(sessionUser));
        setUser(sessionUser);
      }
    } catch {
      // Silently ignore — session refresh failing shouldn't break UX
    }
  }, []);

  const logout = () => {
    clearSession();
    window.location.href = '/login';
  };

  // ─── Computed Subscription Helpers ─────────────────────────────────────────
  const isSubscriptionActive =
    user?.gymSubscriptionStatus === 'trial' || user?.gymSubscriptionStatus === 'active';

  const daysRemaining = (() => {
    if (!user) return null;
    const { gymSubscriptionStatus, gymTrialEndsAt, gymPlanExpiresAt } = user;
    let expiryDate = null;
    if (gymSubscriptionStatus === 'trial' && gymTrialEndsAt) expiryDate = new Date(gymTrialEndsAt);
    else if (gymSubscriptionStatus === 'active' && gymPlanExpiresAt) expiryDate = new Date(gymPlanExpiresAt);
    if (!expiryDate) return null;
    const diff = expiryDate - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        loginAsDemo,
        completeOnboarding,
        logout,
        loading,
        refreshSubscription,
        isSubscriptionActive,
        daysRemaining,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

