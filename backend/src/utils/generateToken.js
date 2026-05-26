const jwt = require('jsonwebtoken');

/**
 * Generates a signed JWT for a given user ID.
 * Expiry is read from environment to allow easy config changes.
 *
 * @param {string} id - MongoDB ObjectId of the user
 * @returns {string} Signed JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

module.exports = generateToken;
