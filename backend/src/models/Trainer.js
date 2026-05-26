const mongoose = require('mongoose');

/**
 * Trainer Model
 *
 * Represents a gym trainer/staff.
 * Stores employment details, salary, and assigned members.
 * A separate User record handles their login/auth.
 */
const trainerSchema = new mongoose.Schema(
  {
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      required: [true, 'Trainer must belong to a gym'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Trainer must have a linked User account for login'],
      unique: true, // One User per Trainer profile
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    specialization: {
      type: String,
      trim: true,
      default: 'General Fitness',
    },
    salary: {
      type: Number,
      default: 0,
      min: [0, 'Salary cannot be negative'],
    },
    assignedMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
      }
    ],
    attendanceRate: {
      type: Number,
      default: 0, // Percentage
    },
    isActive: {
      type: Boolean,
      default: true,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Trainer', trainerSchema);
