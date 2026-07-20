const fs = require('fs');
const path = require('path');

const TYPES_VALIDES = ['facture', 'contrat', 'bon_commande', 'devis', 'identite', 'autre'];
// GET TOUS LES DOCUMENTS
exports.getAllDocuments = (req, res) => {
    const db = req.db;
    
    const { type, reference_type, reference_id } = req.query;

    let sql = `SELECT id, nom, type_document, reference_type, reference_id, nom_original, mime_type, taille_octets, uploaded_by, created_at 
               FROM documents`;
    const params = [];

    if (type) { 
        sql += ' WHERE type_document = ?'; 
        params.push(type); 
    }
    if (reference_type) { 
        sql += type ? ' AND' : ' WHERE';
        sql += ' reference_type = ?'; 
        params.push(reference_type); 
    }
    if (reference_id) { 
        sql += ' AND reference_id = ?'; 
        params.push(reference_id); 
    }
    sql += ' ORDER BY created_at DESC';

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error(' Erreur getAllDocuments:', err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        res.json({ documents: results });
    });
};
 
// GET UN DOCUMENT (métadonnées)

exports.getDocumentById = (req, res) => {
    const db = req.db;
    
    db.query(
        'SELECT * FROM documents WHERE id = ?',
        [req.params.id],
        (err, results) => {
            if (err) {
                console.error(' Erreur getDocumentById:', err);
                return res.status(500).json({ message: 'Erreur serveur' });
            }
            if (results.length === 0) {
                return res.status(404).json({ message: 'Document introuvable' });
            }
            res.json({ document: results[0] });
        }
    );
};


// TÉLÉCHARGER LE FICHIER D'UN DOCUMENT
exports.telechargerDocument = (req, res) => {
    const db = req.db;
    
    db.query(
        'SELECT * FROM documents WHERE id = ?',
        [req.params.id],
        (err, results) => {
            if (err) {
                console.error(' Erreur telechargerDocument:', err);
                return res.status(500).json({ message: 'Erreur serveur' });
            }
            if (results.length === 0) {
                return res.status(404).json({ message: 'Document introuvable' });
            }

            const doc = results[0];
            if (!fs.existsSync(doc.chemin_fichier)) {
                return res.status(404).json({ message: 'Fichier introuvable sur le serveur' });
            }
            res.download(doc.chemin_fichier, doc.nom_original);
        }
    );
};

// UPLOADER UN DOCUMENT
exports.uploadDocument = (req, res) => {
    const db = req.db;
    
    if (!req.file) {
        return res.status(400).json({ message: 'Aucun fichier fourni' });
    }

    const { nom, type_document, reference_type, reference_id } = req.body;
    const typeFinal = TYPES_VALIDES.includes(type_document) ? type_document : 'autre';

    const sql = `
        INSERT INTO documents
            (nom, type_document, reference_type, reference_id, chemin_fichier, nom_original, mime_type, taille_octets, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(sql, [
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
            console.error('Erreur uploadDocument:', err);
            // Supprimer le fichier en cas d'erreur
            fs.unlink(req.file.path, () => {});
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        res.status(201).json({ 
            message: 'Document téléversé avec succès', 
            id: result.insertId 
        });
    });
};

// SUPPRIMER UN DOCUMENT (métadonnée + fichier disque)
exports.deleteDocument = (req, res) => {
    const db = req.db;
    
    db.query(
        'SELECT chemin_fichier FROM documents WHERE id = ?',
        [req.params.id],
        (errSel, results) => {
            if (errSel) {
                console.error(' Erreur deleteDocument - select:', errSel);
                return res.status(500).json({ message: 'Erreur serveur' });
            }
            if (results.length === 0) {
                return res.status(404).json({ message: 'Document introuvable' });
            }

            const cheminFichier = results[0].chemin_fichier;
            
            db.query(
                'DELETE FROM documents WHERE id = ?',
                [req.params.id],
                (err, result) => {
                    if (err) {
                        console.error(' Erreur deleteDocument - delete:', err);
                        return res.status(500).json({ message: 'Erreur serveur' });
                    }
                    // Supprimer le fichier physique
                    if (cheminFichier && fs.existsSync(cheminFichier)) {
                        fs.unlink(cheminFichier, (unlinkErr) => {
                            if (unlinkErr) {
                                console.error('Erreur suppression fichier:', unlinkErr);
                            }
                        });
                    }
                    res.json({ message: 'Document supprimé avec succès' });
                }
            );
        }
    );
};