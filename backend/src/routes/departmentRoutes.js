const express = require('express');
const router  = express.Router();
const departmentController = require('../controllers/departmentController');

// GET /api/departments
router.get('/', departmentController.getAllDepartments);
router.get('/:id', departmentController.getDepartmentById);

// Note: Admin routes for create/update/delete can be added here and protected with adminMiddleware later.

module.exports = router;
