const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function test() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent("Hello, are you working?");
    const response = await result.response;
    console.log("Response:", response.text());
    console.log("API Key is VALID");
  } catch (err) {
    console.error("API Key TEST FAILED:", err.message);
  }
}

test();
