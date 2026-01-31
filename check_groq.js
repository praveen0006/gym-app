require('dotenv').config({ path: '.env.local' });
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
    const models = await groq.models.list();
    console.log('Available models:');
    models.data.forEach((m) => {
        console.log(` - ${m.id}`);
    });
}

main().catch(console.error);
