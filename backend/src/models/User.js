const mongoose = require('mongoose');
const securityGateway = require('../services/securityGateway');

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
    failedLoginAttempts: { type: Number, default: 0 },
    isLocked: { type: Boolean, default: false },
    lockUntil: { type: Date },
    lastLogin: { type: Date },
    refreshToken: { type: String },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
    managedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});

// --- PHI ENCRYPTION HOOKS & VALIDATION ---
userSchema.pre('save', async function() {
    // Ensure email is always stored in lowercase for unique indexing
    if (this.isModified('email') && this.email) {
        this.email = this.email.toLowerCase();
    }

    if (this.isModified('phone') && this.phone) {
        this.phone = securityGateway.encrypt(this.phone);
    }
    if (this.isModified('address') && this.address) {
        this.address = securityGateway.encrypt(this.address);
    }
});

// Decryption after retrieval
userSchema.post('init', function(doc) {
    if (doc.phone) {
        doc.phone = securityGateway.decrypt(doc.phone);
    }
    if (doc.address) {
        doc.address = securityGateway.decrypt(doc.address);
    }
});

module.exports = mongoose.model('User', userSchema);
