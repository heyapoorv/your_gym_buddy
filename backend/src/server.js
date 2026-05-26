require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const initCronJobs = require('./jobs/cronJobs');

// Handle uncaught exceptions synchronously
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;
let server;

// Start server asynchronously to guarantee DB connection first
const startServer = async () => {
  try {
    await connectDB();
    
    // Initialize background jobs
    initCronJobs();

    server = app.listen(PORT, () => {
      console.log(`🚀 GymOS Server running on port ${PORT} [${process.env.NODE_ENV}]`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

// ─── Graceful Shutdown ─────────────────────────────────────────────────
// Ensures in-flight requests complete before shutting down
const shutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('✅ HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ─── Unhandled Rejections ──────────────────────────────────────────────
process.on('unhandledRejection', (err) => {
  console.error('💥 UNHANDLED REJECTION:', err.name, err.message);
  server.close(() => process.exit(1));
});

startServer();
