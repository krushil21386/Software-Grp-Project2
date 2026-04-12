const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');
const { authLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const { register, login, resetPassword } = require('../validators/authValidator');

// --- AUTHENTICATION ROUTES ---

// Public routes (No strict limiter)
router.get('/doctors', authController.getAllDoctors);
router.post('/refresh-token', authController.refreshToken);

// Sensitive routes (Strict rate limiting)
router.post('/register', authLimiter, register, validate, authController.register);
router.post('/verify-otp', authLimiter, authController.verifyOtp);
router.post('/resend-otp', authLimiter, authController.resendOtp);
router.post('/login', authLimiter, login, validate, authController.login);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, resetPassword, validate, authController.resetPassword);
router.post('/verify-mfa', authLimiter, authController.verifyMfa);

// Shared session operations
router.post('/logout', authController.logout);

// ── Protected routes (require valid JWT) ──────────
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.get('/sessions', authenticate, authController.getSessions);

module.exports = router;
