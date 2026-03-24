const express = require('express');
const router  = express.Router();
const { doctors, hospitals } = require('../data/mockData');
const authenticate = require('../middleware/authenticate');
const doctorController = require('../controllers/doctorController');

// Availability Routes (Must be BEFORE /:id)
router.get('/availability', authenticate, doctorController.getAvailability);
router.put('/availability', authenticate, doctorController.updateAvailability);

function toRad(deg) { return deg * (Math.PI / 180); }

function haversine(lat1, lng1, lat2, lng2) {
    const R    = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a    = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GET /api/doctors
router.get('/', (req, res) => {
    const { hospitalId, specialty, departmentId } = req.query;
    let result = [...doctors];
    if (hospitalId)   result = result.filter(d => d.hospitalId   === parseInt(hospitalId));
    if (specialty)    result = result.filter(d => d.specialty.toLowerCase() === specialty.toLowerCase());
    if (departmentId) result = result.filter(d => d.departmentId === parseInt(departmentId));
    res.json({ success: true, doctors: result });
});

// GET /api/doctors/:id
router.get('/:id', (req, res) => {
    const doctor = doctors.find(d => d.id === parseInt(req.params.id));
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    const hospital = hospitals.find(h => h.id === doctor.hospitalId);
    res.json({ success: true, doctor: { ...doctor, hospital } });
});

// POST /api/doctors/nearest
router.post('/nearest', (req, res) => {
    const { lat, lng, specialty, maxDistance = 100 } = req.body;
    if (!lat || !lng) return res.status(400).json({ success: false, message: 'lat and lng are required' });

    let result = doctors.map(doctor => {
        const hospital = hospitals.find(h => h.id === doctor.hospitalId);
        if (!hospital) return null;
        const distance = haversine(lat, lng, hospital.lat, hospital.lng);
        return {
            ...doctor,
            hospital,
            distance:            parseFloat(distance.toFixed(2)),
            estimatedTravelTime: Math.ceil((distance / (40 * (1 - hospital.traffic * 0.6))) * 60)
        };
    }).filter(d => d && d.distance <= maxDistance);

    if (specialty) result = result.filter(d => d.specialty.toLowerCase() === specialty.toLowerCase());
    result.sort((a, b) => a.distance - b.distance);

    res.json({ success: true, doctors: result });
});

module.exports = router;
