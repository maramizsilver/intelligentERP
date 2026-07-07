const db = require('../config/db');

// Exporte TOUTES les données métier de l'entreprise connectée dans un fichier JSON
// téléchargeable. Volontairement jamais protégé par checkEssaiActif : même après
// expiration de l'essai, l'entreprise doit pouvoir récupérer ses données.
exports.exportMesDonnees = (req, res) => {
  if (req.user.is_super_admin) {
    return res.status(400).json({ message: "Le SuperAdmin n'a pas de données d'entreprise à exporter" });
  }
  if (req.user.is_external) {
    return res.status(403).json({ message: 'Export réservé aux comptes internes de l\'entreprise' });
  }
  const entrepriseId = req.user.entreprise_id;
  if (!entrepriseId) {
    return res.status(400).json({ message: 'Aucune entreprise associée à ce compte' });
  }

  const requetes = {
    clients: ['SELECT * FROM clients WHERE entreprise_id = ?', [entrepriseId]],
    produits: ['SELECT * FROM produits WHERE entreprise_id = ?', [entrepriseId]],
    fournisseurs: ['SELECT * FROM fournisseurs WHERE entreprise_id = ?', [entrepriseId]],
    commandes: [
      `SELECT c.* FROM commandes c JOIN clients cl ON c.client_id = cl.id WHERE cl.entreprise_id = ?`,
      [entrepriseId]
    ]
  };

  const cles = Object.keys(requetes);
  const resultat = {};
  let restantes = cles.length;
  let erreur = null;

  cles.forEach((cle) => {
    const [sql, params] = requetes[cle];
    db.query(sql, params, (err, rows) => {
      if (err) erreur = err;
      resultat[cle] = rows || [];
      restantes -= 1;
      if (restantes === 0) {
        if (erreur) {
          console.error(erreur);
          return res.status(500).json({ message: 'Erreur serveur lors de l\'export' });
        }
        const nomFichier = `export-donnees-erp-${new Date().toISOString().slice(0, 10)}.json`;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${nomFichier}"`);
        res.send(JSON.stringify(resultat, null, 2));
      }
    });
  });
};
