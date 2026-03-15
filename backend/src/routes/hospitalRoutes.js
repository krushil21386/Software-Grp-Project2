const express = require('express');
const router  = express.Router();
const { hospitals } = require('../data/mockData');

// GET /api/hospitals
router.get('/', (req, res) => {
    res.json({ success: true, hospitals });
});

// GET /api/hospitals/:id
router.get('/:id', (req, res) => {
    const hospital = hospitals.find(h => h.id === parseInt(req.params.id));
    if (!hospital) return res.status(404).json({ success: false, message: 'Hospital not found' });
    res.json({ success: true, hospital });
});

module.exports = router;
