const rateLimitMap = new Map();

/**
 * Pure JS In-Memory Rate Limiter Middleware
 * Does not require external npm dependencies.
 *
 * @param {number} limit - Maximum requests allowed in the time window
 * @param {number} windowMs - Time window in milliseconds (default: 15 minutes)
 */
const rateLimiter = (limit = 100, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    // Identify requester by IP address
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();

    if (!rateLimitMap.has(ip)) {
      rateLimitMap.set(ip, []);
    }

    let requests = rateLimitMap.get(ip);
    
    // Filter out requests outside the current time window
    requests = requests.filter(timestamp => now - timestamp < windowMs);

    if (requests.length >= limit) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests from this IP. Please try again in 15 minutes.',
      });
    }

    requests.push(now);
    rateLimitMap.set(ip, requests);
    next();
  };
};

module.exports = rateLimiter;
