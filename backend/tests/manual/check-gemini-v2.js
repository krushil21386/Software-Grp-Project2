const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function listModels() {
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    console.error("GEMINI_API_KEY is missing!");
    return;
  }

  console.log("Fetching available models from Google API...");
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
    const data = await response.json();

    if (!response.ok) {
      console.error("❌ API Error:", data.error?.message || "Unknown error");
      return;
    }

    console.log("✅ Models found:");
    data.models?.forEach(m => {
      console.log(`- ${m.name} (${m.displayName})`);
    });
  } catch (err) {
    console.error("❌ Fetch failed:", err.message);
  }
}

listModels();
