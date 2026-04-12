const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function listModels() {
  const API_KEY = process.env.GEMINI_API_KEY;
  console.log("Using API Key:", API_KEY ? (API_KEY.substring(0, 5) + "...") : "MISSING");
  
  const genAI = new GoogleGenerativeAI(API_KEY);
  
  const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
  
  for (const modelName of models) {
    try {
        console.log(`Testing ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello");
        console.log(`✅ ${modelName} is WORKING:`, result.response.text());
    } catch (err) {
        console.error(`❌ ${modelName} FAILED:`, err.message);
    }
  }
}

listModels();
