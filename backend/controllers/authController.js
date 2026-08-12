const databaseService = require('../services/database.service');
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const MFAService = require('../services/mfa.service');
const mfaConfig = require('../config/mfa.config');
const SessionService = require('../services/session.service');
const AuditService = require('../services/audit.service');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegisterInput({ nom, prenom, email, password }) {
    const errors = [];
    if (!nom || nom.trim().length < 2) errors.push('Le nom est requis (min 2 caracteres)');
    if (!prenom || prenom.trim().length < 2) errors.push('Le prenom est requis (min 2 caracteres)');
    if (!email || !EMAIL_REGEX.test(email.trim())) errors.push('Email invalide');
    if (!password || password.length < 8) errors.push('Le mot de passe doit contenir au moins 8 caracteres');
    return errors;
}

// findUserByEmail - SUPPRESSION du LEFT JOIN roles
async function findUserByEmail(email) {
    const cleanEmail = email.trim().toLowerCase();
    
    const [superAdmins] = await db.promisePoolMaster.query(
        'SELECT * FROM users WHERE is_super_admin = 1 AND email = ?',
        [cleanEmail]
    );
    
    if (superAdmins.length > 0) {
        return superAdmins[0];
    }
    
    const [allUsers] = await db.promisePoolMaster.query(
        `SELECT u.*, e.nom AS entreprise_nom, 
                e.statut AS entreprise_statut, e.plan_type, 
                e.connexions_utilisees, e.limite_connexions_essai, e.db_name
         FROM users u
         LEFT JOIN entreprises e ON u.entreprise_id = e.id
         WHERE u.is_super_admin = 0`
    );
    
    for (const user of allUsers) {
        if (user.email === cleanEmail) {
            return user;
        }
    }
    return null;
}

async function findTenantUserByEmail(clientPool, email) {
    const cleanEmail = email.trim().toLowerCase();
    const [tenantUsers] = await clientPool.promise().query('SELECT * FROM users');
    for (const user of tenantUsers) {
        if (user.email === cleanEmail) {
            return user;
        }
    }
    return null;
}

