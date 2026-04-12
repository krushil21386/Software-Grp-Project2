const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: String,
    otp: String,
    type: String,
    used: Boolean,
    expiresAt: Date
});
const OtpToken = mongoose.model('OtpToken', otpSchema);

async function getLatestOtp() {
    await mongoose.connect(process.env.MONGO_URI);
    const token = await OtpToken.findOne({ email: 'testpatient@example.com' }).sort({ createdAt: -1 });
    // Note: The OTP is hashed in the DB, so I can't retrieve the plain text from here!
    // But wait, the otpService.js says:
    // "Store the HASHED OTP — plain text is never saved"
    console.log('Latest Hashed OTP Found:', token?.otp);
    process.exit(0);
}
getLatestOtp();
