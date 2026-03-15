const express = require('express');
const router  = express.Router();

const medicineDB = {
    fever:    [
        { name: 'Paracetamol',                  dosage: '500mg',          frequency: 'Every 6 hours',               duration: '3-5 days',  precautions: 'Take with food. Do not exceed 4g/day' },
        { name: 'Ibuprofen',                    dosage: '400mg',          frequency: 'Every 8 hours',               duration: '3-5 days',  precautions: 'Take with food. Not for children under 12' },
    ],
    headache: [
        { name: 'Paracetamol',                  dosage: '500mg',          frequency: 'Every 6 hours',               duration: 'As needed', precautions: 'Take with food' },
        { name: 'Aspirin',                      dosage: '325mg',          frequency: 'Every 4-6 hours',             duration: 'As needed', precautions: 'Not for children. Take with food' },
    ],
    cough:    [
        { name: 'Dextromethorphan',             dosage: '15mg',           frequency: 'Every 4-6 hours',             duration: '5-7 days',  precautions: 'Do not exceed 120mg/day' },
        { name: 'Guaifenesin',                  dosage: '200mg',          frequency: 'Every 4 hours',               duration: '5-7 days',  precautions: 'Drink plenty of water' },
    ],
    cold:     [
        { name: 'Paracetamol + Pseudoephedrine',dosage: '500mg + 60mg',  frequency: 'Every 6 hours',               duration: '3-5 days',  precautions: 'May cause drowsiness' },
        { name: 'Vitamin C',                    dosage: '1000mg',         frequency: 'Once daily',                  duration: '5-7 days',  precautions: 'Take with food' },
    ],
    pain:     [
        { name: 'Ibuprofen',                    dosage: '400mg',          frequency: 'Every 8 hours',               duration: 'As needed', precautions: 'Take with food' },
        { name: 'Naproxen',                     dosage: '250mg',          frequency: 'Every 12 hours',              duration: 'As needed', precautions: 'Take with food' },
    ],
    stomach:  [
        { name: 'Omeprazole',                   dosage: '20mg',           frequency: 'Once daily before meals',     duration: '7-14 days', precautions: 'Take 30 minutes before food' },
        { name: 'Antacid',                      dosage: 'As directed',    frequency: 'As needed',                   duration: 'As needed', precautions: 'Take 1-2 hours after meals' },
    ],
};

const keywordMap = {
    fever:    ['fever', 'temperature', 'hot', 'burning'],
    headache: ['headache', 'head', 'migraine', 'head ache'],
    cough:    ['cough', 'coughing', 'dry cough', 'wet cough'],
    cold:     ['cold', 'runny nose', 'sneezing', 'nasal congestion'],
    pain:     ['pain', 'ache', 'sore', 'hurting'],
    stomach:  ['stomach', 'nausea', 'vomiting', 'indigestion', 'heartburn', 'abdominal'],
};

// POST /api/medicine-suggestion
router.post('/', (req, res) => {
    const { symptoms, allergies = [] } = req.body;
    if (!symptoms) return res.status(400).json({ success: false, message: 'symptoms field is required' });

    const symptomLower   = symptoms.toLowerCase();
    const suggestions    = [];
    const matchedSymptoms = [];

    for (const [key, keywords] of Object.entries(keywordMap)) {
        if (keywords.some(kw => symptomLower.includes(kw))) {
            matchedSymptoms.push(key);
            (medicineDB[key] || []).forEach(med => {
                const hasAllergy = allergies.some(a => med.name.toLowerCase().includes(a.toLowerCase()));
                if (!hasAllergy) suggestions.push({ ...med, symptom: key });
            });
        }
    }

    const severityWarnings = [];
    if (symptomLower.includes('high fever') || symptomLower.includes('fever above 103'))
        severityWarnings.push('High fever detected. Consult a doctor if it persists for more than 3 days.');
    if (symptomLower.includes('chest pain') || symptomLower.includes('difficulty breathing'))
        severityWarnings.push('Chest pain or breathing difficulties require immediate medical attention.');

    res.json({
        success: true,
        suggestions:     suggestions.slice(0, 3),
        matchedSymptoms,
        severityWarnings,
        disclaimer: 'For informational purposes only. Always consult a healthcare professional.'
    });
});

module.exports = router;
