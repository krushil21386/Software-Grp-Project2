const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');
const { authLimiter } = require('../middleware/rateLimiter');

// ── Public routes (No strict limiter) ─────────────────
router.get('/doctors', authController.getAllDoctors);
router.post('/refresh-token', authController.refreshToken);

// Apply strict rate limiting to sensitive auth endpoints
router.use(authLimiter);

router.post('/register', authController.register);
router.post('/verify-otp', authController.verifyOtp);
router.post('/resend-otp', authController.resendOtp);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-mfa', authController.verifyMfa);

// ── Protected routes (require valid JWT) ──────────
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.get('/sessions', authenticate, authController.getSessions);

module.exports = router;
