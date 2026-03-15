const ocrService = require('../services/ocrService');
const fs = require('fs');
const path = require('path');

const aiController = {
    async analyzeReport(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No file uploaded' });
            }

            const imagePath = req.file.path;

            // Process the image with DeepSeek-OCR-2
            const ocrData = await ocrService.processModule(imagePath);
            const analysis = await ocrService.extractDetails(ocrData);

            // Generate medicine suggestions based on identified diseases
            const medicineSuggestions = generateMedicineSuggestions(analysis.diseases || []);

            // Clean up file after processing
            fs.unlink(imagePath, (err) => {
                if (err) console.error('Failed to delete temp file:', err);
            });

            res.json({
                success: true,
                data: {
                    ...analysis,
                    medicineSuggestions
                }
            });

        } catch (error) {
            console.error('Analysis Error:', error);
            
            // Provide more specific error messages
            let statusCode = 500;
            let errorMessage = error.message || 'Analysis failed';
            
            if (error.message.includes('Missing Python dependencies')) {
                statusCode = 503; // Service Unavailable
                errorMessage = 'OCR service dependencies are missing. Please install Python dependencies.';
            } else if (error.message.includes('No module named')) {
                statusCode = 503;
                errorMessage = 'Python dependencies are not installed. Please run: pip install -r requirements.txt';
            } else if (error.message.includes('OCR process failed')) {
                statusCode = 500;
                errorMessage = 'OCR processing failed. Please ensure the image is valid and OCR dependencies are installed.';
            }
            
            res.status(statusCode).json({ 
                success: false, 
                message: errorMessage,
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};

// Generate medicine suggestions based on identified diseases
function generateMedicineSuggestions(diseases) {
    const medicineDatabase = {
        'Anemia': [
            { name: 'Iron Supplement', dosage: '65mg', frequency: 'Once daily', duration: '3-6 months', precautions: 'Take with vitamin C for better absorption' },
            { name: 'Folic Acid', dosage: '1mg', frequency: 'Once daily', duration: 'As prescribed', precautions: 'Take with food' }
        ],
        'Diabetes': [
            { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', duration: 'As prescribed', precautions: 'Take with meals to reduce stomach upset' },
            { name: 'Insulin', dosage: 'As prescribed', frequency: 'As directed', duration: 'As prescribed', precautions: 'Monitor blood sugar regularly' }
        ],
        'Infection': [
            { name: 'Amoxicillin', dosage: '500mg', frequency: 'Three times daily', duration: '7-10 days', precautions: 'Complete full course even if feeling better' },
            { name: 'Azithromycin', dosage: '500mg', frequency: 'Once daily', duration: '5 days', precautions: 'Take on empty stomach' }
        ],
        'Hypertension': [
            { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', duration: 'As prescribed', precautions: 'Monitor blood pressure regularly' },
            { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: 'As prescribed', precautions: 'May cause dizziness' }
        ],
        'Hypothyroidism': [
            { name: 'Levothyroxine', dosage: 'As prescribed', frequency: 'Once daily', duration: 'Lifelong', precautions: 'Take on empty stomach, 30 minutes before breakfast' }
        ],
        'Hyperthyroidism': [
            { name: 'Methimazole', dosage: '10mg', frequency: 'Three times daily', duration: 'As prescribed', precautions: 'Regular blood tests required' }
        ],
        'Kidney Disease': [
            { name: 'ACE Inhibitor', dosage: 'As prescribed', frequency: 'As directed', duration: 'As prescribed', precautions: 'Monitor kidney function' }
        ],
        'Liver Disease': [
            { name: 'Ursodeoxycholic Acid', dosage: '300mg', frequency: 'Twice daily', duration: 'As prescribed', precautions: 'Take with food' }
        ],
        'Pneumonia': [
            { name: 'Amoxicillin-Clavulanate', dosage: '875mg/125mg', frequency: 'Twice daily', duration: '7-10 days', precautions: 'Take with food' },
            { name: 'Azithromycin', dosage: '500mg', frequency: 'Once daily', duration: '5 days', precautions: 'Complete full course' }
        ],
        'Bronchitis': [
            { name: 'Doxycycline', dosage: '100mg', frequency: 'Twice daily', duration: '7-10 days', precautions: 'Take with food and plenty of water' },
            { name: 'Albuterol', dosage: 'As needed', frequency: 'Inhalation', duration: 'As needed', precautions: 'For breathing difficulties' }
        ],
        'Thrombocytopenia': [
            { name: 'Prednisone', dosage: 'As prescribed', frequency: 'As directed', duration: 'As prescribed', precautions: 'Gradual tapering required' }
        ],
        'Hypoglycemia': [
            { name: 'Glucose Tablets', dosage: '15-20g', frequency: 'As needed', duration: 'As needed', precautions: 'For immediate blood sugar correction' }
        ],
        'Hypercholesterolemia': [
            { name: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily', duration: 'As prescribed', precautions: 'Take in evening, avoid grapefruit' }
        ]
    };

    const suggestions = [];
    diseases.forEach(disease => {
        if (medicineDatabase[disease]) {
            suggestions.push(...medicineDatabase[disease].map(med => ({ ...med, forDisease: disease })));
        }
    });

    // If no specific disease found, suggest general health supplements
    if (suggestions.length === 0) {
        suggestions.push({
            name: 'Multivitamin',
            dosage: 'As directed',
            frequency: 'Once daily',
            duration: 'Ongoing',
            precautions: 'Maintain overall health',
            forDisease: 'General Health'
        });
    }

    return suggestions.slice(0, 5); // Return top 5 suggestions
}

module.exports = aiController;
