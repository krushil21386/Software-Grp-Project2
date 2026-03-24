const mongoose = require('mongoose');

const otpTokenSchema = new mongoose.Schema({
    email: { type: String, required: true },
    otp: { type: String, required: true },
    type: { type: String, required: true, default: 'registration' },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false }
}, {
    timestamps: true
});

module.exports = mongoose.model('OtpToken', otpTokenSchema);
