const rateLimit = require('express-rate-limit');

/**
 * Strict limiter for sensitive auth endpoints:
 * login, register, verify-otp, forgot-password, reset-password
 * Max 10 requests per 15 minutes per IP.
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests from this IP. Please try again after 15 minutes.'
    },
    skipSuccessfulRequests: false
});

/**
 * Looser limiter for general API endpoints.
 * Max 100 requests per 15 minutes per IP.
 */
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests. Please slow down.'
    }
});

module.exports = { authLimiter, generalLimiter };
