require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const fs = require('fs');
const path = require('path');

// Pre-load all models
require('./models/User');
require('./models/OtpToken');
require('./models/Session');
require('./models/Appointment');

const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const { initCronJobs } = require('./services/cronService');

// Connect to MongoDB and Start Server
connectDB().then(() => {
    const server = app.listen(PORT, () => {
        console.log(`✅ Backend server running on port ${PORT}`);
        
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
    });
});
