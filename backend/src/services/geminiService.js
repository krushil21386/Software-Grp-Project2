const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
require("dotenv").config();

// Ensure the API key is present
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("CRITICAL: GEMINI_API_KEY is missing from .env");
}

const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Service to handle multimodal medical report analysis using Gemini.
 */
const geminiService = {
  /**
   * Analyzes an image of a medical report.
   * 
   * @param {string} imagePath - Path to the uploaded image file.
   * @returns {Promise<Object>} - Structured JSON analysis.
   */
  async analyzeMedicalReport(imagePath) {
    // We'll try common variations and fallback to 1.0 if 1.5 is unavailable
    const modelsToTry = [
      "gemini-1.5-flash", 
      "gemini-1.5-pro", 
      "gemini-pro-vision"
    ];
    
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`[GeminiService] Attempting analysis with: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });

        const imageBuffer = await fs.promises.readFile(imagePath);
        const imageParts = [
          {
            inlineData: {
              data: imageBuffer.toString("base64"),
              mimeType: "image/jpeg",
            },
          },
        ];

        const prompt = `
          ACT AS AN EXPERT MEDICAL LABORATORY ANALYST.
          Analyze the attached medical report image with 100% precision. 
          
          STRICT STEPS:
          1. OCR Extraction: Extract every single lab test name, its numeric value, units, and the provided reference range.
          2. Comparison: Compare every value against its reference range. Mark as "High", "Low", or "Normal".
          3. Diagnosis: Based on the pattern of "High" and "Low" values, identify potential medical conditions (e.g., Anemia if Hemoglobin is low, Infection if WBC is high, etc.).
          4. Summary: Provide a clear, professional summary of the findings.
          
          Return the analysis in this STRICT JSON format:
          {
            "extractedValues": [
              {
                "testName": "string",
                "value": number,
                "units": "string",
                "range": { "min": number, "max": number },
                "status": "Normal" | "High" | "Low",
                "bbox": null
              }
            ],
            "diseases": ["string"],
            "summary": "string",
            "medicineSuggestions": [
              {
                "name": "string",
                "dosage": "string",
                "frequency": "string",
                "duration": "string",
                "precautions": "string",
                "forDisease": "string"
              }
            ],
            "diagnosisReport": {
              "findings": [
                { "testName": "string", "message": "string", "status": "Normal" | "Abnormal" }
              ]
            },
            "rawText": "string"
          }
          
          CRITICAL RULES:
          - If any value is outside the reference range, you MUST identify a possible condition in the "diseases" array.
          - Do not guess if the image is blurry, state "Inconclusive due to image quality" in the summary.
          - ALWAYS include the mandatory medical disclaimer.
          - RETURN ONLY JSON.
        `;

        const result = await model.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        const text = response.text();

        const jsonString = text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(jsonString);
        
        console.log(`[GeminiService] Successfully analyzed using ${modelName}`);
        return parsed;

      } catch (error) {
        lastError = error;
        console.warn(`[GeminiService] Model ${modelName} failed: ${error.message}`);
        // If it's a 404 or 400 (unsupported method for that model), try next
        if (error.message.includes('404') || error.message.includes('not found') || error.message.includes('400')) {
          continue;
        }
        break; 
      }
    }
    
    throw new Error("All Gemini models failed: " + lastError.message);
  },
};

module.exports = geminiService;
