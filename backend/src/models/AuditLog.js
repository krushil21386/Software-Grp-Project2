const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    action: { type: String, required: true }, // e.g., 'LOGIN_SUCCESS', 'APPOINTMENT_CANCELLED'
    category: { 
        type: String, 
        enum: ['AUTH', 'APPOINTMENT', 'USER', 'ADMIN', 'SYSTEM'], 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['SUCCESS', 'FAILURE', 'INFO', 'WARNING'], 
        default: 'SUCCESS' 
    },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    ipAddress: { type: String },
    location: { type: String }, // Resolved City, Country
    userAgent: { type: String },
    timestamp: { type: Date, default: Date.now }
}, {
    timestamps: false // We use our own timestamp
});

// Indexing for faster searching by admin
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ category: 1, action: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
