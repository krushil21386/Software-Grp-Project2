const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../../src/models/User');
const AuditLog = require('../../src/models/AuditLog');
const loggingService = require('../../src/services/loggingService');
const securityService = require('../../src/services/securityService');

async function testAudit() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Create a test admin user if not exists
        let admin = await User.findOne({ email: 'admin@test.com' });
        if (!admin) {
            admin = await User.create({
                name: 'Admin User',
                email: 'admin@test.com',
                password: 'password123',
                role: 'admin',
                isVerified: true
            });
            console.log('Created test admin user');
        }

        // 2. Simulate a login attempt (Manual Logging)
        const mockReq = {
            user: { id: admin._id, role: 'admin' },
            headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            ip: '8.8.8.8' // Google Public DNS IP for GeoIP lookup
        };

        console.log('Recording mock login...');
        const { location } = await loggingService.recordLog(mockReq, {
            userId: admin._id,
            action: 'LOGIN_SUCCESS',
            category: 'AUTH',
            status: 'SUCCESS'
        });
        console.log(`Resolved location: ${location}`);

        // 3. Verify Log Exists
        const lastLog = await AuditLog.findOne({ userId: admin._id }).sort({ timestamp: -1 });
        if (lastLog) {
            console.log('✅ Audit Log successfully created in DB');
            console.log(`Log Action: ${lastLog.action}, IP: ${lastLog.ipAddress}, Loc: ${lastLog.location}`);
        } else {
            console.error('❌ Failed to find Audit Log in DB');
        }

        // 4. Test MFA Recognition
        const isRecognized = await securityService.isLocationRecognized(admin._id, 'New York, US');
        console.log(`Is "New York, US" recognized? ${isRecognized}`);
        
        // It should be false unless we just logged in from there (8.8.8.8 might be Mountain View, CA)
        if (!isRecognized) {
            console.log('✅ Risk-Based MFA correctly flagged unrecognized location');
        } else {
            console.log('ℹ️ Location was recognized (maybe history matched)');
        }

        console.log('\nVerification complete!');
        process.exit(0);
    } catch (err) {
        console.error('Test Error:', err);
        process.exit(1);
    }
}

testAudit();
