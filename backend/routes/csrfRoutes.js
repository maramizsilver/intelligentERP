const express = require('express');
const router = express.Router();
const { csrfProtection } = require('../middleware/security.middleware');

router.get('/token', csrfProtection, (req, res) => {
    try {
        const token = req.csrfToken();
        res.json({ csrfToken: token });
    } catch (err) {
        console.error('[CSRF] Erreur generation token:', err);
        res.status(500).json({ 
            message: 'Erreur generation token CSRF',
            error: err.message 
        });
    }
});

module.exports = router;