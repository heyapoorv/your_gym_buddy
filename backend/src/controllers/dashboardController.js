const Member = require('../models/Member');
const Payment = require('../models/Payment');
const Attendance = require('../models/Attendance');
const Lead = require('../models/Lead');
const Gym = require('../models/Gym');
const User = require('../models/User');
const Trainer = require('../models/Trainer');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');
const { PLAN_CONFIG, getPlanLimits } = require('../config/plans');

/**
 * @desc    Get master dashboard metrics (Gym Owner / Super Admin platform wide)
 * @route   GET /api/dashboard
 * @access  Private
 */
const getDashboardMetrics = async (req, res, next) => {
  try {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // ─── SUPER ADMIN PLATFORM WIDE METRICS ─────────────────────────────────
    if (req.user.role === 'superadmin') {
      const [
        totalGyms,
        activeGyms,
        trialGyms,
        expiredGyms,
        totalMembers,
        monthlyRevenueResult,
        pendingPayments,
        todayCheckIns,
        currentlyInGym
      ] = await Promise.all([
        Gym.countDocuments({}),
        Gym.countDocuments({ subscriptionStatus: 'active' }),
        Gym.countDocuments({ subscriptionStatus: 'trial' }),
        Gym.countDocuments({ subscriptionStatus: 'expired' }),
        Member.countDocuments({}),
        Payment.aggregate([
          { $match: { status: 'success', paidAt: { $gte: startOfMonth } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Payment.countDocuments({ status: 'pending' }),
        Attendance.countDocuments({ date: todayString }),
        Attendance.countDocuments({ date: todayString, checkOutTime: null })
      ]);

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);

      const revenueTrend = await Payment.aggregate([
        { $match: { status: 'success', paidAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { year: { $year: '$paidAt' }, month: { $month: '$paidAt' } },
            total: { $sum: '$amount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);

      const attendanceTrend = [10, 18, 14, 22, 29, 21, todayCheckIns];
      const memberTrend = [45, 62, 75, 88, 94, totalMembers];

      return sendSuccess(res, 200, 'Super Admin platform metrics fetched.', {
        isSuperAdmin: true,
        stats: {
          totalGyms,
          activeGyms,
          trialGyms,
          expiredGyms,
          totalMembers,
          monthlyRevenue: monthlyRevenueResult[0]?.total || 0,
          pendingDues: pendingPayments,
          todayCheckIns,
          currentlyInGym
        },
        charts: {
          revenueTrend: revenueTrend.map(r => ({
            month: `${r._id.month}/${r._id.year}`,
            total: r.total
          })),
          attendanceTrend,
          memberTrend
        }
      });
    }

    // ─── GYM OWNER SPECIFIC METRICS ────────────────────────────────────────
    const gymId = req.user.gymId;
    const memberQuery = { gymId };

    if (req.user.role === 'trainer') {
      memberQuery.trainerId = req.user._id;
    }

    const [
      totalMembers,
      activeMembers,
      expiringMembers,
      monthlyRevenueResult,
      pendingPayments,
      todayCheckIns,
      currentlyInGym,
      leadsConverted,
      totalTrainers
    ] = await Promise.all([
      Member.countDocuments(memberQuery),
      Member.countDocuments({ ...memberQuery, status: 'active' }),
      Member.countDocuments({ ...memberQuery, status: 'expiring' }),
      Payment.aggregate([
        { $match: { gymId, status: 'success', paidAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.countDocuments({ gymId, status: 'pending' }),
      Attendance.countDocuments({ gymId, date: todayString }),
      Attendance.countDocuments({ gymId, date: todayString, checkOutTime: null }),
      Lead.countDocuments({ gymId, status: 'converted' }),
      Trainer.countDocuments({ gymId })
    ]);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const revenueTrend = await Payment.aggregate([
      { $match: { gymId, status: 'success', paidAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$paidAt' }, month: { $month: '$paidAt' } },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const attendanceTrendRaw = await Attendance.aggregate([
      { $match: { gymId, checkInTime: { $gte: sevenDaysAgo } } },
      { $group: { _id: '$date', count: { $sum: 1 } } },
      { $sort: { '_id': 1 } }
    ]);

    const attendanceTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const found = attendanceTrendRaw.find(x => x._id === dateStr);
      attendanceTrend.push(found ? found.count : 0);
    }

    const memberTrend = [
      Math.floor(activeMembers * 0.8),
      Math.floor(activeMembers * 0.85),
      Math.floor(activeMembers * 0.9),
      Math.floor(activeMembers * 0.95),
      Math.floor(activeMembers * 0.98),
      activeMembers
    ];

    return sendSuccess(res, 200, 'Dashboard metrics fetched successfully.', {
      isSuperAdmin: false,
      members: {
        total: totalMembers,
        active: activeMembers,
        expiring: expiringMembers,
      },
      financials: {
        monthlyRevenue: monthlyRevenueResult[0]?.total || 0,
        pendingDues: pendingPayments,
      },
      attendance: {
        todayCheckIns,
        currentlyInGym,
      },
      crm: {
        leadsConverted,
      },
      staff: {
        total: totalTrainers,
      },
      charts: {
        revenueTrend: revenueTrend.map(r => ({
          month: `${r._id.month}/${r._id.year}`,
          total: r.total
        })),
        attendanceTrend,
        memberTrend
      }
    });
  } catch (error) {
    next(error);
  }
};

const getGyms = async (req, res, next) => {
  try {
    if (req.user.role !== 'superadmin') {
      return next(new AppError('Forbidden. Super Admin access only.', 403));
    }

    const { page = 1, limit = 10, search, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (status) {
      query.subscriptionStatus = status;
    }
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Get all gyms with full owner data
    const totalGyms = await Gym.countDocuments(query);
    const gyms = await Gym.find(query)
      .populate('owner', 'name email phone role createdAt lastLogin isActive')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Attach real-time usage stats to each gym in parallel
    const gymsWithStats = await Promise.all(
      gyms.map(async (gym) => {
        const gymObj = gym.toObject();
        const [memberCount, staffCount, totalRevenue] = await Promise.all([
          Member.countDocuments({ gymId: gym._id, status: { $ne: 'inactive' } }),
          Trainer.countDocuments({ gymId: gym._id }),
          Payment.aggregate([
            { $match: { gymId: gym._id, status: 'success' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
          ])
        ]);

        // Days remaining calculation
        const now = new Date();
        let daysRemaining = null;
        if (gymObj.subscriptionStatus === 'trial' && gymObj.trialEndsAt) {
          daysRemaining = Math.max(0, Math.ceil((new Date(gymObj.trialEndsAt) - now) / (1000 * 60 * 60 * 24)));
        } else if (gymObj.subscriptionStatus === 'active' && gymObj.planExpiresAt) {
          daysRemaining = Math.max(0, Math.ceil((new Date(gymObj.planExpiresAt) - now) / (1000 * 60 * 60 * 24)));
        }

        return {
          ...gymObj,
          usage: {
            members: { current: memberCount, limit: gymObj.maxMembers },
            staff: { current: staffCount, limit: gymObj.maxStaff },
          },
          totalRevenue: totalRevenue[0]?.total || 0,
          daysRemaining,
          planLabel: PLAN_CONFIG[gymObj.plan]?.label || gymObj.plan,
        };
      })
    );

    return sendSuccess(res, 200, 'Gyms list fetched.', { 
      gyms: gymsWithStats,
      pagination: {
        total: totalGyms,
        page: parseInt(page),
        pages: Math.ceil(totalGyms / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed profile for a single gym (Super Admin only)
 * @route   GET /api/dashboard/gyms/:id
 * @access  Private (superadmin)
 */
const getGymDetails = async (req, res, next) => {
  try {
    if (req.user.role !== 'superadmin') {
      return next(new AppError('Forbidden. Super Admin access only.', 403));
    }

    const gym = await Gym.findById(req.params.id)
      .populate('owner', 'name email phone role createdAt lastLogin isActive address');

    if (!gym) return next(new AppError('Gym not found.', 404));

    const gymObj = gym.toObject();
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalMembers,
      activeMembers,
      expiringMembers,
      expiredMembers,
      staffCount,
      totalLeads,
      convertedLeads,
      monthlyRevenue,
      totalRevenue,
      todayCheckIns,
      recentPayments,
      recentMembers,
      trainersList,
    ] = await Promise.all([
      Member.countDocuments({ gymId: gym._id }),
      Member.countDocuments({ gymId: gym._id, status: 'active' }),
      Member.countDocuments({ gymId: gym._id, status: 'expiring' }),
      Member.countDocuments({ gymId: gym._id, status: 'expired' }),
      Trainer.countDocuments({ gymId: gym._id }),
      Lead.countDocuments({ gymId: gym._id }),
      Lead.countDocuments({ gymId: gym._id, status: 'converted' }),
      Payment.aggregate([
        { $match: { gymId: gym._id, status: 'success', paidAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.aggregate([
        { $match: { gymId: gym._id, status: 'success' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Attendance.countDocuments({ gymId: gym._id, date: todayString }),
      Payment.find({ gymId: gym._id }).sort({ createdAt: -1 }).limit(5)
        .populate('memberId', 'name'),
      Member.find({ gymId: gym._id }).sort({ createdAt: -1 }).limit(5)
        .select('name status joinDate planEndDate'),
      Trainer.find({ gymId: gym._id }).select('fullName email phone specialization isActive'),
    ]);

    // Days remaining
    let daysRemaining = null;
    if (gymObj.subscriptionStatus === 'trial' && gymObj.trialEndsAt) {
      daysRemaining = Math.max(0, Math.ceil((new Date(gymObj.trialEndsAt) - today) / (1000 * 60 * 60 * 24)));
    } else if (gymObj.subscriptionStatus === 'active' && gymObj.planExpiresAt) {
      daysRemaining = Math.max(0, Math.ceil((new Date(gymObj.planExpiresAt) - today) / (1000 * 60 * 60 * 24)));
    }

    return sendSuccess(res, 200, 'Gym details fetched.', {
      gym: {
        ...gymObj,
        planLabel: PLAN_CONFIG[gymObj.plan]?.label || gymObj.plan,
        daysRemaining,
      },
      stats: {
        members: { total: totalMembers, active: activeMembers, expiring: expiringMembers, expired: expiredMembers },
        staff: staffCount,
        leads: { total: totalLeads, converted: convertedLeads },
        revenue: { monthly: monthlyRevenue[0]?.total || 0, total: totalRevenue[0]?.total || 0 },
        attendance: { today: todayCheckIns },
        usage: {
          members: { current: activeMembers + expiringMembers, limit: gymObj.maxMembers },
          staff: { current: staffCount, limit: gymObj.maxStaff },
        },
      },
      recentPayments,
      recentMembers,
      trainersList,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a gym's subscription plan (Super Admin only)
 *          Full SaaS-aware: sets all limits, status, and appends history.
 * @route   PUT /api/dashboard/gyms/:id/plan
 * @access  Private (superadmin)
 */
const updateGymPlan = async (req, res, next) => {
  try {
    if (req.user.role !== 'superadmin') {
      return next(new AppError('Forbidden. Super Admin access only.', 403));
    }

    const { plan, subscriptionStatus, planExpiresAt, note } = req.body;

    const gym = await Gym.findById(req.params.id);
    if (!gym) return next(new AppError('Gym not found.', 404));

    // Validate plan
    const validPlans = ['trial', 'starter', 'growth', 'enterprise'];
    if (plan && !validPlans.includes(plan)) {
      return next(new AppError(`Invalid plan. Choose from: ${validPlans.join(', ')}`, 400));
    }

    const newPlan = plan || gym.plan;
    const planConfig = getPlanLimits(newPlan);
    const now = new Date();

    // Close the last history entry
    if (gym.subscriptionHistory.length > 0) {
      const last = gym.subscriptionHistory[gym.subscriptionHistory.length - 1];
      if (!last.endedAt) last.endedAt = now;
    }

    // Determine new status
    let newStatus = subscriptionStatus || (newPlan === 'trial' ? 'trial' : 'active');

    // Determine expiry dates
    let newPlanStartsAt = gym.planStartsAt;
    let newPlanExpiresAt = planExpiresAt ? new Date(planExpiresAt) : gym.planExpiresAt;
    let newTrialEndsAt = gym.trialEndsAt;

    if (newPlan !== 'trial' && newStatus === 'active' && !planExpiresAt) {
      newPlanStartsAt = now;
      newPlanExpiresAt = new Date(now);
      newPlanExpiresAt.setDate(newPlanExpiresAt.getDate() + planConfig.durationDays);
    }

    gym.subscriptionHistory.push({
      plan: newPlan,
      status: newStatus,
      startedAt: now,
      note: note || `Plan manually updated to ${newPlan} by SuperAdmin.`,
    });

    gym.plan = newPlan;
    gym.subscriptionStatus = newStatus;
    gym.planStartsAt = newPlanStartsAt;
    gym.planExpiresAt = newPlanExpiresAt;
    gym.trialEndsAt = newTrialEndsAt;
    gym.maxMembers = planConfig.maxMembers;
    gym.maxStaff = planConfig.maxStaff;
    gym.maxBranches = planConfig.maxBranches;

    await gym.save();

    const updated = await Gym.findById(gym._id).populate('owner', 'name email phone');
    return sendSuccess(res, 200, 'Gym subscription updated successfully.', { gym: updated });
  } catch (error) {
    next(error);
  }
};


const editGym = async (req, res, next) => {
  try {
    if (req.user.role !== 'superadmin') {
      return next(new AppError('Forbidden. Super Admin access only.', 403));
    }
    const gym = await Gym.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!gym) return next(new AppError('Gym not found.', 404));
    return sendSuccess(res, 200, 'Gym updated successfully.', { gym });
  } catch (error) {
    next(error);
  }
};

const deleteGym = async (req, res, next) => {
  try {
    if (req.user.role !== 'superadmin') {
      return next(new AppError('Forbidden. Super Admin access only.', 403));
    }
    const gym = await Gym.findById(req.params.id);
    if (!gym) return next(new AppError('Gym not found.', 404));
    
    // delete related data
    await Promise.all([
      Member.deleteMany({ gymId: gym._id }),
      Trainer.deleteMany({ gymId: gym._id }),
      Payment.deleteMany({ gymId: gym._id }),
      Attendance.deleteMany({ gymId: gym._id }),
      Lead.deleteMany({ gymId: gym._id }),
      User.findByIdAndDelete(gym.owner),
      gym.deleteOne()
    ]);

    return sendSuccess(res, 200, 'Gym and all related data deleted successfully.', null);
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardMetrics, getGyms, getGymDetails, updateGymPlan, editGym, deleteGym };

