const db = require('../config/db');

// Réservé au SuperAdmin plateforme (voir superAdminMiddleware)

exports.getAllEntreprises = (req, res) => {
  db.query('SELECT * FROM entreprises ORDER BY date_inscription DESC', (err, results) => {
    if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
    res.json({ entreprises: results });
  });
};

exports.validerEntreprise = (req, res) => {
  db.query(
    "UPDATE entreprises SET statut = 'actif' WHERE id = ?",
    [req.params.id],
    (err, result) => {
      if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Entreprise introuvable' });
      res.json({ message: 'Entreprise validée avec succès' });
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
      res.json({ message: 'Entreprise suspendue avec succès' });
    }
  );
};

// Passe l'entreprise en abonnement payant : lève toute limite de connexions d'essai
// (en attendant un vrai module de facturation/paiement)
exports.passerEnPayant = (req, res) => {
  db.query(
    "UPDATE entreprises SET plan_type = 'payant' WHERE id = ?",
    [req.params.id],
    (err, result) => {
      if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Entreprise introuvable' });
      res.json({ message: 'Entreprise passée en abonnement payant avec succès' });
    }
  );
};
