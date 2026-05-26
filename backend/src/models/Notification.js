const mongoose = require('mongoose');

/**
 * Notification Model
 *
 * Stores system-generated alerts for gym owners/admins.
 * E.g., "5 memberships expired today", "Payment failed".
 */
const notificationSchema = new mongoose.Schema(
  {
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      required: [true, 'Notification must belong to a gym'],
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['system', 'billing', 'member_alert', 'lead_alert'],
      default: 'system',
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
