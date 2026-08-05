const OpenAI = require('openai');

if (!process.env.OPENAI_API_KEY) {
    console.warn('[IA] OPENAI_API_KEY manquant dans .env : le chatbot ne pourra pas répondre.');
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// gpt-4o-mini : bon rapport coût/latence/qualité pour un assistant ERP avec
const CHATBOT_MODEL = process.env.OPENAI_CHATBOT_MODEL || 'gpt-4o-mini';

module.exports = { openai, CHATBOT_MODEL };
