const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');

const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenant.middleware');
const checkPermission = require('../middleware/permissionMiddleware');
const checkEssaiActif = require('../middleware/checkEssaiActif');
const superAdminMiddleware = require('../middleware/superAdminMiddleware');

router.use(authMiddleware);

router.get('/stats', 
    superAdminMiddleware,
    auditController.getAuditStats
);

router.get('/logs', 
    superAdminMiddleware,
    auditController.getLogs
);

router.get('/connexions', 
    superAdminMiddleware,
    auditController.getConnexions
);

router.get('/operations', 
    superAdminMiddleware,
    auditController.getOperations
);

router.get('/entreprise/stats', 
    tenantMiddleware,
    checkEssaiActif,
    checkPermission('Utilisateurs', 'consultation'),
    auditController.getAuditStats
);

router.get('/entreprise/logs', 
    tenantMiddleware,
    checkEssaiActif,
    checkPermission('Utilisateurs', 'consultation'),
    auditController.getLogs
);

router.get('/entreprise/connexions', 
    tenantMiddleware,
    checkEssaiActif,
    checkPermission('Utilisateurs', 'consultation'),
    auditController.getConnexions
);

router.get('/entreprise/operations', 
    tenantMiddleware,
    checkEssaiActif,
    checkPermission('Utilisateurs', 'consultation'),
    auditController.getOperations
);

module.exports = router;