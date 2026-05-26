const Attendance = require('../models/Attendance');
const Member = require('../models/Member');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * @desc    Record a check-in for a member
 * @route   POST /api/attendance/checkin
 * @access  Private
 */
const checkIn = async (req, res, next) => {
  try {
    const { memberId, notes } = req.body;
    if (!memberId) return next(new AppError('Member ID is required.', 400));

    // Verify member belongs to the gym
    const member = await Member.findOne({ _id: memberId, gymId: req.user.gymId });
    if (!member) return next(new AppError('Member not found.', 404));

    // Check membership status
    if (member.status === 'inactive') {
      return next(new AppError('Member account is inactive. Please activate the member first.', 400));
    }

    if (!member.planId) {
      return next(new AppError('Membership plan is not assigned. Please assign a plan to check in.', 400));
    }

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    if (member.status === 'expired' || (member.planEndDate && new Date(member.planEndDate) < todayDate)) {
      return next(new AppError("Member's subscription plan has expired. Please renew the membership plan to check in.", 400));
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Prevent duplicate check-in for same day
    const existing = await Attendance.findOne({ memberId, date: today, gymId: req.user.gymId });
    if (existing && !existing.checkOutTime) {
      return next(new AppError('Member is already checked in today. Check out first.', 400));
    }

    const record = await Attendance.create({
      gymId: req.user.gymId,
      memberId,
      date: today,
      checkInTime: new Date(),
      recordedBy: req.user._id,
      notes: notes || '',
    });

    await record.populate({
      path: 'memberId',
      select: 'name phone planId status planEndDate',
      populate: {
        path: 'planId',
        select: 'name'
      }
    });
    return sendSuccess(res, 201, 'Check-in recorded.', { record });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Record a check-out for a member
 * @route   PUT /api/attendance/checkout/:attendanceId
 * @access  Private
 */
const checkOut = async (req, res, next) => {
  try {
    const record = await Attendance.findOneAndUpdate(
      { _id: req.params.attendanceId, gymId: req.user.gymId, checkOutTime: null },
      { checkOutTime: new Date() },
      { new: true }
    ).populate({
      path: 'memberId',
      select: 'name phone planId status planEndDate',
      populate: {
        path: 'planId',
        select: 'name'
      }
    });

    if (!record) return next(new AppError('Active check-in record not found.', 404));
    return sendSuccess(res, 200, 'Check-out recorded.', { record });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get attendance records (with filters)
 * @route   GET /api/attendance
 * @access  Private
 */
const getAttendance = async (req, res, next) => {
  try {
    const { date, memberId, page = 1, limit = 30 } = req.query;

    const query = { gymId: req.user.gymId };
    if (date) query.date = date;
    if (memberId) query.memberId = memberId;

    const skip = (Number(page) - 1) * Number(limit);

    const [records, total] = await Promise.all([
      Attendance.find(query)
        .populate({
          path: 'memberId',
          select: 'name phone planId status planEndDate',
          populate: {
            path: 'planId',
            select: 'name'
          }
        })
        .populate('recordedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Attendance.countDocuments(query),
    ]);

    return sendSuccess(res, 200, 'Attendance records fetched.', {
      records,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get today's attendance summary for dashboard
 * @route   GET /api/attendance/today
 * @access  Private
 */
const getTodayStats = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const gymId = req.user.gymId;

    const [totalToday, currentlyIn] = await Promise.all([
      Attendance.countDocuments({ gymId, date: today }),
      Attendance.countDocuments({ gymId, date: today, checkOutTime: null }),
    ]);

    // Last 7 days daily counts
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const dailyCounts = await Attendance.aggregate([
      {
        $match: {
          gymId,
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: '$date',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return sendSuccess(res, 200, 'Today\'s attendance stats.', {
      totalToday,
      currentlyIn,
      dailyCounts,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { checkIn, checkOut, getAttendance, getTodayStats };
