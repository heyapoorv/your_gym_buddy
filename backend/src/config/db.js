const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the URI from environment variables.
 * Isolated into its own module so server.js stays clean.
 * Will terminate the process on failure to prevent a broken server state.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
