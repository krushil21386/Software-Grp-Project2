const { body } = require('express-validator');

/**
 * Validation rules for user registration and login.
 */
const authValidator = {
    register: [
        body('name')
            .trim()
            .notEmpty().withMessage('Name is required.')
            .isLength({ max: 50 }).withMessage('Name must not exceed 50 characters.'),
        
        body('email')
            .trim()
            .isEmail().withMessage('Must be a valid email address.')
            .normalizeEmail(),
        
        body('password')
            .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
            .matches(/\d/).withMessage('Password must contain at least one number.'),
        
        body('role')
            .optional()
            .isIn(['patient', 'doctor', 'admin']).withMessage('Invalid role selected.')
    ],

    login: [
        body('email')
            .trim()
            .isEmail().withMessage('Enter a valid email address.')
            .normalizeEmail(),
        
        body('password')
            .notEmpty().withMessage('Password is required.')
    ],

    resetPassword: [
        body('email').isEmail().withMessage('Valid email required.'),
        body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits.'),
        body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters.')
    ]
};

module.exports = {
    register: authValidator.register,
    login: authValidator.login,
    resetPassword: authValidator.resetPassword
};
