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
        `SELECT u.*, r.nom AS role_nom, e.nom AS entreprise_nom, 
                e.statut AS entreprise_statut, e.plan_type, 
                e.connexions_utilisees, e.limite_connexions_essai, e.db_name
         FROM users u
         LEFT JOIN roles r ON u.role_id = r.id
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

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    const cleanEmail = email.trim().toLowerCase();

    try {
        const user = await findUserByEmail(cleanEmail);

        if (!user) {
            await db.promisePoolMaster.query(
                `INSERT INTO audit_connexions 
                 (utilisateur_id, email, ip, user_agent, status, created_at) 
                 VALUES (NULL, ?, ?, ?, 'failed', NOW())`,
                [cleanEmail, req.ip || req.connection.remoteAddress, req.headers['user-agent']]
            );
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        if (user.is_super_admin) {
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
            console.error('Configuration utilisateur incomplete:', {
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
            return res.status(403).json({
                message: 'Compte bloque. Reessayez plus tard.',
                locked_until: user.locked_until,
                remaining_minutes: Math.ceil((new Date(user.locked_until) - new Date()) / 60000)
            });
        }

        const clientPool = db.getClientPool(user.entreprise_id, user.db_name);
        const tenantUser = await findTenantUserByEmail(clientPool, cleanEmail);

        if (!tenantUser) {
            await db.promisePoolMaster.query(
                `INSERT INTO audit_connexions 
                 (utilisateur_id, email, ip, user_agent, status, created_at) 
                 VALUES (NULL, ?, ?, ?, 'failed', NOW())`,
                [cleanEmail, req.ip || req.connection.remoteAddress, req.headers['user-agent']]
            );
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        const isMatch = await bcrypt.compare(password, tenantUser.password);
        
        if (!isMatch) {
            const attempts = (tenantUser.login_attempts || 0) + 1;
            let lockedUntil = null;
            let remainingAttempts = 5 - attempts;
            
            if (attempts >= 5) {
                lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
                remainingAttempts = 0;
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

        const token = jwt.sign(
            {
                id: user.id,
                entreprise_id: user.entreprise_id,
                role_id: user.role_id,
                is_super_admin: false,
                is_external: user.is_external || false,
                client_id: user.client_id || null,
                essai_expire: essaiExpire,
                db_name: user.db_name,
                mfa_verified: true
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        try {
            const clientPoolSession = db.getClientPool(user.entreprise_id, user.db_name);
            const result = await SessionService.recordConnection(
                clientPoolSession,
                { id: user.id },
                token,
                req
            );
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

        const userData = {
            id: user.id,
            nom: user.nom,
            prenom: user.prenom,
            email: cleanEmail,
            role: user.role_nom || 'Utilisateur',
            entreprise: user.entreprise_nom || null,
            is_super_admin: false,
            is_external: user.is_external || false,
            plan_type: user.plan_type || null,
            essai_expire: essaiExpire,
            connexions_restantes: connexionsRestantes,
            mfa_enabled: mfaEnabled
        };

        res.json({
            message: 'Connexion reussie',
            messageEssai,
            token,
            user: userData
        });

    } catch (err) {
        console.error('Erreur login:', err);
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

exports.getMesPermissions = (req, res) => {
    const db = req.db;
    
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
        if (err) {
            console.error('Erreur getMesPermissions:', err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        res.json({ permissions: results });
    });
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
        const [rows] = await db.promisePoolMaster.query(
            `SELECT u.id, u.nom, u.prenom, u.email, u.is_external, u.created_at,
                    u.role_id, r.nom AS role_nom
             FROM users u
             LEFT JOIN erp_db.roles r ON u.role_id = r.id
             WHERE u.entreprise_id = ?
             ORDER BY u.created_at DESC`,
            [req.user.entreprise_id]
        );
        
        res.json({ users: rows });
    } catch (err) {
        console.error('Erreur getUsersEntreprise:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.createUserByAdmin = async (req, res) => {
    const { nom, prenom, email, password, role_id } = req.body;
    
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
             (entreprise_id, role_id, nom, prenom, email, password, created_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [req.user.entreprise_id, role_id, nom.trim(), prenom.trim(), cleanEmail, hashedPassword]
        );

        await clientPool.promise().query(
            `INSERT INTO users 
             (id, role_id, nom, prenom, email, password, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [masterResult.insertId, role_id, nom.trim(), prenom.trim(), cleanEmail, hashedPassword, req.user.id]
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
             WHERE u.id = ? AND u.entreprise_id = ?`,
            [id, req.user.entreprise_id]
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
                 WHERE u.entreprise_id = ? AND r.est_admin_entreprise = TRUE`,
                [req.user.entreprise_id]
            );
            
            if (countRows[0].total <= 1) {
                return res.status(400).json({ message: 'Impossible de supprimer le dernier compte Admin Entreprise' });
            }
        }

        await db.promisePoolMaster.query(
            'DELETE FROM users WHERE id = ? AND entreprise_id = ?',
            [id, req.user.entreprise_id]
        );

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
        const [statsRows] = await db.promisePoolMaster.query(
            `SELECT
                COALESCE(r.nom, 'Externe / sans role') AS role_nom,
                COUNT(*) AS total
             FROM users u
             LEFT JOIN erp_db.roles r ON u.role_id = r.id
             WHERE u.entreprise_id = ?
             GROUP BY r.nom
             ORDER BY total DESC`,
            [req.user.entreprise_id]
        );

        const [extRows] = await db.promisePoolMaster.query(
            'SELECT COUNT(*) AS total FROM users WHERE entreprise_id = ? AND is_external = TRUE',
            [req.user.entreprise_id]
        );

        res.json({
            stats_par_role: statsRows,
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
    revokeOtherSessions: exports.revokeOtherSessions
};