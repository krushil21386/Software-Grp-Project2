const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Service to handle multimodal medical report analysis using Gemini.
 * Optimized for Gemini 2.0 Flash (latest) with 1.5 Flash fallback.
 */
const geminiService = {
  /**
   * Analyzes an image of a medical report.
   * 
   * @param {string} imagePath - Path to the uploaded image file.
   * @returns {Promise<Object>} - Structured JSON analysis.
   */
  async analyzeMedicalReport(imagePath) {
    // Current state-of-the-art models
    const modelsToTry = [
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-flash-8b",
      "gemini-2.0-flash-exp",
      "gemini-2.5-flash-lite"
    ];

    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`\n [GeminiService] >>> ATTEMPTING ANALYSIS WITH MODEL: ${modelName} ...`);

        const generationConfig = {
          temperature: 0.1,    // High precision, deterministic results
          topP: 0.95,
          topK: 40,
          responseMimeType: "application/json",
        };

        console.log(`\n🤖 [GeminiService] Parameters: Temp: 0.1, TopP: 0.95, TopK: 40, MimeType: application/json, Model: ${modelName}`);

        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: "You are a world-class Top 1 Senior Doctor whole have knowledege of every medical field. Analyze medical reports with 100% accuracy. Think step-by-step.",
          generationConfig
        });

        const prompt = `
          PHASE 1: DATA EXTRACTION (MAXIMUM RECALL)
          - **MANDATORY**: Extract EVERYTHING. Every Test Name, every Value, every Unit, and every Range shown in the image.
          - **NEVER SKIP A TEST**: Even if it seems minor or normal, it must be in the 'extractedValues' list.
          - **DIAGNOSIS SEARCH**: Prioritize "Impression", "Diagnosis", "Conclusion", or "Clinical Note" sections.
          - **STRICT RANGE FALLBACK**:
            1. Use report ranges first.
            2. If missing for a numeric test (e.g. Glucose, Hgb, WBC, RBC), you MUST provide the standard WHO/Mayo Clinic range.
            3. If missing for a qualitative test (e.g. Urine Glucose), specify the normal state (e.g. "ABSENT").
            
          PHASE 2: UNIVERSAL CLINICAL CORRELATION (NO LIMITS)
          - Do not limit yourself to specific diseases. Use your full medical training to correlate the extracted markers to ANY possible condition (e.g., Pneumonia, Kidney Disease, Liver Cirrhosis, Viral Infection, etc.).
          - **COMPARISON**: Compare every 'value' against the 'range' (Standard or Report).
          - **STATUS**: Mark as "High", "Low", "Normal", or "Positive"/"Negative".
          
          PHASE 3: PATIENT-FRIENDLY SIMPLIFICATION (STRICT)
          - **MANDATORY**: Map complex medical terms to plain English in 'disease' and 'summary'.
            - e.g., "Consolidation in lung" -> "Pneumonia (Lung Infection)"
            - e.g., "Malignancy" -> "Cancer"
            - e.g., "Hyperglycemia" -> "Diabetes"
          - **SUMMARY**: Explain exactly WHICH markers led to the diagnosis.
          
          OUTPUT JSON SCHEMA (STRICT):
          {
            "confidenceScore": number (0-100),
            "extractedValues": [
              { 
                "testName": string, 
                "value": string/number, 
                "units": string, 
                "range": { "min": number, "max": number, "source": string } | string,
                "status": "High" | "Low" | "Normal" | "Abnormal",
                "significance": "Explain clinical importance of this specific result"
              }
            ],
            "diseases": [string],
            "disease": string (Primary diagnosis in plain English),
            "summary": string (Detailed explanation of why markers point to this disease),
            "medicineSuggestions": [
              { "name": string, "dosage": string, "frequency": string, "duration": string, "precautions": string, "forDisease": string }
            ],
            "diagnosisReport": {
              "findings": [
                { "testName": string, "message": string, "status": string }
              ]
            },
            "rawText": "Complete extracted text for verification"
          }
          
          CONSTRAINTS:
          - DO NOT say "General Consultation" if any marker is abnormal.
          - DO NOT hide findings. If it's on the paper, it's in the JSON.
          - VALID JSON ONLY.
        `;

        const ext = path.extname(imagePath).toLowerCase();
        const mimeType = ext === ".png" ? "image/png" : (ext === ".webp" ? "image/webp" : "image/jpeg");
        const imageBuffer = await fs.promises.readFile(imagePath);
        const imageParts = [
          {
            inlineData: {
              data: imageBuffer.toString("base64"),
              mimeType: mimeType,
            },
          },
        ];

        const result = await model.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        let text = response.text();

        // Robust JSON Parsing with sanitization
        try {
          const parsed = JSON.parse(text);
          console.log(`✅ [GeminiService] SUCCESS: Report analyzed using ${modelName}`);
          return parsed;
        } catch (parseErr) {
          console.error(`[GeminiService] JSON Parse Error at ${modelName}. Attempting sanitization...`);
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              return JSON.parse(jsonMatch[0]);
            } catch (e2) {
              throw new Error("AI returned malformed data. Please try again with a clearer image.");
            }
          }
          throw parseErr;
        }
      } catch (error) {
        lastError = error;
        const msg = (error.message || "").toLowerCase();
        console.error(`❌ [GeminiService] ERROR with ${modelName}: ${error.message}`);

        if (msg.includes('404') || msg.includes('not found') || msg.includes('400') || msg.includes('503') || msg.includes('429') || msg.includes('fetch failed') || msg.includes('quota')) {
          console.warn(`⚠️ [GeminiService] ${modelName} is unavailable or quota exceeded. Switching model...`);
          console.log(`   [Action] Waiting 2 seconds for server stability or quota reset before next attempt...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        break;
      }
    }

    throw new Error("Medical report analysis failed after multiple attempts: " + lastError.message);
  },
};

module.exports = geminiService;
