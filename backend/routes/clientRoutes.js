const express = require('express');
const router = express.Router();
const {
  getAllClients, getClientById, createClient, updateClient, deleteClient
} = require('../controllers/clientController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');
const checkEssaiActif = require('../middleware/checkEssaiActif');

router.use(authMiddleware);
router.use(checkEssaiActif);

router.get('/', checkPermission('Ventes', 'consultation'), getAllClients);
router.get('/:id', checkPermission('Ventes', 'consultation'), getClientById);
router.post('/', checkPermission('Ventes', 'creation'), createClient);
router.put('/:id', checkPermission('Ventes', 'modification'), updateClient);
router.delete('/:id', checkPermission('Ventes', 'suppression'), deleteClient);

module.exports = router;
