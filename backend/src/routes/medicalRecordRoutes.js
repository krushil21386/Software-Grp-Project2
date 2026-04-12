const express = require('express');
const router = express.Router();
const medicalRecordController = require('../controllers/medicalRecordController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const multer = require('multer');
const path = require('path');

// Configure Multer for Prescriptions
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, `RX-${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// Patient routes
router.get('/my-records', authenticate, medicalRecordController.getMyRecords);

// Doctor routes
router.get('/doctor-records', authenticate, authorize('doctor'), medicalRecordController.getDoctorRecords);

// Doctor/Admin routes for specific patients
router.get('/patient/:patientId', authenticate, authorize('doctor', 'admin'), medicalRecordController.getPatientRecords);

// Modification routes
router.patch('/:id', authenticate, authorize('doctor', 'admin'), medicalRecordController.updateRecord);

// Prescription Upload (Doctor Only)
router.patch('/:id/prescription', authenticate, authorize('doctor'), upload.single('prescription'), medicalRecordController.uploadPrescription);

// Manual Report Upload (Doctor Only - No AI Analysis)
router.post('/upload-report', authenticate, authorize('doctor'), upload.single('report'), medicalRecordController.uploadMedicalReport);

// Prescription Details Update (Doctor Only - text fields: medicines, dosage, etc.)
router.patch('/:id/prescription-details', authenticate, authorize('doctor'), medicalRecordController.updatePrescriptionDetails);

module.exports = router;
