const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');

const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenant.middleware');
const checkPermission = require('../middleware/permissionMiddleware');
const checkEssaiActif = require('../middleware/checkEssaiActif');
const auditMiddleware = require('../middleware/audit.middleware');

// ============================================================
// MIDDLEWARES
// ============================================================
router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(checkEssaiActif);

// ============================================================
// ROUTES D'AUDIT
// ============================================================

// Statistiques
router.get('/stats', 
    checkPermission('Utilisateurs', 'consultation'), 
    auditController.getAuditStats
);

// Logs généraux
router.get('/logs', 
    checkPermission('Utilisateurs', 'consultation'), 
    auditController.getLogs
);

// Logs de connexion
router.get('/connexions', 
    checkPermission('Utilisateurs', 'consultation'), 
    auditController.getConnexions
);

// Opérations CRUD
router.get('/operations', 
    checkPermission('Utilisateurs', 'consultation'), 
    auditController.getOperations
);

module.exports = router;