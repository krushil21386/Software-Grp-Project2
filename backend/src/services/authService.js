const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = 12;

// Strict environment variable check
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
    console.error('❌ [FATAL ERROR] JWT_SECRET or JWT_REFRESH_SECRET is missing from the environment!');
    // We do not exit(1) here to allow the server to start (for health checks) but token generation will fail.
}

const authService = {
    /**
     * Hash a plain-text password
     */
    async hashPassword(password) {
        return bcrypt.hash(password, SALT_ROUNDS);
    },

    /**
     * Compare plain-text password with hash
     */
    async comparePassword(password, hash) {
        return bcrypt.compare(password, hash);
    },

    /**
     * Generate a short-lived JWT access token
     */
    generateAccessToken(payload) {
        if (!JWT_SECRET) throw new Error('JWT_SECRET is not defined');
        return jwt.sign(payload, JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '15m'
        });
    },

    /**
     * Generate a long-lived refresh token
     */
    generateRefreshToken(payload) {
        if (!JWT_REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET is not defined');
        return jwt.sign(payload, JWT_REFRESH_SECRET, {
            expiresIn: process.env.REFRESH_EXPIRES_IN || '7d'
        });
    },

    /**
     * Verify an access token; throws if invalid/expired
     */
    verifyAccessToken(token) {
        return jwt.verify(token, JWT_SECRET);
    },

    /**
     * Verify a refresh token; throws if invalid/expired
     */
    verifyRefreshToken(token) {
        return jwt.verify(token, JWT_REFRESH_SECRET);
    },

    /**
     * Build a safe public user object (no password/tokens)
     */
    sanitizeUser(user) {
        return {
            id: user.id || user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            age: user.age,
            gender: user.gender,
            address: user.address,
            specialty: user.specialty,
            hospitalId: user.hospitalId,
            license: user.license,
            profileImage: user.profileImage,
            isVerified: user.isVerified,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt
        };
    }
};

module.exports = authService;
