const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const SALT_ROUNDS = 12;

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
        return jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '15m'
        });
    },

    /**
     * Generate a long-lived refresh token
     */
    generateRefreshToken(payload) {
        return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
            expiresIn: process.env.REFRESH_EXPIRES_IN || '7d'
        });
    },

    /**
     * Verify an access token; throws if invalid/expired
     */
    verifyAccessToken(token) {
        return jwt.verify(token, process.env.JWT_SECRET);
    },

    /**
     * Verify a refresh token; throws if invalid/expired
     */
    verifyRefreshToken(token) {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    },

    /**
     * Build a safe public user object (no password/tokens)
     */
    sanitizeUser(user) {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            age: user.age,
            gender: user.gender,
            address: user.address,
            isVerified: user.isVerified,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt
        };
    }
};

module.exports = authService;
