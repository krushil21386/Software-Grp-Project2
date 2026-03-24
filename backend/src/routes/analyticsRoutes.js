const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/stats', analyticsController.getDashboardStats);
router.get('/doctor/:doctorName', analyticsController.getDoctorStats);
router.get('/doctor/id/:doctorId', analyticsController.getDoctorStatsById);

module.exports = router;
