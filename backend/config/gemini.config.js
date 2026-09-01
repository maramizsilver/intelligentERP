const { GoogleGenerativeAI } = require('@google/generative-ai');

if (!process.env.GEMINI_API_KEY) {
    console.warn('[IA] GEMINI_API_KEY manquant dans .env : le chatbot ne pourra pas répondre.');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// gemini-2.0-flash : gratuit, rapide, bon support du function calling
const CHATBOT_MODEL = process.env.GEMINI_CHATBOT_MODEL || 'gemini-2.0-flash';

module.exports = { genAI, CHATBOT_MODEL };