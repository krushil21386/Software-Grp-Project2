const authService = require('../services/authService');
const User = require('../models/User');

/**
 * Optional JWT authentication middleware.
 * If a valid token is found, req.user is populated.
 * If not, the request proceeds anonymously without error.
 */
const optionalAuthenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(); // Proceed as guest
        }

        const token = authHeader.split(' ')[1];
        const decoded = authService.verifyAccessToken(token);

        const user = await User.findById(decoded.id);
        if (user && !(user.isLocked && user.lockUntil > new Date())) {
            req.user = authService.sanitizeUser(user);
        }
        
        next();
    } catch (err) {
        // If token is invalid or expired, just proceed as guest
        next();
    }
};

module.exports = optionalAuthenticate;
