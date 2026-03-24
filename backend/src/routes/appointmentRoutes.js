const express = require('express');
const router  = express.Router();
const authenticate = require('../middleware/authenticate');
const appointmentController = require('../controllers/appointmentController');

// ─── New authenticated endpoints ─────────────────────────────────────────────

/**
 * POST /api/appointments/book-appointment
 * Books an appointment for the logged-in user + sends confirmation email.
 */
router.post('/book-appointment', authenticate, appointmentController.bookAppointment);

/**
 * GET /api/appointments/my-appointments
 * Returns only the current user's appointments (upcoming / completed / cancelled).
 */
router.get('/my-appointments', authenticate, appointmentController.getMyAppointments);

// ─── Legacy / generic endpoints (kept for backward compatibility) ─────────────

router.post('/',              appointmentController.create);
router.get('/',               appointmentController.getAll);
router.get('/:id',            appointmentController.getById);
router.put('/:id',            appointmentController.update);
router.delete('/:id',         appointmentController.delete);

// Specialized status routes
router.put('/:id/accept',     appointmentController.updateStatus);
router.put('/:id/reject',     appointmentController.updateStatus);
router.put('/:id/complete',   appointmentController.updateStatus);
router.put('/:id/reschedule', appointmentController.reschedule);

module.exports = router;
