const path = require('path');
const mongoose = require('mongoose');
const User = require('../../src/models/User');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const checkUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email: 'admin@medicare.com' });
        if (user) {
            console.log('USER_FOUND:', JSON.stringify({
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified
            }));
        } else {
            console.log('USER_NOT_FOUND');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
checkUser();
