const express = require('express');
const router  = express.Router();
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const authenticate = require('../middleware/authenticate');
const doctorController = require('../controllers/doctorController');

// Availability Routes (Must be BEFORE /:id)
router.get('/availability', authenticate, doctorController.getAvailability);
router.put('/availability', authenticate, doctorController.updateAvailability);
router.patch('/availability/date', authenticate, doctorController.updateDateAvailability);

function toRad(deg) { return deg * (Math.PI / 180); }

function haversine(lat1, lng1, lat2, lng2) {
    const R    = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a    = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GET /api/doctors
router.get('/', async (req, res) => {
    try {
        const { specialty } = req.query;
        let filter = { role: 'doctor' };
        
        if (specialty) {
            filter.specialty = { $regex: new RegExp(specialty, 'i') };
        }

        const doctors = await User.find(filter).select('-password').populate('hospitalId');
        
        // Map hospitalId -> hospital for UI compatibility
        const formattedDoctors = doctors.map(d => {
            const obj = d.toObject();
            obj.hospital = obj.hospitalId || null;
            return obj;
        });

        res.json({ success: true, doctors: formattedDoctors });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/doctors/:id
router.get('/:id', async (req, res) => {
    try {
        const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' })
            .select('-password')
            .populate('hospitalId');
            
        if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
        
        const doctorObj = doctor.toObject();
        doctorObj.hospital = doctorObj.hospitalId || null;
        
        res.json({ success: true, doctor: doctorObj });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/doctors/nearest
router.post('/nearest', async (req, res) => {
    try {
        const { lat, lng, specialty, maxDistance = 100 } = req.body;
        if (!lat || !lng) return res.status(400).json({ success: false, message: 'lat and lng are required' });

        const doctors = await User.find({ role: 'doctor' }).select('-password').populate('hospitalId');

        let result = doctors.map(doctor => {
            const hospital = doctor.hospitalId; 
            if (!hospital || !hospital.lat || !hospital.lng) return null;
            
            const distance = haversine(lat, lng, hospital.lat, hospital.lng);
            
            const obj = doctor.toObject();
            obj.hospital = hospital; // Use populated hospital

            return {
                ...obj,
                distance: parseFloat(distance.toFixed(2)),
                estimatedTravelTime: Math.ceil((distance / (40 * (1 - hospital.traffic * 0.6))) * 60)
            };
        }).filter(d => d && d.distance <= maxDistance);

        if (specialty) {
            result = result.filter(d => d.specialty.toLowerCase().includes(specialty.toLowerCase()));
        }
        result.sort((a, b) => a.distance - b.distance);

        res.json({ success: true, doctors: result });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
