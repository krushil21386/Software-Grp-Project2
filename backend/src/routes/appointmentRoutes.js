const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');

router.post('/', appointmentController.create);
router.get('/', appointmentController.getAll);
router.get('/:id', appointmentController.getById);
router.put('/:id', appointmentController.update);
router.delete('/:id', appointmentController.delete);

// specialized status routes
router.put('/:id/accept', appointmentController.updateStatus);
router.put('/:id/reject', appointmentController.updateStatus);
router.put('/:id/complete', appointmentController.updateStatus);

module.exports = router;
