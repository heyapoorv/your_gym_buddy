const mongoose = require('mongoose');

/**
 * Gym Model
 *
 * Represents a gym business subscribed to GymOS.
 * Each Gym is a tenant — all members, trainers, and payments
 * belong to a specific gym via a `gymId` foreign key.
 *
 * SaaS Subscription Fields:
 *  - plan: current GymOS subscription tier
 *  - subscriptionStatus: lifecycle state of the subscription
 *  - trialEndsAt: expiry of the free trial period
 *  - planStartsAt / planExpiresAt: active paid plan window
 *  - maxMembers / maxStaff / maxBranches: enforced resource limits
 *  - subscriptionHistory: append-only audit log
 */
const subscriptionHistorySchema = new mongoose.Schema(
  {
    plan: { type: String, enum: ['trial', 'starter', 'growth', 'enterprise'] },
    status: { type: String, enum: ['trial', 'active', 'expired', 'cancelled'] },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date, default: null },
    note: { type: String, default: '' },
  },
  { _id: false }
);

const gymSchema = new mongoose.Schema(
  {
    // ─── Identity ─────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, 'Gym name is required'],
      trim: true,
      maxlength: [100, 'Gym name cannot exceed 100 characters'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Gym must have an owner'],
    },
    address: {
      street: { type: String, trim: true },
      city:   { type: String, trim: true },
      state:  { type: String, trim: true },
      pincode:{ type: String, trim: true },
    },
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    logo:  { type: String, default: null },
    isActive: { type: Boolean, default: true },
    onboardingComplete: { type: Boolean, default: false },

    // ─── SaaS Subscription ────────────────────────────────────────
    plan: {
      type: String,
      enum: ['trial', 'starter', 'growth', 'enterprise'],
      default: 'trial',
    },
    subscriptionStatus: {
      type: String,
      enum: ['trial', 'active', 'expired', 'cancelled'],
      default: 'trial',
    },
    trialEndsAt: {
      type: Date,
      default: null,
    },
    planStartsAt: {
      type: Date,
      default: null,
    },
    planExpiresAt: {
      type: Date,
      default: null,
    },

    // ─── Resource Limits (enforced by subscriptionMiddleware) ─────
    maxMembers:  { type: Number, default: 50 },
    maxStaff:    { type: Number, default: 3 },
    maxBranches: { type: Number, default: 1 },

    // ─── Audit Log ────────────────────────────────────────────────
    subscriptionHistory: {
      type: [subscriptionHistorySchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Gym', gymSchema);

