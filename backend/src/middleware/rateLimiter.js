const rateLimit = require('express-rate-limit');

/**
 * Strict limiter for sensitive auth endpoints:
 * login, register, verify-otp, forgot-password, reset-password
 * Max 10 requests per 15 minutes per IP.
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Increased from 10 to 100 for dev/testing
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

/**
 * Strict limiter for AI Analysis:
 * Prevents Gemini API quota exhaustion.
 * Max 50 requests per 10 minutes per IP.
 */
const aiLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 50, // Increased from 5 to 50
    message: {
        success: false,
        message: 'AI analysis quota exceeded. Please try again after 10 minutes.'
    }
});

module.exports = { authLimiter, generalLimiter, aiLimiter };
