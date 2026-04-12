const path = require('path');
const { HfInference } = require('@huggingface/inference');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const hf = new HfInference(process.env.HUGGING_FACE_API_TOKEN);

async function checkModels() {
    const models = [
        "microsoft/trocr-base-printed",
        "Salesforce/blip-image-captioning-base",
        "epfl-llm/meditron-7b",
        "HuggingFaceH4/zephyr-7b-beta",
        "mistralai/Mistral-7B-Instruct-v0.3"
    ];

    console.log("Checking Hugging Face Model Availability...\n");

    for (const model of models) {
        try {
            // We just try to get model info or a very tiny request
            console.log(`Checking ${model}...`);
            // This is a dummy call just to see if the provider exists
            const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
                headers: { Authorization: `Bearer ${process.env.HUGGING_FACE_API_TOKEN}` }
            });
            const text = await res.text();
            let data = {};
            try { data = JSON.parse(text); } catch(e) { /* not json */ }
            
            if (res.ok) {
                console.log(`✅ ${model} is reachable.`);
                if (data.status === "too_busy") console.log(`   ⚠️  But it is currently BUSY.`);
            } else {
                console.log(`❌ ${model} ERROR (${res.status}): ${data.error || text.substring(0, 100)}`);
            }
        } catch (err) {
            console.log(`❌ ${model} FAILED: ${err.message}`);
        }
    }
}

checkModels();
