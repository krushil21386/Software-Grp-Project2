const geminiService = require('../../src/services/geminiService');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function test() {
    try {
        const imagePath = path.join(__dirname, 'uploads', '1771324766344-Screenshot 2026-02-06 134719.png');
        console.log('Testing with image:', imagePath);
        const result = await geminiService.analyzeMedicalReport(imagePath);
        console.log('✅ Gemini analysis SUCCESS');
        console.log('Results:', JSON.stringify(result, null, 2).substring(0, 500) + '...');
    } catch (err) {
        console.error('❌ Gemini analysis FAILED:', err.message);
        if (err.stack) console.error(err.stack);
    }
}

test();
