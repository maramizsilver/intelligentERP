const db = require('../config/db');

exports.getAllEntreprises = (req, res) => {
  db.query('SELECT * FROM entreprises ORDER BY date_inscription DESC', (err, results) => {
    if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
    res.json({ entreprises: results });
  });
};

exports.getEntrepriseById = (req, res) => {
  const { id } = req.params;
  db.query(
    `SELECT e.*,
            COUNT(DISTINCT u.id) AS total_users,
            (SELECT COUNT(*) FROM sessions s WHERE s.user_id IN (SELECT id FROM users WHERE entreprise_id = e.id) AND s.is_active = 1) AS active_sessions
     FROM entreprises e
     LEFT JOIN users u ON u.entreprise_id = e.id
     WHERE e.id = ?
     GROUP BY e.id`,
    [id],
    (err, results) => {
      if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
      if (results.length === 0) return res.status(404).json({ message: 'Entreprise introuvable' });
      res.json({ entreprise: results[0] });
    }
  );
};

exports.validerEntreprise = (req, res) => {
  db.query(
    "UPDATE entreprises SET statut = 'actif' WHERE id = ?",
    [req.params.id],
    (err, result) => {
      if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Entreprise introuvable' });
      res.json({ message: 'Entreprise validee avec succes' });
    }
  );
};

exports.suspendreEntreprise = (req, res) => {
  db.query(
    "UPDATE entreprises SET statut = 'suspendu' WHERE id = ?",
    [req.params.id],
    (err, result) => {
      if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Entreprise introuvable' });
      res.json({ message: 'Entreprise suspendue avec succes' });
    }
  );
};

exports.passerEnPayant = (req, res) => {
  db.query(
    "UPDATE entreprises SET plan_type = 'payant' WHERE id = ?",
    [req.params.id],
    (err, result) => {
      if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Entreprise introuvable' });
      res.json({ message: 'Entreprise passee en abonnement payant avec succes' });
    }
  );
};

exports.deleteEntreprise = async (req, res) => {
  const { id } = req.params;

  try {
    const [count] = await db.promisePoolMaster.query(
      'SELECT COUNT(*) as total FROM entreprises'
    );

    if (count[0].total <= 1) {
      return res.status(400).json({
        message: 'Impossible de supprimer la derniere entreprise. Il doit y avoir au moins 1 entreprise sur la plateforme.'
      });
    }

    const [rows] = await db.promisePoolMaster.query(
      'SELECT id, nom, db_name FROM entreprises WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Entreprise introuvable' });
    }

    const entreprise = rows[0];
    const dbName = entreprise.db_name;

    await db.promisePoolMaster.query(`DROP DATABASE IF EXISTS \`${dbName}\``);

    await db.promisePoolMaster.query(
      'DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE entreprise_id = ?)',
      [id]
    );

    await db.promisePoolMaster.query(
      'DELETE FROM user_connections WHERE user_id IN (SELECT id FROM users WHERE entreprise_id = ?)',
      [id]
    );

    await db.promisePoolMaster.query(
      'DELETE FROM user_devices WHERE user_id IN (SELECT id FROM users WHERE entreprise_id = ?)',
      [id]
    );

    await db.promisePoolMaster.query(
      'DELETE FROM security_alerts WHERE user_id IN (SELECT id FROM users WHERE entreprise_id = ?)',
      [id]
    );

    await db.promisePoolMaster.query(
      'DELETE FROM users WHERE entreprise_id = ?',
      [id]
    );

    await db.promisePoolMaster.query(
      'DELETE FROM entreprises WHERE id = ?',
      [id]
    );

    const tenantMiddleware = require('../middleware/tenant.middleware');
    tenantMiddleware.invalidateCache(id);

    res.json({
      message: `Entreprise "${entreprise.nom}" supprimee avec succes`,
      entreprise_id: id
    });

  } catch (err) {
    console.error('Erreur suppression entreprise:', err);
    res.status(500).json({ message: 'Erreur lors de la suppression' });
  }
};