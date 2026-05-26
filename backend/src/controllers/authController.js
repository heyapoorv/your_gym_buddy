const User = require('../models/User');
const Gym = require('../models/Gym');
const generateToken = require('../utils/generateToken');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');
const { validationResult } = require('express-validator');
const { PLAN_CONFIG } = require('../config/plans');

// ─── Helper ──────────────────────────────────────────────────────────────

const buildUserPayload = (user, gym, token) => ({
  token,
  user: {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address,
    role: user.role,
    gymId: user.gymId,
    gymName: gym?.name || null,
    isActive: user.isActive,
    // ─── SaaS Subscription Fields ──────────────────────────
    gymPlan: gym?.plan || null,
    gymSubscriptionStatus: gym?.subscriptionStatus || null,
    gymOnboardingComplete: gym?.onboardingComplete || false,
    gymTrialEndsAt: gym?.trialEndsAt || null,
    gymPlanStartsAt: gym?.planStartsAt || null,
    gymPlanExpiresAt: gym?.planExpiresAt || null,
    gymMaxMembers: gym?.maxMembers ?? null,
    gymMaxStaff: gym?.maxStaff ?? null,
    gymMaxBranches: gym?.maxBranches ?? null,
  },
});

// ─── Controllers ─────────────────────────────────────────────────────────

/**
 * @desc    Register a new Gym Owner — collects name, email, phone, address
 * @route   POST /api/auth/signup
 * @access  Public
 */
const signup = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new AppError(errors.array()[0].msg, 400));

    const { name, email, phone, address, password, gymName } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return next(new AppError('An account with this email already exists.', 409));

    const user = await User.create({
      name,
      email,
      phone: phone || null,
      address: address || {},
      password,
      role: 'gym_owner',
    });

    // ─── Initialize SaaS Trial ────────────────────────────────────
    const trialPlan = PLAN_CONFIG.trial;
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trialPlan.durationDays);

    const gym = await Gym.create({
      name: gymName || `${name}'s Gym`,
      owner: user._id,
      phone: phone || null,
      email: email,
      // Subscription bootstrap
      plan: 'trial',
      subscriptionStatus: 'trial',
      trialEndsAt,
      maxMembers: trialPlan.maxMembers,
      maxStaff: trialPlan.maxStaff,
      maxBranches: trialPlan.maxBranches,
      subscriptionHistory: [
        {
          plan: 'trial',
          status: 'trial',
          startedAt: new Date(),
          note: 'Trial started on signup.',
        },
      ],
    });

    user.gymId = gym._id;
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);
    return sendSuccess(res, 201, 'Account created successfully.', buildUserPayload(user, gym, token));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user and return JWT
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new AppError(errors.array()[0].msg, 400));

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) return next(new AppError('Invalid email or password.', 401));

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return next(new AppError('Invalid email or password.', 401));

    if (!user.isActive) return next(new AppError('This account has been deactivated.', 403));

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const gym = user.gymId
      ? await Gym.findById(user.gymId).select(
          'name plan subscriptionStatus trialEndsAt planStartsAt planExpiresAt maxMembers maxStaff maxBranches onboardingComplete'
        )
      : null;
    const token = generateToken(user._id);

    return sendSuccess(res, 200, 'Logged in successfully.', buildUserPayload(user, gym, token));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return next(new AppError('User not found.', 404));

    const gym = user.gymId
      ? await Gym.findById(user.gymId).select(
          'name plan subscriptionStatus trialEndsAt planStartsAt planExpiresAt maxMembers maxStaff maxBranches address phone email onboardingComplete'
        )
      : null;

    return sendSuccess(res, 200, 'Profile fetched successfully.', {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        gymId: user.gymId,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
      gym,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change password only — email and phone are immutable
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new AppError(errors.array()[0].msg, 400));

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!user) return next(new AppError('User not found.', 404));

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return next(new AppError('Current password is incorrect.', 401));

    if (currentPassword === newPassword) {
      return next(new AppError('New password must be different from the current password.', 400));
    }

    user.password = newPassword; // pre-save hook will hash this
    await user.save();

    return sendSuccess(res, 200, 'Password changed successfully.', {});
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Complete Gym Onboarding
 * @route   PUT /api/auth/onboarding
 * @access  Private (gym_owner)
 */
const completeOnboarding = async (req, res, next) => {
  try {
    const gym = await Gym.findById(req.user.gymId);
    if (!gym) return next(new AppError('Gym not found.', 404));

    gym.onboardingComplete = true;
    await gym.save();

    return sendSuccess(res, 200, 'Onboarding completed successfully.', { onboardingComplete: true });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login to Interactive Demo
 * @route   POST /api/auth/demo
 * @access  Public
 */
const loginAsDemo = async (req, res, next) => {
  try {
    // Hardcoded demo credentials seeded in DB
    const email = 'demo@gymos.com';
    const user = await User.findOne({ email }).select('+password');
    if (!user) return next(new AppError('Demo account not found. Please run seed script.', 404));

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const gym = user.gymId
      ? await Gym.findById(user.gymId).select(
          'name plan subscriptionStatus trialEndsAt planStartsAt planExpiresAt maxMembers maxStaff maxBranches onboardingComplete'
        )
      : null;
    const token = generateToken(user._id);

    return sendSuccess(res, 200, 'Logged in to Demo successfully.', buildUserPayload(user, gym, token));
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login, getProfile, changePassword, completeOnboarding, loginAsDemo };
