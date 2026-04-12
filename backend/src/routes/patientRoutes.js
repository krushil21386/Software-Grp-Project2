const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// Doctor Only: Get their unique patient list
router.get('/my-patients', authenticate, authorize('doctor'), patientController.getMyPatients);

module.exports = router;
