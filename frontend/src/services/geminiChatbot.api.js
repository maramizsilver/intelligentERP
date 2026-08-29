import API from '../utils/api';

const BASE = '/gemini-chatbot';

const geminiChatbotApi = {
    envoyerMessage: (message) => API.post(`${BASE}/message`, { message }),
    getHistorique: () => API.get(`${BASE}/historique`),
    viderHistorique: () => API.delete(`${BASE}/historique`)
};

export default geminiChatbotApi;