const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    appointmentId: { type: String, required: true, unique: true },
    doctorName: { type: String, required: true },
    specialization: { type: String, required: true },
    clinicName: { type: String, required: true },
    clinicAddress: { type: String, required: true },
    doctorContact: { type: String, required: true },
    patientName: { type: String, required: true },
    patientEmail: { type: String, required: true },
    patientPhone: { type: String, required: true },
    patientAddress: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    mode: { type: String, enum: ['Online', 'Offline'], required: true, default: 'Offline' },
    status: { type: String, enum: ['upcoming', 'completed', 'cancelled'], required: true, default: 'upcoming' },
    isUrgent: { type: Boolean, default: false },
    rescheduleReason: { type: String },
    consultationFee: { type: Number, default: 500 }, // Default fee in INR
    paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
    paymentSessionId: { type: String },
    reminder24hSent: { type: Boolean, default: false },
    reminder2hSent: { type: Boolean, default: false }
}, {
    timestamps: true
});

// --- DATABASE CONSTRAINTS ---
// Prevent multiple 'upcoming' appointments for the same doctor at the same time slot.
appointmentSchema.index({ doctorId: 1, date: 1, time: 1 }, { 
    unique: true, 
    partialFilterExpression: { status: 'upcoming' } 
});

module.exports = mongoose.model('Appointment', appointmentSchema);
