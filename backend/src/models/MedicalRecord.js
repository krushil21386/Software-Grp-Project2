const mongoose = require('mongoose');
const securityGateway = require('../services/securityGateway');

const medicalRecordSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reportType: {
        type: String,
        required: true
    },
    fileName: {
        type: String
    },
    fileUrl: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed'],
        default: 'pending'
    },
    analysis: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    doctorComments: {
        type: String
    },
    prescriptionUrl: {
        type: String
    },
    prescriptionFileName: {
        type: String
    }
}, {
    timestamps: true
});

// --- ENCRYPTION HOOKS ---
medicalRecordSchema.pre('save', function() {
    if (this.analysis) {
        // Only encrypt if it's an object (new/updated data) or a non-encrypted string
        const isEncrypted = typeof this.analysis === 'string' && this.analysis.includes(':');
        
        if (typeof this.analysis === 'object') {
            const stringified = JSON.stringify(this.analysis);
            this.analysis = securityGateway.encrypt(stringified);
        } else if (typeof this.analysis === 'string' && !isEncrypted) {
            this.analysis = securityGateway.encrypt(this.analysis);
        }
    }
});

medicalRecordSchema.post('init', function(doc) {
    if (doc.analysis && typeof doc.analysis === 'string' && doc.analysis.includes(':')) {
        const decrypted = securityGateway.decrypt(doc.analysis);
        try {
            doc.analysis = JSON.parse(decrypted);
        } catch (e) {
            doc.analysis = decrypted;
        }
    }
});

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
