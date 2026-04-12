const { body } = require('express-validator');

/**
 * Validation rules for appointment booking.
 */
const appointmentValidator = {
    book: [
        body('doctorId').notEmpty().withMessage('Doctor selection is required.'),
        
        body('patientName')
            .optional({ checkFalsy: true })
            .trim()
            .isLength({ max: 50 }).withMessage('Patient name must not exceed 50 characters.'),
        
        body('patientEmail')
            .optional({ checkFalsy: true })
            .isEmail().withMessage('If provided, patient email must be valid.')
            .normalizeEmail(),
        
        body('patientPhone')
            .optional({ checkFalsy: true })
            .matches(/^\d{10,15}$/).withMessage('Phone number must be between 10 and 15 digits.'),
        
        body('date')
            .isDate().withMessage('A valid date is required (YYYY-MM-DD).')
            .custom(value => {
                if (new Date(value) < new Date().setHours(0,0,0,0)) {
                    throw new Error('Appointment date cannot be in the past.');
                }
                return true;
            }),
        
        body('time')
            .matches(/^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/i).withMessage('Time must be in format "HH:MM AM/PM".'),
        
        body('mode')
            .isIn(['Online', 'Offline']).withMessage('Mode must be Online or Offline.')
    ],

    reschedule: [
        body('date').isDate().withMessage('Valid date required.'),
        body('time').matches(/^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/i).withMessage('Valid time required.'),
        body('reason').trim().notEmpty().withMessage('Reschedule reason is required.')
    ]
};

module.exports = {
    book: appointmentValidator.book,
    reschedule: appointmentValidator.reschedule
};
