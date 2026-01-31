const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// Load env
const envPath = path.resolve(__dirname, '.env.local');
let apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    const match = envConfig.match(/GOOGLE_GENERATIVE_AI_API_KEY=(.*)/);
    if (match) {
        apiKey = match[1].trim();
    }
}

if (!apiKey) {
    console.error("API Key not found in .env.local or process.env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

const modelsToTest = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
    "gemini-1.5-pro-latest",
    "gemini-pro",
    "gemini-1.0-pro"
];

async function testModel(modelName) {
    console.log(`\nTesting ${modelName}...`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello");
        console.log(`✅ SUCCESS: ${modelName}`);
        // console.log("Response:", result.response.text());
        return true;
    } catch (error) {
        console.error(`❌ FAILED: ${modelName}`);
        console.error("Error Details:", error.message);
        // console.error(JSON.stringify(error, null, 2));
        return false;
    }
}

async function run() {
    console.log("Checking API Key availability...");
    let successCount = 0;
    for (const model of modelsToTest) {
        const success = await testModel(model);
        if (success) successCount++;
    }

    if (successCount === 0) {
        console.log("\n⚠️ ALL Models Failed. The API Key might be invalid, or the project lacks access to Generative Language API.");
    } else {
        console.log(`\n✅ Found ${successCount} working models.`);
    }
}

run();
