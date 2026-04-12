const express = require('express');
const router  = express.Router();
const authenticate = require('../middleware/authenticate');
const appointmentController = require('../controllers/appointmentController');
const validate = require('../middleware/validate');
const { book, reschedule } = require('../validators/appointmentValidator');

// ─── New authenticated endpoints ─────────────────────────────────────────────

/**
 * POST /api/appointments/book-appointment
 * Books an appointment for the logged-in user + sends confirmation email.
 */
router.post('/book-appointment', authenticate, book, validate, appointmentController.bookAppointment);

/**
 * GET /api/appointments/my-appointments
 * Returns only the current user's appointments (upcoming / completed / cancelled).
 */
router.get('/my-appointments', authenticate, appointmentController.getMyAppointments);

/**
 * GET /api/appointments/heatmap
 * Returns a 7x24 matrix of appointment density.
 */
router.get('/heatmap', authenticate, appointmentController.getHeatmap);

// ─── Legacy / generic endpoints (kept for backward compatibility) ─────────────
// All routes now require authentication for security

router.post('/',              authenticate, book, validate, appointmentController.create);
router.get('/',               authenticate, appointmentController.getAll);
router.get('/:id',            authenticate, appointmentController.getById);
router.put('/:id',            authenticate, appointmentController.update);
router.delete('/:id',         authenticate, appointmentController.delete);

// Specialized status routes
router.put('/:id/accept',     authenticate, appointmentController.updateStatus);
router.put('/:id/reject',     authenticate, appointmentController.updateStatus);
router.put('/:id/complete',   authenticate, appointmentController.updateStatus);
router.put('/:id/reschedule', authenticate, reschedule, validate, appointmentController.reschedule);

module.exports = router;
