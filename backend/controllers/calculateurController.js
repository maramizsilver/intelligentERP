// backend/controllers/calculateurController.js
const db = require('../config/db');

// ============================================================
// UTILITAIRES
// ============================================================

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
 * Formatte une date en string locale
 */
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR');
}

/**
 * Arrondi à 2 décimales
 */
function arrondir(valeur) {
  return Math.round(valeur * 100) / 100;
}

// ============================================================
// CALCUL - TAUX UNIQUE
// ============================================================

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
    const arrondi = arrondir(resultat);

    // Journalisation (pour traçabilité)
    const sqlLog = `
      INSERT INTO logs_calculs (entreprise_id, utilisateur_id, type_calcul, montant, taux, nb_jours, resultat, details)
      VALUES (?, ?, 'taux_unique', ?, ?, ?, ?, ?)
    `;
    db.query(sqlLog, [
      req.user.entreprise_id,
      req.user.id,
      Number(montant),
      Number(taux),
      nbJours,
      arrondi,
      JSON.stringify({ date_debut, date_fin })
    ], () => {});

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

// ============================================================
// CALCUL - TAUX VARIABLES (MANUEL)
// ============================================================

/**
 * CAS N°2 : Taux variables par période (saisie manuelle)
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
        resultat: arrondir(resultat)
      };
    });

    const total = details.reduce((sum, d) => sum + d.resultat, 0);

    // Journalisation
    const sqlLog = `
      INSERT INTO logs_calculs (entreprise_id, utilisateur_id, type_calcul, montant, nb_jours, resultat, details)
      VALUES (?, ?, 'taux_variables_manuel', ?, ?, ?, ?)
    `;
    db.query(sqlLog, [
      req.user.entreprise_id,
      req.user.id,
      Number(montant),
      details.reduce((sum, d) => sum + d.nbJours, 0),
      arrondir(total),
      JSON.stringify(details)
    ], () => {});

    res.json({
      cas: 'taux_variables_manuel',
      montant: Number(montant),
      base_jours: 365,
      details,
      total_brut: total,
      total: arrondir(total),
      formule: `Σ [ ${montant} × Taux(%) × (NbJours/365) ]`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ============================================================
// CALCUL - TAUX VARIABLES (AUTO DEPUIS BDD)
// ============================================================

/**
 * CAS N°3 : Taux variables par période (chargement automatique depuis BDD)
 * POST /api/calculateur/taux-variables-auto
 * Body: { montant, date_debut, date_fin, categorie, sous_categorie }
 */
exports.calculTauxVariablesAuto = (req, res) => {
  const { montant, date_debut, date_fin, categorie, sous_categorie } = req.body;

  // Validation
  if (!montant || isNaN(montant) || montant <= 0) {
    return res.status(400).json({ message: 'Le montant doit être un nombre positif' });
  }
  if (!date_debut || !date_fin) {
    return res.status(400).json({ message: 'Les dates de début et fin sont requises' });
  }
  if (!categorie) {
    return res.status(400).json({ message: 'La catégorie est requise' });
  }

  // Récupérer les taux de référence depuis la BDD
  let sql = `
    SELECT * FROM taux_reference
    WHERE entreprise_id = ? AND categorie = ? AND actif = TRUE
  `;
  const params = [req.user.entreprise_id, categorie];

  if (sous_categorie) {
    sql += ' AND sous_categorie = ?';
    params.push(sous_categorie);
  }

  sql += ' ORDER BY date_debut ASC';

  db.query(sql, params, (err, tauxRefs) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }

    if (tauxRefs.length === 0) {
      return res.status(404).json({
        message: `Aucun taux de référence trouvé pour la catégorie "${categorie}"`,
        categorie,
        sous_categorie: sous_categorie || null
      });
    }

    try {
      const dateDebut = new Date(date_debut);
      const dateFin = new Date(date_fin);

      // Filtrer les taux qui chevauchent la période demandée
      const tauxApplicables = tauxRefs.filter(t => {
        const tDebut = new Date(t.date_debut);
        const tFin = new Date(t.date_fin);
        return tDebut <= dateFin && tFin >= dateDebut;
      });

      if (tauxApplicables.length === 0) {
        return res.status(404).json({
          message: 'Aucun taux applicable sur la période demandée',
          date_debut,
          date_fin
        });
      }

      const details = tauxApplicables.map((t, index) => {
        // Calculer l'intersection des périodes
        const debut = new Date(Math.max(new Date(date_debut), new Date(t.date_debut)));
        const fin = new Date(Math.min(new Date(date_fin), new Date(t.date_fin)));
        const nbJours = calculerNbJours(debut.toISOString().slice(0, 10), fin.toISOString().slice(0, 10));
        const resultat = Number(montant) * (Number(t.taux) / 100) * (nbJours / 365);

        return {
          periode: index + 1,
          date_debut: formatDate(t.date_debut),
          date_fin: formatDate(t.date_fin),
          date_debut_raw: t.date_debut,
          date_fin_raw: t.date_fin,
          nbJours,
          taux: Number(t.taux),
          reference: t.nom || `Taux #${t.id}`,
          calcul: `${montant} × ${t.taux}% × (${nbJours}/365)`,
          resultat_brut: resultat,
          resultat: arrondir(resultat)
        };
      });

      const total = details.reduce((sum, d) => sum + d.resultat, 0);

      // Journalisation
      const sqlLog = `
        INSERT INTO logs_calculs (entreprise_id, utilisateur_id, type_calcul, montant, nb_jours, resultat, details)
        VALUES (?, ?, 'taux_variables_auto', ?, ?, ?, ?)
      `;
      db.query(sqlLog, [
        req.user.entreprise_id,
        req.user.id,
        Number(montant),
        details.reduce((sum, d) => sum + d.nbJours, 0),
        arrondir(total),
        JSON.stringify({ categorie, sous_categorie, details })
      ], () => {});

      res.json({
        cas: 'taux_variables_auto',
        montant: Number(montant),
        base_jours: 365,
        categorie,
        sous_categorie: sous_categorie || null,
        details,
        total_brut: total,
        total: arrondir(total),
        formule: `Σ [ ${montant} × Taux(%) × (NbJours/365) ]`
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });
};

// ============================================================
// GESTION DES TAUX DE RÉFÉRENCE (CRUD)
// ============================================================

/**
 * Récupérer tous les taux de référence de l'entreprise
 * GET /api/calculateur/taux-reference
 */
exports.getTauxReference = (req, res) => {
  const { categorie, actif } = req.query;
  let sql = 'SELECT * FROM taux_reference WHERE entreprise_id = ?';
  const params = [req.user.entreprise_id];

  if (categorie) {
    sql += ' AND categorie = ?';
    params.push(categorie);
  }
  if (actif !== undefined) {
    sql += ' AND actif = ?';
    params.push(actif === 'true' ? 1 : 0);
  }

  sql += ' ORDER BY categorie, date_debut DESC';

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    res.json({ taux: results });
  });
};

