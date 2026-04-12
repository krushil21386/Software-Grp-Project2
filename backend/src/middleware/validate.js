const { validationResult } = require('express-validator');
const logger = require('../services/loggerService');

/**
 * Middleware to process validation results.
 * If errors are present, it returns a 400 response with the error details.
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorDetails = errors.array().map(err => ({
            field: err.path,
            message: err.msg
        }));

        logger.warn(`[Validation] Blocked request to ${req.originalUrl}: ${JSON.stringify(errorDetails)}`);

        return res.status(400).json({
            success: false,
            message: 'Validation failed.',
            errors: errorDetails
        });
    }
    next();
};

module.exports = validate;
