const AuditService = require('../services/audit.service');
const encryptionService = require('../services/encryption.service');

exports.getAllFournisseurs = (req, res) => {
    const db = req.db;
    db.query('SELECT * FROM fournisseurs ORDER BY id DESC', (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }

        const fournisseurs = results.map(f => ({
            ...f,
            nom: encryptionService.decrypt(f.nom),
            email: encryptionService.decrypt(f.email),
            telephone: encryptionService.decrypt(f.telephone),
            adresse: encryptionService.decrypt(f.adresse)
        }));

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

        const fournisseur = results[0];
        fournisseur.nom = encryptionService.decrypt(fournisseur.nom);
        fournisseur.email = encryptionService.decrypt(fournisseur.email);
        fournisseur.telephone = encryptionService.decrypt(fournisseur.telephone);
        fournisseur.adresse = encryptionService.decrypt(fournisseur.adresse);

        res.json({ fournisseur: fournisseur });
    });
};

exports.createFournisseur = (req, res) => {
    const db = req.db;
    const { nom, email, telephone, adresse } = req.body;

    if (!nom || nom.trim().length < 2) {
        return res.status(400).json({ message: 'Le nom du fournisseur est requis' });
    }

    const encryptedNom = encryptionService.encrypt(nom.trim());
    const encryptedEmail = email ? encryptionService.encrypt(email) : null;
    const encryptedTelephone = telephone ? encryptionService.encrypt(telephone) : null;
    const encryptedAdresse = adresse ? encryptionService.encrypt(adresse) : null;

    const sql = 'INSERT INTO fournisseurs (nom, email, telephone, adresse) VALUES (?, ?, ?, ?)';
    db.query(sql, [encryptedNom, encryptedEmail, encryptedTelephone, encryptedAdresse], (err, result) => {
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
            nouvelles_valeurs: { nom, email, telephone, adresse },
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
    const { nom, email, telephone, adresse } = req.body;

    if (!nom || nom.trim().length < 2) {
        return res.status(400).json({ message: 'Le nom du fournisseur est requis' });
    }

    db.query('SELECT * FROM fournisseurs WHERE id = ?', [req.params.id], (errSelect, oldData) => {
        if (errSelect) {
            console.error(errSelect);
            return res.status(500).json({ message: 'Erreur serveur' });
        }

        const encryptedNom = encryptionService.encrypt(nom.trim());
        const encryptedEmail = email ? encryptionService.encrypt(email) : null;
        const encryptedTelephone = telephone ? encryptionService.encrypt(telephone) : null;
        const encryptedAdresse = adresse ? encryptionService.encrypt(adresse) : null;

        const sql = 'UPDATE fournisseurs SET nom = ?, email = ?, telephone = ?, adresse = ? WHERE id = ?';
        db.query(sql, [encryptedNom, encryptedEmail, encryptedTelephone, encryptedAdresse, req.params.id], (err, result) => {
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
                nouvelles_valeurs: { nom, email, telephone, adresse },
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