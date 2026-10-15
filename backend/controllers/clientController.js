const encryptionService = require('../services/encryption.service');

const SENSITIVE_FIELDS = encryptionService
  .getEncryptedFieldNames()
  .filter(f => ['email', 'telephone', 'adresse'].includes(f));

// Colonnes autorisées pour le profil (whitelist : jamais de SELECT *)
const COLONNES_PROFIL = 'id, nom, prenom, email, telephone, adresse, ville, code_postal, pays';
// PRODUITS
exports.getMesProduits = (req, res) => {
  req.db.query(
    `SELECT id, nom, reference, categorie, unite, prix, prix_vente, quantite_stock
     FROM produits WHERE actif = 1 ORDER BY nom ASC`,
    (err, results) => {
      if (err) {
        console.error('Erreur getMesProduits:', err);
        return res.status(500).json({ message: 'Erreur serveur' });
      }
      res.json({ produits: results });
    });
};

// PROFIL
exports.getMonProfil = (req, res) => {
  if (!req.user.client_id) {
    return res.status(400).json({ message: 'Aucun client associé à ce compte' });
  }

  req.db.query(
    `SELECT ${COLONNES_PROFIL} FROM clients WHERE id = ?`,
    [req.user.client_id],
    (err, results) => {
      if (err) {
        console.error('Erreur getMonProfil:', err);
        return res.status(500).json({ message: 'Erreur serveur' });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: 'Client introuvable' });
      }

      // Déchiffrement des champs sensibles avant envoi au client
      const user = encryptionService.decryptSensitiveFields(results[0], SENSITIVE_FIELDS);

      res.json({ user });
    }
  );
};
//delete client

const { repondreErreurDb } = require('../utils/dbErrors');
exports.deleteClient = (req, res) => {
    const db = req.db;

    db.query('SELECT * FROM clients WHERE id = ?', [req.params.id], (errSelect, oldData) => {
        if (errSelect) {
            console.error(errSelect);
            return res.status(500).json({ message: 'Erreur serveur' });
        }

        db.query('DELETE FROM clients WHERE id = ?', [req.params.id], (err, result) => {
            if (err) return repondreErreurDb(res, err);        // ← LA LIGNE CHANGÉE
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
// MISE À JOUR DU PROFIL
 
exports.updateMonProfil = (req, res) => {
  if (!req.user.client_id) {
    return res.status(400).json({ message: 'Aucun client associé à ce compte' });
  }

  const {
    nom, prenom, email, telephone, adresse,
    ville, code_postal, pays
  } = req.body;

  // Validation minimale
  const errors = [];
  if (!nom || nom.trim().length < 2) errors.push('Le nom est requis (min 2 caractères)');
  if (!prenom || prenom.trim().length < 2) errors.push('Le prénom est requis (min 2 caractères)');
  if (errors.length > 0) {
    return res.status(400).json({ message: 'Données invalides', errors });
  }

  // Chiffrement des champs sensibles avant UPDATE
  const encryptedData = encryptionService.encryptSensitiveFields(
    {
      email: email || null,
      telephone: telephone || null,
      adresse: adresse || null
    },
    SENSITIVE_FIELDS
  );

  const sql = `
    UPDATE clients SET
      nom = ?, prenom = ?, email = ?, telephone = ?, adresse = ?,
      ville = ?, code_postal = ?, pays = ?
    WHERE id = ?`;

  req.db.query(
    sql,
    [
      nom.trim(),
      prenom.trim(),
      encryptedData.email,
      encryptedData.telephone,
      encryptedData.adresse,
      ville || null,
      code_postal || null,
      pays || 'Tunisie',
      req.user.client_id
    ],
    (err, result) => {
      if (err) {
        console.error('Erreur updateMonProfil:', err);
        return res.status(500).json({ message: 'Erreur serveur' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Client introuvable' });
      }

      // Relecture avec la whitelist (jamais SELECT *)
      req.db.query(
        `SELECT ${COLONNES_PROFIL} FROM clients WHERE id = ?`,
        [req.user.client_id],
        (err2, rows) => {
          if (err2) {
            console.error('Erreur updateMonProfil (relecture):', err2);
            return res.json({ message: 'Profil mis à jour avec succès' });
          }

          const user = encryptionService.decryptSensitiveFields(rows[0] || {}, SENSITIVE_FIELDS);
          res.json({ message: 'Profil mis à jour avec succès', user });
        }
      );
    }
  );
};