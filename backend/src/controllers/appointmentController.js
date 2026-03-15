const Appointment = require('../models/Appointment');
const User = require('../models/User');

const appointmentController = {
    async create(req, res) {
        try {
            const { patientId, doctorId, hospitalId, date, time, reason, notes } = req.body;
            const newAppointment = await Appointment.create({
                patientId, doctorId, hospitalId, date, time, reason, notes, status: 'upcoming'
            });
            res.json({ success: true, appointment: newAppointment });
        } catch (error) {
            console.error('Create Appointment Error:', error);
            res.status(500).json({ success: false, message: 'Failed to create appointment' });
        }
    },

    async getAll(req, res) {
        try {
            const { patientId, doctorId, status } = req.query;
            const where = {};
            if (patientId) where.patientId = patientId;
            if (doctorId) where.doctorId = doctorId;
            if (status) where.status = status;

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
            const { status } = req.params; // Using route param for logic separation if needed, or body
            // This is for specific endpoints like /:id/accept

            // Map action to status
            // accept -> upcoming (or confirmed if we had it)
            // reject -> cancelled
            // complete -> completed

            const action = req.path.split('/').pop(); // accept, reject, complete
            let newStatus = 'upcoming';
            if (action === 'reject') newStatus = 'cancelled';
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
                // Soft delete by collecting status cancelled? Or distinct delete?
                // matching old logic: status = cancelled
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
