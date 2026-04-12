const Medicine = require('../models/Medicine');

// Keyword mapping for symptom-to-category matching
const keywordMap = {
    fever:    ['fever', 'temperature', 'hot', 'burning'],
    headache: ['headache', 'head', 'migraine', 'head ache'],
    cough:    ['cough', 'coughing', 'dry cough', 'wet cough'],
    cold:     ['cold', 'runny nose', 'sneezing', 'nasal congestion'],
    pain:     ['pain', 'ache', 'sore', 'hurting'],
    stomach:  ['stomach', 'nausea', 'vomiting', 'indigestion', 'heartburn', 'abdominal'],
};

exports.suggestMedicines = async (req, res) => {
    try {
        const { symptoms, allergies = [] } = req.body;
        if (!symptoms) return res.status(400).json({ success: false, message: 'symptoms field is required' });

        const symptomLower = symptoms.toLowerCase();
        const matchedCategories = [];

        // Identify categories based on symptoms
        for (const [category, keywords] of Object.entries(keywordMap)) {
            if (keywords.some(kw => symptomLower.includes(kw))) {
                matchedCategories.push(category);
            }
        }

        let filter = {};
        if (matchedCategories.length > 0) {
            filter.category = { $in: matchedCategories };
        }

        // Fetch medicines from MongoDB
        let medicines = await Medicine.find(filter);

        // Filter out allergies
        const suggestions = medicines.filter(med => {
            const hasAllergy = allergies.some(a => med.name.toLowerCase().includes(a.toLowerCase()));
            return !hasAllergy;
        }).map(med => ({
            name: med.name,
            dosage: med.dosage,
            frequency: med.frequency || 'As directed',
            duration: med.duration || 'As needed',
            precautions: med.precautions,
            symptom: med.category
        }));

        const severityWarnings = [];
        if (symptomLower.includes('high fever') || symptomLower.includes('fever above 103'))
            severityWarnings.push('High fever detected. Consult a doctor if it persists for more than 3 days.');
        if (symptomLower.includes('chest pain') || symptomLower.includes('difficulty breathing'))
            severityWarnings.push('Chest pain or breathing difficulties require immediate medical attention.');

        res.json({
            success: true,
            suggestions: suggestions.slice(0, 3),
            matchedSymptoms: matchedCategories,
            severityWarnings,
            disclaimer: 'For informational purposes only. Always consult a healthcare professional.'
        });
    } catch (error) {
        console.error('Medicine suggestion error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// --- Admin CRUD Operations --- //

exports.getAllMedicines = async (req, res) => {
    try {
        const medicines = await Medicine.find();
        res.json({ success: true, medicines });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getMedicineById = async (req, res) => {
    try {
        const medicine = await Medicine.findById(req.params.id);
        if(!medicine) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, medicine });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.createMedicine = async (req, res) => {
    try {
        const medicine = await Medicine.create(req.body);
        res.status(201).json({ success: true, medicine });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

exports.updateMedicine = async (req, res) => {
    try {
        const medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, medicine });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteMedicine = async (req, res) => {
    try {
        await Medicine.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Medicine deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
