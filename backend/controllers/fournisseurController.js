const AuditService = require('../services/audit.service');
const encryptionService = require('../services/encryption.service');

const SENSITIVE_FIELDS = encryptionService
  .getEncryptedFieldNames()
  .filter(f => ['email', 'telephone', 'adresse'].includes(f));

exports.getAllFournisseurs = (req, res) => {
    const db = req.db;
    db.query('SELECT * FROM fournisseurs ORDER BY id DESC', (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }

        const fournisseurs = results.map(fournisseur =>
            encryptionService.decryptSensitiveFields(fournisseur, SENSITIVE_FIELDS)
        );

        res.json({ fournisseurs: fournisseurs });
    });
};

exports.getFournisseurById = (req, res) => {
    const db = req.db;
    db.query('SELECT * FROM fournisseurs WHERE id = ?', [req.params.id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Fournisseur introuvable' });
        }

        const fournisseur = encryptionService.decryptSensitiveFields(results[0], SENSITIVE_FIELDS);

        res.json({ fournisseur: fournisseur });
    });
};

exports.createFournisseur = (req, res) => {
    const db = req.db;
    const { 
        nom, raison_sociale, email, telephone, adresse,
        ville, code_postal, pays, matricule_fiscal, numero_tva, rib, notes
    } = req.body;

    if (!nom || nom.trim().length < 2) {
        return res.status(400).json({ message: 'Le nom du fournisseur est requis' });
    }

    const encryptedData = encryptionService.encryptSensitiveFields(
        { email: email || null, telephone: telephone || null, adresse: adresse || null },
        SENSITIVE_FIELDS
    );

    const sql = `INSERT INTO fournisseurs 
        (nom, raison_sociale, email, telephone, adresse, ville, code_postal,
         pays, matricule_fiscal, numero_tva, rib, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(sql, [
        nom.trim(), raison_sociale || null, encryptedData.email, encryptedData.telephone, encryptedData.adresse,
        ville || null, code_postal || null, pays || 'Tunisie',
        matricule_fiscal || null, numero_tva || null, rib || null, notes || null
    ], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }

        AuditService.logOperation(db, {
            utilisateur_id: req.user.id,
            entreprise_id: req.user.entreprise_id,
            operation: 'CREATE',
            table_name: 'fournisseurs',
            record_id: result.insertId,
            nouvelles_valeurs: { nom, raison_sociale, email, telephone, adresse, ville, code_postal, pays, matricule_fiscal, numero_tva, rib, notes },
            ip: req.ip || req.connection.remoteAddress,
            user_agent: req.headers['user-agent']
        }).catch(err => console.error('Erreur audit operation:', err));

        res.status(201).json({
            message: 'Fournisseur cree avec succes',
            id: result.insertId
        });
    });
};

exports.updateFournisseur = (req, res) => {
    const db = req.db;
    const { 
        nom, raison_sociale, email, telephone, adresse,
        ville, code_postal, pays, matricule_fiscal, numero_tva, rib, notes
    } = req.body;

    if (!nom || nom.trim().length < 2) {
        return res.status(400).json({ message: 'Le nom du fournisseur est requis' });
    }

    db.query('SELECT * FROM fournisseurs WHERE id = ?', [req.params.id], (errSelect, oldData) => {
        if (errSelect) {
            console.error(errSelect);
            return res.status(500).json({ message: 'Erreur serveur' });
        }

        const encryptedData = encryptionService.encryptSensitiveFields(
            { email: email || null, telephone: telephone || null, adresse: adresse || null },
            SENSITIVE_FIELDS
        );

        const sql = `UPDATE fournisseurs SET 
            nom = ?, raison_sociale = ?, email = ?, telephone = ?, adresse = ?,
            ville = ?, code_postal = ?, pays = ?, matricule_fiscal = ?, numero_tva = ?,
            rib = ?, notes = ?
            WHERE id = ?`;

        db.query(sql, [
            nom.trim(), raison_sociale || null, encryptedData.email, encryptedData.telephone, encryptedData.adresse,
            ville || null, code_postal || null, pays || 'Tunisie',
            matricule_fiscal || null, numero_tva || null, rib || null, notes || null,
            req.params.id
        ], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Erreur serveur' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Fournisseur introuvable' });
            }

            AuditService.logOperation(db, {
                utilisateur_id: req.user.id,
                entreprise_id: req.user.entreprise_id,
                operation: 'UPDATE',
                table_name: 'fournisseurs',
                record_id: req.params.id,
                anciennes_valeurs: oldData[0] || null,
                nouvelles_valeurs: { nom, raison_sociale, email, telephone, adresse, ville, code_postal, pays, matricule_fiscal, numero_tva, rib, notes },
                ip: req.ip || req.connection.remoteAddress,
                user_agent: req.headers['user-agent']
            }).catch(err => console.error('Erreur audit operation:', err));

            res.json({ message: 'Fournisseur mis a jour avec succes' });
        });
    });
};

exports.deleteFournisseur = (req, res) => {
    const db = req.db;

    db.query('SELECT * FROM fournisseurs WHERE id = ?', [req.params.id], (errSelect, oldData) => {
        if (errSelect) {
            console.error(errSelect);
            return res.status(500).json({ message: 'Erreur serveur' });
        }

        db.query('DELETE FROM fournisseurs WHERE id = ?', [req.params.id], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Erreur serveur' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Fournisseur introuvable' });
            }

            AuditService.logOperation(db, {
                utilisateur_id: req.user.id,
                entreprise_id: req.user.entreprise_id,
                operation: 'DELETE',
                table_name: 'fournisseurs',
                record_id: req.params.id,
                anciennes_valeurs: oldData[0] || null,
                ip: req.ip || req.connection.remoteAddress,
                user_agent: req.headers['user-agent']
            }).catch(err => console.error('Erreur audit operation:', err));

            res.json({ message: 'Fournisseur supprime avec succes' });
        });
    });
};