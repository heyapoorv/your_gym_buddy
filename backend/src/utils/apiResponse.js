/**
 * Standardized API response helpers.
 * Ensures every response from the API has a consistent shape.
 *
 * Success:  { success: true,  message, data }
 * Error:    { success: false, message, error? }
 */

const sendSuccess = (res, statusCode = 200, message = 'Success', data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendError = (res, statusCode = 500, message = 'Internal Server Error', error = null) => {
  const payload = {
    success: false,
    message,
  };
  // Only expose error details in development
  if (error && process.env.NODE_ENV === 'development') {
    payload.error = error;
  }
  return res.status(statusCode).json(payload);
};

module.exports = { sendSuccess, sendError };
