const authService = require('../services/authService');
const User = require('../models/User');

/**
 * JWT authentication middleware.
 * Expects: Authorization: Bearer <token>
 * Attaches req.user on success.
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Please log in.'
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = authService.verifyAccessToken(token);

        // Fetch fresh user to ensure account is still valid/unlocked
        const user = await User.findByPk(decoded.id);
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
