import client from './client';

/**
 * Subscription Service — GymOS SaaS
 *
 * Two-step Razorpay payment flow:
 *   1. createOrder(plan)        → backend creates Razorpay order, returns orderId
 *   2. verifyPayment(payload)   → backend verifies HMAC, activates plan
 *
 * Helper: loadRazorpayScript()  → injects Razorpay checkout.js into DOM
 */
const subscriptionService = {
  /**
   * Get current subscription status, usage stats, plan history,
   * and the Razorpay key ID needed for checkout.
   */
  getStatus: () => client.get('/subscription'),

  /**
   * Step 1 — Create a Razorpay order for the given plan.
   * Returns { orderId, amount, currency, razorpayKeyId, gymName, ... }
   * @param {string} plan - 'starter' | 'growth' | 'enterprise'
   */
  createOrder: (plan) => client.post('/subscription/create-order', { plan }),

  /**
   * Step 2 — Send Razorpay payment response to backend for HMAC verification.
   * Plan is only activated if signature verification passes.
   * @param {{ razorpay_order_id, razorpay_payment_id, razorpay_signature, plan }} payload
   */
  verifyPayment: (payload) => client.post('/subscription/verify-payment', payload),

  /**
   * Dynamically load the Razorpay checkout.js script.
   * Safe to call multiple times — resolves immediately if already loaded.
   * @returns {Promise<boolean>}
   */
  loadRazorpayScript: () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  },
};

export default subscriptionService;
