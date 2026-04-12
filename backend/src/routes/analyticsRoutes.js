const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// Every analytics route requires authentication
router.use(authenticate);

// Global system stats: Admins only
router.get('/stats', authorize('admin'), analyticsController.getDashboardStats);

// Doctor-specific performance: Doctor themselves or Admin
router.get('/doctor/:doctorName', authorize('doctor', 'admin'), analyticsController.getDoctorStats);
router.get('/doctor/id/:doctorId', authorize('doctor', 'admin'), analyticsController.getDoctorStatsById);

module.exports = router;
