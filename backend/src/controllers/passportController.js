const MedicalRecord = require('../models/MedicalRecord');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const User = require('../models/User');
const ShareToken = require('../models/ShareToken');
const { v4: uuidv4 } = require('uuid');
const logger = require('../services/loggerService');

const passportController = {

    /**
     * GET /api/passport/data
     * Aggregates ALL health data for the authenticated patient.
     */
    async getPassportData(req, res) {
        try {
            const userId = req.user.id;

            // Fetch from all 3 collections in parallel
            const [records, appointments, prescriptions, user] = await Promise.all([
                MedicalRecord.find({ patient: userId }).sort({ createdAt: -1 }).lean(),
                Appointment.find({ userId }).sort({ createdAt: -1 }).lean(),
                Prescription.find({ patientId: userId }).sort({ createdAt: -1 }).lean(),
                User.findById(userId).select('name email phone age gender address createdAt').lean()
            ]);

            // Extract key health markers from AI analysis results
            const healthMarkers = [];
            records.forEach(record => {
                if (record.analysis && record.analysis.extractedValues) {
                    record.analysis.extractedValues.forEach(val => {
                        healthMarkers.push({
                            testName: val.testName,
                            value: val.value,
                            units: val.units,
                            status: val.status,
                            range: val.range,
                            date: record.createdAt
                        });
                    });
                }
            });

            // Extract diagnosis history
            const diagnoses = records
                .filter(r => r.analysis && r.analysis.disease)
                .map(r => ({
                    disease: r.analysis.disease,
                    confidence: r.analysis.confidenceScore,
                    summary: r.analysis.summary,
                    date: r.createdAt
                }));

            // Build stats
            const stats = {
                totalAppointments: appointments.length,
                completedAppointments: appointments.filter(a => a.status === 'completed').length,
                totalReports: records.length,
                activePrescriptions: prescriptions.filter(p => p.status === 'active').length,
                totalPrescriptions: prescriptions.length
            };

            res.json({
                success: true,
                data: {
                    patient: user,
                    stats,
                    appointments: appointments.map(a => ({
                        appointmentId: a.appointmentId,
                        doctorName: a.doctorName,
                        specialization: a.specialization,
                        clinicName: a.clinicName,
                        date: a.date,
                        time: a.time,
                        mode: a.mode,
                        status: a.status
                    })),
                    records: records.map(r => ({
                        reportType: r.reportType,
                        fileName: r.fileName,
                        status: r.status,
                        disease: r.analysis?.disease,
                        summary: r.analysis?.summary,
                        confidence: r.analysis?.confidenceScore,
                        findings: r.analysis?.diagnosisReport?.findings || [],
                        date: r.createdAt
                    })),
                    prescriptions: prescriptions.map(p => ({
                        doctorName: p.doctorName,
                        medicines: p.medicines,
                        status: p.status,
                        issuedDate: p.issuedDate,
                        expiryDate: p.expiryDate
                    })),
                    healthMarkers,
                    diagnoses
                }
            });
        } catch (error) {
            logger.error('[PassportController] Error fetching passport data:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch health passport data.' });
        }
    },

    /**
     * POST /api/passport/share
     * Generates a secure 24-hour share token (persisted in MongoDB with TTL).
     */
    async generateShareLink(req, res) {
        try {
            const userId = req.user.id;
            const token = uuidv4();
            const expiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000)); // 24 hours

            // Persist in MongoDB — TTL index auto-deletes after expiry
            await ShareToken.create({ token, userId, expiresAt });

            const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const shareUrl = `${baseUrl}/Software-Grp-Project/health-passport?share=${token}`;

            logger.info(`[PassportController] Share link generated for user ${userId}, expires ${expiresAt.toISOString()}`);

            res.json({
                success: true,
                shareUrl,
                token,
                expiresAt: expiresAt.toISOString()
            });
        } catch (error) {
            logger.error('[PassportController] Error generating share link:', error);
            res.status(500).json({ success: false, message: 'Failed to generate share link.' });
        }
    },

    /**
     * GET /api/passport/view/:token
     * Public endpoint — validates share token and returns read-only data.
     */
    async viewSharedPassport(req, res) {
        try {
            const { token } = req.params;
            
            // Look up token in MongoDB (TTL handles auto-expiry)
            const shareData = await ShareToken.findOne({ token });

            if (!shareData) {
                return res.status(404).json({ success: false, message: 'Invalid or expired share link.' });
            }

            if (shareData.expiresAt < new Date()) {
                // Manually expired (TTL may have slight delay)
                await ShareToken.deleteOne({ _id: shareData._id });
                return res.status(410).json({ success: false, message: 'This share link has expired.' });
            }

            const userId = shareData.userId;

            const [records, appointments, prescriptions, user] = await Promise.all([
                MedicalRecord.find({ patient: userId }).sort({ createdAt: -1 }).lean(),
                Appointment.find({ userId }).sort({ createdAt: -1 }).lean(),
                Prescription.find({ patientId: userId }).sort({ createdAt: -1 }).lean(),
                User.findById(userId).select('name age gender createdAt').lean() // Limited info for privacy
            ]);

            res.json({
                success: true,
                shared: true,
                expiresAt: shareData.expiresAt.toISOString(),
                data: {
                    patient: { name: user.name, age: user.age, gender: user.gender },
                    appointments: appointments.filter(a => a.status === 'completed').map(a => ({
                        doctorName: a.doctorName,
                        specialization: a.specialization,
                        date: a.date,
                        status: a.status
                    })),
                    records: records.map(r => ({
                        reportType: r.reportType,
                        disease: r.analysis?.disease,
                        summary: r.analysis?.summary,
                        confidence: r.analysis?.confidenceScore,
                        findings: r.analysis?.diagnosisReport?.findings || [],
                        date: r.createdAt
                    })),
                    prescriptions: prescriptions.map(p => ({
                        doctorName: p.doctorName,
                        medicines: p.medicines,
                        status: p.status,
                        issuedDate: p.issuedDate
                    }))
                }
            });
        } catch (error) {
            logger.error('[PassportController] Error viewing shared passport:', error);
            res.status(500).json({ success: false, message: 'Failed to load shared health passport.' });
        }
    }
};

module.exports = passportController;
