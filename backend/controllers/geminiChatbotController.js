// backend/controllers/geminiChatbotController.js
const geminiChatbotService = require('../services/geminiChatbot.service');

exports.envoyerMessage = async (req, res) => {
    const { message } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ message: 'Le message ne peut pas être vide' });
    }
    if (message.length > 2000) {
        return res.status(400).json({ message: 'Message trop long (2000 caractères maximum)' });
    }

    try {
        const reponse = await geminiChatbotService.envoyerMessage(req.db, req.user, message.trim());
        res.json({ reponse });
    } catch (err) {
        if (err.code === 'IA_NON_CONFIGUREE') {
            return res.status(503).json({ message: err.message });
        }
        console.error('[Gemini Chatbot] Erreur envoyerMessage:', err);
        res.status(500).json({ message: "L'agent IA est momentanément indisponible. Réessaie dans un instant." });
    }
};

exports.getHistorique = async (req, res) => {
    try {
        const historique = await geminiChatbotService.obtenirHistorique(req.db, req.user.id);
        res.json({ historique });
    } catch (err) {
        console.error('[Gemini Chatbot] Erreur getHistorique:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.viderHistorique = async (req, res) => {
    try {
        await geminiChatbotService.viderHistorique(req.db, req.user.id);
        res.json({ message: 'Historique effacé' });
    } catch (err) {
        console.error('[Gemini Chatbot] Erreur viderHistorique:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};