const Appointment = require('../models/Appointment');
const User = require('../models/User');

const patientController = {
    /**
     * GET /api/patients/my-patients
     * Returns a unique list of patients who have had appointments with the authenticated doctor.
     */
    async getMyPatients(req, res) {
        try {
            const doctorId = req.user.id;
            
            // Find all appointments for this doctor
            const appointments = await Appointment.find({ doctorId });
            
            // Extract unique patient IDs
            const patientIds = [...new Set(appointments.map(a => a.userId).filter(id => id))];
            
            // Fetch patient details
            const patients = await User.find({ _id: { $in: patientIds } }).select('-password');
            
            res.json({
                success: true,
                count: patients.length,
                patients
            });
        } catch (error) {
            console.error('getMyPatients error:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch patients' });
        }
    }
};

module.exports = patientController;
