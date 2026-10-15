// backend/routes/documentIntelligenceRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
    listerModeles, tagsDuModele, genererDocument,
    numeriser, autoRemplirChamp,
    rechercheGlobaleHandler,
    verifierOrthographe,
    validerDateHandler,
    montantEnLettresHandler,
    resoudreDocument
} = require('../controllers/documentIntelligenceController');

const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');
const checkEssaiActif = require('../middleware/checkEssaiActif');
const tenantMiddleware = require('../middleware/tenant.middleware');

// Stockage temporaire des scans à analyser par OCR
const storageOcr = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '..', 'uploads', 'ocr_temp', String(req.user.entreprise_id));
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`);
    }
});

const uploadOcr = multer({
    storage: storageOcr,
    limits: { fileSize: 15 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const typesAutorises = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
        if (!typesAutorises.includes(file.mimetype)) {
            return cb(new Error('Type de fichier non autorisé pour la numérisation'));
        }
        cb(null, true);
    }
});

const { staffEntrepriseSeulement } = require('../middleware/accessGuards.middleware');

// Module RBAC requis selon le type demandé
const MODULE_AUTOFILL = {
  client: 'Ventes', fournisseur: 'Achats', produit: 'Stock',
  devis: 'Ventes', commande: 'Ventes', facture: 'Ventes', entreprise: 'Documents'
};
const MODULE_RESOUDRE = { devis: 'Ventes', commande: 'Ventes', facture: 'Ventes' };

const permissionParParam = (table, param) => (req, res, next) => {
  const module = table[req.params[param]];
  if (!module) return res.status(400).json({ message: 'Type non supporté' });
  return checkPermission(module, 'consultation')(req, res, next);
};

router.use(authMiddleware);
router.use(staffEntrepriseSeulement);   // ni client externe, ni SuperAdmin
router.use(checkEssaiActif);
router.use(tenantMiddleware);

router.get('/modeles', checkPermission('Documents', 'consultation'), listerModeles);
router.get('/modeles/:type/:nom/tags', checkPermission('Documents', 'consultation'), tagsDuModele);
router.post('/generer', checkPermission('Documents', 'creation'), genererDocument);
router.post('/ocr', checkPermission('Documents', 'creation'), uploadOcr.single('fichier'), numeriser);

router.get('/autofill/:typeEntite/:identifiant', permissionParParam(MODULE_AUTOFILL, 'typeEntite'), autoRemplirChamp);
router.get('/resoudre/:type/:id', permissionParParam(MODULE_RESOUDRE, 'type'), resoudreDocument);
router.get('/recherche', rechercheGlobaleHandler);        // permissions par module dans le handler
router.post('/orthographe', verifierOrthographe);
router.post('/valider-date', validerDateHandler);
router.post('/montant-en-lettres', montantEnLettresHandler);

module.exports = router;