const Lead = require('../models/Lead');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');
const { validationResult } = require('express-validator');

/**
 * @desc    Get all leads (with status filtering and pagination)
 * @route   GET /api/leads
 * @access  Private (gym_owner, trainer)
 */
const getLeads = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = { gymId: req.user.gymId };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [leads, total] = await Promise.all([
      Lead.find(query).sort({ nextFollowup: 1, createdAt: -1 }).skip(skip).limit(Number(limit)),
      Lead.countDocuments(query),
    ]);

    return sendSuccess(res, 200, 'Leads fetched successfully.', {
      leads,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new lead (inquiry)
 * @route   POST /api/leads
 * @access  Private
 */
const createLead = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new AppError(errors.array()[0].msg, 400));

    const { fullName, phone, source, notes, nextFollowup } = req.body;

    const lead = await Lead.create({
      gymId: req.user.gymId,
      fullName,
      phone,
      source: source || 'walk_in',
      notes: notes || '',
      nextFollowup: nextFollowup || null,
      status: 'inquiry',
    });

    return sendSuccess(res, 201, 'Lead created successfully.', { lead });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a lead (kanban status, followups)
 * @route   PUT /api/leads/:id
 * @access  Private
 */
const updateLead = async (req, res, next) => {
  try {
    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, gymId: req.user.gymId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!lead) return next(new AppError('Lead not found.', 404));

    return sendSuccess(res, 200, 'Lead updated successfully.', { lead });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Lead pipeline stats
 * @route   GET /api/leads/stats
 * @access  Private
 */
const getLeadStats = async (req, res, next) => {
  try {
    const gymId = req.user.gymId;

    const stats = await Lead.aggregate([
      { $match: { gymId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const result = { inquiry: 0, contacted: 0, trial: 0, converted: 0, lost: 0, total: 0 };
    stats.forEach((s) => {
      result[s._id] = s.count;
      result.total += s.count;
    });

    return sendSuccess(res, 200, 'Lead stats fetched.', result);
  } catch (error) {
    next(error);
  }
};

module.exports = { getLeads, createLead, updateLead, getLeadStats };
