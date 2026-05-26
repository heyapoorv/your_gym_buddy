const Member = require('../models/Member');
const MembershipPlan = require('../models/MembershipPlan');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');
const { validationResult } = require('express-validator');

/**
 * @desc    Get all members for the gym (with search, filter, pagination)
 * @route   GET /api/members
 * @access  Private
 */
const getMembers = async (req, res, next) => {
  try {
    const {
      search = '',
      status,
      planId,
      page = 1,
      limit = 20,
    } = req.query;

    const query = { gymId: req.user.gymId };

    if (req.user.role === 'trainer') {
      query.trainerId = req.user._id;
    }

    // Search by name or phone
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) query.status = status;
    if (planId) query.planId = planId;

    const skip = (Number(page) - 1) * Number(limit);

    const [members, total] = await Promise.all([
      Member.find(query)
        .populate('planId', 'name price durationDays')
        .populate('trainerId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Member.countDocuments(query),
    ]);

    return sendSuccess(res, 200, 'Members fetched successfully.', {
      members,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new member
 * @route   POST /api/members
 * @access  Private (gym_owner, trainer)
 */
const createMember = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new AppError(errors.array()[0].msg, 400));

    const { name, email, phone, planId, trainerId, dateOfBirth, gender, notes } = req.body;

    // Calculate plan end date if a plan is provided
    let planStartDate = null;
    let planEndDate = null;

    if (planId) {
      const plan = await MembershipPlan.findOne({ _id: planId, gymId: req.user.gymId });
      if (!plan) return next(new AppError('Membership plan not found.', 404));

      planStartDate = new Date();
      planEndDate = new Date();
      planEndDate.setDate(planEndDate.getDate() + plan.durationDays);
    }

    const member = await Member.create({
      gymId: req.user.gymId,
      name,
      email,
      phone,
      planId: planId || null,
      planStartDate,
      planEndDate,
      trainerId: trainerId || null,
      dateOfBirth: dateOfBirth || null,
      gender: gender || null,
      notes: notes || '',
      status: 'active',
    });

    await member.populate('planId', 'name price durationDays');

    return sendSuccess(res, 201, 'Member added successfully.', { member });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single member by ID
 * @route   GET /api/members/:id
 * @access  Private
 */
const getMember = async (req, res, next) => {
  try {
    const member = await Member.findOne({ _id: req.params.id, gymId: req.user.gymId })
      .populate('planId', 'name price durationDays features')
      .populate('trainerId', 'name email');

    if (!member) return next(new AppError('Member not found.', 404));
    return sendSuccess(res, 200, 'Member fetched successfully.', { member });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update member details
 * @route   PUT /api/members/:id
 * @access  Private (gym_owner, trainer)
 */
const updateMember = async (req, res, next) => {
  try {
    // If plan is changing, recalculate dates
    if (req.body.planId) {
      const plan = await MembershipPlan.findOne({ _id: req.body.planId, gymId: req.user.gymId });
      if (!plan) return next(new AppError('Membership plan not found.', 404));

      req.body.planStartDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.durationDays);
      req.body.planEndDate = endDate;
      req.body.status = 'active';
    }

    const member = await Member.findOneAndUpdate(
      { _id: req.params.id, gymId: req.user.gymId },
      req.body,
      { new: true, runValidators: true }
    )
      .populate('planId', 'name price durationDays')
      .populate('trainerId', 'name email');

    if (!member) return next(new AppError('Member not found.', 404));
    return sendSuccess(res, 200, 'Member updated successfully.', { member });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a member (set inactive)
 * @route   DELETE /api/members/:id
 * @access  Private (gym_owner)
 */
const deleteMember = async (req, res, next) => {
  try {
    const member = await Member.findOneAndUpdate(
      { _id: req.params.id, gymId: req.user.gymId },
      { status: 'inactive' },
      { new: true }
    );
    if (!member) return next(new AppError('Member not found.', 404));
    return sendSuccess(res, 200, 'Member deactivated successfully.', {});
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get member count stats for dashboard
 * @route   GET /api/members/stats
 * @access  Private
 */
const getMemberStats = async (req, res, next) => {
  try {
    const gymId = req.user.gymId;
    const matchQuery = { gymId };

    if (req.user.role === 'trainer') {
      matchQuery.trainerId = req.user._id;
    }

    const stats = await Member.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const result = { active: 0, expiring: 0, expired: 0, inactive: 0, total: 0 };
    stats.forEach((s) => {
      result[s._id] = s.count;
      result.total += s.count;
    });

    return sendSuccess(res, 200, 'Member stats fetched.', result);
  } catch (error) {
    next(error);
  }
};

module.exports = { getMembers, createMember, getMember, updateMember, deleteMember, getMemberStats };
