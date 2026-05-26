const Trainer = require('../models/Trainer');
const User = require('../models/User');
const Member = require('../models/Member');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');
const { validationResult } = require('express-validator');

/**
 * @desc    Get all trainers for a gym
 * @route   GET /api/trainers
 * @access  Private (gym_owner)
 */
const getTrainers = async (req, res, next) => {
  try {
    const trainers = await Trainer.find({ gymId: req.user.gymId })
      .populate('userId', 'isActive lastLogin')
      .populate('assignedMembers', 'name status');

    return sendSuccess(res, 200, 'Trainers fetched successfully.', { trainers });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new trainer (creates User auth + Trainer profile)
 * @route   POST /api/trainers
 * @access  Private (gym_owner)
 */
const createTrainer = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new AppError(errors.array()[0].msg, 400));

    const { fullName, email, phone, password, specialization, salary } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) return next(new AppError('An account with this email already exists.', 409));

    // Create User account for the trainer
    const user = await User.create({
      name: fullName,
      email,
      phone,
      password,
      role: 'trainer',
      gymId: req.user.gymId,
    });

    // Create Trainer profile
    const trainer = await Trainer.create({
      gymId: req.user.gymId,
      userId: user._id,
      fullName,
      email,
      phone,
      specialization,
      salary: salary || 0,
    });

    return sendSuccess(res, 201, 'Trainer created successfully.', { trainer });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update trainer details
 * @route   PUT /api/trainers/:id
 * @access  Private (gym_owner)
 */
const updateTrainer = async (req, res, next) => {
  try {
    const { specialization, salary, isActive } = req.body;

    const trainer = await Trainer.findOneAndUpdate(
      { _id: req.params.id, gymId: req.user.gymId },
      { specialization, salary, isActive },
      { new: true, runValidators: true }
    );

    if (!trainer) return next(new AppError('Trainer not found.', 404));

    // Update the linked user's active status if provided
    if (isActive !== undefined) {
      await User.findByIdAndUpdate(trainer.userId, { isActive });
    }

    return sendSuccess(res, 200, 'Trainer updated successfully.', { trainer });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign a member to a trainer
 * @route   POST /api/trainers/:id/assign
 * @access  Private (gym_owner)
 */
const assignMember = async (req, res, next) => {
  try {
    const { memberId } = req.body;
    if (!memberId) return next(new AppError('Member ID is required.', 400));

    // Verify trainer exists in this gym
    const trainer = await Trainer.findOne({ _id: req.params.id, gymId: req.user.gymId });
    if (!trainer) return next(new AppError('Trainer not found.', 404));

    // Verify member exists in this gym
    const member = await Member.findOne({ _id: memberId, gymId: req.user.gymId });
    if (!member) return next(new AppError('Member not found.', 404));

    // Update trainer's list
    if (!trainer.assignedMembers.includes(memberId)) {
      trainer.assignedMembers.push(memberId);
      await trainer.save();
    }

    // Update member's reference
    member.trainerId = trainer.userId;
    await member.save();

    return sendSuccess(res, 200, 'Member assigned to trainer successfully.', {});
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a trainer
 * @route   DELETE /api/trainers/:id
 * @access  Private (gym_owner)
 */
const deleteTrainer = async (req, res, next) => {
  try {
    const trainer = await Trainer.findOne({ _id: req.params.id, gymId: req.user.gymId });
    if (!trainer) return next(new AppError('Trainer not found.', 404));

    // Remove trainer assignments from members
    await Member.updateMany(
      { trainerId: trainer.userId },
      { $set: { trainerId: null } }
    );

    // Delete associated user
    if (trainer.userId) {
      await User.findByIdAndDelete(trainer.userId);
    }

    // Delete trainer
    await trainer.deleteOne();

    return sendSuccess(res, 200, 'Trainer deleted and assignments safely removed.', {});
  } catch (error) {
    next(error);
  }
};

module.exports = { getTrainers, createTrainer, updateTrainer, assignMember, deleteTrainer };
