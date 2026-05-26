const mongoose = require('mongoose');

/**
 * Lead Model
 *
 * Handles CRM inquiries and potential members.
 * Status kanban flow: inquiry → contacted → trial → converted | lost
 */
const leadSchema = new mongoose.Schema(
  {
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      required: [true, 'Lead must belong to a gym'],
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    source: {
      type: String,
      enum: ['walk_in', 'website', 'referral', 'social_media', 'other'],
      default: 'walk_in',
    },
    status: {
      type: String,
      enum: ['inquiry', 'contacted', 'trial', 'converted', 'lost'],
      default: 'inquiry',
      index: true,
    },
    nextFollowup: {
      type: Date,
      default: null,
    },
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

// Indexes for fast CRM queries
leadSchema.index({ gymId: 1, status: 1 });
leadSchema.index({ gymId: 1, nextFollowup: 1 });

module.exports = mongoose.model('Lead', leadSchema);
