const db = require('../config/db');

// Whitelist des entités archivables + leur table + leur clé de filtrage
// entreprise (certaines tables comme `commandes` ne portent pas
// directement entreprise_id, il faut passer par un JOIN clients).
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
        selectSql: 'SELECT * FROM devis WHERE id = ? AND entreprise_id = ?',
        deleteSql: 'DELETE FROM devis WHERE id = ? AND entreprise_id = ?'
    },
    achat: {
        selectSql: 'SELECT * FROM achats WHERE id = ? AND entreprise_id = ?',
        deleteSql: 'DELETE FROM achats WHERE id = ? AND entreprise_id = ?'
    },
    client: {
        selectSql: 'SELECT * FROM clients WHERE id = ? AND entreprise_id = ?',
        deleteSql: 'DELETE FROM clients WHERE id = ? AND entreprise_id = ?'
    }
};

// ============================================================
// GET TOUTES LES ARCHIVES (filtre optionnel par type_entite)
// ============================================================
exports.getAllArchives = (req, res) => {
    const { type_entite } = req.query;
    let sql = 'SELECT id, type_entite, entite_id, motif, archived_by, archived_at FROM archives WHERE entreprise_id = ?';
    const params = [req.user.entreprise_id];
    if (type_entite) { sql += ' AND type_entite = ?'; params.push(type_entite); }
    sql += ' ORDER BY archived_at DESC';

    db.query(sql, params, (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        res.json({ archives: results });
    });
};

// ============================================================
// GET UNE ARCHIVE (avec le snapshot JSON complet)
// ============================================================
exports.getArchiveById = (req, res) => {
    db.query('SELECT * FROM archives WHERE id = ? AND entreprise_id = ?', [req.params.id, req.user.entreprise_id], (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (results.length === 0) return res.status(404).json({ message: 'Archive introuvable' });
        res.json({ archive: results[0] });
    });
};

// ============================================================
// ARCHIVER UNE ENTITÉ
// body: { type_entite, entite_id, motif?, supprimer_original? }
// Prend un instantané JSON de l'enregistrement, l'enregistre dans
// `archives`, puis supprime l'original SEULEMENT si demandé
// explicitement (supprimer_original = true) — sinon l'archive n'est
// qu'une copie de sauvegarde, l'original reste consultable.
// ============================================================
exports.archiverEntite = (req, res) => {
    const { type_entite, entite_id, motif, supprimer_original } = req.body;

    if (!ENTITES_ARCHIVABLES[type_entite]) {
        return res.status(400).json({
            message: `Type d'entité non archivable. Valeurs autorisées : ${Object.keys(ENTITES_ARCHIVABLES).join(', ')}`
        });
    }
    if (!entite_id) return res.status(400).json({ message: 'entite_id est requis' });

    const { selectSql, deleteSql } = ENTITES_ARCHIVABLES[type_entite];

    db.query(selectSql, [entite_id, req.user.entreprise_id], (errSel, results) => {
        if (errSel) { console.error(errSel); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (results.length === 0) return res.status(404).json({ message: 'Enregistrement introuvable pour votre entreprise' });

        const snapshot = JSON.stringify(results[0]);
        const sqlInsert = `
            INSERT INTO archives (entreprise_id, type_entite, entite_id, donnees, motif, archived_by)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        db.query(sqlInsert, [req.user.entreprise_id, type_entite, entite_id, snapshot, motif || null, req.user.id], (errIns, result) => {
            if (errIns) { console.error(errIns); return res.status(500).json({ message: 'Erreur serveur' }); }

            if (!supprimer_original) {
                return res.status(201).json({ message: 'Entité archivée avec succès (original conservé)', archive_id: result.insertId });
            }

            db.query(deleteSql, [entite_id, req.user.entreprise_id], (errDel) => {
                if (errDel) {
                    console.error(errDel);
                    return res.status(201).json({
                        message: "Entité archivée, mais suppression de l'original a échoué (peut-être des données liées)",
                        archive_id: result.insertId
                    });
                }
                res.status(201).json({ message: 'Entité archivée et supprimée avec succès', archive_id: result.insertId });
            });
        });
    });
};

// ============================================================
// RESTAURER UNE ARCHIVE (uniquement pour les entités simples sans
// dépendances complexes — ici : client, à titre d'exemple)
// ============================================================
exports.restaurerArchive = (req, res) => {
    db.query('SELECT * FROM archives WHERE id = ? AND entreprise_id = ?', [req.params.id, req.user.entreprise_id], (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (results.length === 0) return res.status(404).json({ message: 'Archive introuvable' });

        const archive = results[0];
        if (archive.type_entite !== 'client') {
            return res.status(400).json({ message: 'La restauration automatique n\'est disponible que pour les clients pour le moment' });
        }

        const donnees = typeof archive.donnees === 'string' ? JSON.parse(archive.donnees) : archive.donnees;
        const sql = 'INSERT INTO clients (entreprise_id, nom, email, telephone, adresse) VALUES (?, ?, ?, ?, ?)';
        db.query(sql, [req.user.entreprise_id, donnees.nom, donnees.email, donnees.telephone, donnees.adresse], (errIns, result) => {
            if (errIns) { console.error(errIns); return res.status(500).json({ message: 'Erreur serveur' }); }
            res.status(201).json({ message: 'Client restauré avec succès', nouveau_id: result.insertId });
        });
    });
};

// ============================================================
// SUPPRIMER DÉFINITIVEMENT UNE ARCHIVE (purge, à utiliser avec prudence)
// ============================================================
exports.deleteArchive = (req, res) => {
    db.query('DELETE FROM archives WHERE id = ? AND entreprise_id = ?', [req.params.id, req.user.entreprise_id], (err, result) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Archive introuvable' });
        res.json({ message: 'Archive supprimée définitivement' });
    });
};
