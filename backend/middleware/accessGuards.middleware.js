const q = (db, sql, p) => new Promise((res, rej) => db.query(sql, p, (e, r) => (e ? rej(e) : res(r))));

// Bloque le portail client
exports.bloquerExternes = (req, res, next) => {
  if (req.user?.is_external) return res.status(403).json({ message: "Accès réservé au personnel de l'entreprise" });
  next();
};

// Personnel interne uniquement (ni client externe, ni SuperAdmin)
exports.staffEntrepriseSeulement = (req, res, next) => {
  if (!req.user || req.user.is_super_admin || req.user.is_external) {
    return res.status(403).json({ message: 'Accès non autorisé pour ce type de compte' });
  }
  next();
};

// Admin Entreprise uniquement (nécessite tenantMiddleware avant)
exports.adminEntrepriseSeulement = async (req, res, next) => {
  try {
    if (!req.user?.role_id || !req.db || req.user.is_super_admin || req.user.is_external) {
      return res.status(403).json({ message: "Réservé à l'administrateur de l'entreprise" });
    }
    const rows = await q(req.db, 'SELECT est_admin_entreprise FROM roles WHERE id = ?', [req.user.role_id]);
    if (!rows.length || !rows[0].est_admin_entreprise) {
      return res.status(403).json({ message: "Réservé à l'administrateur de l'entreprise" });
    }
    next();
  } catch (err) {
    console.error('[adminEntrepriseSeulement]', err.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};