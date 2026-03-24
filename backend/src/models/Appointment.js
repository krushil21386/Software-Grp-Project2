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
    reminder24hSent: { type: Boolean, default: false },
    reminder2hSent: { type: Boolean, default: false }
}, {
    timestamps: true
});

module.exports = mongoose.model('Appointment', appointmentSchema);
