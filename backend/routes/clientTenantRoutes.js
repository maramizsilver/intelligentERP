// backend/routes/clientTenantRoutes.js
// Routes multi-tenant avec company_id
const express = require('express');
const router = express.Router();
const {
    getClientsTenant,
    getClientByIdTenant,
    createClientTenant,
    updateClientTenant,
    deleteClientTenant,
    searchClientsTenant
} = require('../controllers/clientTenantController');

const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenant.middleware');
const checkPermission = require('../middleware/permissionMiddleware');
const checkEssaiActif = require('../middleware/checkEssaiActif');

// Toutes les routes sont protégées
router.use(authMiddleware);
router.use(checkEssaiActif);
router.use(tenantMiddleware);

// Routes CRUD avec isolation company_id
router.get('/', checkPermission('Ventes', 'consultation'), getClientsTenant);
router.get('/search', checkPermission('Ventes', 'consultation'), searchClientsTenant);
router.get('/:id', checkPermission('Ventes', 'consultation'), getClientByIdTenant);
router.post('/', checkPermission('Ventes', 'creation'), createClientTenant);
router.put('/:id', checkPermission('Ventes', 'modification'), updateClientTenant);
router.delete('/:id', checkPermission('Ventes', 'suppression'), deleteClientTenant);

module.exports = router;