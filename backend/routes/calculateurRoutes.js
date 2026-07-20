const express = require('express');
const router = express.Router();
const {
    calculTauxUnique,
    calculTauxVariables,
    calculTauxVariablesAuto,
    getTauxReference,
    getHistoriqueTauxUnique,
    getHistoriqueTauxVariable,
    getHistoriqueTauxUniqueById,        
    getHistoriqueTauxVariableById,     
    calculSimple
} = require('../controllers/calculateurController');
const {
    exporterCalculPDF,
    exporterCalculWord,
    exporterHistoriquePDF,
    exporterHistoriqueWord
} = require('../controllers/exportCalculController');
const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenant.middleware');
const checkEssaiActif = require('../middleware/checkEssaiActif');
const checkPermission = require('../middleware/permissionMiddleware');
const { validate } = require('../middleware/validate.middleware');
const { calculTauxUniqueSchema, calculTauxVariablesSchema } = require('../middleware/validate.middleware');

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(checkEssaiActif);

// Routes de calcul
router.post('/taux-unique', checkPermission('Finance', 'consultation'), validate(calculTauxUniqueSchema), calculTauxUnique);
router.post('/taux-variables', checkPermission('Finance', 'consultation'), validate(calculTauxVariablesSchema), calculTauxVariables);
router.post('/taux-variables-auto', checkPermission('Finance', 'consultation'), calculTauxVariablesAuto);
router.post('/calcul-simple', checkPermission('Finance', 'consultation'), calculSimple);

// Route taux de référence
router.get('/taux-reference', checkPermission('Finance', 'consultation'), getTauxReference);

// Routes historique
router.get('/historique/taux-unique', checkPermission('Finance', 'consultation'), getHistoriqueTauxUnique);
router.get('/historique/taux-variable', checkPermission('Finance', 'consultation'), getHistoriqueTauxVariable);

// Routes historique par ID (pour impression)
router.get('/historique/taux-unique/:id', 
    checkPermission('Finance', 'consultation'), 
    getHistoriqueTauxUniqueById
);
router.get('/historique/taux-variable/:id', 
    checkPermission('Finance', 'consultation'), 
    getHistoriqueTauxVariableById
);

// Routes export
router.post('/export/pdf', checkPermission('Finance', 'export'), exporterCalculPDF);
router.post('/export/word', checkPermission('Finance', 'export'), exporterCalculWord);
router.get('/historique/:id/export/pdf', checkPermission('Finance', 'export'), exporterHistoriquePDF);
router.get('/historique/:id/export/word', checkPermission('Finance', 'export'), exporterHistoriqueWord);

module.exports = router;