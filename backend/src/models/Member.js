const mongoose = require('mongoose');

/**
 * Member Model
 *
 * Represents a gym member. Members belong to a specific gym (multi-tenant).
 * Each member can be linked to a MembershipPlan and optionally a Trainer.
 * Status lifecycle: active → expiring → expired → inactive
 */
const memberSchema = new mongoose.Schema(
  {
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      required: [true, 'Member must belong to a gym'],
      index: true,
    },
    // ─── Personal Info ────────────────────────────────────────────
    name: {
      type: String,
      required: [true, 'Member name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', null],
      default: null,
    },
    photo: {
      type: String, // URL
      default: null,
    },
    // ─── Membership ───────────────────────────────────────────────
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MembershipPlan',
      default: null,
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
    planStartDate: {
      type: Date,
      default: null,
    },
    planEndDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'expiring', 'expired', 'inactive'],
      default: 'active',
    },
    // ─── Trainer Assignment ───────────────────────────────────────
    trainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Trainer is a User with role='trainer'
      default: null,
    },
    // ─── Notes ───────────────────────────────────────────────────
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Auto-index for faster queries by gym + status
memberSchema.index({ gymId: 1, status: 1 });

module.exports = mongoose.model('Member', memberSchema);
