const mongoose = require('mongoose');
const User = require('../models/User');
const sync = require('../sync/syncManager');
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
    sync.startRealtimeSync('User', User);
    sync.startReversePolling('User', User);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = { connectDB };
