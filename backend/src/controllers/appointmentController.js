const { v4: uuidv4 } = require('uuid');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { sendAppointmentConfirmationEmail } = require('../services/emailService');

const appointmentController = {

    /**
     * POST /book-appointment
     * Books a new appointment for the authenticated user.
     * Generates a unique appointmentId, saves to DB, and sends confirmation email.
     */
    async bookAppointment(req, res) {
        try {
            const userId = req.user.id; // From JWT authenticate middleware

            const {
                doctorName,
                specialization,
                clinicName,
                clinicAddress,
                doctorContact,
                patientName,
                patientEmail,
                patientPhone,
                patientAddress,
                date,
                time,
                mode
            } = req.body;

            // If the user has profile data in DB, prefer it — otherwise use request body
            const userRecord = await User.findByPk(userId);
            const resolvedPatientName  = patientName  || userRecord?.name;
            const resolvedPatientEmail = patientEmail || userRecord?.email;
            const resolvedPatientPhone = patientPhone || userRecord?.phone;
            const resolvedPatientAddr  = patientAddress || userRecord?.address;

            // Validate required fields (doctor + appointment always required, patient can be resolved from user profile)
            const required = {
                doctorName,
                specialization,
                clinicName,
                clinicAddress,
                doctorContact,
                date,
                time,
                mode,
                patientName: resolvedPatientName,
                patientEmail: resolvedPatientEmail,
                patientPhone: resolvedPatientPhone,
                patientAddress: resolvedPatientAddr
            };
            const missing = Object.keys(required).filter(k => !required[k]);
            if (missing.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Missing required fields: ${missing.join(', ')}`
                });
            }

            // Generate a unique appointment reference ID
            const appointmentId = `APT-${uuidv4().split('-')[0].toUpperCase()}`;

            const appointment = await Appointment.create({
                userId,
                appointmentId,
                doctorName,
                specialization,
                clinicName,
                clinicAddress,
                doctorContact,
                patientName:    resolvedPatientName,
                patientEmail:   resolvedPatientEmail,
                patientPhone:   resolvedPatientPhone,
                patientAddress: resolvedPatientAddr,
                date,
                time,
                mode,
                status: 'upcoming'
            });

            // Send confirmation email — non-blocking so booking succeeds even if email fails
            sendAppointmentConfirmationEmail(appointment.toJSON()).catch(err => {
                console.error('⚠️  Email send failed (booking still saved):', err.message);
            });

            return res.status(201).json({
                success: true,
                message: 'Appointment booked successfully. Confirmation email sent.',
                appointmentId: appointment.appointmentId,
                appointment
            });

        } catch (error) {
            console.error('bookAppointment error:', error);
            return res.status(500).json({ success: false, message: 'Failed to book appointment' });
        }
    },

    /**
     * GET /my-appointments
     * Returns ONLY the appointments belonging to the authenticated user.
     * Separates them into upcoming and completed arrays.
     */
    async getMyAppointments(req, res) {
        try {
            const userId = req.user.id;

            const all = await Appointment.findAll({
                where: { userId },
                order: [['date', 'ASC'], ['time', 'ASC']]
            });

            // Split into upcoming (includes only 'upcoming') and completed
            const upcoming  = all.filter(a => a.status === 'upcoming');
            const completed = all.filter(a => a.status === 'completed');
            const cancelled = all.filter(a => a.status === 'cancelled');

            return res.json({
                success: true,
                total: all.length,
                upcoming,
                completed,
                cancelled
            });

        } catch (error) {
            console.error('getMyAppointments error:', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch appointments' });
        }
    },

    // ─── Existing handlers (kept for backward compatibility) ─────────────────

    async create(req, res) {
        try {
            const { patientId, doctorId, hospitalId, date, time, reason, notes } = req.body;
            const newAppointment = await Appointment.create({
                userId: patientId, // map legacy patientId → userId
                appointmentId: `APT-${uuidv4().split('-')[0].toUpperCase()}`,
                doctorName: `Doctor #${doctorId}`,
                specialization: 'General',
                clinicName: `Hospital #${hospitalId}`,
                clinicAddress: 'N/A', doctorContact: 'N/A',
                patientName: 'Patient', patientEmail: 'N/A',
                patientPhone: 'N/A', patientAddress: 'N/A',
                date, time, mode: 'Offline', status: 'upcoming'
            });
            res.json({ success: true, appointment: newAppointment });
        } catch (error) {
            console.error('Create Appointment Error:', error);
            res.status(500).json({ success: false, message: 'Failed to create appointment' });
        }
    },

    async getAll(req, res) {
        try {
            const { patientId, status } = req.query;
            const where = {};
            if (patientId) where.userId = patientId;
            if (status)    where.status = status;
            const appointments = await Appointment.findAll({ where });
            res.json({ success: true, appointments });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch appointments' });
        }
    },

    async getById(req, res) {
        try {
            const appointment = await Appointment.findByPk(req.params.id);
            if (appointment) {
                res.json({ success: true, appointment });
            } else {
                res.status(404).json({ success: false, message: 'Appointment not found' });
            }
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error fetching appointment' });
        }
    },

    async update(req, res) {
        try {
            const appointment = await Appointment.findByPk(req.params.id);
            if (appointment) {
                await appointment.update(req.body);
                res.json({ success: true, appointment });
            } else {
                res.status(404).json({ success: false, message: 'Appointment not found' });
            }
        } catch (error) {
            res.status(500).json({ success: false, message: 'Update failed' });
        }
    },

    async updateStatus(req, res) {
        try {
            const action = req.path.split('/').pop();
            let newStatus = 'upcoming';
            if (action === 'reject')   newStatus = 'cancelled';
            if (action === 'complete') newStatus = 'completed';

            const appointment = await Appointment.findByPk(req.params.id);
            if (appointment) {
                await appointment.update({ status: newStatus });
                res.json({ success: true, message: `Appointment ${newStatus}` });
            } else {
                res.status(404).json({ success: false, message: 'Appointment not found' });
            }
        } catch (error) {
            res.status(500).json({ success: false, message: 'Status update failed' });
        }
    },

    async delete(req, res) {
        try {
            const appointment = await Appointment.findByPk(req.params.id);
            if (appointment) {
                await appointment.update({ status: 'cancelled' });
                res.json({ success: true, message: 'Appointment cancelled' });
            } else {
                res.status(404).json({ success: false, message: 'Appointment not found' });
            }
        } catch (error) {
            res.status(500).json({ success: false, message: 'Delete failed' });
        }
    }
};

module.exports = appointmentController;
