const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegisterInput({ nom, prenom, email, password }) {
  const errors = [];
  if (!nom || nom.trim().length < 2) errors.push('Le nom est requis (min 2 caractères)');
  if (!prenom || prenom.trim().length < 2) errors.push('Le prénom est requis (min 2 caractères)');
  if (!email || !EMAIL_REGEX.test(email.trim())) errors.push('Email invalide');
  if (!password || password.length < 8) errors.push('Le mot de passe doit contenir au moins 8 caractères');
  return errors;
}

// ============================================================
// INSCRIPTION D'UNE NOUVELLE ENTREPRISE (page publique "Créer mon compte ERP")
// Crée : 1) l'entreprise (statut = en_attente), 2) le rôle "Admin Entreprise",
// 3) le premier utilisateur (l'admin de cette entreprise).
// L'entreprise reste inactive tant que le SuperAdmin ne l'a pas validée
// (cf. schéma : "Validation des inscriptions" côté SuperAdmin).
// ============================================================
exports.registerEntreprise = async (req, res) => {
  const { entreprise_nom, nom, prenom, email, password, plan_type } = req.body;
  const errors = validateRegisterInput({ nom, prenom, email, password });
  if (!entreprise_nom || entreprise_nom.trim().length < 2) {
    errors.push("Le nom de l'entreprise est requis (min 2 caractères)");
  }
  const planChoisi = plan_type === 'payant' ? 'payant' : 'essai'; // essai par défaut
  if (errors.length > 0) {
    return res.status(400).json({ message: 'Données invalides', errors });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const cleanEmail = email.trim().toLowerCase();

    db.query(
      'INSERT INTO entreprises (nom, email, statut, plan_type) VALUES (?, ?, ?, ?)',
      [entreprise_nom.trim(), cleanEmail, 'en_attente', planChoisi],
      (errEnt, resEnt) => {
        if (errEnt) {
          console.error(errEnt);
          return res.status(500).json({ message: 'Erreur serveur' });
        }
        const entrepriseId = resEnt.insertId;

        db.query(
          'INSERT INTO roles (entreprise_id, nom, est_admin_entreprise) VALUES (?, ?, TRUE)',
          [entrepriseId, 'Admin Entreprise'],
          (errRole, resRole) => {
            if (errRole) {
              console.error(errRole);
              db.query('DELETE FROM entreprises WHERE id = ?', [entrepriseId], () => {});
              return res.status(500).json({ message: 'Erreur serveur' });
            }
            const roleId = resRole.insertId;

            db.query(
              'INSERT INTO users (entreprise_id, role_id, nom, prenom, email, password) VALUES (?, ?, ?, ?, ?, ?)',
              [entrepriseId, roleId, nom.trim(), prenom.trim(), cleanEmail, hashedPassword],
              (errUser) => {
                if (errUser) {
                  db.query('DELETE FROM roles WHERE id = ?', [roleId], () => {});
                  db.query('DELETE FROM entreprises WHERE id = ?', [entrepriseId], () => {});
                  if (errUser.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ message: 'Email déjà utilisé' });
                  }
                  console.error(errUser);
                  return res.status(500).json({ message: 'Erreur serveur' });
                }
                res.status(201).json({
                  message: "Inscription envoyée avec succès. Votre entreprise est en attente de validation par l'administrateur de la plateforme."
                });
              }
            );
          }
        );
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ============================================================
// LOGIN UNIQUE — email + mot de passe seulement.
// Le système déduit automatiquement entreprise_id, role_id, is_super_admin, is_external.
// ============================================================
exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe requis' });
  }

  const sql = `
    SELECT u.*, r.nom AS role_nom, e.nom AS entreprise_nom, e.statut AS entreprise_statut,
           e.plan_type, e.connexions_utilisees, e.limite_connexions_essai
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    LEFT JOIN entreprises e ON u.entreprise_id = e.id
    WHERE u.email = ?
  `;
  db.query(sql, [email.trim().toLowerCase()], async (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    if (results.length === 0) return res.status(401).json({ message: 'Email ou mot de passe incorrect' });

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Email ou mot de passe incorrect' });

    // Un compte d'entreprise non-superadmin ne peut se connecter que si son
    // entreprise est active (bloque les comptes en attente de validation ou suspendus)
    if (!user.is_super_admin && user.entreprise_statut !== 'actif') {
      return res.status(403).json({
        message: user.entreprise_statut === 'en_attente'
          ? 'Votre entreprise est en attente de validation par la plateforme'
          : 'Votre entreprise est suspendue, contactez le support'
      });
    }

    // ============================================================
    // GESTION DE L'ESSAI GRATUIT (30 connexions)
    // Ne concerne pas le SuperAdmin (pas d'entreprise) ni les comptes en plan "payant".
    // ============================================================
    let essaiExpire = false;
    let connexionsRestantes = null;
    let messageEssai = null;

    if (!user.is_super_admin && user.plan_type === 'essai') {
      const dejaExpire = user.connexions_utilisees >= user.limite_connexions_essai;

      if (dejaExpire) {
        essaiExpire = true;
        connexionsRestantes = 0;
      } else {
        const nouveauCompteur = user.connexions_utilisees + 1;
        await new Promise((resolve) => {
          db.query('UPDATE entreprises SET connexions_utilisees = ? WHERE id = ?',
            [nouveauCompteur, user.entreprise_id], () => resolve());
        });
        connexionsRestantes = user.limite_connexions_essai - nouveauCompteur;
        essaiExpire = connexionsRestantes <= 0;
        messageEssai = essaiExpire
          ? "C'était votre dernière connexion d'essai gratuite. Vos données sont conservées ; souscrivez à un abonnement pour continuer, ou exportez vos données."
          : `Période d'essai gratuite : il vous reste ${connexionsRestantes} connexion(s) avant l'expiration.`;
      }
    }

    const token = jwt.sign(
      {
        id: user.id,
        entreprise_id: user.entreprise_id,
        role_id: user.role_id,
        is_super_admin: !!user.is_super_admin,
        is_external: !!user.is_external,
        client_id: user.client_id || null,
        essai_expire: essaiExpire
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Connexion réussie',
      messageEssai,
      token,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.is_super_admin ? 'SuperAdmin Plateforme' : user.role_nom,
        entreprise: user.entreprise_nom || null,
        is_super_admin: !!user.is_super_admin,
        is_external: !!user.is_external,
        plan_type: user.plan_type || null,
        essai_expire: essaiExpire,
        connexions_restantes: connexionsRestantes
      }
    });
  });
};

