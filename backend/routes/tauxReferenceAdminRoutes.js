const express = require('express');
const router = express.Router();
const {
    getAllTauxAdmin,
    getTauxAdminById,
    createTauxAdmin,
    updateTauxAdmin,
    deleteTauxAdmin,
    toggleTauxAdmin
} = require('../controllers/tauxReferenceAdminController');
const authMiddleware = require('../middleware/authMiddleware');
const superAdminMiddleware = require('../middleware/superAdminMiddleware');
router.use(authMiddleware);
router.use(superAdminMiddleware);

// CRUD complet
router.get('/', getAllTauxAdmin);
router.get('/:id', getTauxAdminById);
router.post('/', createTauxAdmin);
router.put('/:id', updateTauxAdmin);
router.delete('/:id', deleteTauxAdmin);
router.put('/:id/toggle', toggleTauxAdmin);

module.exports = router;