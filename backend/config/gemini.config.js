const { GoogleGenerativeAI } = require('@google/generative-ai');

if (!process.env.GEMINI_API_KEY) {
  console.warn('[IA] GEMINI_API_KEY manquant dans .env : le chatbot ne pourra pas répondre.');
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// À vérifier dans la doc Google : ce modèle peut avoir été retiré
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

module.exports = { genAI, GEMINI_MODEL, CHATBOT_MODEL: GEMINI_MODEL };  