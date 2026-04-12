const path = require('path');
const fs = require('fs');
const MedicalRecord = require('../models/MedicalRecord');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const User = require('../models/User');
const securityGateway = require('../services/securityGateway');
const { sendPrescriptionUpdateEmail } = require('../services/emailService');

const medicalRecordController = {
    /**
     * Get all medical records for the logged-in patient
     */
    async getMyRecords(req, res) {
        try {
            const userId = req.user.id;
            const records = await MedicalRecord.find({ patient: userId })
                .sort({ createdAt: -1 })
                .lean();

            // Also fetch prescriptions for this patient
            const prescriptions = await Prescription.find({ patientId: userId }).lean();

            // Attach prescriptions to the specific record they belong to
            const recordsWithRx = records.map(r => {
                const matchedRx = prescriptions.filter(
                    p => p.recordId?.toString() === r._id?.toString()
                );
                return { ...r, prescriptions: matchedRx };
            });
            
            res.json({
                success: true,
                count: recordsWithRx.length,
                data: recordsWithRx
            });
        } catch (error) {
            console.error('[medicalRecordController] Error fetching records:', error.message);
            res.status(500).json({ success: false, message: 'Failed to fetch medical records.' });
        }
    },

    /**
     * Get all patient records for the logged-in doctor
     * Joins through Appointments to find which patients this doctor has seen
     */
    async getDoctorRecords(req, res) {
        try {
            const doctorId = req.user.id;

            // Find all unique patient IDs from this doctor's appointments
            const appointments = await Appointment.find({ doctorId }).select('userId').lean();
            const patientIds = [...new Set(appointments.map(a => a.userId?.toString()).filter(Boolean))];

            if (patientIds.length === 0) {
                return res.json({ success: true, count: 0, data: [] });
            }

            // Fetch all medical records for these patients
            const records = await MedicalRecord.find({ patient: { $in: patientIds } })
                .populate('patient', 'name email phone age gender')
                .sort({ createdAt: -1 })
                .lean();

            // Also get prescriptions for these patients by this doctor
            const prescriptions = await Prescription.find({
                patientId: { $in: patientIds },
                doctorId: doctorId
            }).lean();

            // Attach prescriptions to the specific record they belong to
            const recordsWithRx = records.map(r => {
                const recordRx = prescriptions.filter(
                    p => p.recordId?.toString() === r._id?.toString()
                );
                return { ...r, prescriptions: recordRx };
            });

            res.json({
                success: true,
                count: recordsWithRx.length,
                data: recordsWithRx
            });
        } catch (error) {
            console.error('[medicalRecordController] Error fetching doctor records:', error.message);
            res.status(500).json({ success: false, message: 'Failed to fetch patient records.' });
        }
    },

    /**
     * Get records for a specific patient (for doctors/admins)
     */
    async getPatientRecords(req, res) {
        try {
            const { patientId } = req.params;
            const records = await MedicalRecord.find({ patient: patientId })
                .sort({ createdAt: -1 });
            
            res.json({
                success: true,
                count: records.length,
                data: records
            });
        } catch (error) {
            console.error('[medicalRecordController] Error fetching patient records:', error.message);
            res.status(500).json({ success: false, message: 'Failed to fetch records for this patient.' });
        }
    },

    /**
     * Update doctor comments or status
     */
    async updateRecord(req, res) {
        try {
            const { id } = req.params;
            const { doctorComments, status } = req.body;
            
            const updatedRecord = await MedicalRecord.findByIdAndUpdate(
                id,
                { doctorComments, status },
                { new: true, runValidators: true }
            );
            
            if (!updatedRecord) {
                return res.status(404).json({ success: false, message: 'Medical record not found.' });
            }
            
            res.json({
                success: true,
                data: updatedRecord
            });
        } catch (error) {
            console.error('[medicalRecordController] Error updating record:', error.message);
            res.status(500).json({ success: false, message: 'Failed to update record.' });
        }
    },

    /**
     * Upload a report for a patient (Doctor only - No AI analysis)
     */
    async uploadMedicalReport(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No report file uploaded.' });
            }

            const { patientId } = req.body;
            if (!patientId) {
                return res.status(400).json({ success: false, message: 'patientId is required.' });
            }

            // --- ACTIVE MALWARE SCAN ---
            const scanResult = await securityGateway.scanFile(req.file.path);
            if (!scanResult.safe) {
                if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
                return res.status(403).json({ 
                    success: false, 
                    message: 'Upload Blocked: File contains malicious patterns.',
                    threat: scanResult.threat 
                });
            }

            const fileUrl = `/uploads/${path.basename(req.file.path)}`;
            
            const newRecord = new MedicalRecord({
                patient: patientId,
                reportType: 'Doctor Uploaded Report',
                fileName: req.file.originalname,
                fileUrl: fileUrl,
                status: 'reviewed', // Since doctor uploaded it, it's considered reviewed
                analysis: {
                    summary: 'Report uploaded by doctor. Manual assessment required or pending.',
                    diseases: [],
                    key_findings: []
                }
            });

            await newRecord.save();

            res.status(201).json({
                success: true,
                message: 'Medical report uploaded successfully.',
                data: newRecord
            });
        } catch (error) {
            console.error('[medicalRecordController] Error uploading manual report:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to upload report.',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined 
            });
        }
    },

    /**
     * Upload a prescription for a record (Doctor only)
     */
    async uploadPrescription(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No prescription file uploaded.' });
            }

            // --- ACTIVE MALWARE SCAN ---
            const scanResult = await securityGateway.scanFile(req.file.path);
            if (!scanResult.safe) {
                if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
                return res.status(403).json({ 
                    success: false, 
                    message: 'Upload Blocked: Prescription file failed security scan.',
                    threat: scanResult.threat 
                });
            }

            const { id } = req.params;
            const prescriptionUrl = `/uploads/${path.basename(req.file.path)}`;
            
            const updatedRecord = await MedicalRecord.findByIdAndUpdate(
                id,
                { 
                    prescriptionUrl, 
                    prescriptionFileName: req.file.originalname,
                    status: 'reviewed'
                },
                { new: true }
            ).populate('patient', 'name email');

            if (!updatedRecord) {
                return res.status(404).json({ success: false, message: 'Medical record not found.' });
            }

            // Send email notification to patient
            try {
                if (updatedRecord.patient?.email) {
                    await sendPrescriptionUpdateEmail(
                        updatedRecord.patient,
                        req.user.name || 'Your Doctor',
                        'uploaded'
                    );
                }
            } catch (emailErr) {
                console.warn('[medicalRecordController] Email notification failed:', emailErr.message);
            }

            res.json({
                success: true,
                message: 'Prescription uploaded successfully.',
                data: updatedRecord
            });
        } catch (error) {
            console.error('[medicalRecordController] Error uploading prescription:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to upload prescription.',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined 
            });
        }
    },

    /**
     * Update prescription details (medicine text fields) for a record
     */
    async updatePrescriptionDetails(req, res) {
        try {
            const { id } = req.params;
            const { medicines, doctorComments } = req.body;

            // Find the record and patient
            const record = await MedicalRecord.findById(id).populate('patient', 'name email');
            if (!record) {
                return res.status(404).json({ success: false, message: 'Medical record not found.' });
            }

            // Find or create a prescription linked to this specific record
            let prescription = await Prescription.findOne({
                recordId: id,
                doctorId: req.user.id
            }).sort({ createdAt: -1 });

            if (prescription) {
                // Update existing
                prescription.medicines = medicines;
                prescription.status = 'active';
                await prescription.save();
            } else {
                // Create new
                prescription = await Prescription.create({
                    patientId: record.patient._id,
                    doctorId: req.user.id,
                    doctorName: req.user.name,
                    recordId: id,
                    medicines,
                    status: 'active',
                    issuedDate: new Date(),
                    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
                });
            }

            // Update doctor comments on the record
            if (doctorComments !== undefined) {
                record.doctorComments = doctorComments;
                record.status = 'reviewed';
                await record.save();
            }

            // Send email notification
            try {
                if (record.patient?.email) {
                    await sendPrescriptionUpdateEmail(
                        record.patient,
                        req.user.name || 'Your Doctor',
                        'updated'
                    );
                }
            } catch (emailErr) {
                console.warn('[medicalRecordController] Email notification failed:', emailErr.message);
            }

            res.json({
                success: true,
                message: 'Prescription details updated successfully.',
                data: { record, prescription }
            });
        } catch (error) {
            console.error('[medicalRecordController] Error updating prescription details:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to update prescription details.',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined 
            });
        }
    }
};

module.exports = medicalRecordController;
