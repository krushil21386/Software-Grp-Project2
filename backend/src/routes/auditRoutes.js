const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// Publicly accessible for any logged-in user to see their OWN activity
router.get('/my-activity', authenticate, auditController.getMyLogs);

// Admin-only routes
router.use(authenticate, authorize('admin'));
router.get('/logs', auditController.getLogs);
router.get('/stats', auditController.getStats);
router.get('/export', auditController.exportLogs);

module.exports = router;
