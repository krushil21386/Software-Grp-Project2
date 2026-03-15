require('dotenv').config();
const app = require('./app');
const sequelize = require('./config/db');
const fs = require('fs');
const path = require('path');

// Pre-load all models so Sequelize syncs all tables
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

// Sync Database (alter: true updates columns without dropping data)
sequelize.sync({ alter: true })
    .then(() => {
        console.log('✅ Database synced (all tables up to date)');
        app.listen(PORT, () => {
            console.log(`✅ Backend server running on port ${PORT}`);
            console.log(`   Health:          http://localhost:${PORT}/health`);
            console.log(`   Auth Register:   POST http://localhost:${PORT}/api/auth/register`);
            console.log(`   Auth Login:      POST http://localhost:${PORT}/api/auth/login`);
            console.log(`   Verify OTP:      POST http://localhost:${PORT}/api/auth/verify-otp`);
            console.log(`   AI Analysis:     POST http://localhost:${PORT}/api/ai/analyze`);
        });
    })
    .catch(err => {
        console.error('❌ Failed to sync database:', err);
        app.listen(PORT, () => {
            console.log(`⚠️  Backend running on port ${PORT} (DB sync failed)`);
        });
    });
