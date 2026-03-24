const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
    phone: { type: String },
    age: { type: Number },
    gender: { type: String },
    address: { type: String },
    specialty: { type: String },
    license: { type: String },
    profileImage: { type: String },
    isVerified: { type: Boolean, default: false },
    isLocked: { type: Boolean, default: false },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    refreshToken: { type: String, default: null },
    lastLogin: { type: Date, default: null },
    knownLocations: { type: [String], default: [] }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
