const db = require('../config/db');
const fs = require('fs');
const path = require('path');

const TYPES_VALIDES = ['facture', 'contrat', 'bon_commande', 'devis', 'identite', 'autre'];

// ============================================================
// GET TOUS LES DOCUMENTS (filtres optionnels : type, reference_type, reference_id)
// ============================================================
exports.getAllDocuments = (req, res) => {
    const { type, reference_type, reference_id } = req.query;

    let sql = 'SELECT id, nom, type_document, reference_type, reference_id, nom_original, mime_type, taille_octets, uploaded_by, created_at FROM documents WHERE entreprise_id = ?';
    const params = [req.user.entreprise_id];

    if (type) { sql += ' AND type_document = ?'; params.push(type); }
    if (reference_type) { sql += ' AND reference_type = ?'; params.push(reference_type); }
    if (reference_id) { sql += ' AND reference_id = ?'; params.push(reference_id); }
    sql += ' ORDER BY created_at DESC';

    db.query(sql, params, (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        res.json({ documents: results });
    });
};

// ============================================================
// GET UN DOCUMENT (métadonnées)
// ============================================================
exports.getDocumentById = (req, res) => {
    db.query('SELECT * FROM documents WHERE id = ? AND entreprise_id = ?', [req.params.id, req.user.entreprise_id], (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (results.length === 0) return res.status(404).json({ message: 'Document introuvable' });
        res.json({ document: results[0] });
    });
};

// ============================================================
// TÉLÉCHARGER LE FICHIER D'UN DOCUMENT
// ============================================================
exports.telechargerDocument = (req, res) => {
    db.query('SELECT * FROM documents WHERE id = ? AND entreprise_id = ?', [req.params.id, req.user.entreprise_id], (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (results.length === 0) return res.status(404).json({ message: 'Document introuvable' });

        const doc = results[0];
        if (!fs.existsSync(doc.chemin_fichier)) {
            return res.status(404).json({ message: 'Fichier introuvable sur le serveur' });
        }
        res.download(doc.chemin_fichier, doc.nom_original);
    });
};

// ============================================================
// UPLOADER UN DOCUMENT (le fichier est déjà déposé sur disque par multer,
// disponible dans req.file — voir documentRoutes.js)
// body: { nom, type_document, reference_type?, reference_id? }
// ============================================================
exports.uploadDocument = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Aucun fichier fourni' });
    }

    const { nom, type_document, reference_type, reference_id } = req.body;
    const typeFinal = TYPES_VALIDES.includes(type_document) ? type_document : 'autre';

    const sql = `
        INSERT INTO documents
            (entreprise_id, nom, type_document, reference_type, reference_id, chemin_fichier, nom_original, mime_type, taille_octets, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(sql, [
        req.user.entreprise_id,
        (nom && nom.trim()) || req.file.originalname,
        typeFinal,
        reference_type || null,
        reference_id || null,
        req.file.path,
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
        req.user.id
    ], (err, result) => {
        if (err) {
            console.error(err);
            fs.unlink(req.file.path, () => {});
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        res.status(201).json({ message: 'Document téléversé avec succès', id: result.insertId });
    });
};

// ============================================================
// SUPPRIMER UN DOCUMENT (métadonnée + fichier disque)
// ============================================================
exports.deleteDocument = (req, res) => {
    db.query('SELECT chemin_fichier FROM documents WHERE id = ? AND entreprise_id = ?', [req.params.id, req.user.entreprise_id], (errSel, results) => {
        if (errSel) { console.error(errSel); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (results.length === 0) return res.status(404).json({ message: 'Document introuvable' });

        const cheminFichier = results[0].chemin_fichier;
        db.query('DELETE FROM documents WHERE id = ? AND entreprise_id = ?', [req.params.id, req.user.entreprise_id], (err, result) => {
            if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
            if (cheminFichier && fs.existsSync(cheminFichier)) {
                fs.unlink(cheminFichier, () => {});
            }
            res.json({ message: 'Document supprimé avec succès' });
        });
    });
};
