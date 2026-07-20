const db = require('../config/db');

// LISTE DES RÔLES DE L'ENTREPRISE CONNECTÉE
exports.getRoles = (req, res) => {
    const clientDb = req.db;
    
    clientDb.query(
        'SELECT * FROM roles ORDER BY id',
        (err, results) => {
            if (err) {
                console.error(' Erreur getRoles:', err);
                return res.status(500).json({ message: 'Erreur serveur' });
            }
            res.json({ roles: results });
        }
    );
};

// CRÉER UN NOUVEAU RÔLE PERSONNALISÉ
exports.createRole = (req, res) => {
    const clientDb = req.db;
    
    const { nom, description } = req.body;
    
    if (!nom || nom.trim().length < 2) {
        return res.status(400).json({ message: 'Le nom du rôle est requis' });
    }

    clientDb.query(
        'INSERT INTO roles (nom, description, est_admin_entreprise) VALUES (?, ?, FALSE)',
        [nom.trim(), description || null],
        (err, result) => {
            if (err) {
                console.error(' Erreur createRole:', err);
                return res.status(500).json({ message: 'Erreur serveur' });
            }
            res.status(201).json({ 
                message: 'Rôle créé avec succès', 
                id: result.insertId 
            });
        }
    );
};

// SUPPRIMR UN RÔLE (UNIQUEMENT LES RÔLES NON-ADMIN)

exports.deleteRole = (req, res) => {
    const clientDb = req.db;
    
    const { id } = req.params;
    
    clientDb.query(
        'DELETE FROM roles WHERE id = ? AND est_admin_entreprise = FALSE',
        [id],
        (err, result) => {
            if (err) {
                console.error('❌ Erreur deleteRole:', err);
                return res.status(500).json({ message: 'Erreur serveur' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ 
                    message: "Rôle introuvable ou non supprimable (rôle admin d'entreprise)" 
                });
            }
            res.json({ message: 'Rôle supprimé avec succès' });
        }
    );
};

// LISTE DE TOUS LES MODULES DISPONIBLES (depuis la base MASTER)
exports.getModules = (req, res) => {
    db.query('SELECT * FROM modules ORDER BY id', (err, results) => {
        if (err) {
            console.error('❌ Erreur getModules:', err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        res.json({ modules: results });
    });
};

// RÉCUPÉRER LA MATRICE DE PERMISSIONS D'UN RÔLE
exports.getPermissionsForRole = (req, res) => {
    const clientDb = req.db;
    
    const { role_id } = req.params;

    clientDb.query(
        'SELECT id FROM roles WHERE id = ?',
        [role_id],
        (errCheck, roles) => {
            if (errCheck) {
                console.error(' Erreur getPermissionsForRole - check:', errCheck);
                return res.status(500).json({ message: 'Erreur serveur' });
            }
            if (roles.length === 0) {
                return res.status(404).json({ message: 'Rôle introuvable' });
            }

            const sql = `
                SELECT m.id AS module_id, m.nom AS module_nom,
                       COALESCE(p.consultation, FALSE) AS consultation,
                       COALESCE(p.creation, FALSE) AS creation,
                       COALESCE(p.modification, FALSE) AS modification,
                       COALESCE(p.suppression, FALSE) AS suppression,
                       COALESCE(p.validation, FALSE) AS validation,
                       COALESCE(p.export, FALSE) AS export
                FROM erp_db.modules m
                LEFT JOIN permissions p ON p.module_id = m.id AND p.role_id = ?
                ORDER BY m.id
            `;
            clientDb.query(sql, [role_id], (err, results) => {
                if (err) {
                    console.error(' Erreur getPermissionsForRole - query:', err);
                    return res.status(500).json({ message: 'Erreur serveur' });
                }
                res.json({ permissions: results });
            });
        }
    );
};

// METTRE À JOUR LES PERMISSIONS D'UN RÔLE
exports.setPermission = (req, res) => {
    const clientDb = req.db;
    
    const { role_id } = req.params;
    const { module_id, consultation, creation, modification, suppression, validation, export: exp } = req.body;

    if (!module_id) {
        return res.status(400).json({ message: 'module_id est requis' });
    }

    clientDb.query(
        'SELECT id FROM roles WHERE id = ?',
        [role_id],
        (errCheck, roles) => {
            if (errCheck) {
                console.error(' Erreur setPermission - check:', errCheck);
                return res.status(500).json({ message: 'Erreur serveur' });
            }
            if (roles.length === 0) {
                return res.status(404).json({ message: 'Rôle introuvable' });
            }

            const sql = `
                INSERT INTO permissions (role_id, module_id, consultation, creation, modification, suppression, validation, export)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    consultation = VALUES(consultation),
                    creation = VALUES(creation),
                    modification = VALUES(modification),
                    suppression = VALUES(suppression),
                    validation = VALUES(validation),
                    export = VALUES(export)
            `;
            const vals = [
                role_id, 
                module_id,
                !!consultation, 
                !!creation, 
                !!modification, 
                !!suppression, 
                !!validation, 
                !!exp
            ];
            clientDb.query(sql, vals, (err) => {
                if (err) {
                    console.error(' Erreur setPermission - upsert:', err);
                    return res.status(500).json({ message: 'Erreur serveur' });
                }
                res.json({ message: 'Permissions mises à jour avec succès' });
            });
        }
    );
};