/**
 * Créer un taux de référence
 * POST /api/calculateur/taux-reference
 * Body: { categorie, sous_categorie, nom, date_debut, date_fin, taux, description }
 */
exports.createTauxReference = (req, res) => {
  const { categorie, sous_categorie, nom, date_debut, date_fin, taux, description } = req.body;

  if (!categorie) {
    return res.status(400).json({ message: 'La catégorie est requise' });
  }
  if (!date_debut || !date_fin) {
    return res.status(400).json({ message: 'Les dates de début et fin sont requises' });
  }
  if (!taux || isNaN(taux) || taux < 0) {
    return res.status(400).json({ message: 'Le taux doit être un nombre positif ou nul' });
  }

  const sql = `
    INSERT INTO taux_reference
    (entreprise_id, categorie, sous_categorie, nom, date_debut, date_fin, taux, description, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(sql, [
    req.user.entreprise_id,
    categorie,
    sous_categorie || null,
    nom || null,
    date_debut,
    date_fin,
    Number(taux),
    description || null,
    req.user.id
  ], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    res.status(201).json({ message: 'Taux de référence créé avec succès', id: result.insertId });
  });
};

/**
 * Mettre à jour un taux de référence
 * PUT /api/calculateur/taux-reference/:id
 */
exports.updateTauxReference = (req, res) => {
  const { id } = req.params;
  const { categorie, sous_categorie, nom, date_debut, date_fin, taux, description, actif } = req.body;

  const sql = `
    UPDATE taux_reference SET
      categorie = ?,
      sous_categorie = ?,
      nom = ?,
      date_debut = ?,
      date_fin = ?,
      taux = ?,
      description = ?,
      actif = ?
    WHERE id = ? AND entreprise_id = ?
  `;
  db.query(sql, [
    categorie,
    sous_categorie || null,
    nom || null,
    date_debut,
    date_fin,
    Number(taux),
    description || null,
    actif !== undefined ? (actif ? 1 : 0) : 1,
    id,
    req.user.entreprise_id
  ], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Taux de référence introuvable' });
    }
    res.json({ message: 'Taux de référence mis à jour avec succès' });
  });
};

/**
 * Supprimer un taux de référence
 * DELETE /api/calculateur/taux-reference/:id
 */
exports.deleteTauxReference = (req, res) => {
  const { id } = req.params;

  db.query(
    'DELETE FROM taux_reference WHERE id = ? AND entreprise_id = ?',
    [id, req.user.entreprise_id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erreur serveur' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Taux de référence introuvable' });
      }
      res.json({ message: 'Taux de référence supprimé avec succès' });
    }
  );
};

// ============================================================
// HISTORIQUE DES CALCULS
// ============================================================

/**
 * Récupérer l'historique des calculs
 * GET /api/calculateur/historique
 */
exports.getHistoriqueCalculs = (req, res) => {
  const { limit = 50, offset = 0 } = req.query;

  const sql = `
    SELECT l.*, u.nom, u.prenom
    FROM logs_calculs l
    LEFT JOIN users u ON l.utilisateur_id = u.id
    WHERE l.entreprise_id = ?
    ORDER BY l.created_at DESC
    LIMIT ? OFFSET ?
  `;
  db.query(sql, [req.user.entreprise_id, parseInt(limit), parseInt(offset)], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }

    db.query(
      'SELECT COUNT(*) AS total FROM logs_calculs WHERE entreprise_id = ?',
      [req.user.entreprise_id],
      (err2, countResult) => {
        if (err2) {
          console.error(err2);
          return res.status(500).json({ message: 'Erreur serveur' });
        }
        res.json({
          historique: results,
          total: countResult[0].total,
          limit: parseInt(limit),
          offset: parseInt(offset)
        });
      }
    );
  });
};

// ============================================================
// CALCUL SIMPLE (pour composant réutilisable)
// ============================================================

/**
 * Calcul simple pour composant réutilisable
 * POST /api/calculateur/calcul-simple
 * Body: { montant, taux, nb_jours }
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
    resultat: arrondir(resultat),
    base_jours: 365,
    nb_jours: Number(nb_jours)
  });
};