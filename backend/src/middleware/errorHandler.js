const AppError = require('../utils/AppError');

/**
 * Centralized Global Error Handler Middleware
 * 
 * Handles all errors passed via next(error).
 * Differentiates between:
 *  - Operational errors (AppError): Safe to expose to client
 *  - Mongoose errors: Cast, validation, duplicate key
 *  - JWT errors: Invalid/expired tokens  
 *  - Unknown errors: Generic 500 in production, detailed in dev
 */

// ─── Mongoose Error Handlers ──────────────────────────────────────────────

const handleCastErrorDB = (err) => {
  const message = `Invalid value for field '${err.path}': ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `An account with ${field} '${value}' already exists.`;
  return new AppError(message, 409);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Validation failed: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// ─── Response Senders ─────────────────────────────────────────────────────

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  } else {
    // Programming or unknown error: don't leak details
    console.error('💥 UNEXPECTED ERROR:', err);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.',
    });
  }
};

// ─── Main Error Handler ───────────────────────────────────────────────────

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err, message: err.message };

    // Transform known Mongoose/JWT errors into AppErrors
    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error);

    sendErrorProd(error, res);
  }
};

module.exports = errorHandler;
