const mongoose = require('mongoose');
const User = require('./src/models/User');
const authService = require('./src/services/authService');
require('dotenv').config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const adminEmail = 'admin@medicare.com';
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        const hashedPassword = await authService.hashPassword('Admin@123');

        const admin = new User({
            name: 'System Administrator',
            email: adminEmail,
            password: hashedPassword,
            role: 'admin',
            isVerified: true
        });

        await admin.save();
        console.log('Admin user created successfully!');
        console.log('Email: admin@medicare.com');
        console.log('Password: Admin@123');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
