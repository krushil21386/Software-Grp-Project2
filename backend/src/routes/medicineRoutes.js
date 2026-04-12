const express = require('express');
const router  = express.Router();
const medicineController = require('../controllers/medicineController');
// Admin middleware will be required here later if these APIs are used by real frontend,
// but for now, we'll keep them open to verify the API works, or we can use adminMiddleware if we create it.
// Let's assume adminMiddleware will exist when admin logic is built.

// POST /api/medicine-suggestion (Public / Authenticated AI logic)
router.post('/', medicineController.suggestMedicines);

// Admin / Inventory endpoints (We'll mount these to /api/medicines in app.js if we wanted, 
// but since the file is medicine-suggestion, let's keep it here or rename it. 
// Actually, it's easier to keep them under /api/medicine-suggestion for backward compatibility of file paths,
// but ideally they'd be protected by adminMiddleware.

router.get('/inventory', medicineController.getAllMedicines);
router.get('/inventory/:id', medicineController.getMedicineById);

// If an admin wants to add a medicine
router.post('/inventory', medicineController.createMedicine);
router.put('/inventory/:id', medicineController.updateMedicine);
router.delete('/inventory/:id', medicineController.deleteMedicine);

module.exports = router;
