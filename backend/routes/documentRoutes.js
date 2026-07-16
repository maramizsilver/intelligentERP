const express = require('express');
const router = express.Router();
const multer = require('multer'); // npm install multer
const path = require('path');
const fs = require('fs');
const {
    getAllDocuments, getDocumentById, telechargerDocument, uploadDocument, deleteDocument
} = require('../controllers/documentController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');
const checkEssaiActif = require('../middleware/checkEssaiActif');
const tenantMiddleware = require('../middleware/tenant.middleware');

// Stockage disque local, isolé par entreprise (adapter vers S3/Cloud si besoin
// en remplaçant seulement ce storage — le reste du contrôleur ne change pas).
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '..', 'uploads', 'documents', String(req.user.entreprise_id));
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const suffixe = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${suffixe}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 Mo max
    fileFilter: (req, file, cb) => {
        const typesAutorises = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
        if (!typesAutorises.includes(file.mimetype)) {
            return cb(new Error('Type de fichier non autorisé'));
        }
        cb(null, true);
    }
});

router.use(authMiddleware);
router.use(checkEssaiActif);
router.use(tenantMiddleware);
router.get('/', checkPermission('Documents', 'consultation'), getAllDocuments);
router.get('/:id', checkPermission('Documents', 'consultation'), getDocumentById);
router.get('/:id/telecharger', checkPermission('Documents', 'consultation'), telechargerDocument);
router.post('/', checkPermission('Documents', 'creation'), upload.single('fichier'), uploadDocument);
router.delete('/:id', checkPermission('Documents', 'suppression'), deleteDocument);

module.exports = router;
