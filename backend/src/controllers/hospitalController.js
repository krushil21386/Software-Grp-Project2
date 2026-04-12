const Hospital = require('../models/Hospital');

exports.getAllHospitals = async (req, res) => {
    try {
        const hospitals = await Hospital.find().populate('departments');
        res.json({ success: true, hospitals });
    } catch (error) {
        console.error('Error fetching hospitals:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getHospitalById = async (req, res) => {
    try {
        const hospital = await Hospital.findById(req.params.id).populate('departments');
        if (!hospital) return res.status(404).json({ success: false, message: 'Hospital not found' });
        res.json({ success: true, hospital });
    } catch (error) {
        console.error('Error fetching hospital:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.createHospital = async (req, res) => {
    try {
        const hospital = await Hospital.create(req.body);
        res.status(201).json({ success: true, hospital });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

exports.updateHospital = async (req, res) => {
    try {
        const hospital = await Hospital.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, hospital });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteHospital = async (req, res) => {
    try {
        await Hospital.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Hospital deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
