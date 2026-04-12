require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const geminiService = require('../../src/services/geminiService');
const path = require('path');

async function test() {
  const testImagePath = path.join(__dirname, 'uploads', '1774778013681-Screenshot 2026-03-29 140617.png');
  console.log('🧪 Testing Gemini Service with image:', testImagePath);
  
  try {
    const results = await geminiService.analyzeMedicalReport(testImagePath);
    console.log('✅ Analysis Success!');
    console.log('Findings:', JSON.stringify(results.findings, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('❌ Analysis Failed:', err);
    process.exit(1);
  }
}

test();
