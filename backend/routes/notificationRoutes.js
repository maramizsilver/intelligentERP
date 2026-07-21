const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenant.middleware');

router.use(authMiddleware);
router.use(tenantMiddleware);

router.post('/test', notificationController.testNotification);
router.post('/login-alert', notificationController.sendLoginAlert);
router.get('/preferences', notificationController.getPreferences);
router.put('/preferences', notificationController.updatePreferences);

module.exports = router;