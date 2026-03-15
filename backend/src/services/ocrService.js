const { spawn } = require('child_process');
const path = require('path');

const ocrService = {
    async processModule(imagePath) {
        return new Promise((resolve, reject) => {
            console.log(`Processing image with DeepSeek-OCR: ${imagePath}`);

            const pythonScript = path.join(__dirname, 'ocr_engine.py');
            // Try to use virtual environment Python if it exists, otherwise use system Python
            const venvPython = path.join(__dirname, '../../../.venv/Scripts/python.exe');
            const pythonPath = require('fs').existsSync(venvPython) ? venvPython : 'python';
            
            console.log(`Using Python: ${pythonPath}`);
            
            // Redirect stderr to suppress warnings, but still capture actual errors
            const pythonProcess = spawn(pythonPath, [pythonScript, imagePath], {
                stdio: ['pipe', 'pipe', 'pipe'] // stdin, stdout, stderr
            });

            let dataString = '';
            let errorString = '';

            pythonProcess.stdout.on('data', (data) => {
                dataString += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                const stderrText = data.toString();
                // Filter out warnings but keep actual errors
                if (!stderrText.includes('Warning:') && 
                    !stderrText.includes('Encountered exception while importing') &&
                    !stderrText.includes('You are using a model of type') &&
                    !stderrText.includes('HF_TOKEN')) {
                    console.error(`Python Stderr: ${stderrText}`);
                    errorString += stderrText;
                } else {
                    // Log warnings but don't treat them as errors
                    console.warn(`Python Warning (ignored): ${stderrText.substring(0, 100)}...`);
                }
            });

            pythonProcess.on('close', (code) => {
                // Filter out warning-only errors
                const actualErrors = errorString
                    .split('\n')
                    .filter(line => 
                        line.trim() && 
                        !line.includes('Warning:') &&
                        !line.includes('Encountered exception while importing') &&
                        !line.includes('You are using a model of type') &&
                        !line.includes('HF_TOKEN') &&
                        !line.includes('Python Stderr:')
                    )
                    .join('\n');

                if (code !== 0) {
                    // Check for missing dependencies
                    if (errorString.includes('No module named')) {
                        const missingModules = errorString.match(/No module named '([^']+)'/g) || [];
                        const modules = [...new Set(missingModules.map(m => m.match(/'([^']+)'/)[1]))].join(', ');
                        return reject(new Error(`Missing Python dependencies: ${modules}. Please run: pip install -r requirements.txt`));
                    }
                    
                    // Only fail if there are actual errors (not just warnings)
                    if (actualErrors.trim().length > 0) {
                        return reject(new Error(`OCR process failed with code ${code}. ${actualErrors.substring(0, 500)}`));
                    }
                    
                    // If only warnings, check if we got valid output anyway
                    if (dataString && dataString.trim().length > 0) {
                        try {
                            const result = JSON.parse(dataString);
                            if (result.success) {
                                // Warnings but successful - resolve anyway
                                return resolve(result);
                            }
                        } catch {
                            // Failed to parse, treat as error
                        }
                    }
                    
                    return reject(new Error(`OCR process exited with code ${code}. Check logs for details.`));
                }

                try {
                    // Check if we have any output
                    if (!dataString || dataString.trim().length === 0) {
                        return reject(new Error('OCR process completed but produced no output. Please check the image file.'));
                    }
                    
                    const result = JSON.parse(dataString);
                    if (result.success) {
                        resolve(result);
                    } else {
                        reject(new Error(result.error || 'Unknown error in OCR script'));
                    }
                } catch (err) {
                    reject(new Error(`Failed to parse OCR output: ${err.message}. Output: ${dataString.substring(0, 200)}`));
                }
            });
        });
    },

    async extractDetails(ocrData) {
        const text = ocrData.text || "";
        const lines = text.split('\n');

        // Define common lab tests and their standard ranges (simplified)
        // These ranges are illustrative examples.
        const markers = [
            { name: 'Hemoglobin', regex: /Hemoglobin|Hb|HGB.*?(\d+\.?\d*)/i, unit: 'g/dL', min: 13.0, max: 17.0 },
            { name: 'WBC', regex: /WBC|White Blood Cell|Leukocyte.*?(\d+\.?\d*)/i, unit: '/cmm', min: 4000, max: 11000 },
            { name: 'RBC', regex: /RBC|Red Blood Cell|Erythrocyte.*?(\d+\.?\d*)/i, unit: 'mill/cmm', min: 4.5, max: 5.5 },
            { name: 'Platelets', regex: /Platelet|PLT.*?(\d+\.?\d*)/i, unit: '/cmm', min: 150000, max: 450000 },
            { name: 'Glucose', regex: /Glucose|Blood Sugar|BS|FBS|FBG.*?(\d+\.?\d*)/i, unit: 'mg/dL', min: 70, max: 100 },
            { name: 'Cholesterol', regex: /Cholesterol|Total Cholesterol|TC.*?(\d+\.?\d*)/i, unit: 'mg/dL', min: 125, max: 200 },
            { name: 'TSH', regex: /TSH|Thyroid Stimulating Hormone.*?(\d+\.?\d*)/i, unit: 'mIU/L', min: 0.4, max: 4.0 },
            { name: 'Creatinine', regex: /Creatinine|CREA.*?(\d+\.?\d*)/i, unit: 'mg/dL', min: 0.6, max: 1.2 },
            { name: 'Urea', regex: /Urea|BUN|Blood Urea Nitrogen.*?(\d+\.?\d*)/i, unit: 'mg/dL', min: 7, max: 20 },
            { name: 'ALT', regex: /ALT|Alanine Aminotransferase|SGPT.*?(\d+\.?\d*)/i, unit: 'U/L', min: 7, max: 56 },
            { name: 'AST', regex: /AST|Aspartate Aminotransferase|SGOT.*?(\d+\.?\d*)/i, unit: 'U/L', min: 10, max: 40 },
            { name: 'Bilirubin', regex: /Bilirubin|Total Bilirubin|TBIL.*?(\d+\.?\d*)/i, unit: 'mg/dL', min: 0.1, max: 1.2 }
        ];

        const extractedValues = [];
        const diagnosisReport = { findings: [] };
        const diseases = new Set();

        markers.forEach(marker => {
            const match = text.match(marker.regex);
            if (match && match[1]) {
                const value = parseFloat(match[1]);
                const isNormal = value >= marker.min && value <= marker.max;

                extractedValues.push({
                    testName: marker.name,
                    value: value,
                    units: marker.unit,
                    range: { min: marker.min, max: marker.max }
                });

                if (!isNormal) {
                    const status = value < marker.min ? 'Low' : 'High';
                    let condition = 'Abnormality';
                    let message = `${marker.name} is ${status}.`;

                    // Enhanced rule-based logic for diseases
                    if (marker.name === 'Hemoglobin' && status === 'Low') {
                        condition = 'Anemia';
                        diseases.add('Anemia');
                        message += ' May indicate Anemia.';
                    }
                    if (marker.name === 'Glucose' && status === 'High') {
                        condition = 'Diabetes Risk';
                        diseases.add('Diabetes');
                        message += ' High blood sugar levels.';
                    }
                    if (marker.name === 'Glucose' && status === 'Low') {
                        condition = 'Hypoglycemia';
                        diseases.add('Hypoglycemia');
                        message += ' Low blood sugar levels.';
                    }
                    if (marker.name === 'WBC' && status === 'High') {
                        condition = 'Infection';
                        diseases.add('Infection');
                        message += ' Possible active infection.';
                    }
                    if (marker.name === 'WBC' && status === 'Low') {
                        condition = 'Immunodeficiency';
                        diseases.add('Immunodeficiency');
                        message += ' Low white blood cell count.';
                    }
                    if (marker.name === 'RBC' && status === 'Low') {
                        condition = 'Anemia';
                        diseases.add('Anemia');
                        message += ' Low red blood cell count.';
                    }
                    if (marker.name === 'Platelets' && status === 'Low') {
                        condition = 'Thrombocytopenia';
                        diseases.add('Thrombocytopenia');
                        message += ' Low platelet count.';
                    }
                    if (marker.name === 'Cholesterol' && status === 'High') {
                        condition = 'Hypercholesterolemia';
                        diseases.add('Hypercholesterolemia');
                        message += ' High cholesterol levels.';
                    }
                    if (marker.name === 'TSH' && status === 'High') {
                        condition = 'Hypothyroidism';
                        diseases.add('Hypothyroidism');
                        message += ' Possible hypothyroidism.';
                    }
                    if (marker.name === 'TSH' && status === 'Low') {
                        condition = 'Hyperthyroidism';
                        diseases.add('Hyperthyroidism');
                        message += ' Possible hyperthyroidism.';
                    }

                    diagnosisReport.findings.push({
                        testName: marker.name,
                        status: status,
                        condition: condition,
                        message: message
                    });
                } else {
                    diagnosisReport.findings.push({
                        testName: marker.name,
                        status: 'Normal',
                        condition: 'Healthy',
                        message: 'Within normal range'
                    });
                }
            }
        });

        // Additional disease detection from text patterns
        const diseasePatterns = [
            { pattern: /diabetes|diabetic|DM|Type [12] Diabetes/i, disease: 'Diabetes' },
            { pattern: /anemia|anaemic|low hemoglobin|low hb/i, disease: 'Anemia' },
            { pattern: /infection|bacterial|viral|sepsis/i, disease: 'Infection' },
            { pattern: /hypertension|high blood pressure|HTN/i, disease: 'Hypertension' },
            { pattern: /hypothyroidism|underactive thyroid/i, disease: 'Hypothyroidism' },
            { pattern: /hyperthyroidism|overactive thyroid/i, disease: 'Hyperthyroidism' },
            { pattern: /kidney disease|renal failure|CKD|chronic kidney/i, disease: 'Kidney Disease' },
            { pattern: /liver disease|hepatitis|jaundice/i, disease: 'Liver Disease' },
            { pattern: /pneumonia|lung infection/i, disease: 'Pneumonia' },
            { pattern: /bronchitis|respiratory infection/i, disease: 'Bronchitis' }
        ];

        diseasePatterns.forEach(({ pattern, disease }) => {
            if (pattern.test(text)) {
                diseases.add(disease);
            }
        });

        const diseaseList = Array.from(diseases);
        const overallDisease = diseaseList.length > 0 ? diseaseList.join(', ') : 'No significant abnormalities detected';

        return {
            rawText: text,
            extractedValues: extractedValues,
            diagnosisReport: diagnosisReport,
            diseases: diseaseList,
            disease: overallDisease
        };
    }
};

module.exports = ocrService;
