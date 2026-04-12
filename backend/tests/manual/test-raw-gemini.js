const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const API_KEY = process.env.GEMINI_API_KEY;

async function test(modelId, version) {
    const url = `https://generativelanguage.googleapis.com/${version}/models/${modelId}:generateContent?key=${API_KEY}`;
    console.log(`Testing: ${url}`);
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: "hi" }] }] })
        });
        const data = await res.json();
        console.log(`Status: ${res.status}`);
        if (data.error) console.log(`Error: ${data.error.message}`);
        else console.log(`Success! Result: ${data.candidates?.[0]?.content?.parts?.[0]?.text}`);
    } catch (e) {
        console.log(`Fetch Error: ${e.message}`);
    }
}

async function runAll() {
    await test("gemini-1.5-flash", "v1beta");
    await test("gemini-1.5-flash", "v1");
    await test("gemini-1.5-pro", "v1beta");
    await test("gemini-2.0-flash-exp", "v1beta");
}

runAll();