// ============================================================
// ME — utilisateur courant (via token), avec ses infos de rôle/entreprise
// ============================================================
exports.getMe = (req, res) => {
  const sql = `
    SELECT u.id, u.nom, u.prenom, u.email, u.is_super_admin, u.is_external, u.client_id,
           r.id AS role_id, r.nom AS role_nom,
           e.id AS entreprise_id, e.nom AS entreprise_nom
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    LEFT JOIN entreprises e ON u.entreprise_id = e.id
    WHERE u.id = ?
  `;
  db.query(sql, [req.user.id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    if (results.length === 0) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json({ user: results[0] });
  });
};

// ============================================================
// MES PERMISSIONS — utilisé par le frontend pour construire le menu dynamiquement.
// Un SuperAdmin ou un utilisateur externe n'a pas de permissions par module (accès séparé).
// ============================================================
exports.getMesPermissions = (req, res) => {
  if (req.user.is_super_admin || req.user.is_external || !req.user.role_id) {
    return res.json({ permissions: [] });
  }
  const sql = `
    SELECT m.nom AS module_nom, p.consultation, p.creation, p.modification, p.suppression, p.validation, p.export
    FROM permissions p
    JOIN modules m ON p.module_id = m.id
    WHERE p.role_id = ?
  `;
  db.query(sql, [req.user.role_id], (err, results) => {
    if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
    res.json({ permissions: results });
  });
};

