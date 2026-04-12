const fs = require('fs');
const path = require('path');
const geminiService = require('../services/geminiService');
const MedicalRecord = require('../models/MedicalRecord');
const securityGateway = require('../services/securityGateway');

/**
 * AI Medical Report Analysis Controller
 * Uses Gemini 2.x (Multi-Modal) for high-precision diagnostics, with a rule-based fallback.
 */
const aiController = {

    async analyzeReport(req, res) {
        let imagePath = null;
        try {
            if (req.file) {
                imagePath = req.file.path;
                // --- ACTIVE MALWARE SCAN ---
                const scanResult = await securityGateway.scanFile(imagePath);
                if (!scanResult.safe) {
                    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
                    return res.status(403).json({ 
                        success: false, 
                        message: 'Security Alert: Malicious file pattern detected.',
                        threat: scanResult.threat 
                    });
                }
            }

            if (!req.file) {
                // If no file but there's text (symptom-based analysis)
                const analysis = analyzeReportText(reportText);
                console.log(`[aiController] Symptom-based analysis returned success.`);
                return res.json({ success: true, from: 'logic', data: analysis });
            }

            imagePath = req.file.path;

            // Use Gemini for multimodal analysis (OCR + LLM)
            try {
                const aiAnalysis = await geminiService.analyzeMedicalReport(imagePath);

                // --- NEW: PERSISTENCE BLOCK ---
                // Only persist if we have an authenticated user
                if (req.user && req.user.id) {
                    try {
                        // If a doctor is uploading, they might provide a patientId in the request body
                        const isDoctor = req.user.role === 'doctor' || req.user.role === 'admin';
                        const targetPatientId = (isDoctor && req.body.patientId) ? req.body.patientId : req.user.id;

                        const newRecord = new MedicalRecord({
                            patient: targetPatientId,
                            reportType: aiAnalysis.extractedValues?.[0]?.testName || 'Medical Report',
                            fileName: req.file.originalname,
                            fileUrl: `/uploads/${path.basename(imagePath)}`,
                            analysis: aiAnalysis,
                            status: isDoctor ? 'reviewed' : 'pending' // Auto-review if doctor uploads
                        });
                        await newRecord.save();
                        console.log(`[aiController] Successfully persisted record for patient: ${targetPatientId} (Uploaded by: ${req.user.id})`);
                    } catch (dbError) {
                        console.error('[aiController] Failed to persist medical record:', dbError.message);
                    }
                }
                // --- END PERSISTENCE BLOCK ---

                console.log(`[aiController] Gemini analysis success: ${aiAnalysis.disease}`);
                return res.json({
                    success: true,
                    from: 'gemini',
                    data: aiAnalysis
                });
            } catch (aiError) {
                console.error('❌ [aiController] Gemini analysis CRITICAL FAILURE:');
                console.error(`   Message: ${aiError.message}`);
                console.error(`   Stack: ${aiError.stack}`);

                // Fallback: Continue to rule-based analysis if Gemini fails
                const reportText = req.body.text || '';
                const analysis = analyzeReportText(reportText);

                // Cleanup file
                if (imagePath && fs.existsSync(imagePath)) {
                    fs.unlink(imagePath, (err) => { if (err) console.error('Cleanup error:', err); });
                }

                console.warn(`⚠️ [aiController] Falling back to rule-based analysis: ${analysis.disease}`);
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
    'hemoglobin': { low: 12.0, high: 17.5, unit: 'g/dL', disease: 'Anemia' },
    'glucose': { low: 70, high: 100, unit: 'mg/dL', disease: 'Diabetes' },
    'platelet': { low: 150, high: 400, unit: 'K/µL', disease: 'Thrombocytopenia' },
    'wbc': { low: 4.5, high: 11.0, unit: 'K/µL', disease: 'Infection' },
    'cholesterol': { low: 0, high: 200, unit: 'mg/dL', disease: 'Hypercholesterolemia' },
    'creatinine': { low: 0.6, high: 1.2, unit: 'mg/dL', disease: 'Kidney Disease' },
    'alt': { low: 7, high: 56, unit: 'U/L', disease: 'Liver Disease' },
    'tsh': { low: 0.4, high: 4.0, unit: 'mIU/L', disease: 'Hypothyroidism' },
    'systolic': { low: 90, high: 120, unit: 'mmHg', disease: 'Hypertension' },
};

const medicineDB = {
    'Anemia': [{ name: 'Iron Supplement', dosage: '65mg', frequency: 'Once daily', duration: '3-6 months', precautions: 'Take with vitamin C' }],
    'Diabetes': [{ name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', duration: 'As prescribed', precautions: 'Take with meals' }],
    'Thrombocytopenia': [{ name: 'Prednisone', dosage: 'As prescribed', frequency: 'As directed', duration: 'As prescribed', precautions: 'Gradual taper required' }],
    'Infection': [{ name: 'Amoxicillin', dosage: '500mg', frequency: 'Three times daily', duration: '7-10 days', precautions: 'Complete full course' }],
    'Hypercholesterolemia': [{ name: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily', duration: 'As prescribed', precautions: 'Avoid grapefruit' }],
    'Kidney Disease': [{ name: 'ACE Inhibitor', dosage: 'As prescribed', frequency: 'As directed', duration: 'As prescribed', precautions: 'Monitor kidney function' }],
    'Liver Disease': [{ name: 'Ursodeoxycholic Acid', dosage: '300mg', frequency: 'Twice daily', duration: 'As prescribed', precautions: 'Take with food' }],
    'Hypothyroidism': [{ name: 'Levothyroxine', dosage: 'As prescribed', frequency: 'Once daily', duration: 'Lifelong', precautions: '30 min before breakfast' }],
    'Hypertension': [{ name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: 'As prescribed', precautions: 'Monitor blood pressure' }],
};

function analyzeReportText(text) {
    const lower = text.toLowerCase();
    const diseases = new Set();
    const extractedValues = [];

    for (const [marker, range] of Object.entries(labRanges)) {
        // Try to find a numeric value near the lab marker keyword
        const regex = new RegExp(`${marker}[^\\d]*(\\d+\\.?\\d*)`, 'i');
        const match = lower.match(regex);
        if (!match) continue;

        const value = parseFloat(match[1]);
        let status = 'Normal';
        if (value < range.low) { status = 'Low'; diseases.add(range.disease); }
        if (value > range.high) { status = 'High'; diseases.add(range.disease); }

        extractedValues.push({
            testName: marker.charAt(0).toUpperCase() + marker.slice(1),
            value,
            units: range.unit,
            status,
            range: { min: range.low, max: range.high },
            significance: `This marker is used to screen for ${range.disease}.`
        });
    }

    const diseaseList = [...diseases];
    const medicineSuggestions = diseaseList.flatMap(d => (medicineDB[d] || []).map(m => ({ ...m, forDisease: d }))).slice(0, 5);

    if (medicineSuggestions.length === 0) {
        medicineSuggestions.push({ name: 'Multivitamin', dosage: 'As directed', frequency: 'Once daily', duration: 'Ongoing', precautions: 'General health maintenance', forDisease: 'General Health' });
    }

    return {
        confidenceScore: 60, // Baseline confidence for rule-based logic
        diseases: diseaseList,
        disease: diseaseList.length > 0 ? diseaseList[0] : "General Health Consultation",
        extractedValues,
        medicineSuggestions,
        summary: diseaseList.length > 0
            ? `Possible conditions detected: ${diseaseList.join(', ')}.`
            : 'No significant abnormalities detected based on the report.',
        disclaimer: 'This is an automated analysis for informational purposes only. Always consult a qualified healthcare professional.'
    };
}

module.exports = aiController;
