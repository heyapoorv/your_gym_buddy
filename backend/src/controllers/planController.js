const MembershipPlan = require('../models/MembershipPlan');
const Member = require('../models/Member');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');
const { validationResult } = require('express-validator');

/**
 * @desc    Get all plans for the authenticated gym
 * @route   GET /api/plans
 * @access  Private (gym_owner, trainer)
 */
const getPlans = async (req, res, next) => {
  try {
    const plans = await MembershipPlan.find({ gymId: req.user.gymId }).sort({ price: 1 });
    return sendSuccess(res, 200, 'Plans fetched successfully.', { plans, count: plans.length });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new membership plan
 * @route   POST /api/plans
 * @access  Private (gym_owner)
 */
const createPlan = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new AppError(errors.array()[0].msg, 400));

    const { name, description, price, durationDays, features } = req.body;

    const plan = await MembershipPlan.create({
      gymId: req.user.gymId,
      name,
      description,
      price,
      durationDays,
      features: features || [],
    });

    return sendSuccess(res, 201, 'Plan created successfully.', { plan });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single plan by ID
 * @route   GET /api/plans/:id
 * @access  Private
 */
const getPlan = async (req, res, next) => {
  try {
    const plan = await MembershipPlan.findOne({ _id: req.params.id, gymId: req.user.gymId });
    if (!plan) return next(new AppError('Plan not found.', 404));
    return sendSuccess(res, 200, 'Plan fetched successfully.', { plan });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a plan
 * @route   PUT /api/plans/:id
 * @access  Private (gym_owner)
 */
const updatePlan = async (req, res, next) => {
  try {
    const plan = await MembershipPlan.findOneAndUpdate(
      { _id: req.params.id, gymId: req.user.gymId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!plan) return next(new AppError('Plan not found.', 404));
    return sendSuccess(res, 200, 'Plan updated successfully.', { plan });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete (deactivate) a plan
 * @route   DELETE /api/plans/:id
 * @access  Private (gym_owner)
 */
const deletePlan = async (req, res, next) => {
  try {
    // Check if any active/expiring members are using this plan
    const activeMembersCount = await Member.countDocuments({
      gymId: req.user.gymId,
      planId: req.params.id,
      status: { $in: ['active', 'expiring'] }
    });

    if (activeMembersCount > 0) {
      return res.status(400).json({ 
        status: 'fail', 
        message: 'This plan is assigned to active members. Please migrate members before deletion.' 
      });
    }

    const plan = await MembershipPlan.findOneAndUpdate(
      { _id: req.params.id, gymId: req.user.gymId },
      { isActive: false },
      { new: true }
    );
    if (!plan) return next(new AppError('Plan not found.', 404));
    return sendSuccess(res, 200, 'Plan deactivated successfully.', {});
  } catch (error) {
    next(error);
  }
};

module.exports = { getPlans, createPlan, getPlan, updatePlan, deletePlan };
