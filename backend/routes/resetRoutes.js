// backend/routes/resetRoutes.js
const express = require('express');
const router = express.Router();
const ResetService = require('../services/reset.service');
const { loginLimiter } = require('../middleware/rateLimit.middleware');

exports.requestReset = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, message: 'Email requis' });
    }
    try {
        const result = await ResetService.requestReset(email);
        if (result.success) {
            res.json({ success: true, message: result.message });
        } else {
            res.status(400).json({ success: false, message: result.message });
        }
    } catch (err) {
        console.error('Erreur requestReset:', err);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

exports.validateResetToken = async (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.status(400).json({ success: false, message: 'Token requis' });
    }
    try {
        const result = await ResetService.validateToken(token);
        if (result.valid) {
            res.json({ success: true, valid: true });
        } else {
            res.json({ success: false, valid: false, message: result.message });
        }
    } catch (err) {
        console.error('Erreur validateResetToken:', err);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

exports.resetPassword = async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) {
        return res.status(400).json({ success: false, message: 'Token et mot de passe requis' });
    }
    if (password.length < 8) {
        return res.status(400).json({ success: false, message: 'Le mot de passe doit contenir au moins 8 caracteres' });
    }
    try {
        const result = await ResetService.resetPassword(token, password);
        if (result.success) {
            res.json({ success: true, message: result.message });
        } else {
            res.status(400).json({ success: false, message: result.message });
        }
    } catch (err) {
        console.error('Erreur resetPassword:', err);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

router.post('/request', loginLimiter, exports.requestReset);
router.get('/validate', exports.validateResetToken);
router.post('/reset', loginLimiter, exports.resetPassword);

module.exports = router;