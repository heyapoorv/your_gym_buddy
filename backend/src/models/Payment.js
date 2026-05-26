const mongoose = require('mongoose');

/**
 * Payment Model
 *
 * Records every financial transaction in the gym.
 * Tracks membership fee payments, PT sessions, etc.
 * Status lifecycle: pending → success | failed | refunded
 */
const paymentSchema = new mongoose.Schema(
  {
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      required: [true, 'Payment must belong to a gym'],
      index: true,
    },
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Payment must reference a member'],
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MembershipPlan',
      default: null,
    },
    // ─── Transaction Details ──────────────────────────────────────
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'bank_transfer', 'other'],
      default: 'cash',
    },
    transactionId: {
      type: String,
      trim: true,
      default: null, // External payment gateway reference
    },
    // ─── Context ─────────────────────────────────────────────────
    type: {
      type: String,
      enum: ['membership', 'pt_session', 'supplement', 'other'],
      default: 'membership',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    paidAt: {
      type: Date,
      default: null, // Set when status changes to 'success'
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for financial reporting queries
paymentSchema.index({ gymId: 1, status: 1 });
paymentSchema.index({ gymId: 1, createdAt: -1 });

// Auto-set paidAt when status is set to success
paymentSchema.pre('save', function () {
  if (this.isModified('status') && this.status === 'success' && !this.paidAt) {
    this.paidAt = new Date();
  }
});

module.exports = mongoose.model('Payment', paymentSchema);
