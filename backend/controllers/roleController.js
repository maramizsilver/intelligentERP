const db = require('../config/db');

// Liste des rôles de l'entreprise connectée
exports.getRoles = (req, res) => {
  db.query(
    'SELECT * FROM roles WHERE entreprise_id = ? ORDER BY id',
    [req.user.entreprise_id],
    (err, results) => {
      if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
      res.json({ roles: results });
    }
  );
};

// Créer un nouveau rôle personnalisé pour l'entreprise connectée
exports.createRole = (req, res) => {
  const { nom, description } = req.body;
  if (!nom || nom.trim().length < 2) {
    return res.status(400).json({ message: 'Le nom du rôle est requis' });
  }
  db.query(
    'INSERT INTO roles (entreprise_id, nom, description, est_admin_entreprise) VALUES (?, ?, ?, FALSE)',
    [req.user.entreprise_id, nom.trim(), description || null],
    (err, result) => {
      if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
      res.status(201).json({ message: 'Rôle créé avec succès', id: result.insertId });
    }
  );
};

exports.deleteRole = (req, res) => {
  const { id } = req.params;
  db.query(
    'DELETE FROM roles WHERE id = ? AND entreprise_id = ? AND est_admin_entreprise = FALSE',
    [id, req.user.entreprise_id],
    (err, result) => {
      if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Rôle introuvable ou non supprimable (rôle admin d'entreprise)" });
      }
      res.json({ message: 'Rôle supprimé avec succès' });
    }
  );
};

// Liste de tous les modules disponibles (référentiel global, pas par entreprise)
exports.getModules = (req, res) => {
  db.query('SELECT * FROM modules ORDER BY id', (err, results) => {
    if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
    res.json({ modules: results });
  });
};

// Récupérer la matrice de permissions d'un rôle (tous les modules, cochés ou non)
exports.getPermissionsForRole = (req, res) => {
  const { role_id } = req.params;

  db.query(
    'SELECT id FROM roles WHERE id = ? AND entreprise_id = ?',
    [role_id, req.user.entreprise_id],
    (errCheck, roles) => {
      if (errCheck) { console.error(errCheck); return res.status(500).json({ message: 'Erreur serveur' }); }
      if (roles.length === 0) return res.status(404).json({ message: 'Rôle introuvable' });

      const sql = `
        SELECT m.id AS module_id, m.nom AS module_nom,
               COALESCE(p.consultation, FALSE) AS consultation,
               COALESCE(p.creation, FALSE) AS creation,
               COALESCE(p.modification, FALSE) AS modification,
               COALESCE(p.suppression, FALSE) AS suppression,
               COALESCE(p.validation, FALSE) AS validation,
               COALESCE(p.export, FALSE) AS export
        FROM modules m
        LEFT JOIN permissions p ON p.module_id = m.id AND p.role_id = ?
        ORDER BY m.id
      `;
      db.query(sql, [role_id], (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        res.json({ permissions: results });
      });
    }
  );
};

// Mettre à jour (upsert) les permissions d'un rôle pour un module donné
// body: { module_id, consultation, creation, modification, suppression, validation, export }
exports.setPermission = (req, res) => {
  const { role_id } = req.params;
  const { module_id, consultation, creation, modification, suppression, validation, export: exp } = req.body;

  if (!module_id) {
    return res.status(400).json({ message: 'module_id est requis' });
  }

  // Le rôle doit appartenir à l'entreprise de l'admin connecté (isolation multi-tenant)
  db.query(
    'SELECT id FROM roles WHERE id = ? AND entreprise_id = ?',
    [role_id, req.user.entreprise_id],
    (errCheck, roles) => {
      if (errCheck) { console.error(errCheck); return res.status(500).json({ message: 'Erreur serveur' }); }
      if (roles.length === 0) return res.status(404).json({ message: 'Rôle introuvable pour votre entreprise' });

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
        role_id, module_id,
        !!consultation, !!creation, !!modification, !!suppression, !!validation, !!exp
      ];
      db.query(sql, vals, (err) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        res.json({ message: 'Permissions mises à jour avec succès' });
      });
    }
  );
};
