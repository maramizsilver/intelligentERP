const ACTIONS_VALIDES = ['consultation', 'creation', 'modification', 'suppression', 'validation', 'export'];

module.exports = function checkPermission(moduleNom, action) {
  if (!ACTIONS_VALIDES.includes(action)) {
    throw new Error(`Action de permission invalide : ${action}`);
  }

  return (req, res, next) => {
    const { is_super_admin, role_id } = req.user || {};

    // Le SuperAdmin n'a PAS accès aux données métier des entreprises
    if (is_super_admin) {
      return res.status(403).json({ 
        message: "Le SuperAdmin n'a pas accès aux données métier des entreprises" 
      });
    }

    if (!role_id) {
      return res.status(403).json({ message: 'Aucun rôle assigné à ce compte' });
    }

    if (!req.db) {
      console.error('[Permission] req.db est undefined - tenantMiddleware manquant');
      return res.status(500).json({ message: 'Erreur de connexion à la base de données' });
    }

    const db = req.db;

    //  L'Admin Entreprise a TOUJOURS accès à tout
    
    db.query(
      'SELECT est_admin_entreprise FROM roles WHERE id = ?',
      [role_id],
      (errRole, roleRows) => {
        if (errRole) {
          console.error('Erreur verification role admin:', errRole);
          return res.status(500).json({ message: 'Erreur serveur' });
        }

        if (roleRows.length === 0) {
          return res.status(403).json({ 
            message: 'Rôle introuvable ou supprimé. Contactez votre administrateur.' 
          });
        }

        if (roleRows[0].est_admin_entreprise) {
          return next();
        }

        // rôle normal -> vérification classique sur la
        // table permissions
        const sql = `
          SELECT p.${action} AS autorise
          FROM permissions p
          JOIN modules m ON p.module_id = m.id
          WHERE p.role_id = ? AND m.nom = ?
        `;
        db.query(sql, [role_id, moduleNom], (err, results) => {
          if (err) {
            console.error('Erreur permission:', err);
            return res.status(500).json({ message: 'Erreur serveur' });
          }
          if (results.length === 0 || !results[0].autorise) {
            return res.status(403).json({ message: 'Accès refusé : permission insuffisante' });
          }
          next();
        });
      }
    );
  };
};

module.exports.ACTIONS_VALIDES = ACTIONS_VALIDES;