exports.registerEntreprise = async (req, res) => {
    const { entreprise_nom, nom, prenom, email, password, plan_type } = req.body;
    const errors = validateRegisterInput({ nom, prenom, email, password });
    if (!entreprise_nom || entreprise_nom.trim().length < 2) {
        errors.push("Le nom de l'entreprise est requis (min 2 caracteres)");
    }
    const planChoisi = plan_type === 'payant' ? 'payant' : 'essai';
    if (errors.length > 0) {
        return res.status(400).json({ message: 'Donnees invalides', errors });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const cleanEmail = email.trim().toLowerCase();

        const [result] = await db.promisePoolMaster.query(
            'INSERT INTO entreprises (nom, email, statut, plan_type) VALUES (?, ?, ?, ?)',
            [entreprise_nom.trim(), cleanEmail, 'en_attente', planChoisi]
        );
        const entrepriseId = result.insertId;

        const dbName = databaseService.generateDbName(entreprise_nom, entrepriseId);
        await databaseService.createTenantDatabase(entrepriseId, dbName);

        await db.promisePoolMaster.query(
            'UPDATE entreprises SET db_name = ? WHERE id = ?',
            [dbName, entrepriseId]
        );

        const clientPool = db.getClientPool(entrepriseId, dbName);
        const [roleResult] = await clientPool.promise().query(
            'INSERT INTO roles (nom, est_admin_entreprise) VALUES (?, TRUE)',
            ['Admin Entreprise']
        );
        const roleId = roleResult.insertId;

        await clientPool.promise().query(
            `INSERT INTO permissions (role_id, module_id, consultation, creation, modification, suppression, validation, export)
             SELECT ?, m.id, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE
             FROM modules m`,
            [roleId]
        );

        await clientPool.promise().query(
            'INSERT INTO users (role_id, nom, prenom, email, password) VALUES (?, ?, ?, ?, ?)',
            [
                roleId,
                nom.trim(),
                prenom.trim(),
                cleanEmail,
                hashedPassword
            ]
        );

        await db.promisePoolMaster.query(
            `INSERT INTO users (entreprise_id, role_id, nom, prenom, email, password, is_super_admin, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                entrepriseId,
                roleId,
                nom.trim(),
                prenom.trim(),
                cleanEmail,
                hashedPassword,
                0
            ]
        );

        try {
            await clientPool.promise().query(
                `INSERT INTO taux_reference_central 
                 (categorie, sous_categorie, nom, description, taux, date_debut, date_fin, actif, version, created_by, created_at)
                 SELECT 
                    categorie, sous_categorie, nom, description, taux, date_debut, date_fin, actif, version, created_by, NOW()
                 FROM erp_db.taux_reference_central
                 WHERE actif = 1`
            );
            console.log('Taux de reference copies pour entreprise', entrepriseId);
        } catch (copyErr) {
            console.error('Erreur copie des taux de reference:', copyErr);
        }

        res.status(201).json({
            message: "Inscription reussie. Votre entreprise est en attente de validation par l'administrateur de la plateforme.",
            entreprise_id: entrepriseId
        });

    } catch (err) {
        console.error('Erreur inscription:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Email deja utilise' });
        }
        res.status(500).json({ message: 'Erreur serveur' });
    }
};
 //Recherche de comptes pour déverrouillage (KYC)
exports.searchUsersForUnlock = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim().length < 2) {
            return res.json({ users: [] });
        }

        const terme = q.trim();
        const like = `%${terme}%`;
        const idRecherche = /^\d+$/.test(terme) ? Number(terme) : 0;

        const [rows] = await db.promisePoolMaster.query(
            `SELECT u.id, u.nom, u.prenom, u.email, u.telephone,
                    u.is_account_locked, u.account_lock_reason, u.lock_expires_at,
                    u.last_login, u.created_at,
                    e.id AS entreprise_id, e.nom AS entreprise_nom, e.statut AS entreprise_statut
             FROM users u
             LEFT JOIN entreprises e ON u.entreprise_id = e.id
             WHERE u.is_super_admin = 0
               AND (u.nom LIKE ? OR u.prenom LIKE ? OR u.email LIKE ? OR u.id = ?)
             ORDER BY u.is_account_locked DESC, u.nom ASC, u.prenom ASC
             LIMIT 20`,
            [like, like, like, idRecherche]
        );

        res.json({ users: rows });
    } catch (err) {
        console.error('Erreur searchUsersForUnlock:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// exports.login - Récupération du vrai nom du rôle
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    const cleanEmail = email.trim().toLowerCase();

    try {
        console.log('[LOGIN] Tentative de connexion pour:', cleanEmail);
        
        const user = await findUserByEmail(cleanEmail);

        if (!user) {
            console.log('[LOGIN] Utilisateur non trouve');
            await db.promisePoolMaster.query(
                `INSERT INTO audit_connexions 
                 (utilisateur_id, email, ip, user_agent, status, created_at) 
                 VALUES (NULL, ?, ?, ?, 'failed', NOW())`,
                [cleanEmail, req.ip || req.connection.remoteAddress, req.headers['user-agent']]
            );
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        console.log('[LOGIN] Utilisateur trouve ID:', user.id);

        if (user.is_super_admin) {
            console.log('[LOGIN] SuperAdmin - Verification mot de passe');
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                await db.promisePoolMaster.query(
                    `INSERT INTO audit_connexions 
                     (utilisateur_id, email, ip, user_agent, status, created_at) 
                     VALUES (NULL, ?, ?, ?, 'failed', NOW())`,
                    [cleanEmail, req.ip || req.connection.remoteAddress, req.headers['user-agent']]
                );
                return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
            }

            await db.promisePoolMaster.query(
                `INSERT INTO audit_connexions 
                 (utilisateur_id, email, ip, user_agent, status, created_at) 
                 VALUES (?, ?, ?, ?, 'success', NOW())`,
                [user.id, cleanEmail, req.ip || req.connection.remoteAddress, req.headers['user-agent']]
            );

            const token = jwt.sign(
                {
                    id: user.id,
                    is_super_admin: true,
                    entreprise_id: null,
                    db_name: null,
                    mfa_verified: true
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            return res.json({
                message: 'Connexion reussie',
                token,
                user: {
                    id: user.id,
                    nom: user.nom || 'SuperAdmin',
                    prenom: user.prenom || '',
                    email: cleanEmail,
                    role: 'SuperAdmin Plateforme',
                    is_super_admin: true,
                    is_external: false,
                    mfa_enabled: false,
                    plan_type: 'payant',
                    entreprise: 'Plateforme'
                }
            });
        }

        if (!user.entreprise_id || !user.db_name) {
            console.error('[LOGIN] Configuration utilisateur incomplete:', {
                user_id: user.id,
                email: user.email,
                entreprise_id: user.entreprise_id,
                db_name: user.db_name
            });
            return res.status(500).json({
                message: 'Configuration de l\'utilisateur incomplete. Contactez le support.'
            });
        }

        if (user.locked_until && new Date(user.locked_until) > new Date()) {
            console.log('[LOGIN] Compte bloque jusqu\'a:', user.locked_until);
            return res.status(403).json({
                message: 'Compte bloque. Reessayez plus tard.',
                locked_until: user.locked_until,
                remaining_minutes: Math.ceil((new Date(user.locked_until) - new Date()) / 60000)
            });
        }

        console.log('[LOGIN] Verification du verrouillage de compte pour user:', user.id);
        const accountLock = await SessionService.isAccountLocked(user.id);
        if (accountLock.locked) {
            console.log('[LOGIN] ERREUR: Compte verrouille pour user:', user.id);
            return res.status(423).json({
                message: 'Compte verrouille pour des raisons de securite. Contactez le support.',
                code: 'ACCOUNT_LOCKED',
                reason: accountLock.reason,
                expires_at: accountLock.expires_at
            });
        }

        const clientPool = db.getClientPool(user.entreprise_id, user.db_name);
        const tenantUser = await findTenantUserByEmail(clientPool, cleanEmail);

        if (!tenantUser) {
            console.log('[LOGIN] Utilisateur tenant non trouve');
            await db.promisePoolMaster.query(
                `INSERT INTO audit_connexions 
                 (utilisateur_id, email, ip, user_agent, status, created_at) 
                 VALUES (NULL, ?, ?, ?, 'failed', NOW())`,
                [cleanEmail, req.ip || req.connection.remoteAddress, req.headers['user-agent']]
            );
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        console.log('[LOGIN] Utilisateur tenant trouve ID:', tenantUser.id);

        const isMatch = await bcrypt.compare(password, tenantUser.password);
        
        if (!isMatch) {
            console.log('[LOGIN] Mot de passe incorrect');
            const attempts = (tenantUser.login_attempts || 0) + 1;
            let lockedUntil = null;
            let remainingAttempts = 5 - attempts;
            
            if (attempts >= 5) {
                lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
                remainingAttempts = 0;
                console.log('[LOGIN] Compte bloque apres 5 tentatives');
            }
            
            await clientPool.promise().query(
                'UPDATE users SET login_attempts = ?, locked_until = ? WHERE id = ?',
                [attempts, lockedUntil, tenantUser.id]
            );
            
            await db.promisePoolMaster.query(
                `INSERT INTO audit_connexions 
                 (utilisateur_id, email, ip, user_agent, status, created_at) 
                 VALUES (NULL, ?, ?, ?, 'failed', NOW())`,
                [cleanEmail, req.ip || req.connection.remoteAddress, req.headers['user-agent']]
            );
            
            return res.status(401).json({
                message: 'Email ou mot de passe incorrect',
                attempts_remaining: remainingAttempts,
                locked: lockedUntil !== null,
                locked_until: lockedUntil
            });
        }

        console.log('[LOGIN] Mot de passe correct');

        await clientPool.promise().query(
            'UPDATE users SET login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = ?',
            [tenantUser.id]
        );

        let mfaEnabled = false;
        try {
            const [mfaResult] = await clientPool.promise().query(
                'SELECT mfa_enabled FROM users WHERE id = ?',
                [tenantUser.id]
            );
            mfaEnabled = mfaResult.length > 0 && mfaResult[0].mfa_enabled === 1;
        } catch (err) {
            console.error('[MFA] Erreur recuperation statut:', err);
            mfaEnabled = false;
        }

        if (mfaEnabled) {
            console.log('[LOGIN] MFA active pour l\'utilisateur');
            const [lockRows] = await clientPool.promise().query(
                'SELECT mfa_locked_until FROM users WHERE id = ?',
                [tenantUser.id]
            );

            if (lockRows.length && lockRows[0].mfa_locked_until) {
                const lockStatus = MFAService.isMFALocked(lockRows[0]);
                if (lockStatus.locked) {
                    return res.status(403).json({
                        success: false,
                        message: 'Compte verrouille pour MFA. Reessayez dans ' + lockStatus.remainingMinutes + ' minute(s).',
                        locked_until: lockRows[0].mfa_locked_until
                    });
                }
            }

            const tempToken = jwt.sign(
                {
                    id: tenantUser.id,
                    mfa_pending: true,
                    entreprise_id: user.entreprise_id,
                    db_name: user.db_name
                },
                process.env.JWT_SECRET,
                { expiresIn: '5m' }
            );

            return res.status(200).json({
                success: true,
                message: 'MFA requise',
                mfa_required: true,
                temp_token: tempToken,
                user: {
                    id: tenantUser.id,
                    email: cleanEmail,
                    nom: user.nom,
                    prenom: user.prenom
                }
            });
        }

        if (user.entreprise_statut !== 'actif') {
            console.log('[LOGIN] Entreprise non active:', user.entreprise_statut);
            return res.status(403).json({
                message: user.entreprise_statut === 'en_attente'
                    ? 'Votre entreprise est en attente de validation'
                    : 'Votre entreprise est suspendue'
            });
        }

        let essaiExpire = false;
        let connexionsRestantes = null;
        let messageEssai = null;

        if (user.plan_type === 'essai') {
            const dejaExpire = user.connexions_utilisees >= user.limite_connexions_essai;

            if (dejaExpire) {
                essaiExpire = true;
                connexionsRestantes = 0;
            } else {
                const nouveauCompteur = user.connexions_utilisees + 1;
                await db.promisePoolMaster.query(
                    'UPDATE entreprises SET connexions_utilisees = ? WHERE id = ?',
                    [nouveauCompteur, user.entreprise_id]
                );
                connexionsRestantes = user.limite_connexions_essai - nouveauCompteur;
                essaiExpire = connexionsRestantes <= 0;
                messageEssai = essaiExpire
                    ? "C'etait votre derniere connexion d'essai gratuite."
                    : 'Il vous reste ' + connexionsRestantes + ' connexion(s) avant l\'expiration.';
            }
        }

        // RÉCUPÉRATION DU VRAI NOM DU RÔLE DEPUIS LA BASE TENANT
        let roleNom = 'Utilisateur';
        
        if (!user.is_super_admin && user.entreprise_id && user.db_name && user.role_id) {
            try {
                const clientPoolRole = db.getClientPool(user.entreprise_id, user.db_name);
                const [roleRows] = await clientPoolRole.promise().query(
                    'SELECT nom FROM roles WHERE id = ?',
                    [user.role_id]
                );
                if (roleRows.length > 0) {
                    roleNom = roleRows[0].nom;
                }
            } catch (err) {
                console.error('[LOGIN] Erreur récupération nom du rôle:', err.message);
            }
        }

        const token = jwt.sign(
            {
                id: user.id,
                entreprise_id: user.entreprise_id,
                role_id: user.role_id,
                is_super_admin: false,
                is_entreprise_admin: user.is_entreprise_admin || false,
                is_external: user.is_external || false,
                client_id: user.client_id || null,
                essai_expire: essaiExpire,
                db_name: user.db_name,
                mfa_verified: true
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('[LOGIN] Token JWT genere');

        try {
            const clientPoolSession = db.getClientPool(user.entreprise_id, user.db_name);
            console.log('[LOGIN] Enregistrement de la connexion...');
            const result = await SessionService.recordConnection(
                clientPoolSession,
                { id: user.id },
                token,
                req,
                req.body.device_info || {}  
            );
            console.log('[LOGIN] Connexion enregistree - Session ID:', result.sessionId);
            if (result.previousSessionCount > 0) {
                console.log('[SESSION] ' + user.email + ' - ' + result.previousSessionCount + ' ancienne(s) session(s) deconnectee(s)');
            }
        } catch (err) {
            console.error('[SESSION] Erreur:', err.message);
            if (err.message === 'DEVICE_BLOCKED') {
                return res.status(403).json({
                    message: 'Appareil bloque. Contactez votre administrateur.',
                    code: 'DEVICE_BLOCKED'
                });
            }
        }

        await db.promisePoolMaster.query(
            `INSERT INTO audit_connexions 
             (utilisateur_id, email, ip, user_agent, status, created_at) 
             VALUES (?, ?, ?, ?, 'success', NOW())`,
            [user.id, cleanEmail, req.ip || req.connection.remoteAddress, req.headers['user-agent']]
        );

        // CONSTRUCTION DES DONNÉES UTILISATEUR AVEC LE VRAI NOM DU RÔLE
        const userData = {
            id: user.id,
            nom: user.nom || '',
            prenom: user.prenom || '',
            email: cleanEmail,
            role: roleNom,  
            entreprise: user.entreprise_nom || null,
            is_super_admin: false,
            is_entreprise_admin: user.is_entreprise_admin || false,
            is_external: user.is_external || false,
            plan_type: user.plan_type || null,
            essai_expire: essaiExpire,
            connexions_restantes: connexionsRestantes,
            mfa_enabled: mfaEnabled
        };

        console.log('[LOGIN] Connexion reussie pour:', cleanEmail);
        res.json({
            message: 'Connexion reussie',
            messageEssai,
            token,
            user: userData
        });

    } catch (err) {
        console.error('[LOGIN] Erreur:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.logout = async (req, res) => {
    try {
        const userId = req.user.id;
        const email = req.user.email;
        
        await db.promisePoolMaster.query(
            `INSERT INTO audit_connexions 
             (utilisateur_id, email, ip, user_agent, status, created_at) 
             VALUES (?, ?, ?, ?, 'deconnexion', NOW())`,
            [userId, email, req.ip || req.connection.remoteAddress, req.headers['user-agent']]
        );
        
        await SessionService.logoutAllSessions(userId);
        
        res.json({ message: 'Deconnexion reussie' });
    } catch (err) {
        console.error('Erreur logout:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const [rows] = await db.promisePoolMaster.query(
            `SELECT u.id, u.nom, u.prenom, u.email, u.is_super_admin, u.is_external, u.client_id,
                    u.role_id, u.mfa_enabled,
                    e.id AS entreprise_id, e.nom AS entreprise_nom
             FROM users u
             LEFT JOIN entreprises e ON u.entreprise_id = e.id
             WHERE u.id = ? AND u.entreprise_id = ?`,
            [req.user.id, req.user.entreprise_id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }
        
        res.json({ user: rows[0] });
    } catch (err) {
        console.error('Erreur getMe:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// getMesPermissions 
exports.getMesPermissions = (req, res) => {
    const db = req.db;

    // SuperAdmin et comptes externes : pas de permissions à afficher
    if (req.user.is_super_admin || req.user.is_external || !req.user.role_id) {
        return res.json({ permissions: [] });
    }

    // Vérifier si le rôle est Admin Entreprise
    db.query(
        'SELECT est_admin_entreprise FROM roles WHERE id = ?',
        [req.user.role_id],
        (errRole, roleRows) => {
            if (errRole) {
                console.error('Erreur getMesPermissions - verification role:', errRole);
                return res.status(500).json({ message: 'Erreur serveur' });
            }

            if (roleRows.length === 0) {
                return res.json({ permissions: [] });
            }

            // Admin Entreprise => accès total
            if (roleRows[0].est_admin_entreprise) {
                db.query('SELECT nom FROM modules ORDER BY nom', (errMod, modules) => {
                    if (errMod) {
                        console.error('Erreur getMesPermissions - modules:', errMod);
                        return res.status(500).json({ message: 'Erreur serveur' });
                    }
                    const permissions = modules.map(m => ({
                        module_nom: m.nom,
                        consultation: true,
                        creation: true,
                        modification: true,
                        suppression: true,
                        validation: true,
                        export: true
                    }));
                    return res.json({ permissions });
                });
                return;
            }

            // 3. Rôle normal => lecture classique
            const sql = `
                SELECT m.nom AS module_nom, p.consultation, p.creation, p.modification, p.suppression, p.validation, p.export
                FROM permissions p
                JOIN modules m ON p.module_id = m.id
                WHERE p.role_id = ?
                ORDER BY m.nom
            `;
            db.query(sql, [req.user.role_id], (err, results) => {
                if (err) {
                    console.error('Erreur getMesPermissions:', err);
                    return res.status(500).json({ message: 'Erreur serveur' });
                }
                res.json({ permissions: results });
            });
        }
    );
};

exports.updateMe = async (req, res) => {
    try {
        const { nom, prenom, email, password } = req.body;
        const errors = [];
        if (!nom || nom.trim().length < 2) errors.push('Le nom est requis (min 2 caracteres)');
        if (!prenom || prenom.trim().length < 2) errors.push('Le prenom est requis (min 2 caracteres)');
        if (!email || !EMAIL_REGEX.test(email.trim())) errors.push('Email invalide');
        if (password && password.length < 8) errors.push('Le mot de passe doit contenir au moins 8 caracteres');
        if (errors.length > 0) {
            return res.status(400).json({ message: 'Donnees invalides', errors });
        }

        const cleanEmail = email.trim().toLowerCase();
        const clientPool = db.getClientPool(req.user.entreprise_id, req.user.db_name);
        
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await db.promisePoolMaster.query(
                'UPDATE users SET nom = ?, prenom = ?, email = ?, password = ? WHERE id = ? AND entreprise_id = ?',
                [nom.trim(), prenom.trim(), cleanEmail, hashedPassword, req.user.id, req.user.entreprise_id]
            );
            await clientPool.promise().query(
                'UPDATE users SET nom = ?, prenom = ?, email = ?, password = ? WHERE id = ?',
                [nom.trim(), prenom.trim(), cleanEmail, hashedPassword, req.user.id]
            );
        } else {
            await db.promisePoolMaster.query(
                'UPDATE users SET nom = ?, prenom = ?, email = ? WHERE id = ? AND entreprise_id = ?',
                [nom.trim(), prenom.trim(), cleanEmail, req.user.id, req.user.entreprise_id]
            );
            await clientPool.promise().query(
                'UPDATE users SET nom = ?, prenom = ?, email = ? WHERE id = ?',
                [nom.trim(), prenom.trim(), cleanEmail, req.user.id]
            );
        }

        res.json({ message: 'Profil mis a jour avec succes' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Email deja utilise' });
        }
        console.error('Erreur updateMe:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.getUsersEntreprise = async (req, res) => {
    try {
        if (!req.user || !req.user.entreprise_id) {
            console.error('[getUsersEntreprise] Utilisateur ou entreprise_id manquant');
            return res.status(400).json({ message: 'Entreprise non identifiée' });
        }

        const entrepriseId = req.user.entreprise_id;
        console.log('[getUsersEntreprise] Recherche pour entreprise_id:', entrepriseId);

        const [rows] = await db.promisePoolMaster.query(
            `SELECT id, nom, prenom, email, is_external, created_at, role_id
             FROM users
             WHERE entreprise_id = ?
             ORDER BY created_at DESC`,
            [entrepriseId]
        );

        console.log('[getUsersEntreprise] Utilisateurs trouvés:', rows.length);

        if (rows.length === 0) {
            return res.json({ users: [] });
        }

        let roleNames = {};
        try {
            const clientPool = db.getClientPool(entrepriseId, req.user.db_name);
            const [roles] = await clientPool.promise().query('SELECT id, nom FROM roles');
            roles.forEach(r => { roleNames[r.id] = r.nom; });
        } catch (err) {
            console.error('[getUsersEntreprise] Erreur récupération rôles tenant:', err.message);
        }

        const users = rows.map(u => ({
            ...u,
            role_nom: roleNames[u.role_id] || 'Sans rôle'
        }));

        res.json({ users });

    } catch (err) {
        console.error('[getUsersEntreprise] Erreur:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.createUserByAdmin = async (req, res) => {
    const { nom, prenom, email, password, role_id, telephone, matricule, fonction, service } = req.body;
    
    const errors = validateRegisterInput({ nom, prenom, email, password });
    if (!role_id) errors.push('Le role est requis');
    if (errors.length > 0) {
        return res.status(400).json({ message: 'Donnees invalides', errors });
    }

    try {
        const clientPool = db.getClientPool(req.user.entreprise_id, req.user.db_name);
        
        const [roleCheck] = await clientPool.promise().query(
            'SELECT id FROM roles WHERE id = ?',
            [role_id]
        );
        
        if (roleCheck.length === 0) {
            return res.status(400).json({ message: 'Role invalide pour votre entreprise' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const cleanEmail = email.trim().toLowerCase();

        const [masterResult] = await db.promisePoolMaster.query(
            `INSERT INTO users 
             (entreprise_id, role_id, nom, prenom, telephone, matricule, fonction, service, email, password, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [req.user.entreprise_id, role_id, nom.trim(), prenom.trim(), 
             telephone || null, matricule || null, fonction || null, service || null,
             cleanEmail, hashedPassword]
        );

        await clientPool.promise().query(
            `INSERT INTO users 
             (id, role_id, nom, prenom, telephone, matricule, fonction, service, email, password, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [masterResult.insertId, role_id, nom.trim(), prenom.trim(),
             telephone || null, matricule || null, fonction || null, service || null,
             cleanEmail, hashedPassword, req.user.id]
        );

        console.log('[AUDIT] Admin id=' + req.user.id + ' a cree le compte ' + cleanEmail + ' (role_id=' + role_id + ')');
        res.status(201).json({ message: 'Utilisateur cree avec succes', id: masterResult.insertId });

    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Email deja utilise' });
        }
        console.error('Erreur createUserByAdmin:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.createExternalUser = async (req, res) => {
    const { nom, prenom, email, password, client_id } = req.body;
    
    const errors = validateRegisterInput({ nom, prenom, email, password });
    if (!client_id) errors.push('client_id est requis pour un compte externe');
    if (errors.length > 0) {
        return res.status(400).json({ message: 'Donnees invalides', errors });
    }

    try {
        const clientPool = db.getClientPool(req.user.entreprise_id, req.user.db_name);
        
        const [clientCheck] = await clientPool.promise().query(
            'SELECT id FROM clients WHERE id = ?',
            [client_id]
        );
        
        if (clientCheck.length === 0) {
            return res.status(400).json({ message: 'Client introuvable pour votre entreprise' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const cleanEmail = email.trim().toLowerCase();

        const [masterResult] = await db.promisePoolMaster.query(
            `INSERT INTO users 
             (entreprise_id, nom, prenom, email, password, is_external, client_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [req.user.entreprise_id, nom.trim(), prenom.trim(), cleanEmail, hashedPassword, 1, client_id]
        );

        await clientPool.promise().query(
            `INSERT INTO users 
             (id, is_external, nom, prenom, email, password, client_id, created_by)
             VALUES (?, TRUE, ?, ?, ?, ?, ?, ?)`,
            [masterResult.insertId, nom.trim(), prenom.trim(), cleanEmail, hashedPassword, client_id, req.user.id]
        );

        console.log('[AUDIT] Admin id=' + req.user.id + ' a cree le compte externe ' + cleanEmail + ' (client_id=' + client_id + ')');
        res.status(201).json({ message: 'Compte externe cree avec succes', id: masterResult.insertId });

    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Email deja utilise' });
        }
        console.error('Erreur createExternalUser:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.updateUserRole = async (req, res) => {
    const { id } = req.params;
    const { role_id } = req.body;
    
    if (!role_id) {
        return res.status(400).json({ message: 'role_id est requis' });
    }

    try {
        const clientPool = db.getClientPool(req.user.entreprise_id, req.user.db_name);
        
        const [roleCheck] = await clientPool.promise().query(
            'SELECT id FROM roles WHERE id = ?',
            [role_id]
        );
        
        if (roleCheck.length === 0) {
            return res.status(400).json({ message: 'Role invalide pour votre entreprise' });
        }

        await db.promisePoolMaster.query(
            'UPDATE users SET role_id = ? WHERE id = ? AND entreprise_id = ?',
            [role_id, id, req.user.entreprise_id]
        );

        await clientPool.promise().query(
            'UPDATE users SET role_id = ? WHERE id = ?',
            [role_id, id]
        );

        res.json({ message: 'Role mis a jour avec succes' });
    } catch (err) {
        console.error('Erreur updateUserRole:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};


exports.deleteUser = async (req, res) => {
    const { id } = req.params;

    if (Number(id) === req.user.id) {
        return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    try {
        const clientPool = db.getClientPool(req.user.entreprise_id, req.user.db_name);
        
        const [infoRows] = await clientPool.promise().query(
            `SELECT u.id, r.est_admin_entreprise
             FROM users u
             LEFT JOIN roles r ON u.role_id = r.id
             WHERE u.id = ?`,
            [id]
        );
        
        if (infoRows.length === 0) {
            return res.status(404).json({ message: 'Utilisateur introuvable dans votre entreprise' });
        }

        const cible = infoRows[0];

        if (cible.est_admin_entreprise) {
            const [countRows] = await clientPool.promise().query(
                `SELECT COUNT(*) AS total
                 FROM users u
                 JOIN roles r ON u.role_id = r.id
                 WHERE r.est_admin_entreprise = TRUE`,
                []
            );
            
            if (countRows[0].total <= 1) {
                return res.status(400).json({ message: 'Impossible de supprimer le dernier compte Admin Entreprise' });
            }
        }

        await db.promisePoolMaster.query(
            'DELETE FROM users WHERE id = ? AND entreprise_id = ?',
            [id, req.user.entreprise_id]
        );

        // Supprimer de la base TENANT
        await clientPool.promise().query(
            'DELETE FROM users WHERE id = ?',
            [id]
        );

        console.log('[AUDIT] Admin id=' + req.user.id + ' a supprime le compte id=' + id);
        res.json({ message: 'Utilisateur supprime avec succes' });

    } catch (err) {
        console.error('Erreur deleteUser:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.getUserStats = async (req, res) => {
    try {
        let roleNames = {};
        try {
            const clientPool = db.getClientPool(req.user.entreprise_id, req.user.db_name);
            const [roles] = await clientPool.promise().query('SELECT id, nom FROM roles');
            roles.forEach(r => { roleNames[r.id] = r.nom; });
        } catch (err) {
            console.error('[getUserStats] Erreur récupération rôles tenant:', err.message);
        }

        const [statsRows] = await db.promisePoolMaster.query(
            `SELECT u.role_id, COUNT(*) AS total
             FROM users u
             WHERE u.entreprise_id = ?
             GROUP BY u.role_id`,
            [req.user.entreprise_id]
        );

        const stats = statsRows.map(row => ({
            role_nom: roleNames[row.role_id] || 'Sans rôle',
            total: row.total
        }));

        const [extRows] = await db.promisePoolMaster.query(
            'SELECT COUNT(*) AS total FROM users WHERE entreprise_id = ? AND is_external = TRUE',
            [req.user.entreprise_id]
        );

        res.json({
            stats_par_role: stats,
            total_comptes_externes: extRows[0].total
        });
    } catch (err) {
        console.error('Erreur getUserStats:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.getActiveSessions = async (req, res) => {
    try {
        const [sessions] = await db.promisePoolMaster.query(
            `SELECT s.*, u.nom, u.prenom, u.email
             FROM sessions s
             JOIN users u ON s.user_id = u.id
             WHERE s.user_id = ? AND s.is_active = TRUE
             ORDER BY s.last_activity DESC`,
            [req.user.id]
        );

        res.json({ sessions: sessions });
    } catch (err) {
        console.error('Erreur getActiveSessions:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.revokeOtherSessions = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        await db.promisePoolMaster.query(
            'UPDATE sessions SET is_active = FALSE WHERE user_id = ? AND token != ?',
            [req.user.id, token]
        );

        res.json({ message: 'Autres sessions deconnectees avec succes' });
    } catch (err) {
        console.error('Erreur revokeOtherSessions:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.reportUnknownSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { reason, lock_account = true } = req.body;

        const result = await SessionService.reportUnknownSession(
            req.user.id,
            sessionId,
            reason || 'Connexion suspecte - non reconnue par l\'utilisateur',
            lock_account
        );

        res.json({
            message: result.locked ? 'Connexion signalee, compte verrouille.' : 'Connexion signalee.',
            ...result
        });
    } catch (error) {
        console.error('Erreur reportUnknownSession:', error);
        res.status(500).json({ message: 'Erreur lors du signalement' });
    }
};

exports.lockMyAccount = async (req, res) => {
    try {
        await SessionService.lockAccount(
            req.user.id,
            req.body.reason || "Verrouillage volontaire par l'utilisateur"
        );
        res.json({ message: 'Compte verrouille avec succes.' });
    } catch (error) {
        console.error('Erreur lockMyAccount:', error);
        res.status(500).json({ message: 'Erreur lors du verrouillage' });
    }
};

exports.unlockAccount = async (req, res) => {
    try {
        const { userId } = req.params;
        await SessionService.unlockAccount(userId);
        res.json({ message: 'Compte deverrouille avec succes.' });
    } catch (error) {
        console.error('Erreur unlockAccount:', error);
        res.status(500).json({ message: 'Erreur lors du deverrouillage' });
    }
};

exports.getActiveSessionsDetailed = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const sessions = await SessionService.getUserSessionsWithCurrent(req.user.id, token);
        res.json({ sessions });
    } catch (error) {
        console.error('Erreur getActiveSessionsDetailed:', error);
        res.status(500).json({ message: 'Erreur lors de la recuperation des sessions' });
    }
};

exports.revokeOtherSessionsExtended = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const count = await SessionService.revokeOtherSessions(req.user.id, token);
        res.json({
            message: 'Autres sessions deconnectees avec succes',
            revoked: count
        });
    } catch (error) {
        console.error('Erreur revokeOtherSessionsExtended:', error);
        res.status(500).json({ message: 'Erreur lors de la revocation des sessions' });
    }
};
// Verrouiller un compte utilisateur (SuperAdmin uniquement)
exports.lockUserAccount = async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;
        
        if (!userId) {
            return res.status(400).json({ message: 'ID utilisateur requis' });
        }
        
        if (!reason || reason.trim().length < 3) {
            return res.status(400).json({ message: 'Une raison est requise (minimum 3 caracteres)' });
        }
        
        // Vérifier que l'utilisateur existe et n'est pas un SuperAdmin
        const [users] = await db.promisePoolMaster.query(
            `SELECT id, is_super_admin, is_account_locked, email, nom, prenom 
             FROM users 
             WHERE id = ?`,
            [userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouve' });
        }
        
        const user = users[0];
        
        if (user.is_super_admin) {
            return res.status(403).json({ message: 'Impossible de verrouiller un SuperAdmin' });
        }
        
        if (user.is_account_locked) {
            return res.status(400).json({ message: 'Ce compte est deja verrouille' });
        }
        
        // Verrouiller le compte
        await db.promisePoolMaster.query(
            `UPDATE users 
             SET is_account_locked = 1, 
                 account_lock_reason = ?,
                 lock_expires_at = DATE_ADD(NOW(), INTERVAL 24 HOUR),
                 login_attempts = 0
             WHERE id = ?`,
            [reason.trim(), userId]
        );
        
        // Journaliser l'action dans l'audit
        await db.promisePoolMaster.query(
            `INSERT INTO audit_logs (utilisateur_id, action, module, details, ip, status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [
                req.user.id,
                'LOCK_USER_ACCOUNT',
                'Administration',
                JSON.stringify({ 
                    target_user_id: userId, 
                    target_email: user.email,
                    target_name: `${user.prenom} ${user.nom}`,
                    reason: reason.trim(),
                    locked_by: req.user.id
                }),
                req.ip,
                'success'
            ]
        );
        
        res.json({ 
            message: 'Compte verrouille avec succes',
            user: {
                id: user.id,
                email: user.email,
                nom: user.nom,
                prenom: user.prenom,
                is_account_locked: true,
                account_lock_reason: reason.trim()
            }
        });
    } catch (err) {
        console.error('Erreur lockUserAccount:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = {
    registerEntreprise: exports.registerEntreprise,
    login: exports.login,
    logout: exports.logout,
    getMe: exports.getMe,
    getMesPermissions: exports.getMesPermissions,
    updateMe: exports.updateMe,
    getUsersEntreprise: exports.getUsersEntreprise,
    createUserByAdmin: exports.createUserByAdmin,
    createExternalUser: exports.createExternalUser,
    updateUserRole: exports.updateUserRole,
    deleteUser: exports.deleteUser,
    getUserStats: exports.getUserStats,
    getActiveSessions: exports.getActiveSessions,
    revokeOtherSessions: exports.revokeOtherSessions,
    reportUnknownSession: exports.reportUnknownSession,
    lockMyAccount: exports.lockMyAccount,
    unlockAccount: exports.unlockAccount,
    getActiveSessionsDetailed: exports.getActiveSessionsDetailed,
    searchUsersForUnlock: exports.searchUsersForUnlock,
    revokeOtherSessionsExtended: exports.revokeOtherSessionsExtended,
    lockUserAccount: exports.lockUserAccount
};