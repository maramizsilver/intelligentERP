// backend/controllers/chatbotController.js
const chatbotService = require('../services/chatbot.service');

exports.envoyerMessage = async (req, res) => {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ message: 'Le message ne peut pas être vide' });
    }
    if (message.length > 2000) {
        return res.status(400).json({ message: 'Message trop long (2000 caractères maximum)' });
    }

    try {
        const reponse = await chatbotService.envoyerMessage(req.db, req.user, message.trim());
        res.json({ reponse });
    } catch (err) {
        if (err.code === 'IA_NON_CONFIGUREE') {
            return res.status(503).json({ message: err.message });
        }
        console.error('[Chatbot] Erreur envoyerMessage:', err);
        res.status(500).json({ message: "L'assistant IA est momentanément indisponible. Réessaie dans un instant." });
    }
};

exports.getHistorique = async (req, res) => {
    try {
        const historique = await chatbotService.obtenirHistorique(req.db, req.user.id);
        res.json({ historique });
    } catch (err) {
        console.error('[Chatbot] Erreur getHistorique:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.viderHistorique = async (req, res) => {
    try {
        await chatbotService.viderHistorique(req.db, req.user.id);
        res.json({ message: 'Historique effacé' });
    } catch (err) {
        console.error('[Chatbot] Erreur viderHistorique:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};
