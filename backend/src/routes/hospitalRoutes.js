const express = require('express');
const router  = express.Router();
const hospitalController = require('../controllers/hospitalController');

// GET /api/hospitals
router.get('/', hospitalController.getAllHospitals);

// GET /api/hospitals/:id
router.get('/:id', hospitalController.getHospitalById);

// Admin endpoints can be added here later

module.exports = router;
