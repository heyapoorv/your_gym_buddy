const express = require('express');
const { body } = require('express-validator');
const { signup, login, getProfile, changePassword, completeOnboarding, loginAsDemo } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ─── Validation Rules ─────────────────────────────────────────────────────

const signupValidation = [
  body('name').trim().notEmpty().withMessage('Full name is required.'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address.'),
  body('phone')
    .notEmpty().withMessage('Phone number is required.')
    .trim()
    .matches(/^[+\d][\d\s\-().]{7,}$/).withMessage('Please enter a valid phone number.'),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  body('gymName').optional().trim(),
  body('address.street').optional().trim(),
  body('address.city').optional().trim(),
  body('address.state').optional().trim(),
  body('address.pincode').optional().trim(),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address.'),
  body('password').notEmpty().withMessage('Password is required.'),
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required.'),
  body('newPassword')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters.'),
];

// ─── Routes ───────────────────────────────────────────────────────────────

router.post('/signup', signupValidation, signup);
router.post('/login', loginValidation, login);
router.post('/demo', loginAsDemo);
router.get('/profile', protect, getProfile);
router.put('/change-password', protect, changePasswordValidation, changePassword);
router.put('/onboarding', protect, completeOnboarding);

module.exports = router;
