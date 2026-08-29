// backend/config/gemini.config.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

if (!process.env.GEMINI_API_KEY) {
    console.warn('[IA Gemini] GEMINI_API_KEY manquant dans .env : l\'agent IA Gemini ne pourra pas répondre.');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// gemini-2.5-flash : bon rapport qualité / quota gratuit, function calling supporté.
// gemini-2.0-flash reste utilisable si le quota de 2.5 est épuisé.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

module.exports = { genAI, GEMINI_MODEL };