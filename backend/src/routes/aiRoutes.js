const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const multer = require('multer');
const path = require('path');
const authenticate = require('../middleware/authenticate');

const { aiLimiter } = require('../middleware/rateLimiter');

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        // Sanitization: Remove any non-alphanumeric/dot/hyphen characters to prevent traversal attacks
        const sanitized = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '');
        cb(null, `${Date.now()}-${sanitized}`);
    }
});

const upload = multer({ 
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

const logger = require('../services/loggerService');

// Protect AI route with authentication and a dedicated rate limiter
router.post('/analyze', authenticate, aiLimiter, upload.single('report'), (req, res, next) => {
    const filename = req.file ? req.file.originalname : 'No file';
    const userId = req.user ? req.user.id : 'Guest';
    logger.info(`[AI Analysis] Incoming request from User: ${userId} for File: ${filename}`);
    next();
}, aiController.analyzeReport);

module.exports = router;
