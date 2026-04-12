const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticate = require('../middleware/authenticate');
const adminMiddleware = require('../middleware/adminMiddleware');

// Protect all admin routes
router.use(authenticate, adminMiddleware);

// GET /api/admin/users
router.get('/users', adminController.getAllUsers);

// GET /api/admin/stats
router.get('/stats', adminController.getDashboardStats);

// PUT /api/admin/users/:id/status
router.put('/users/:id/status', adminController.updateUserStatus);

// GET /api/admin/inventory/status
router.get('/inventory/status', adminController.getInventoryStatus);

module.exports = router;
