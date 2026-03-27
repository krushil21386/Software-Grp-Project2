const fs   = require('fs');
const path = require('path');
const geminiService = require('../services/geminiService');

/**
 * AI Medical Report Analysis Controller
 * Uses Hugging Face (OCR + LLM) for depth, with a rule-based fallback.
 */
const aiController = {

    async analyzeReport(req, res) {
        let imagePath = null;
        try {
            if (!req.file) {
                // If no file but there's text (symptom-based analysis)
                const reportText = req.body.text || '';
                const analysis = analyzeReportText(reportText);
                return res.json({ success: true, from: 'logic', data: analysis });
            }

            imagePath = req.file.path;

            // Use Gemini for multimodal analysis (OCR + LLM)
            try {
                const aiAnalysis = await geminiService.analyzeMedicalReport(imagePath);
                
                // Cleanup file after successful analysis
                fs.unlink(imagePath, (err) => { if (err) console.error('Cleanup error:', err); });
                
                return res.json({ 
                    success: true, 
                    from: 'gemini', 
                    data: aiAnalysis 
                });
            } catch (aiError) {
                console.error('Gemini analysis failed, falling back to rule-based logic:', aiError.message);
                
                // Fallback: Continue to rule-based analysis if Gemini fails
                const reportText = req.body.text || '';
                const analysis = analyzeReportText(reportText);
                
                // Cleanup file
                fs.unlink(imagePath, (err) => { if (err) console.error('Cleanup error:', err); });

                return res.json({ 
                    success: true, 
                    from: 'fallback-logic', 
                    data: analysis,
                    note: 'Advanced AI analysis unavailable. Using standard processing.'
                });
            }

        } catch (error) {
            console.error('Analysis error:', error);
            if (imagePath && fs.existsSync(imagePath)) {
                fs.unlink(imagePath, (err) => { if (err) console.error('Cleanup error:', err); });
            }
            res.status(500).json({ success: false, message: 'Report analysis failed.' });
        }
    }
};

// ── Rule-based lab report analyser ──────────────────────────────────────────

const labRanges = {
    'hemoglobin':        { low: 12.0, high: 17.5, unit: 'g/dL',   disease: 'Anemia' },
    'glucose':           { low: 70,   high: 100,  unit: 'mg/dL',  disease: 'Diabetes' },
    'platelet':          { low: 150,  high: 400,  unit: 'K/µL',   disease: 'Thrombocytopenia' },
    'wbc':               { low: 4.5,  high: 11.0, unit: 'K/µL',   disease: 'Infection' },
    'cholesterol':       { low: 0,    high: 200,  unit: 'mg/dL',  disease: 'Hypercholesterolemia' },
    'creatinine':        { low: 0.6,  high: 1.2,  unit: 'mg/dL',  disease: 'Kidney Disease' },
    'alt':               { low: 7,    high: 56,   unit: 'U/L',    disease: 'Liver Disease' },
    'tsh':               { low: 0.4,  high: 4.0,  unit: 'mIU/L',  disease: 'Hypothyroidism' },
    'systolic':          { low: 90,   high: 120,  unit: 'mmHg',   disease: 'Hypertension' },
};

const medicineDB = {
    'Anemia':                [{ name: 'Iron Supplement',          dosage: '65mg',           frequency: 'Once daily',       duration: '3-6 months',  precautions: 'Take with vitamin C' }],
    'Diabetes':              [{ name: 'Metformin',                dosage: '500mg',          frequency: 'Twice daily',      duration: 'As prescribed', precautions: 'Take with meals' }],
    'Thrombocytopenia':      [{ name: 'Prednisone',               dosage: 'As prescribed',  frequency: 'As directed',      duration: 'As prescribed', precautions: 'Gradual taper required' }],
    'Infection':             [{ name: 'Amoxicillin',              dosage: '500mg',          frequency: 'Three times daily',duration: '7-10 days',   precautions: 'Complete full course' }],
    'Hypercholesterolemia':  [{ name: 'Atorvastatin',             dosage: '20mg',           frequency: 'Once daily',       duration: 'As prescribed', precautions: 'Avoid grapefruit' }],
    'Kidney Disease':        [{ name: 'ACE Inhibitor',            dosage: 'As prescribed',  frequency: 'As directed',      duration: 'As prescribed', precautions: 'Monitor kidney function' }],
    'Liver Disease':         [{ name: 'Ursodeoxycholic Acid',     dosage: '300mg',          frequency: 'Twice daily',      duration: 'As prescribed', precautions: 'Take with food' }],
    'Hypothyroidism':        [{ name: 'Levothyroxine',            dosage: 'As prescribed',  frequency: 'Once daily',       duration: 'Lifelong',     precautions: '30 min before breakfast' }],
    'Hypertension':          [{ name: 'Amlodipine',               dosage: '5mg',            frequency: 'Once daily',       duration: 'As prescribed', precautions: 'Monitor blood pressure' }],
};

function analyzeReportText(text) {
    const lower    = text.toLowerCase();
    const diseases = new Set();
    const findings = [];

    for (const [marker, range] of Object.entries(labRanges)) {
        // Try to find a numeric value near the lab marker keyword
        const regex = new RegExp(`${marker}[^\\d]*(\\d+\\.?\\d*)`, 'i');
        const match = lower.match(regex);
        if (!match) continue;

        const value  = parseFloat(match[1]);
        let   status = 'normal';
        if (value < range.low)  { status = 'low';  diseases.add(range.disease); }
        if (value > range.high) { status = 'high'; diseases.add(range.disease); }

        findings.push({ marker, value, unit: range.unit, status, referenceRange: `${range.low}–${range.high}` });
    }

    const diseaseList = [...diseases];
    const medicineSuggestions = diseaseList.flatMap(d => (medicineDB[d] || []).map(m => ({ ...m, forDisease: d }))).slice(0, 5);

    if (medicineSuggestions.length === 0) {
        medicineSuggestions.push({ name: 'Multivitamin', dosage: 'As directed', frequency: 'Once daily', duration: 'Ongoing', precautions: 'General health maintenance', forDisease: 'General Health' });
    }

    return {
        diseases:          diseaseList,
        findings,
        medicineSuggestions,
        summary:           diseaseList.length > 0
            ? `Possible conditions detected: ${diseaseList.join(', ')}.`
            : 'No significant abnormalities detected based on the report.',
        disclaimer: 'This is an automated analysis for informational purposes only. Always consult a qualified healthcare professional.'
    };
}

module.exports = aiController;
