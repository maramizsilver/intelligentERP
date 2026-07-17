const ENTITES_ARCHIVABLES = {
    commande: {
        selectSql: `
            SELECT c.* FROM commandes c
            JOIN clients cl ON c.client_id = cl.id
            WHERE c.id = ? AND cl.entreprise_id = ?
        `,
        deleteSql: `
            DELETE c FROM commandes c
            JOIN clients cl ON c.client_id = cl.id
            WHERE c.id = ? AND cl.entreprise_id = ?
        `
    },
    devis: {
        selectSql: `
            SELECT d.* FROM devis d
            JOIN clients cl ON d.client_id = cl.id
            WHERE d.id = ? AND cl.entreprise_id = ?
        `,
        deleteSql: `
            DELETE d FROM devis d
            JOIN clients cl ON d.client_id = cl.id
            WHERE d.id = ? AND cl.entreprise_id = ?
        `
    },
    achat: {
        selectSql: `
            SELECT a.* FROM achats a
            JOIN fournisseurs f ON a.fournisseur_id = f.id
            WHERE a.id = ? AND f.entreprise_id = ?
        `,
        deleteSql: `
            DELETE a FROM achats a
            JOIN fournisseurs f ON a.fournisseur_id = f.id
            WHERE a.id = ? AND f.entreprise_id = ?
        `
    },
    client: {
        // CORRIGÉ: clients a bien une colonne entreprise_id
        selectSql: 'SELECT * FROM clients WHERE id = ? AND entreprise_id = ?',
        deleteSql: 'DELETE FROM clients WHERE id = ? AND entreprise_id = ?'
    }
};

// ============================================================
// GET TOUTES LES ARCHIVES
// ============================================================
exports.getAllArchives = (req, res) => {
    const db = req.db;
    
    const { type_entite } = req.query;
    let sql = 'SELECT id, type_entite, entite_id, motif, archived_by, archived_at FROM archives WHERE entreprise_id = ?';
    const params = [req.user.entreprise_id];
    
    if (type_entite) { 
        sql += ' AND type_entite = ?'; 
        params.push(type_entite); 
    }
    sql += ' ORDER BY archived_at DESC';

    db.query(sql, params, (err, results) => {
        if (err) { 
            console.error(' Erreur getAllArchives:', err); 
            return res.status(500).json({ message: 'Erreur serveur' }); 
        }
        res.json({ archives: results });
    });
};

// ============================================================
// GET UNE ARCHIVE PAR ID
// ============================================================
exports.getArchiveById = (req, res) => {
    const db = req.db;
    
    db.query(
        'SELECT * FROM archives WHERE id = ? AND entreprise_id = ?', 
        [req.params.id, req.user.entreprise_id], 
        (err, results) => {
            if (err) { 
                console.error('❌ Erreur getArchiveById:', err); 
                return res.status(500).json({ message: 'Erreur serveur' }); 
            }
            if (results.length === 0) {
                return res.status(404).json({ message: 'Archive introuvable' });
            }
            res.json({ archive: results[0] });
        }
    );
};

// ============================================================
// ARCHIVER UNE ENTITÉ
// ============================================================
exports.archiverEntite = (req, res) => {
    const db = req.db;
    
    const { type_entite, entite_id, motif, supprimer_original } = req.body;

    if (!ENTITES_ARCHIVABLES[type_entite]) {
        return res.status(400).json({
            message: `Type d'entité non archivable. Valeurs autorisées : ${Object.keys(ENTITES_ARCHIVABLES).join(', ')}`
        });
    }
    if (!entite_id) {
        return res.status(400).json({ message: 'entite_id est requis' });
    }

    const { selectSql, deleteSql } = ENTITES_ARCHIVABLES[type_entite];

    db.query(selectSql, [entite_id, req.user.entreprise_id], (errSel, results) => {
        if (errSel) { 
            console.error('❌ Erreur selectSql:', errSel); 
            return res.status(500).json({ message: 'Erreur serveur' }); 
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Enregistrement introuvable pour votre entreprise' });
        }

        const snapshot = JSON.stringify(results[0]);
        const sqlInsert = `
            INSERT INTO archives (entreprise_id, type_entite, entite_id, donnees, motif, archived_by)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        db.query(sqlInsert, [
            req.user.entreprise_id, 
            type_entite, 
            entite_id, 
            snapshot, 
            motif || null, 
            req.user.id
        ], (errIns, result) => {
            if (errIns) { 
                console.error(' Erreur insert archive:', errIns); 
                return res.status(500).json({ message: 'Erreur serveur' }); 
            }

            if (!supprimer_original) {
                return res.status(201).json({ 
                    message: 'Entité archivée avec succès (original conservé)', 
                    archive_id: result.insertId 
                });
            }

            db.query(deleteSql, [entite_id, req.user.entreprise_id], (errDel) => {
                if (errDel) {
                    console.error(' Erreur delete original:', errDel);
                    return res.status(201).json({
                        message: "Entité archivée, mais suppression de l'original a échoué",
                        archive_id: result.insertId
                    });
                }
                res.status(201).json({ 
                    message: 'Entité archivée et supprimée avec succès', 
                    archive_id: result.insertId 
                });
            });
        });
    });
};

// ============================================================
// RESTAURER UNE ARCHIVE
// ============================================================
exports.restaurerArchive = (req, res) => {
    const db = req.db;
    
    db.query(
        'SELECT * FROM archives WHERE id = ? AND entreprise_id = ?', 
        [req.params.id, req.user.entreprise_id], 
        (err, results) => {
            if (err) { 
                console.error('❌ Erreur restaurerArchive:', err); 
                return res.status(500).json({ message: 'Erreur serveur' }); 
            }
            if (results.length === 0) {
                return res.status(404).json({ message: 'Archive introuvable' });
            }

            const archive = results[0];
            if (archive.type_entite !== 'client') {
                return res.status(400).json({ 
                    message: 'La restauration automatique n\'est disponible que pour les clients pour le moment' 
                });
            }

            const donnees = typeof archive.donnees === 'string' ? JSON.parse(archive.donnees) : archive.donnees;
            
            const sql = 'INSERT INTO clients (entreprise_id, nom, email, telephone, adresse) VALUES (?, ?, ?, ?, ?)';
            db.query(sql, [
                req.user.entreprise_id, 
                donnees.nom, 
                donnees.email, 
                donnees.telephone, 
                donnees.adresse
            ], (errIns, result) => {
                if (errIns) { 
                    console.error(' Erreur restauration client:', errIns); 
                    return res.status(500).json({ message: 'Erreur serveur' }); 
                }
                res.status(201).json({ 
                    message: 'Client restauré avec succès', 
                    nouveau_id: result.insertId 
                });
            });
        }
    );
};

// ============================================================
// SUPPRIMER DÉFINITIVEMENT UNE ARCHIVE
// ============================================================
exports.deleteArchive = (req, res) => {
    const db = req.db;
    
    db.query(
        'DELETE FROM archives WHERE id = ? AND entreprise_id = ?', 
        [req.params.id, req.user.entreprise_id], 
        (err, result) => {
            if (err) { 
                console.error('❌ Erreur deleteArchive:', err); 
                return res.status(500).json({ message: 'Erreur serveur' }); 
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Archive introuvable' });
            }
            res.json({ message: 'Archive supprimée définitivement' });
        }
    );
};