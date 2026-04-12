const { HfInference } = require('@huggingface/inference');
const fs = require('fs');
const Tesseract = require('tesseract.js');

const hf = new HfInference(process.env.HUGGING_FACE_API_TOKEN);

/**
 * Service to handle medical report analysis using a hybrid approach:
 * Local OCR (Tesseract.js) + Cloud LLM Analysis (Hugging Face).
 */
const huggingFaceService = {
    /**
     * Analyzes an image of a medical report.
     * 
     * @param {string} imagePath - Path to the uploaded image file.
     * @returns {Promise<Object>} - Structured JSON analysis.
     */
    async analyzeMedicalReport(imagePath) {
        if (!process.env.HUGGING_FACE_API_TOKEN) {
            throw new Error("HUGGING_FACE_API_TOKEN is missing");
        }

        // Using Mistral as it's more consistently available on the free tier
        const analysisModel = "mistralai/Mistral-7B-Instruct-v0.3"; 

        try {
            console.log(`[HuggingFaceService] Stage 1: Running Local OCR with Tesseract...`);
            
            // Stage 1: Local OCR
            const { data: { text } } = await Tesseract.recognize(
                imagePath,
                'eng'
            );

            const extractedText = text;
            console.log(`--------------------------------------------------`);
            console.log(`[HuggingFaceService] FULL OCR EXTRACTED TEXT:`);
            console.log(extractedText);
            console.log(`--------------------------------------------------`);

            if (!extractedText || extractedText.trim().length < 5) {
                throw new Error("OCR failed to extract readable text. Please ensure the image is clear.");
            }

            // Stage 2: Analysis
            console.log(`[HuggingFaceService] Stage 2: Running Analysis with ${analysisModel}...`);
            
            const prompt = `[INST] ACT AS AN EXPERT MEDICAL LABORATORY ANALYST.
Analyze the following text extracted from a medical report and provide a structured diagnosis.

EXTRACTED TEXT:
"${extractedText}"

STRICT STEPS:
1. Identify all lab tests, their values, and ranges.
2. Mark status as "High", "Low", or "Normal".
3. Identify potential conditions.
4. Suggest medicines with dosage and precautions.

RETURN ONLY A VALID JSON OBJECT with this structure:
{
  "extractedValues": [
    { "testName": "Hemoglobin", "value": 11.5, "units": "g/dL", "range": { "min": 13.5, "max": 17.5 }, "status": "Low" }
  ],
  "diseases": ["Anemia"],
  "summary": "Short professional summary",
  "medicineSuggestions": [
    { "name": "Medicine", "dosage": "...", "frequency": "...", "duration": "...", "precautions": "...", "forDisease": "..." }
  ],
  "diagnosisReport": {
    "findings": [
      { "testName": "Hemoglobin", "message": "...", "status": "Abnormal" }
    ]
  },
  "rawText": "${extractedText.replace(/"/g, "'")}"
}
[/INST]`;

            const chatResult = await hf.textGeneration({
                model: analysisModel,
                inputs: prompt,
                parameters: {
                    max_new_tokens: 1000,
                    return_full_text: false,
                    temperature: 0.1,
                }
            });

            const responseText = chatResult.generated_text;
            
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.error("Failed to parse JSON from AI response:", responseText);
                throw new Error("AI analysis response was not in a valid format.");
            }

            const parsed = JSON.parse(jsonMatch[0]);
            console.log(`[HuggingFaceService] Successfully analyzed report.`);
            return parsed;

        } catch (error) {
            console.error(`[HuggingFaceService] Error: ${error.message}`);
            
            // If the model is not available, provide a more helpful error
            if (error.message.includes("No Inference Provider")) {
                throw new Error(`The AI analysis model is currently busy or unavailable on Hugging Face's free tier. Please try again in a few minutes.`);
            }
            
            throw error;
        }
    }
};

module.exports = huggingFaceService;
