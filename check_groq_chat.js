require('dotenv').config({ path: '.env.local' });
const { createOpenAI } = require('@ai-sdk/openai');
const { generateText } = require('ai');

const groq = createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY,
});

async function main() {
    console.log("Testing Groq Chat...");
    try {
        const { text } = await generateText({
            model: groq('llama-3.3-70b-versatile'),
            messages: [
                { role: 'user', content: 'Hello, are you working?' }
            ],
        });
        console.log("Response:", text);
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
