const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorName: { type: String },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    recordId: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicalRecord' },
    medicines: [{
        medicineName: { type: String, required: true },
        dosage: String,
        frequency: String,
        duration: String
    }],
    status: { type: String, enum: ['active', 'expired', 'used'], default: 'active' },
    issuedDate: { type: Date, default: Date.now },
    expiryDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);