// ============================================================
// METTRE À JOUR MON PROPRE PROFIL (nom, prénom, email, mot de passe optionnel)
// ============================================================
exports.updateMe = async (req, res) => {
  const { nom, prenom, email, password } = req.body;
  const errors = [];
  if (!nom || nom.trim().length < 2) errors.push('Le nom est requis (min 2 caractères)');
  if (!prenom || prenom.trim().length < 2) errors.push('Le prénom est requis (min 2 caractères)');
  if (!email || !EMAIL_REGEX.test(email.trim())) errors.push('Email invalide');
  if (password && password.length < 8) errors.push('Le mot de passe doit contenir au moins 8 caractères');
  if (errors.length > 0) {
    return res.status(400).json({ message: 'Données invalides', errors });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    const finaliser = (sql, params) => {
      db.query(sql, params, (err) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Email déjà utilisé' });
          console.error(err);
          return res.status(500).json({ message: 'Erreur serveur' });
        }
        res.json({ message: 'Profil mis à jour avec succès' });
      });
    };

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      finaliser('UPDATE users SET nom = ?, prenom = ?, email = ?, password = ? WHERE id = ?',
        [nom.trim(), prenom.trim(), cleanEmail, hashedPassword, req.user.id]);
    } else {
      finaliser('UPDATE users SET nom = ?, prenom = ?, email = ? WHERE id = ?',
        [nom.trim(), prenom.trim(), cleanEmail, req.user.id]);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ============================================================
// ADMIN ENTREPRISE : lister tous les comptes de son entreprise (internes + externes)
// ============================================================
exports.getUsersEntreprise = (req, res) => {
  const sql = `
    SELECT u.id, u.nom, u.prenom, u.email, u.is_external, u.created_at,
           r.id AS role_id, r.nom AS role_nom
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.entreprise_id = ?
    ORDER BY u.created_at DESC
  `;
  db.query(sql, [req.user.entreprise_id], (err, results) => {
    if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
    res.json({ users: results });
  });
};

// ============================================================
// ADMIN ENTREPRISE : créer un utilisateur INTERNE (collaborateur) avec un rôle
// personnalisé qui doit appartenir à SA PROPRE entreprise.
// ============================================================
exports.createUserByAdmin = async (req, res) => {
  const { nom, prenom, email, password, role_id } = req.body;
  const errors = validateRegisterInput({ nom, prenom, email, password });
  if (!role_id) errors.push('Le rôle est requis');
  if (errors.length > 0) {
    return res.status(400).json({ message: 'Données invalides', errors });
  }

  // Sécurité multi-tenant : le rôle choisi doit appartenir à l'entreprise de l'admin connecté
  db.query(
    'SELECT id FROM roles WHERE id = ? AND entreprise_id = ?',
    [role_id, req.user.entreprise_id],
    async (errCheck, roles) => {
      if (errCheck) {
        console.error(errCheck);
        return res.status(500).json({ message: 'Erreur serveur' });
      }
      if (roles.length === 0) {
        return res.status(400).json({ message: 'Rôle invalide pour votre entreprise' });
      }

      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const cleanEmail = email.trim().toLowerCase();
        db.query(
          'INSERT INTO users (entreprise_id, role_id, nom, prenom, email, password, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [req.user.entreprise_id, role_id, nom.trim(), prenom.trim(), cleanEmail, hashedPassword, req.user.id],
          (err, result) => {
            if (err) {
              if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Email déjà utilisé' });
              console.error(err);
              return res.status(500).json({ message: 'Erreur serveur' });
            }
            console.log(`[AUDIT] Admin id=${req.user.id} a créé le compte ${cleanEmail} (role_id=${role_id})`);
            res.status(201).json({ message: 'Utilisateur créé avec succès', id: result.insertId });
          }
        );
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur' });
      }
    }
  );
};

// ============================================================
// ADMIN ENTREPRISE : créer un compte EXTERNE (portail client/fournisseur),
// toujours lié à une fiche "clients" existante de la même entreprise.
// ============================================================
exports.createExternalUser = async (req, res) => {
  const { nom, prenom, email, password, client_id } = req.body;
  const errors = validateRegisterInput({ nom, prenom, email, password });
  if (!client_id) errors.push('client_id est requis pour un compte externe');
  if (errors.length > 0) {
    return res.status(400).json({ message: 'Données invalides', errors });
  }

  db.query(
    'SELECT id FROM clients WHERE id = ? AND entreprise_id = ?',
    [client_id, req.user.entreprise_id],
    async (errCheck, clients) => {
      if (errCheck) {
        console.error(errCheck);
        return res.status(500).json({ message: 'Erreur serveur' });
      }
      if (clients.length === 0) {
        return res.status(400).json({ message: 'Client introuvable pour votre entreprise' });
      }

      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const cleanEmail = email.trim().toLowerCase();
        db.query(
          'INSERT INTO users (entreprise_id, is_external, nom, prenom, email, password, client_id, created_by) VALUES (?, TRUE, ?, ?, ?, ?, ?, ?)',
          [req.user.entreprise_id, nom.trim(), prenom.trim(), cleanEmail, hashedPassword, client_id, req.user.id],
          (err, result) => {
            if (err) {
              if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Email déjà utilisé' });
              console.error(err);
              return res.status(500).json({ message: 'Erreur serveur' });
            }
            res.status(201).json({ message: 'Compte externe créé avec succès', id: result.insertId });
          }
        );
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur' });
      }
    }
  );
};

// ============================================================
// ADMIN ENTREPRISE : changer le rôle d'un utilisateur interne
// (le rôle doit appartenir à la même entreprise)
// ============================================================
exports.updateUserRole = (req, res) => {
  const { id } = req.params;
  const { role_id } = req.body;

  if (!role_id) {
    return res.status(400).json({ message: 'role_id est requis' });
  }

  db.query(
    'SELECT id FROM roles WHERE id = ? AND entreprise_id = ?',
    [role_id, req.user.entreprise_id],
    (errCheck, roles) => {
      if (errCheck) {
        console.error(errCheck);
        return res.status(500).json({ message: 'Erreur serveur' });
      }
      if (roles.length === 0) {
        return res.status(400).json({ message: 'Rôle invalide pour votre entreprise' });
      }

      db.query(
        'UPDATE users SET role_id = ? WHERE id = ? AND entreprise_id = ?',
        [role_id, id, req.user.entreprise_id],
        (err, result) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erreur serveur' });
          }
          if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Utilisateur introuvable dans votre entreprise' });
          }
          res.json({ message: 'Rôle mis à jour avec succès' });
        }
      );
    }
  );
};
