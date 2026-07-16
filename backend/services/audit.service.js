

class AuditService {
    /**
     * Journalise une action utilisateur
     * @param {object} db - Pool MySQL tenant
     * @param {object} data - Données à journaliser
     */
    static async logAction(db, data) {
        const {
            utilisateur_id,
            entreprise_id,
            action,
            module,
            details,
            ip,
            user_agent,
            status = 'success'
        } = data;

        try {
            await db.promise().query(
                `INSERT INTO audit_logs 
                 (entreprise_id, utilisateur_id, action, module, details, ip, user_agent, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    entreprise_id || null,
                    utilisateur_id || null,
                    action,
                    module || null,
                    details ? JSON.stringify(details) : null,
                    ip || null,
                    user_agent || null,
                    status
                ]
            );
        } catch (err) {
            console.error(' Erreur audit log:', err);
        }
    }

    /**
     * Journalise une opération CRUD (avec anciennes/nouvelles valeurs)
     */
    static async logOperation(db, data) {
        const {
            utilisateur_id,
            entreprise_id,
            operation,
            table_name,
            record_id,
            anciennes_valeurs,
            nouvelles_valeurs,
            ip,
            user_agent
        } = data;

        try {
            await db.promise().query(
                `INSERT INTO audit_operations 
                 (entreprise_id, utilisateur_id, operation, table_name, record_id, 
                  anciennes_valeurs, nouvelles_valeurs, ip, user_agent) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    entreprise_id || null,
                    utilisateur_id || null,
                    operation,
                    table_name,
                    record_id || null,
                    anciennes_valeurs ? JSON.stringify(anciennes_valeurs) : null,
                    nouvelles_valeurs ? JSON.stringify(nouvelles_valeurs) : null,
                    ip || null,
                    user_agent || null
                ]
            );
        } catch (err) {
            console.error(' Erreur audit operation:', err);
        }
    }

    /**
     * Récupère les logs avec filtres
     */
    static async getLogs(db, filters = {}) {
        const {
            utilisateur_id,
            module,
            action,
            date_debut,
            date_fin,
            limit = 50,
            offset = 0
        } = filters;

        let sql = 'SELECT * FROM audit_logs WHERE 1=1';
        const params = [];

        if (utilisateur_id) {
            sql += ' AND utilisateur_id = ?';
            params.push(utilisateur_id);
        }
        if (module) {
            sql += ' AND module = ?';
            params.push(module);
        }
        if (action) {
            sql += ' AND action = ?';
            params.push(action);
        }
        if (date_debut) {
            sql += ' AND created_at >= ?';
            params.push(date_debut);
        }
        if (date_fin) {
            sql += ' AND created_at <= ?';
            params.push(date_fin);
        }

        sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [rows] = await db.promise().query(sql, params);
        return rows;
    }

    /**
     * Récupère les logs de connexion
     */
    static async getConnexions(db, filters = {}) {
        const {
            email,
            status,
            date_debut,
            date_fin,
            limit = 50,
            offset = 0
        } = filters;

        let sql = 'SELECT * FROM audit_connexions WHERE 1=1';
        const params = [];

        if (email) {
            sql += ' AND email = ?';
            params.push(email);
        }
        if (status) {
            sql += ' AND status = ?';
            params.push(status);
        }
        if (date_debut) {
            sql += ' AND created_at >= ?';
            params.push(date_debut);
        }
        if (date_fin) {
            sql += ' AND created_at <= ?';
            params.push(date_fin);
        }

        sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [rows] = await db.promise().query(sql, params);
        return rows;
    }

    /**
     * Récupère les opérations CRUD
     */
    static async getOperations(db, filters = {}) {
        const {
            utilisateur_id,
            operation,
            table_name,
            date_debut,
            date_fin,
            limit = 50,
            offset = 0
        } = filters;

        let sql = 'SELECT * FROM audit_operations WHERE 1=1';
        const params = [];

        if (utilisateur_id) {
            sql += ' AND utilisateur_id = ?';
            params.push(utilisateur_id);
        }
        if (operation) {
            sql += ' AND operation = ?';
            params.push(operation);
        }
        if (table_name) {
            sql += ' AND table_name = ?';
            params.push(table_name);
        }
        if (date_debut) {
            sql += ' AND created_at >= ?';
            params.push(date_debut);
        }
        if (date_fin) {
            sql += ' AND created_at <= ?';
            params.push(date_fin);
        }

        sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [rows] = await db.promise().query(sql, params);
        return rows;
    }
}

module.exports = AuditService;