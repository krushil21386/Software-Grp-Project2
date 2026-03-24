const { v4: uuidv4 } = require('uuid');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { sendAppointmentConfirmationEmail, sendCancellationEmail, sendRescheduleEmail } = require('../services/emailService');
const socketIO = require('../socket');
const loggingService = require('../services/loggingService');

const appointmentController = {

    /**
     * POST /book-appointment
     */
    async bookAppointment(req, res) {
        try {
            const userId = req.user.id;

            const {
                doctorId,
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

            const userRecord = await User.findById(userId);
            const resolvedPatientName  = patientName  || userRecord?.name;
            const resolvedPatientEmail = patientEmail || userRecord?.email;
            const resolvedPatientPhone = patientPhone || userRecord?.phone;
            const resolvedPatientAddr  = patientAddress || userRecord?.address;

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

            const appointmentId = `APT-${uuidv4().split('-')[0].toUpperCase()}`;

            const appointment = await Appointment.create({
                userId,
                doctorId,
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

            sendAppointmentConfirmationEmail(appointment.toJSON()).catch(err => {
                console.error('⚠️  Email send failed (booking still saved):', err.message);
            });

            // Emit real-time update
            socketIO.getIO().emit('analytics_update', { doctorId, doctorName });

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
     */
    async getMyAppointments(req, res) {
        try {
            const { id: userId, role } = req.user;
            let all = [];

            if (role === 'doctor') {
                const doctorUser = await User.findById(userId);
                console.log(`[DEBUG] Doctor Dashboard Search: ID=${userId}, Name="${doctorUser?.name}"`);
                // Search by doctorId OR doctorName (for legacy/missing data)
                all = await Appointment.find({
                    $or: [
                        { doctorId: userId },
                        { doctorName: doctorUser.name }
                    ]
                }).sort({ date: 1, time: 1 });
                console.log(`[DEBUG] Found ${all.length} appointments for doctor`);
            } else {
                all = await Appointment.find({ userId }).sort({ date: 1, time: 1 });
            }

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

    async create(req, res) {
        try {
            const { patientId, doctorId, hospitalId, date, time, reason, notes } = req.body;
            const newAppointment = await Appointment.create({
                userId: patientId,
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
            const filter = {};
            if (patientId) filter.userId = patientId;
            if (status)    filter.status = status;
            const appointments = await Appointment.find(filter);
            res.json({ success: true, appointments });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch appointments' });
        }
    },

    async getById(req, res) {
        try {
            const appointment = await Appointment.findById(req.params.id);
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
            const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (appointment) {
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

            const appointment = await Appointment.findByIdAndUpdate(req.params.id, { status: newStatus }, { new: true });
            if (appointment) {
                if (newStatus === 'cancelled') {
                    const reason = req.body.reason || 'Not provided';
                    sendCancellationEmail(appointment.toJSON(), reason).catch(err => {
                        console.error('⚠️  Cancellation email failed:', err);
                    });
                }
                
                // Emit real-time update
                socketIO.getIO().emit('analytics_update', { 
                    doctorId: appointment.doctorId, 
                    doctorName: appointment.doctorName 
                });
                
                res.json({ success: true, message: `Appointment ${newStatus}` });
            } else {
                res.status(404).json({ success: false, message: 'Appointment not found' });
            }
        } catch (error) {
            res.status(500).json({ success: false, message: 'Status update failed' });
        }
    },

    async reschedule(req, res) {
        try {
            const { date, time, reason } = req.body;
            if (!date || !time) {
                return res.status(400).json({ success: false, message: 'New date and time are required.' });
            }

            const appointment = await Appointment.findById(req.params.id);
            if (!appointment) {
                return res.status(404).json({ success: false, message: 'Appointment not found' });
            }

            // reset reminders so they trigger again if applicable
            appointment.date = date;
            appointment.time = time;
            appointment.reminder24hSent = false;
            appointment.reminder2hSent = false;
            // if it was cancelled, make it upcoming again
            appointment.status = 'upcoming';

            await appointment.save();

            sendRescheduleEmail(appointment.toJSON(), date, time, reason || 'Not provided').catch(err => {
                console.error('⚠️  Reschedule email failed:', err);
            });

            // Emit real-time update
            socketIO.getIO().emit('analytics_update', { 
                status: 'upcoming', // Explicitly include status
                appointmentId: appointment._id, // Include appointment ID
                doctorId: appointment.doctorId, 
                doctorName: appointment.doctorName 
            });

            // Audit Log (Non-blocking)
            loggingService.recordLog(req, {
                userId: req.user.id,
                action: 'APPOINTMENT_RESCHEDULED',
                category: 'APPOINTMENT',
                details: { appointmentId: appointment.appointmentId, doctorName: appointment.doctorName, newDate: date, newTime: time }
            });

            res.json({ success: true, message: 'Appointment rescheduled successfully', appointment });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Reschedule failed' });
        }
    },

    async delete(req, res) {
        try {
            const appointment = await Appointment.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true });
            if (appointment) {
                sendCancellationEmail(appointment.toJSON(), 'Canceled by user deleted').catch(err => console.error('Email error:', err));
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
