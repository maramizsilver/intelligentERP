const express = require('express');
const router = express.Router();
const { exportMesDonnees } = require('../controllers/exportController');
const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenant.middleware');
const { staffEntrepriseSeulement, adminEntrepriseSeulement } = require('../middleware/accessGuards.middleware');
const { exportLimiter } = require('../middleware/rateLimit.middleware');

// Volontairement SANS checkEssaiActif : l'export reste possible après l'essai.
router.get('/mes-donnees',
  authMiddleware, staffEntrepriseSeulement, tenantMiddleware,
  adminEntrepriseSeulement, exportLimiter, exportMesDonnees);

module.exports = router;