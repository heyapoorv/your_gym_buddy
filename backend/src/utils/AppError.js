/**
 * Custom operational error class.
 * Allows controllers to throw structured errors that
 * the centralized error handler can interpret.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Distinguishes from programmer errors

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
