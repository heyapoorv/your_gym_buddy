const mongoose = require('mongoose');

/**
 * MembershipPlan Model
 *
 * Defines the subscription tiers offered by a gym.
 * Each plan belongs to a specific gym (multi-tenant).
 * Members are linked to a plan, and payments reference plans.
 */
const membershipPlanSchema = new mongoose.Schema(
  {
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      required: [true, 'Plan must belong to a gym'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
      maxlength: [100, 'Plan name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Plan price is required'],
      min: [0, 'Price cannot be negative'],
    },
    durationDays: {
      type: Number,
      required: [true, 'Plan duration is required'],
      min: [1, 'Duration must be at least 1 day'],
    },
    features: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('MembershipPlan', membershipPlanSchema);
