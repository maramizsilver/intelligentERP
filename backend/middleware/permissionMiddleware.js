const ACTIONS_VALIDES = ['consultation', 'creation', 'modification', 'suppression', 'validation', 'export'];

module.exports = function checkPermission(moduleNom, action) {
  if (!ACTIONS_VALIDES.includes(action)) {
    throw new Error(`Action de permission invalide : ${action}`);
  }

  return (req, res, next) => {
    const { is_super_admin, role_id } = req.user || {};

    if (is_super_admin) {
      return res.status(403).json({ message: "Le SuperAdmin n'a pas accès aux données métier des entreprises" });
    }

    if (!role_id) {
      return res.status(403).json({ message: 'Aucun rôle assigné à ce compte' });
    }

    const db = req.db || require('../config/db');

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
  };
};

module.exports.ACTIONS_VALIDES = ACTIONS_VALIDES;