const express = require('express');
const router = express.Router();
const {
    getAllArchives, getArchiveById, archiverEntite, restaurerArchive, deleteArchive
} = require('../controllers/archivageController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');
const checkEssaiActif = require('../middleware/checkEssaiActif');
const tenantMiddleware = require('../middleware/tenant.middleware');

router.use(authMiddleware);
router.use(checkEssaiActif);
router.use(tenantMiddleware);
router.get('/', checkPermission('Documents', 'consultation'), getAllArchives);
router.get('/:id', checkPermission('Documents', 'consultation'), getArchiveById);
router.post('/', checkPermission('Documents', 'creation'), archiverEntite);
router.post('/:id/restaurer', checkPermission('Documents', 'modification'), restaurerArchive);
router.delete('/:id', checkPermission('Documents', 'suppression'), deleteArchive);

module.exports = router;
