const AuditService = require('../services/audit.service');
const encryptionService = require('../services/encryption.service');

exports.getAllClients = (req, res) => {
    const db = req.db;
    db.query('SELECT * FROM clients ORDER BY id DESC', (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }

        const clients = results.map(client => ({
            ...client,
            nom: encryptionService.decrypt(client.nom),
            email: encryptionService.decrypt(client.email),
            telephone: encryptionService.decrypt(client.telephone),
            adresse: encryptionService.decrypt(client.adresse)
        }));

        res.json({ clients: clients });
    });
};

exports.getClientById = (req, res) => {
    const db = req.db;
    db.query('SELECT * FROM clients WHERE id = ?', [req.params.id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Client introuvable' });
        }

        const client = results[0];
        client.nom = encryptionService.decrypt(client.nom);
        client.email = encryptionService.decrypt(client.email);
        client.telephone = encryptionService.decrypt(client.telephone);
        client.adresse = encryptionService.decrypt(client.adresse);

        res.json({ client: client });
    });
};

exports.createClient = (req, res) => {
    const db = req.db;
    const { nom, email, telephone, adresse } = req.body;

    if (!nom || nom.trim().length < 2) {
        return res.status(400).json({ message: 'Le nom du client est requis' });
    }

    const encryptedNom = encryptionService.encrypt(nom.trim());
    const encryptedEmail = email ? encryptionService.encrypt(email) : null;
    const encryptedTelephone = telephone ? encryptionService.encrypt(telephone) : null;
    const encryptedAdresse = adresse ? encryptionService.encrypt(adresse) : null;

    const sql = 'INSERT INTO clients (nom, email, telephone, adresse) VALUES (?, ?, ?, ?)';
    db.query(sql, [encryptedNom, encryptedEmail, encryptedTelephone, encryptedAdresse], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }

        AuditService.logOperation(db, {
            utilisateur_id: req.user.id,
            entreprise_id: req.user.entreprise_id,
            operation: 'CREATE',
            table_name: 'clients',
            record_id: result.insertId,
            nouvelles_valeurs: { nom, email, telephone, adresse },
            ip: req.ip || req.connection.remoteAddress,
            user_agent: req.headers['user-agent']
        }).catch(err => console.error('Erreur audit operation:', err));

        res.status(201).json({
            message: 'Client cree avec succes',
            id: result.insertId
        });
    });
};

exports.updateClient = (req, res) => {
    const db = req.db;
    const { nom, email, telephone, adresse } = req.body;

    if (!nom || nom.trim().length < 2) {
        return res.status(400).json({ message: 'Le nom du client est requis' });
    }

    db.query('SELECT * FROM clients WHERE id = ?', [req.params.id], (errSelect, oldData) => {
        if (errSelect) {
            console.error(errSelect);
            return res.status(500).json({ message: 'Erreur serveur' });
        }

        const encryptedNom = encryptionService.encrypt(nom.trim());
        const encryptedEmail = email ? encryptionService.encrypt(email) : null;
        const encryptedTelephone = telephone ? encryptionService.encrypt(telephone) : null;
        const encryptedAdresse = adresse ? encryptionService.encrypt(adresse) : null;

        const sql = 'UPDATE clients SET nom = ?, email = ?, telephone = ?, adresse = ? WHERE id = ?';
        db.query(sql, [encryptedNom, encryptedEmail, encryptedTelephone, encryptedAdresse, req.params.id], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Erreur serveur' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Client introuvable' });
            }

            AuditService.logOperation(db, {
                utilisateur_id: req.user.id,
                entreprise_id: req.user.entreprise_id,
                operation: 'UPDATE',
                table_name: 'clients',
                record_id: req.params.id,
                anciennes_valeurs: oldData[0] || null,
                nouvelles_valeurs: { nom, email, telephone, adresse },
                ip: req.ip || req.connection.remoteAddress,
                user_agent: req.headers['user-agent']
            }).catch(err => console.error('Erreur audit operation:', err));

            res.json({ message: 'Client mis a jour avec succes' });
        });
    });
};

exports.deleteClient = (req, res) => {
    const db = req.db;

    db.query('SELECT * FROM clients WHERE id = ?', [req.params.id], (errSelect, oldData) => {
        if (errSelect) {
            console.error(errSelect);
            return res.status(500).json({ message: 'Erreur serveur' });
        }

        db.query('DELETE FROM clients WHERE id = ?', [req.params.id], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Erreur serveur' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Client introuvable' });
            }

            AuditService.logOperation(db, {
                utilisateur_id: req.user.id,
                entreprise_id: req.user.entreprise_id,
                operation: 'DELETE',
                table_name: 'clients',
                record_id: req.params.id,
                anciennes_valeurs: oldData[0] || null,
                ip: req.ip || req.connection.remoteAddress,
                user_agent: req.headers['user-agent']
            }).catch(err => console.error('Erreur audit operation:', err));

            res.json({ message: 'Client supprime avec succes' });
        });
    });
};