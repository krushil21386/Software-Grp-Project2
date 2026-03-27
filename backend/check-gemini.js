const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // There is no direct "listModels" in the standard genAI object, 
    // we have to use the fetch API or a specific client if available.
    // However, we can try to "peek" by just trying a very basic non-multimodal call.
    
    console.log("Testing Gemini API Key...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello");
    console.log("✅ gemini-1.5-flash is AVAILABLE.");
    console.log("Response:", result.response.text());
  } catch (err) {
    console.error("❌ gemini-1.5-flash failed:", err.message);
    
    try {
        console.log("Testing gemini-pro...");
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hello");
        console.log("✅ gemini-pro is AVAILABLE.");
    } catch (err2) {
        console.error("❌ gemini-pro failed:", err2.message);
    }
  }
}

listModels();
