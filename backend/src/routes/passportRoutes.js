const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const passportController = require('../controllers/passportController');

// Protected — requires login
router.get('/data', authenticate, passportController.getPassportData);
router.post('/share', authenticate, passportController.generateShareLink);

// Public — anyone with a valid share token can view
router.get('/view/:token', passportController.viewSharedPassport);

module.exports = router;
