const authService = require('../services/authService');
const User = require('../models/User');
const logger = require('../services/loggerService');

/**
 * JWT authentication middleware.
 * Expects: Authorization: Bearer <token>
 * Attaches req.user on success.
 */
const authenticate = async (req, res, next) => {
    try {
        // --- TOKEN EXTRACTION ---
        // Prioritize httpOnly cookie, fallback to Authorization header
        let token = req.cookies.accessToken;

        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            }
        }

        if (!token) {
            logger.warn(`[Auth] No authentication token provided from ${req.ip}`);
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Please log in.'
            });
        }

        const decoded = authService.verifyAccessToken(token);

        // Fetch fresh user to ensure account is still valid/unlocked
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ success: false, message: 'User no longer exists.' });
        }
        if (user.isLocked && user.lockUntil > new Date()) {
            return res.status(403).json({
                success: false,
                message: 'Account is temporarily locked. Try again later.'
            });
        }

        req.user = authService.sanitizeUser(user);
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired. Please refresh.' });
        }
        return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
};

module.exports = authenticate;
