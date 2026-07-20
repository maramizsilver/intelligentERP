const express = require('express');
const router = express.Router();
const { exportMesDonnees } = require('../controllers/exportController');
const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenant.middleware');

router.get('/mes-donnees', authMiddleware, tenantMiddleware, exportMesDonnees);

module.exports = router;