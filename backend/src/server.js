require('dotenv').config();
const logger = require('./services/loggerService');

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', { promise, reason });
});
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
});
const app = require('./app');
const connectDB = require('./config/db');
const fs = require('fs');
const path = require('path');

// Pre-load all models (ensures indexes are created on startup)
require('./models/User');
require('./models/OtpToken');
require('./models/Session');
require('./models/Appointment');
require('./models/ShareToken');

const PORT = process.env.PORT || 5000;

// Ensure system directories exist
['../uploads', '../logs'].forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath);
    }
});

const { initCronJobs } = require('./services/cronService');

// Connect to MongoDB and Start Server
connectDB().then(() => {
    const server = app.listen(PORT, () => {
        console.log(`✅ Backend server running on port ${PORT}`);
        
        try {
          // Initialize Socket.io
          const socketIO = require('./socket');
          socketIO.init(server);
          console.log(`📡 Socket.io initialized`);
          
          // Start background email reminders
          initCronJobs();

          console.log(`   Health:          http://localhost:${PORT}/health`);
          console.log(`   Auth Register:   POST http://localhost:${PORT}/api/auth/register`);
          console.log(`   Auth Login:      POST http://localhost:${PORT}/api/auth/login`);
          console.log(`   Verify OTP:      POST http://localhost:${PORT}/api/auth/verify-otp`);
          console.log(`   AI Analysis:     POST http://localhost:${PORT}/api/ai/analyze`);
        } catch (initErr) {
          console.error('❌ Critical failure during service initialization:', initErr);
        }
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please kill the other process or use a different port.`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', err);
      }
    });
}).catch(err => {
    console.error('⚠️ Warning: Database connection issue detected, but server will remain alive:', err.message);
    // Removed process.exit(1) to prevent complete process termination
});

// ── Graceful Shutdown ─────────────────────────────────────────────
const gracefulShutdown = (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    process.exit(0);
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));
process.on('exit', (code) => {
    logger.info(`Process exiting with code: ${code}`);
});
