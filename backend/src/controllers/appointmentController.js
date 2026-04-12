const { v4: uuidv4 } = require('uuid');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { sendAppointmentConfirmationEmail, sendCancellationEmail, sendRescheduleEmail } = require('../services/emailService');
const socketIO = require('../socket');
const loggingService = require('../services/loggingService');
const logger = require('../services/loggerService');

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

            // --- ATOMIC LOCK CHECK: Prevent Double Booking ---
            // Ensure the doctor doesn't already have an 'upcoming' appointment at this exact date and time.
            const existingBookings = await Appointment.findOne({
                doctorId,
                date,
                time,
                status: 'upcoming'
            });

            if (existingBookings) {
                return res.status(409).json({
                    success: false,
                    message: `Dr. ${doctorName} is already booked on ${date} at ${time}. Please select another available slot.`
                });
            }
            // -------------------------------------------------

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
                logger.error('⚠️  Email send failed (booking still saved):', err.message);
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
            logger.error('bookAppointment error:', error);
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
                logger.info(`[DoctorDashboard] Fetching appointments for ID=${userId}, Name="${doctorUser?.name}"`);
                // Search by doctorId OR doctorName (for legacy/missing data)
                all = await Appointment.find({
                    $or: [
                        { doctorId: userId },
                        { doctorName: doctorUser.name }
                    ]
                }).sort({ date: 1, time: 1 });
                logger.info(`[DoctorDashboard] Found ${all.length} appointments`);
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
            logger.error('getMyAppointments error:', error);
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
            logger.error('Create Appointment Error:', error);
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

            // ENFORCE REASON FOR REJECTION
            if (newStatus === 'cancelled' && !req.body.reason) {
                return res.status(400).json({ success: false, message: 'A reason for rejection is required.' });
            }

            const appointment = await Appointment.findByIdAndUpdate(req.params.id, { status: newStatus }, { new: true });
            if (appointment) {
                if (newStatus === 'cancelled') {
                    const reason = req.body.reason;
                    sendCancellationEmail(appointment.toJSON(), reason).catch(err => {
                        logger.error('⚠️  Cancellation email failed:', err);
                    });
                }
                
                // Emit real-time update for analytics
                socketIO.getIO().emit('analytics_update', { 
                    doctorId: appointment.doctorId, 
                    doctorName: appointment.doctorName 
                });

                // --- NEW: TARGETED NOTIFICATION ---
                // Notify the specific patient about the status change
                socketIO.getIO().emit('appointment_status_update', {
                    appointmentId: appointment._id,
                    newStatus,
                    message: `Your appointment with Dr. ${appointment.doctorName} has been ${newStatus}.`
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
            if (!date || !time || !reason) {
                return res.status(400).json({ success: false, message: 'New date, time, and a reason are required.' });
            }

            const appointment = await Appointment.findById(req.params.id);
            if (!appointment) {
                return res.status(404).json({ success: false, message: 'Appointment not found' });
            }

            // --- ATOMIC LOCK CHECK: Prevent Double Booking on Reschedule ---
            const existingBookings = await Appointment.findOne({
                doctorId: appointment.doctorId,
                date,
                time,
                status: 'upcoming',
                _id: { $ne: appointment._id } // Ignore the current appointment being rescheduled
            });

            if (existingBookings) {
                return res.status(409).json({
                    success: false,
                    message: `Dr. ${appointment.doctorName} is already booked on ${date} at ${time}. Please select another available slot.`
                });
            }
            // ---------------------------------------------------------------

            // reset reminders so they trigger again if applicable
            appointment.date = date;
            appointment.time = time;
            appointment.rescheduleReason = reason;
            appointment.reminder24hSent = false;
            appointment.reminder2hSent = false;
            // if it was cancelled, make it upcoming again
            appointment.status = 'upcoming';

            await appointment.save();

            sendRescheduleEmail(appointment.toJSON(), date, time, reason).catch(err => {
                logger.error('⚠️  Reschedule email failed:', err);
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

    async getHeatmap(req, res) {
        try {
            const { id: userId, role } = req.user;
            const targetDoctorId = req.query.doctorId; // Optional query param
            
            let filter = { status: { $ne: 'cancelled' } };

            if (targetDoctorId) {
                // If a specific doctor is requested (e.g., by a patient or admin)
                const doctorUser = await User.findById(targetDoctorId);
                filter.$or = [
                    { doctorId: targetDoctorId },
                    { doctorName: doctorUser?.name || 'Unknown' }
                ];
            } else if (role === 'doctor') {
                // Default to current doctor's own data if no doctorId was provided
                const doctorUser = await User.findById(userId);
                filter.$or = [
                    { doctorId: userId },
                    { doctorName: doctorUser?.name || 'Unknown' }
                ];
            } else if (role === 'admin') {
                // Admins see a global heatmap if no doctorId provided (already covered by filter init)
            } else {
                // Patients/Others MUST provide a doctorId if they want recommendations
                return res.status(400).json({ 
                    success: false, 
                    message: 'Please provide a doctorId to see their availability heatmap.' 
                });
            }

            const appointments = await Appointment.find(filter);
            
            // 7 days (0-6) x 24 hours (0-23)
            const heatmap = Array.from({ length: 7 }, () => Array(24).fill(0));

            appointments.forEach(appt => {
                const dateObj = new Date(appt.date);
                if (isNaN(dateObj.getTime())) return;

                const day = dateObj.getDay(); // 0-6 (Sun-Sat)
                
                try {
                    // Parse "10:00 AM" or "02:30 PM"
                    const timeStr = appt.time; 
                    if (!timeStr) return;

                    const [time, modifier] = timeStr.trim().split(' ');
                    let [hours, minutes] = time.split(':').map(Number);

                    if (modifier === 'PM' && hours < 12) hours += 12;
                    if (modifier === 'AM' && hours === 12) hours = 0;

                    if (hours >= 0 && hours < 24) {
                        heatmap[day][hours] += 1;
                    }
                } catch (pe) {
                    logger.warn(`[Heatmap] Failed to parse time slot: ${appt.time}`);
                }
            });

            // --- NEW: BEST TIME SUGGESTIONS (FROM 3 PM / 15:00) ---
            const suggestions = [];
            const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            
            for (let day = 0; day < 7; day++) {
                let minDensity = Infinity;
                let bestHour = -1;
                
                // Only consider slots from 09:00 to 20:00, excluding 12-2 PM lunch (12-14)
                for (let hour = 9; hour < 21; hour++) {
                    // HARD EXCLUSION: Skip lunch break (12:00 PM - 2:00 PM)
                    if (hour === 12 || hour === 13 || hour === 14) continue; 
                    
                    if (heatmap[day][hour] < minDensity) {
                        minDensity = heatmap[day][hour];
                        bestHour = hour;
                    }
                }
                
                if (bestHour !== -1) {
                    console.log(`[Heatmap Debug] Day ${day}: Chosen ${bestHour} with density ${minDensity}`);
                    const ampm = bestHour >= 12 ? 'PM' : 'AM';
                    const displayHour = bestHour % 12 || 12;
                    suggestions.push({
                        day: dayNames[day],
                        time: `${displayHour}:00 ${ampm}`,
                        density: minDensity
                    });
                }
            }
            // --- END SUGGESTIONS ---

            res.json({
                success: true,
                heatmap,
                bestTimeSuggestions: suggestions,
                summary: "Density matrix [DayOfWeek][Hour] with suggestions from 3:00 PM"
            });
        } catch (error) {
            logger.error('getHeatmap error:', error);
            res.status(500).json({ success: false, message: 'Failed to generate heatmap data' });
        }
    },

    async delete(req, res) {
        try {
            const appointment = await Appointment.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true });
            if (appointment) {
                sendCancellationEmail(appointment.toJSON(), 'Canceled by user deleted').catch(err => logger.error('Email error:', err));
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
