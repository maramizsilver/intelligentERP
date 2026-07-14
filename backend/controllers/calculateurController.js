// backend/controllers/calculateurController.js
const db = require('../config/db');

/**
 * Calcule le nombre de jours entre deux dates (inclus)
 */
function calculerNbJours(dateDebut, dateFin) {
  const d1 = new Date(dateDebut);
  const d2 = new Date(dateFin);
  const diff = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
  return diff > 0 ? diff : 0;
}

/**
 * Formate une date en string locale
 */
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR');
}

/**
 * CAS N°1 : Taux unique sur toute la période
 * POST /api/calculateur/taux-unique
 * Body: { montant, date_debut, date_fin, taux }
 */
exports.calculTauxUnique = (req, res) => {
  const { montant, date_debut, date_fin, taux } = req.body;

  // Validation
  if (!montant || isNaN(montant) || montant <= 0) {
    return res.status(400).json({ message: 'Le montant doit être un nombre positif' });
  }
  if (!date_debut || !date_fin) {
    return res.status(400).json({ message: 'Les dates de début et fin sont requises' });
  }
  if (!taux || isNaN(taux) || taux < 0) {
    return res.status(400).json({ message: 'Le taux doit être un nombre positif ou nul' });
  }

  try {
    const nbJours = calculerNbJours(date_debut, date_fin);
    const resultat = Number(montant) * (Number(taux) / 100) * (nbJours / 365);
    const arrondi = Math.round(resultat * 100) / 100;

    res.json({
      cas: 'taux_unique',
      montant: Number(montant),
      date_debut: formatDate(date_debut),
      date_fin: formatDate(date_fin),
      date_debut_raw: date_debut,
      date_fin_raw: date_fin,
      taux: Number(taux),
      nbJours,
      resultat_brut: resultat,
      resultat: arrondi,
      formule: `${montant} × ${taux}% × (${nbJours}/365) = ${arrondi}`,
      base_jours: 365
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * CAS N°2 : Taux variables par période
 * POST /api/calculateur/taux-variables
 * Body: { montant, periodes: [{ date_debut, date_fin, taux }] }
 */
exports.calculTauxVariables = (req, res) => {
  const { montant, periodes } = req.body;

  // Validation
  if (!montant || isNaN(montant) || montant <= 0) {
    return res.status(400).json({ message: 'Le montant doit être un nombre positif' });
  }
  if (!Array.isArray(periodes) || periodes.length === 0) {
    return res.status(400).json({ message: 'Au moins une période est requise' });
  }

  try {
    const details = periodes.map((p, index) => {
      const nbJours = calculerNbJours(p.date_debut, p.date_fin);
      const resultat = Number(montant) * (Number(p.taux) / 100) * (nbJours / 365);
      return {
        periode: index + 1,
        date_debut: formatDate(p.date_debut),
        date_fin: formatDate(p.date_fin),
        date_debut_raw: p.date_debut,
        date_fin_raw: p.date_fin,
        nbJours,
        taux: Number(p.taux),
        calcul: `${montant} × ${p.taux}% × (${nbJours}/365)`,
        resultat_brut: resultat,
        resultat: Math.round(resultat * 100) / 100
      };
    });

    const total = details.reduce((sum, d) => sum + d.resultat, 0);
    const totalBrut = details.reduce((sum, d) => sum + d.resultat_brut, 0);

    res.json({
      cas: 'taux_variables',
      montant: Number(montant),
      base_jours: 365,
      details,
      total_brut: totalBrut,
      total: Math.round(total * 100) / 100,
      formule: `Σ [ ${montant} × Taux(%) × (NbJours/365) ]`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * Calcul simple pour composant réutilisable
 */
exports.calculSimple = (req, res) => {
  const { montant, taux, nb_jours } = req.body;

  if (!montant || isNaN(montant) || montant <= 0) {
    return res.status(400).json({ message: 'Montant invalide' });
  }
  if (!taux || isNaN(taux) || taux < 0) {
    return res.status(400).json({ message: 'Taux invalide' });
  }
  if (!nb_jours || isNaN(nb_jours) || nb_jours <= 0) {
    return res.status(400).json({ message: 'Nombre de jours invalide' });
  }

  const resultat = Number(montant) * (Number(taux) / 100) * (Number(nb_jours) / 365);
  res.json({
    resultat: Math.round(resultat * 100) / 100,
    base_jours: 365,
    nb_jours: Number(nb_jours)
  });
};