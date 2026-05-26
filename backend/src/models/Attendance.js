const mongoose = require('mongoose');

/**
 * Attendance Model
 *
 * Records each gym check-in event for a member.
 * Supports both member-based and walk-in attendance.
 * Indexed for fast daily/weekly queries needed by the dashboard.
 */
const attendanceSchema = new mongoose.Schema(
  {
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      required: [true, 'Attendance must belong to a gym'],
      index: true,
    },
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Attendance must reference a member'],
    },
    checkInTime: {
      type: Date,
      default: Date.now,
    },
    checkOutTime: {
      type: Date,
      default: null,
    },
    date: {
      type: String, // YYYY-MM-DD for easy daily aggregation queries
      required: true,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Staff/trainer who recorded it
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

// Compound index for efficient dashboard queries (gym + date)
attendanceSchema.index({ gymId: 1, date: 1 });
attendanceSchema.index({ gymId: 1, memberId: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
