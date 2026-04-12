const User = require('../models/User');
const Session = require('../models/Session');
const authService = require('../services/authService');
const otpService = require('../services/otpService');
const loggingService = require('../services/loggingService');
const securityService = require('../services/securityService');
const { sendLoginOtpEmail, sendSecurityAlertEmail } = require('../services/emailService');
const logger = require('../services/loggerService');

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

const authController = {

    // ─────────────────────────────────────────────
    // POST /api/auth/register
    // ─────────────────────────────────────────────
    async register(req, res) {
        try {
            const { name, email, password, role, phone, age, gender, address, specialty, license } = req.body;

            if (!name || !email || !password) {
                return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
            }

            const existing = await User.findOne({ email });
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
                specialty, license,
                isVerified: false
            });

            // Generate and send OTP
            const otp = await otpService.generateAndSend(email, 'registration');

            res.status(201).json({
                success: true,
                message: 'Registration successful. Please check your email for the OTP.',
                userId: user._id
            });

        } catch (err) {
            logger.error('Register error:', err);
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
                await User.updateOne({ email }, { isVerified: true });
                return res.json({ success: true, message: 'Email verified successfully. You can now log in.' });
            }

            // For password-reset, just confirm verification — actual reset happens in reset-password
            res.json({ success: true, message: 'OTP verified.' });

        } catch (err) {
            logger.error('Verify OTP error:', err);
            res.status(500).json({ success: false, message: 'OTP verification failed.' });
        }
    },

    // ─────────────────────────────────────────────
    // POST /api/auth/resend-otp
    // ─────────────────────────────────────────────
    async resendOtp(req, res) {
        try {
            const { email, type = 'registration' } = req.body;

            const user = await User.findOne({ email });
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
            logger.error('Resend OTP error:', err);
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

            const user = await User.findOne({ email });
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
                
                // Log failure (Non-blocking)
                loggingService.recordLog(req, {
                    userId: user._id,
                    action: 'LOGIN_FAILURE_INVALID_PASSWORD',
                    category: 'AUTH',
                    status: 'FAILURE',
                    details: { email }
                });

                if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
                    user.isLocked = true;
                    user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
                    await user.save();
                    
                    loggingService.recordLog(req, {
                        userId: user._id,
                        action: 'ACCOUNT_LOCKED',
                        category: 'AUTH',
                        status: 'WARNING',
                        details: { reason: 'Too many failed attempts' }
                    });

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

            /* 
            // Check email verification (KEEP FOR SIGNUP ONLY)
            if (!user.isVerified) {
                return res.status(403).json({
                    success: false,
                    message: 'Please verify your email before logging in.',
                    requiresVerification: true,
                    email
                });
            }
            */

            // --- RISK-BASED MFA CHECK (DISABLED PER USER REQUEST) ---
            const { location, clientIp } = loggingService.recordLog(req, { 
                userId: user._id, 
                action: 'LOGIN_ATTEMPT', 
                category: 'AUTH' 
            });

            /* 
            const recognized = await securityService.isLocationRecognized(user, location);
            
            if (!recognized) {
                // Suspicious login detected! Require MFA.
                const otp = await otpService.generate(email, 'login-mfa');
                await sendLoginOtpEmail(email, otp, location);

                return res.status(200).json({
                    success: true,
                    requiresMfa: true,
                    message: 'Login from unrecognized location detected. Please enter the OTP sent to your email.',
                    email: user.email,
                    location
                });
            }
            */

            // --- STANDARD SUCCESSFUL LOGIN ---
            return authController.finalizeLogin(req, res, user, location, clientIp);

        } catch (err) {
            logger.error('Login error:', err);
            res.status(500).json({ success: false, message: 'Login failed.' });
        }
    },

    /**
     * Helper to finish the login process (token generation, session creation, logging)
     */
    async finalizeLogin(req, res, user, location, clientIp, isMfaVerified = false) {
        // Reset failed attempts on successful login
        user.failedLoginAttempts = 0;
        user.isLocked = false;
        user.lockUntil = null;
        user.lastLogin = new Date();

        // Generate tokens
        const tokenPayload = { id: user._id, email: user.email, role: user.role };
        const accessToken = authService.generateAccessToken(tokenPayload);
        const refreshToken = authService.generateRefreshToken(tokenPayload);

        user.refreshToken = refreshToken;
        await user.save();

        // Track session
        const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await Session.create({
            userId: user._id,
            refreshToken,
            ipAddress: clientIp,
            userAgent: req.headers['user-agent'],
            expiresAt: refreshExpiresAt
        });

        // Log success (Non-blocking)
        loggingService.recordLog(req, {
            userId: user._id,
            action: 'LOGIN_SUCCESS',
            category: 'AUTH',
            status: 'SUCCESS',
            details: { 
                location, 
                mfaBypass: !isMfaVerified, 
                mfaVerified: isMfaVerified 
            }
        });

        // Optional: Notify user if it's a new location BUT they just verified via MFA
        if (isMfaVerified) {
             sendSecurityAlertEmail(user, location, clientIp).catch(e => logger.error('Alert email fail:', e));
        }

        // --- COOKIE CONFIG ---
        const isProd = process.env.NODE_ENV === 'production';
        const cookieOptions = {
            httpOnly: true,
            secure: isProd, // Only send over HTTPS in production
            sameSite: 'Lax', // Protect against CSRF while allowing cross-site navigation
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days (matching refresh token)
        };

        const accessCookieOptions = {
            ...cookieOptions,
            maxAge: 15 * 60 * 1000 // 15 minutes (matching access token)
        };

        // Set cookies
        res.cookie('accessToken', accessToken, accessCookieOptions);
        res.cookie('refreshToken', refreshToken, cookieOptions);

        return res.json({
            success: true,
            message: 'Login successful.',
            user: authService.sanitizeUser(user)
        });
    },

    // ─────────────────────────────────────────────
    // POST /api/auth/verify-mfa
    // ─────────────────────────────────────────────
    async verifyMfa(req, res) {
        try {
            const { email, otp } = req.body;
            if (!email || !otp) {
                return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
            }

            const valid = await otpService.verify(email, otp, 'login-mfa');
            if (!valid) {
                loggingService.recordLog(req, {
                    action: 'MFA_FAILURE',
                    category: 'AUTH',
                    status: 'FAILURE',
                    details: { email }
                });
                return res.status(401).json({ success: false, message: 'Invalid or expired security code.' });
            }

            const user = await User.findOne({ email });
            const { location, clientIp } = loggingService.recordLog(req, {
                userId: user._id,
                action: 'MFA_SUCCESS',
                category: 'AUTH'
            });

            // Update known locations after successful MFA
            await securityService.updateKnownLocation(user._id, location);

            return authController.finalizeLogin(req, res, user, location, clientIp, true);

        } catch (err) {
            logger.error('MFA Verify error:', err);
            res.status(500).json({ success: false, message: 'Verification failed.' });
        }
    },

    // ─────────────────────────────────────────────
    // POST /api/auth/refresh-token
    // ─────────────────────────────────────────────
    async refreshToken(req, res) {
        try {
            // Read from cookie instead of body
            const refreshToken = req.cookies.refreshToken;
            logger.info(`[Auth] Received refresh token request...`);

            if (!refreshToken) {
                return res.status(401).json({ success: false, message: 'Refresh token required.' });
            }

            let decoded;
            try {
                decoded = authService.verifyRefreshToken(refreshToken);
                logger.info(`[Auth] Refresh token verified for user ID: ${decoded?.id}`);
            } catch (jwtErr) {
                logger.warn(`[Auth] JWT Refresh Token verification failed: ${jwtErr.message}`);
                return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
            }

            if (!decoded || !decoded.id) {
                return res.status(401).json({ success: false, message: 'Malformed refresh token payload.' });
            }

            const user = await User.findById(decoded.id);
            if (!user) {
                logger.warn(`[Auth] User not found during token refresh: ${decoded.id}`);
                return res.status(401).json({ success: false, message: 'User no longer exists.' });
            }

            if (user.refreshToken !== refreshToken) {
                logger.warn(`[Auth] Refresh token mismatch for user: ${user.email}`);
                return res.status(401).json({ success: false, message: 'Refresh token revoked or invalid.' });
            }

            // Check session is still active
            const session = await Session.findOne({
                userId: user._id, refreshToken, isActive: true
            });
            
            if (!session) {
                logger.warn(`[Auth] Active session not found for token refresh: ${user.email}`);
                return res.status(401).json({ success: false, message: 'Session no longer active.' });
            }

            if (session.expiresAt < new Date()) {
                logger.warn(`[Auth] Session expired for user: ${user.email}`);
                return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
            }

            // Issue new access token
            const tokenPayload = { id: user._id, email: user.email, role: user.role };
            const newAccessToken = authService.generateAccessToken(tokenPayload);

            logger.info(`[Auth] Successfully issued new access token for: ${user.email}`);

            // Update the access cookie
            const isProd = process.env.NODE_ENV === 'production';
            res.cookie('accessToken', newAccessToken, {
                httpOnly: true,
                secure: isProd,
                sameSite: 'Lax',
                maxAge: 15 * 60 * 1000
            });

            res.json({
                success: true,
                message: 'Token refreshed.'
            });

        } catch (err) {
            logger.error('CRITICAL ERROR during Refresh token:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Internal server error during token refresh.',
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    },

    // ─────────────────────────────────────────────
    // POST /api/auth/logout
    // ─────────────────────────────────────────────
    async logout(req, res) {
        try {
            const refreshToken = req.cookies.refreshToken;

            if (refreshToken) {
                // Invalidate session
                await Session.updateMany(
                    { refreshToken },
                    { isActive: false }
                );

                // Clear stored refresh token on user
                await User.updateMany(
                    { refreshToken },
                    { refreshToken: null }
                );
            }

            // Clear cookies
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');

            res.json({ success: true, message: 'Logged out successfully.' });

        } catch (err) {
            logger.error('Logout error:', err);
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

            const user = await User.findOne({ email });
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
            logger.error('Forgot password error:', err);
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
            await User.updateOne({ email }, { password: hashedPassword, refreshToken: null });

            // Invalidate all sessions
            const user = await User.findOne({ email });
            if (user) {
                await Session.updateMany({ userId: user._id }, { isActive: false });
            }

            res.json({ success: true, message: 'Password reset successfully. Please log in with your new password.' });

        } catch (err) {
            logger.error('Reset password error:', err);
            res.status(500).json({ success: false, message: 'Password reset failed.' });
        }
    },

    // ─────────────────────────────────────────────
    // GET /api/auth/profile  (protected)
    // ─────────────────────────────────────────────
    async getProfile(req, res) {
        try {
            const user = await User.findById(req.user.id);
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
            const { name, phone, age, gender, address, profileImage } = req.body;

            await User.updateOne(
                { _id: req.user.id },
                { name, phone, age, gender, address, profileImage }
            );

            const updated = await User.findById(req.user.id);
            res.json({ success: true, message: 'Profile updated.', user: authService.sanitizeUser(updated) });

        } catch (err) {
            logger.error('Update profile error:', err);
            res.status(500).json({ success: false, message: 'Profile update failed.' });
        }
    },

    // ─────────────────────────────────────────────
    // GET /api/auth/doctors  (public)
    // ─────────────────────────────────────────────
    async getAllDoctors(req, res) {
        try {
            const docs = await User.find({ role: 'doctor' }).select('-password -__v');
            res.json({ success: true, doctors: docs.map(d => authService.sanitizeUser(d)) });
        } catch (error) {
            logger.error('getAllDoctors error:', error);
            res.status(500).json({ success: false, message: 'Server error fetching doctors' });
        }
    },

    // ─────────────────────────────────────────────
    // GET /api/auth/sessions  (protected)
    // ─────────────────────────────────────────────
    async getSessions(req, res) {
        try {
            const sessions = await Session.find({ userId: req.user.id, isActive: true })
                                          .select('ipAddress userAgent createdAt expiresAt');
            res.json({ success: true, sessions });
        } catch (err) {
            res.status(500).json({ success: false, message: 'Failed to fetch sessions.' });
        }
    }
};

// Bind methods to the object to avoid 'this' issues with Express router
authController.login = authController.login.bind(authController);
authController.verifyMfa = authController.verifyMfa.bind(authController);
authController.finalizeLogin = authController.finalizeLogin.bind(authController);

module.exports = authController;
