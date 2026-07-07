const express = require('express');
const router = express.Router();
const { exportMesDonnees } = require('../controllers/exportController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/mes-donnees', authMiddleware, exportMesDonnees);

module.exports = router;
