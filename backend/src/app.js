require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ─── Security & Request Middleware ────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: '10kb' })); // Prevent large payload attacks
app.use(express.urlencoded({ extended: true }));

const rateLimiter = require('./middleware/rateLimiter');
app.use('/api', rateLimiter(200, 15 * 60 * 1000)); // Limit each IP to 200 requests per 15 minutes

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Health Check ─────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'GymOS API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/members', require('./routes/memberRoutes'));
app.use('/api/plans', require('./routes/planRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/trainers', require('./routes/trainerRoutes'));
app.use('/api/leads', require('./routes/leadRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/subscription', require('./routes/subscriptionRoutes'));


// ─── Unhandled Route Handler ──────────────────────────────────────────────
app.all('{*path}', (req, res, next) => {
  const AppError = require('./utils/AppError');
  next(new AppError(`Route ${req.originalUrl} not found on this server.`, 404));
});

// ─── Global Error Handler (must be last) ─────────────────────────────────
app.use(errorHandler);

module.exports = app;
