const User = require('../models/User');
const Session = require('../models/Session');
const authService = require('../services/authService');
const otpService = require('../services/otpService');
require('dotenv').config();

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

const authController = {

    // ─────────────────────────────────────────────
    // POST /api/auth/register
    // ─────────────────────────────────────────────
    async register(req, res) {
        try {
            const { name, email, password, role, phone, age, gender, address } = req.body;

            if (!name || !email || !password) {
                return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
            }

            const existing = await User.findOne({ where: { email } });
            if (existing) {
                return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
            }

            const hashedPassword = await authService.hashPassword(password);

            const user = await User.create({
                name,
                email,
                password: hashedPassword,
                role: role || 'patient',
                phone, age, gender, address,
                isVerified: false
            });

            // Generate and send OTP
            const otp = await otpService.generateAndSend(email, 'registration');

            res.status(201).json({
                success: true,
                message: 'Registration successful. Please check your email for the OTP.',
                userId: user.id
            });

        } catch (err) {
            console.error('Register error:', err);
            res.status(500).json({ success: false, message: 'Registration failed.', error: err.message });
        }
    },

    // ─────────────────────────────────────────────
    // POST /api/auth/verify-otp
    // ─────────────────────────────────────────────
    async verifyOtp(req, res) {
        try {
            const { email, otp, type = 'registration' } = req.body;

            if (!email || !otp) {
                return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
            }

            const valid = await otpService.verify(email, otp, type);
            if (!valid) {
                return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
            }

            if (type === 'registration') {
                await User.update({ isVerified: true }, { where: { email } });
                return res.json({ success: true, message: 'Email verified successfully. You can now log in.' });
            }

            // For password-reset, just confirm verification — actual reset happens in reset-password
            res.json({ success: true, message: 'OTP verified.' });

        } catch (err) {
            console.error('Verify OTP error:', err);
            res.status(500).json({ success: false, message: 'OTP verification failed.' });
        }
    },

    // ─────────────────────────────────────────────
    // POST /api/auth/resend-otp
    // ─────────────────────────────────────────────
    async resendOtp(req, res) {
        try {
            const { email, type = 'registration' } = req.body;

            const user = await User.findOne({ where: { email } });
            if (!user) {
                return res.status(404).json({ success: false, message: 'No account found with this email.' });
            }

            const otp = await otpService.generateAndSend(email, type);

            res.json({
                success: true,
                message: 'A new OTP has been sent to your email.',
                ...(process.env.NODE_ENV === 'development' && { devOtp: otp })
            });

        } catch (err) {
            console.error('Resend OTP error:', err);
            res.status(500).json({ success: false, message: 'Failed to resend OTP.' });
        }
    },

    // ─────────────────────────────────────────────
    // POST /api/auth/login
    // ─────────────────────────────────────────────
    async login(req, res) {
        try {
            const { email, password, role } = req.body;

            if (!email || !password) {
                return res.status(400).json({ success: false, message: 'Email and password are required.' });
            }

            const user = await User.findOne({ where: { email } });
            if (!user) {
                return res.status(401).json({ success: false, message: 'Invalid email or password.' });
            }

            // Check account lock
            if (user.isLocked && user.lockUntil > new Date()) {
                const remaining = Math.ceil((user.lockUntil - new Date()) / 60000);
                return res.status(403).json({
                    success: false,
                    message: `Account locked due to too many failed attempts. Try again in ${remaining} minute(s).`
                });
            }

            // Auto-unlock if lock has expired
            if (user.isLocked && user.lockUntil <= new Date()) {
                user.isLocked = false;
                user.failedLoginAttempts = 0;
                user.lockUntil = null;
            }

            // Verify password
            const passwordMatch = await authService.comparePassword(password, user.password);
            if (!passwordMatch) {
                user.failedLoginAttempts += 1;

                if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
                    user.isLocked = true;
                    user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
                    await user.save();
                    return res.status(403).json({
                        success: false,
                        message: `Account locked after ${MAX_FAILED_ATTEMPTS} failed attempts. Try again in 30 minutes.`
                    });
                }

                await user.save();
                return res.status(401).json({
                    success: false,
                    message: `Invalid email or password. ${MAX_FAILED_ATTEMPTS - user.failedLoginAttempts} attempt(s) remaining.`
                });
            }

            // Check email verification
            if (!user.isVerified) {
                return res.status(403).json({
                    success: false,
                    message: 'Please verify your email before logging in.',
                    requiresVerification: true,
                    email
                });
            }

            // Check role match if provided
            if (role && user.role !== role) {
                return res.status(401).json({ success: false, message: 'Role mismatch.' });
            }

            // Reset failed attempts on successful login
            user.failedLoginAttempts = 0;
            user.isLocked = false;
            user.lockUntil = null;
            user.lastLogin = new Date();

            // Generate tokens
            const tokenPayload = { id: user.id, email: user.email, role: user.role };
            const accessToken = authService.generateAccessToken(tokenPayload);
            const refreshToken = authService.generateRefreshToken(tokenPayload);

            user.refreshToken = refreshToken;
            await user.save();

            // Track session
            const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await Session.create({
                userId: user.id,
                refreshToken,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                expiresAt: refreshExpiresAt
            });

            res.json({
                success: true,
                message: 'Login successful.',
                accessToken,
                refreshToken,
                user: authService.sanitizeUser(user)
            });

        } catch (err) {
            console.error('Login error:', err);
            res.status(500).json({ success: false, message: 'Login failed.' });
        }
    },

    // ─────────────────────────────────────────────
    // POST /api/auth/refresh-token
    // ─────────────────────────────────────────────
    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return res.status(400).json({ success: false, message: 'Refresh token required.' });
            }

            let decoded;
            try {
                decoded = authService.verifyRefreshToken(refreshToken);
            } catch {
                return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
            }

            const user = await User.findByPk(decoded.id);
            if (!user || user.refreshToken !== refreshToken) {
                return res.status(401).json({ success: false, message: 'Refresh token revoked or invalid.' });
            }

            // Check session is still active
            const session = await Session.findOne({
                where: { userId: user.id, refreshToken, isActive: true }
            });
            if (!session || session.expiresAt < new Date()) {
                return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
            }

            // Issue new access token
            const tokenPayload = { id: user.id, email: user.email, role: user.role };
            const newAccessToken = authService.generateAccessToken(tokenPayload);

            res.json({
                success: true,
                accessToken: newAccessToken
            });

        } catch (err) {
            console.error('Refresh token error:', err);
            res.status(500).json({ success: false, message: 'Token refresh failed.' });
        }
    },

    // ─────────────────────────────────────────────
    // POST /api/auth/logout
    // ─────────────────────────────────────────────
    async logout(req, res) {
        try {
            const { refreshToken } = req.body;

            if (refreshToken) {
                // Invalidate session
                await Session.update(
                    { isActive: false },
                    { where: { refreshToken } }
                );

                // Clear stored refresh token on user
                await User.update(
                    { refreshToken: null },
                    { where: { refreshToken } }
                );
            }

            res.json({ success: true, message: 'Logged out successfully.' });

        } catch (err) {
            console.error('Logout error:', err);
            res.status(500).json({ success: false, message: 'Logout failed.' });
        }
    },

    // ─────────────────────────────────────────────
    // POST /api/auth/forgot-password
    // ─────────────────────────────────────────────
    async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ success: false, message: 'Email is required.' });
            }

            const user = await User.findOne({ where: { email } });
            // Always respond the same way to prevent email enumeration
            const genericMessage = 'If an account exists for this email, an OTP has been sent.';

            if (!user) {
                return res.json({ success: true, message: genericMessage });
            }

            const otp = await otpService.generateAndSend(email, 'password-reset');

            res.json({
                success: true,
                message: genericMessage,
                ...(process.env.NODE_ENV === 'development' && { devOtp: otp })
            });

        } catch (err) {
            console.error('Forgot password error:', err);
            res.status(500).json({ success: false, message: 'Failed to process request.' });
        }
    },

    // ─────────────────────────────────────────────
    // POST /api/auth/reset-password
    // ─────────────────────────────────────────────
    async resetPassword(req, res) {
        try {
            const { email, otp, newPassword } = req.body;

            if (!email || !otp || !newPassword) {
                return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required.' });
            }

            const valid = await otpService.verify(email, otp, 'password-reset');
            if (!valid) {
                return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
            }

            const hashedPassword = await authService.hashPassword(newPassword);
            await User.update({ password: hashedPassword, refreshToken: null }, { where: { email } });

            // Invalidate all sessions
            const user = await User.findOne({ where: { email } });
            if (user) {
                await Session.update({ isActive: false }, { where: { userId: user.id } });
            }

            res.json({ success: true, message: 'Password reset successfully. Please log in with your new password.' });

        } catch (err) {
            console.error('Reset password error:', err);
            res.status(500).json({ success: false, message: 'Password reset failed.' });
        }
    },

    // ─────────────────────────────────────────────
    // GET /api/auth/profile  (protected)
    // ─────────────────────────────────────────────
    async getProfile(req, res) {
        try {
            const user = await User.findByPk(req.user.id);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found.' });
            }
            res.json({ success: true, user: authService.sanitizeUser(user) });
        } catch (err) {
            res.status(500).json({ success: false, message: 'Failed to get profile.' });
        }
    },

    // ─────────────────────────────────────────────
    // PUT /api/auth/profile  (protected)
    // ─────────────────────────────────────────────
    async updateProfile(req, res) {
        try {
            const { name, phone, age, gender, address } = req.body;

            await User.update(
                { name, phone, age, gender, address },
                { where: { id: req.user.id } }
            );

            const updated = await User.findByPk(req.user.id);
            res.json({ success: true, message: 'Profile updated.', user: authService.sanitizeUser(updated) });

        } catch (err) {
            console.error('Update profile error:', err);
            res.status(500).json({ success: false, message: 'Profile update failed.' });
        }
    },

    // ─────────────────────────────────────────────
    // GET /api/auth/sessions  (protected)
    // ─────────────────────────────────────────────
    async getSessions(req, res) {
        try {
            const sessions = await Session.findAll({
                where: { userId: req.user.id, isActive: true },
                attributes: ['id', 'ipAddress', 'userAgent', 'createdAt', 'expiresAt']
            });
            res.json({ success: true, sessions });
        } catch (err) {
            res.status(500).json({ success: false, message: 'Failed to fetch sessions.' });
        }
    }
};

module.exports = authController;
