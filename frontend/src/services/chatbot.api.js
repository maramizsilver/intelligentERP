// frontend/src/services/chatbot.api.js
// Réutilise l'instance axios déjà configurée (auth, CSRF, X-Enterprise-Id...)
// voir src/utils/api.js — même pattern que documentIntelligence.api.js
import API from '../utils/api';

const BASE = '/chatbot';

const chatbotApi = {
    envoyerMessage: (message) => API.post(`${BASE}/message`, { message }),
    getHistorique: () => API.get(`${BASE}/historique`),
    viderHistorique: () => API.delete(`${BASE}/historique`)
};

export default chatbotApi;
