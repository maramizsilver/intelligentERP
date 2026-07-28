const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const superAdminMiddleware = require('../middleware/superAdminMiddleware');
const superAdminController = require('../controllers/superadminController');
const superadminAuditController = require('../controllers/superadminAuditController');
const superadminAbonnementController = require('../controllers/superadminAbonnementController');
const superadminBackupController = require('../controllers/superadminBackupController');
const superadminInterventionController = require('../controllers/superadminInterventionController');

router.use(authMiddleware);
router.use(superAdminMiddleware);

router.get('/sessions/active', superAdminController.getActiveSessions);
router.post('/sessions/:sessionId/revoke', superAdminController.revokeSession);
router.get('/connections/history', superAdminController.getConnectionHistory);
router.post('/devices/:deviceId/block', superAdminController.blockDevice);
router.get('/alerts', superAdminController.getSecurityAlerts);
router.post('/alerts/:alertId/read', superAdminController.markAlertRead);
router.post('/alerts/:alertId/resolve', superAdminController.resolveAlert);
router.get('/stats/security', superAdminController.getSecurityStats);

// Audit routes
router.get('/audit/logs', superadminAuditController.getGlobalAuditLogs);
router.get('/audit/connexions', superadminAuditController.getGlobalConnectionLogs);
router.get('/audit/stats', superadminAuditController.getGlobalAuditStats);

// Abonnements routes
router.get('/abonnements', superadminAbonnementController.getAllAbonnements);
router.get('/abonnements/stats', superadminAbonnementController.getAbonnementStats);

// Interventions routes
router.get('/interventions', superadminInterventionController.getAllowedInterventions);
router.post('/interventions', superadminInterventionController.createIntervention);
router.put('/interventions/:id/resolve', superadminInterventionController.resolveIntervention);

// Backup routes
router.post('/backup', superadminBackupController.triggerBackup);
router.get('/backup/history', superadminBackupController.getBackupHistory);
router.delete('/backup/cleanup', superadminBackupController.cleanupBackups);

module.exports = router;