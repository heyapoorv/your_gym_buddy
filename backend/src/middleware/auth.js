const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

/**
 * protect middleware
 * Verifies the JWT token sent in the Authorization header.
 * Attaches the authenticated user object to `req.user`.
 */
const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Not authorized. No token provided.', 401));
    }

    // Verify and decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user, explicitly include password:false fields
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    if (!user.isActive) {
      return next(new AppError('This account has been deactivated. Please contact support.', 403));
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please log in again.', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Your session has expired. Please log in again.', 401));
    }
    next(error);
  }
};

/**
 * authorize middleware factory
 * Restricts access to specific roles after `protect` runs.
 *
 * Usage: protect, authorize('superadmin', 'gym_owner')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Your role '${req.user.role}' is not permitted to perform this action.`,
          403
        )
      );
    }
    next();
  };
};

module.exports = { protect, authorize };
