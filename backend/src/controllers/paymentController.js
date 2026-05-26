const Payment = require('../models/Payment');
const Member = require('../models/Member');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');
const { validationResult } = require('express-validator');

/**
 * @desc    Get all payments (with filters + pagination)
 * @route   GET /api/payments
 * @access  Private
 */
const getPayments = async (req, res, next) => {
  try {
    const { status, memberId, type, page = 1, limit = 20 } = req.query;

    const query = { gymId: req.user.gymId };
    if (status) query.status = status;
    if (memberId) query.memberId = memberId;
    if (type) query.type = type;

    const skip = (Number(page) - 1) * Number(limit);

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('memberId', 'name phone email')
        .populate('planId', 'name price')
        .populate('recordedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Payment.countDocuments(query),
    ]);

    return sendSuccess(res, 200, 'Payments fetched successfully.', {
      payments,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Record a new payment
 * @route   POST /api/payments
 * @access  Private (gym_owner)
 */
const createPayment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new AppError(errors.array()[0].msg, 400));

    const { memberId, planId, amount, paymentMethod, type, description, status } = req.body;

    // Verify member belongs to gym
    const member = await Member.findOne({ _id: memberId, gymId: req.user.gymId });
    if (!member) return next(new AppError('Member not found.', 404));

    const payment = await Payment.create({
      gymId: req.user.gymId,
      memberId,
      planId: planId || null,
      amount,
      paymentMethod: paymentMethod || 'cash',
      type: type || 'membership',
      description: description || '',
      status: status || 'success',
      recordedBy: req.user._id,
      paidAt: status === 'success' ? new Date() : null,
    });

    await payment.populate('memberId', 'name phone');
    return sendSuccess(res, 201, 'Payment recorded successfully.', { payment });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a payment status
 * @route   PUT /api/payments/:id
 * @access  Private (gym_owner)
 */
const updatePayment = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    if (updateData.status === 'success') {
      updateData.paidAt = new Date();
    } else if (updateData.status === 'pending' || updateData.status === 'failed') {
      updateData.paidAt = null;
    }

    const payment = await Payment.findOneAndUpdate(
      { _id: req.params.id, gymId: req.user.gymId },
      updateData,
      { new: true, runValidators: true }
    ).populate('memberId', 'name phone');

    if (!payment) return next(new AppError('Payment not found.', 404));
    return sendSuccess(res, 200, 'Payment updated successfully.', { payment });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get financial summary for dashboard
 * @route   GET /api/payments/stats
 * @access  Private
 */
const getPaymentStats = async (req, res, next) => {
  try {
    const gymId = req.user.gymId;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [monthlyRevenue, totalRevenue, pendingCount, failedCount] = await Promise.all([
      // Sum of successful payments this month
      Payment.aggregate([
        { $match: { gymId, status: 'success', paidAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // All-time revenue
      Payment.aggregate([
        { $match: { gymId, status: 'success' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payment.countDocuments({ gymId, status: 'pending' }),
      Payment.countDocuments({ gymId, status: 'failed' }),
    ]);

    // Monthly revenue trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const monthlyTrend = await Payment.aggregate([
      { $match: { gymId, status: 'success', paidAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$paidAt' }, month: { $month: '$paidAt' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    return sendSuccess(res, 200, 'Payment stats fetched.', {
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      totalRevenue: totalRevenue[0]?.total || 0,
      pendingCount,
      failedCount,
      monthlyTrend,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPayments, createPayment, updatePayment, getPaymentStats };
