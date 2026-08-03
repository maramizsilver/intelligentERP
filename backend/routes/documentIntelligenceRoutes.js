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

router.use(authMiddleware);
router.use(checkEssaiActif);
router.use(tenantMiddleware);

// --- Génération / remplissage Word ---
router.get('/modeles', checkPermission('Documents', 'consultation'), listerModeles);
router.get('/modeles/:type/:nom/tags', checkPermission('Documents', 'consultation'), tagsDuModele);
router.post('/generer', checkPermission('Documents', 'creation'), genererDocument);

// --- Numérisation intelligente (OCR) ---
router.post('/ocr', checkPermission('Documents', 'creation'), uploadOcr.single('fichier'), numeriser);

// --- Saisie intelligente (auto-remplissage) ---
router.get('/autofill/:typeEntite/:identifiant', autoRemplirChamp);

// --- Recherche globale ---
router.get('/recherche', rechercheGlobaleHandler);

// --- Dictionnaire intelligent ---
router.post('/orthographe', verifierOrthographe);

// --- Calendrier intelligent ---
router.post('/valider-date', validerDateHandler);

// --- Montants en toutes lettres ---
router.post('/montant-en-lettres', montantEnLettresHandler);

// --- Résolution de document complet (relations) ---
router.get('/resoudre/:type/:id', resoudreDocument);

module.exports = router;