const path = require('path');
const fetch = require('node-fetch'); // May need for older nodes, but Node 18+ has it.
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function debugModels() {
  const API_KEY = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log("--- AVAILABLE MODELS & METHODS ---");
    data.models.forEach(m => {
      console.log(`Model: ${m.name}`);
      console.log(`Methods: ${m.supportedGenerationMethods.join(', ')}`);
      console.log(`Version: ${m.name.includes('1.5') ? '1.5' : (m.name.includes('2.0') ? '2.0' : 'Other')}`);
      console.log('---');
    });
    
    // Test generateContent for the first available 1.5 or 2.0 model
    const testModel = data.models.find(m => m.name.includes('gemini-1.5-flash') || m.name.includes('gemini-2.0-flash'))?.name;
    if (testModel) {
        console.log(`Testing generateContent for: ${testModel}`);
        const testUrl = `https://generativelanguage.googleapis.com/v1beta/${testModel}:generateContent?key=${API_KEY}`;
        const testRes = await fetch(testUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: "hi" }] }] })
        });
        const testData = await testRes.json();
        console.log(`Status: ${testRes.status}`);
        console.log(`Result: ${JSON.stringify(testData).substring(0, 200)}`);
    }

  } catch (err) {
    console.error("Debug failed:", err.message);
  }
}

debugModels();
