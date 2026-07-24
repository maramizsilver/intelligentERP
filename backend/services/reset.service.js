// backend/services/reset.service.js
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const notificationService = require('./notification.service');

class ResetService {
    static generateToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    static async requestReset(email) {
        const cleanEmail = email.trim().toLowerCase();

        const [users] = await db.promisePoolMaster.query(
            `SELECT u.id, u.entreprise_id, u.email, u.nom, u.prenom, e.db_name
             FROM users u
             LEFT JOIN entreprises e ON u.entreprise_id = e.id
             WHERE u.email = ? AND u.is_super_admin = 0`,
            [cleanEmail]
        );

        if (users.length === 0) {
            return { success: false, message: 'Aucun compte associe a cet email' };
        }

        const user = users[0];
        const token = this.generateToken();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await db.promisePoolMaster.query(
            'UPDATE users SET reset_token = ?, reset_token_expires = ?, reset_token_used = FALSE WHERE id = ?',
            [token, expiresAt, user.id]
        );

        if (user.entreprise_id && user.db_name) {
            try {
                const clientPool = db.getClientPool(user.entreprise_id, user.db_name);
                
                const [check] = await clientPool.promise().query(
                    `SELECT COUNT(*) as count FROM information_schema.columns 
                     WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'reset_token_used'`
                );

                if (check[0].count > 0) {
                    await clientPool.promise().query(
                        'UPDATE users SET reset_token = ?, reset_token_expires = ?, reset_token_used = FALSE WHERE id = ?',
                        [token, expiresAt, user.id]
                    );
                } else {
                    await clientPool.promise().query(
                        'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
                        [token, expiresAt, user.id]
                    );
                }
            } catch (err) {
                console.error('Erreur mise a jour tenant:', err);
            }
        }

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

        await notificationService.sendEmail({
            to: user.email,
            subject: 'Reinitialisation de votre mot de passe',
            html: `
                <h2>Bonjour ${user.prenom} ${user.nom},</h2>
                <p>Vous avez demande la reinitialisation de votre mot de passe.</p>
                <p>Cliquez sur le lien ci-dessous pour creer un nouveau mot de passe :</p>
                <p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#0EA5E9;color:#fff;text-decoration:none;border-radius:8px;">Reinitialiser mon mot de passe</a></p>
                <p>Ce lien est valable pendant 1 heure.</p>
                <p>Si vous n'etes pas a l'origine de cette demande, ignorez cet email.</p>
            `,
            text: `Bonjour ${user.prenom} ${user.nom},\n\nVous avez demande la reinitialisation de votre mot de passe.\n\nCliquez sur le lien ci-dessous pour creer un nouveau mot de passe :\n\n${resetUrl}\n\nCe lien est valable pendant 1 heure.\n\nSi vous n'etes pas a l'origine de cette demande, ignorez cet email.`
        });

        return { success: true, message: 'Un email de reinitialisation a ete envoye' };
    }

    static async validateToken(token) {
        const [users] = await db.promisePoolMaster.query(
            `SELECT u.id, u.entreprise_id, u.reset_token, u.reset_token_expires, u.reset_token_used, e.db_name as entreprise_db_name
             FROM users u
             LEFT JOIN entreprises e ON u.entreprise_id = e.id
             WHERE u.reset_token = ?`,
            [token]
        );

        if (users.length === 0) {
            return { valid: false, message: 'Token invalide' };
        }

        const user = users[0];

        if (user.reset_token_used) {
            return { valid: false, message: 'Ce token a deja ete utilise' };
        }

        if (new Date(user.reset_token_expires) < new Date()) {
            return { valid: false, message: 'Ce token a expire' };
        }

        return { valid: true, user };
    }

    static async resetPassword(token, newPassword) {
        const validation = await this.validateToken(token);
        if (!validation.valid) {
            return { success: false, message: validation.message };
        }

        const user = validation.user;
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.promisePoolMaster.query(
            'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL, reset_token_used = TRUE, login_attempts = 0, locked_until = NULL WHERE id = ?',
            [hashedPassword, user.id]
        );

        if (user.entreprise_id && user.entreprise_db_name) {
            try {
                const clientPool = db.getClientPool(user.entreprise_id, user.entreprise_db_name);
                
                const [check] = await clientPool.promise().query(
                    `SELECT COUNT(*) as count FROM information_schema.columns 
                     WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'reset_token_used'`
                );

                if (check[0].count > 0) {
                    await clientPool.promise().query(
                        'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL, reset_token_used = TRUE, login_attempts = 0, locked_until = NULL WHERE id = ?',
                        [hashedPassword, user.id]
                    );
                } else {
                    await clientPool.promise().query(
                        'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL, login_attempts = 0, locked_until = NULL WHERE id = ?',
                        [hashedPassword, user.id]
                    );
                }
            } catch (err) {
                console.error('Erreur mise a jour tenant:', err);
            }
        }

        await db.promisePoolMaster.query(
            'UPDATE sessions SET is_active = FALSE WHERE user_id = ?',
            [user.id]
        );

        return { success: true, message: 'Mot de passe reinitialise avec succes' };
    }
}

module.exports = ResetService;