// backend/controllers/entrepriseController.js
const db = require('../config/db');
const { reparerPermissionsManquantes } = require('../services/permissions.service');

// Récupérer toutes les entreprises
exports.getAllEntreprises = async (req, res) => {
  try {
    const [rows] = await db.promisePoolMaster.query(`
      SELECT e.*, 
             COUNT(DISTINCT u.id) as nb_users
      FROM entreprises e
      LEFT JOIN users u ON e.id = u.entreprise_id
      GROUP BY e.id
    `);
    res.json({ entreprises: rows });
  } catch (err) {
    console.error('Erreur getAllEntreprises:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer une entreprise par ID
exports.getEntrepriseById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.promisePoolMaster.query(
      'SELECT * FROM entreprises WHERE id = ?',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Entreprise non trouvée' });
    }
    res.json({ entreprise: rows[0] });
  } catch (err) {
    console.error('Erreur getEntrepriseById:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Valider une entreprise (passer de en_attente à actif)
exports.validerEntreprise = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.promisePoolMaster.query(
      'UPDATE entreprises SET statut = "actif" WHERE id = ?',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Entreprise non trouvée' });
    }
    res.json({ message: 'Entreprise validée avec succès' });
  } catch (err) {
    console.error('Erreur validerEntreprise:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Suspendre une entreprise
exports.suspendreEntreprise = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.promisePoolMaster.query(
      'UPDATE entreprises SET statut = "suspendu" WHERE id = ?',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Entreprise non trouvée' });
    }
    res.json({ message: 'Entreprise suspendue avec succès' });
  } catch (err) {
    console.error('Erreur suspendreEntreprise:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Passer une entreprise en payant
exports.passerEnPayant = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.promisePoolMaster.query(
      'UPDATE entreprises SET plan_type = "payant", statut = "actif" WHERE id = ?',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Entreprise non trouvée' });
    }
    res.json({ message: 'Entreprise passée en plan payant avec succès' });
  } catch (err) {
    console.error('Erreur passerEnPayant:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprimer une entreprise
exports.deleteEntreprise = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.promisePoolMaster.query(
      'DELETE FROM entreprises WHERE id = ?',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Entreprise non trouvée' });
    }
    res.json({ message: 'Entreprise supprimée avec succès' });
  } catch (err) {
    console.error('Erreur deleteEntreprise:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

//  Réparer les permissions manquantes d'une entreprise
exports.reparerPermissions = async (req, res) => {
  const { id } = req.params;

  try {
    // Vérifier que l'entreprise existe
    const [rows] = await db.promisePoolMaster.query(
      'SELECT db_name FROM entreprises WHERE id = ?',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Entreprise introuvable' });
    }

    // Récupérer la connexion vers la base tenant
    const clientPool = db.getClientPool(id, rows[0].db_name);
    
    // Lancer la réparation
    const resultat = await reparerPermissionsManquantes(clientPool);

    res.json({
      message: ` Permissions réparées : ${resultat.lignesAjoutees} ligne(s) ajoutée(s)`,
      ...resultat
    });
  } catch (err) {
    console.error('Erreur reparerPermissions:', err);
    res.status(500).json({ message: 'Erreur lors de la réparation des permissions' });
  }
};