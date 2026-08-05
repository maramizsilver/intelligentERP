// backend/controllers/clientTenantController.js
// Contrôleur dédié pour les routes multi-tenant avec company_id

const { getClientPool } = require('../config/db');

/**
 * Récupère tous les clients de l'entreprise (avec isolation company_id)
 * GET /api/clients/tenant
 */
exports.getClientsTenant = async (req, res) => {
    try {
        const companyId = req.user.company_id || req.user.entreprise_id;
        const dbName = req.tenant.dbName;
        const clientPool = getClientPool(companyId, dbName);

        const [clients] = await clientPool.promise().query(
            `SELECT c.*, 
                    (SELECT COUNT(*) FROM commandes WHERE client_id = c.id AND company_id = ?) as total_commandes,
                    (SELECT COUNT(*) FROM devis WHERE client_id = c.id AND company_id = ?) as total_devis
             FROM clients c
             WHERE c.company_id = ?
             ORDER BY c.nom ASC`,
            [companyId, companyId, companyId]
        );

        res.json(clients);
    } catch (error) {
        console.error('Erreur getClientsTenant:', error);
        res.status(500).json({ message: 'Erreur lors de la recuperation des clients' });
    }
};

/**
 * Récupère un client par ID avec vérification company_id
 * GET /api/clients/tenant/:id
 */
exports.getClientByIdTenant = async (req, res) => {
    try {
        const companyId = req.user.company_id || req.user.entreprise_id;
        const dbName = req.tenant.dbName;
        const clientId = req.params.id;
        const clientPool = getClientPool(companyId, dbName);

        const [clients] = await clientPool.promise().query(
            'SELECT * FROM clients WHERE id = ? AND company_id = ?',
            [clientId, companyId]
        );

        if (clients.length === 0) {
            return res.status(404).json({ message: 'Client non trouve' });
        }

        res.json(clients[0]);
    } catch (error) {
        console.error('Erreur getClientByIdTenant:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

/**
 * Crée un client avec company_id injecté automatiquement
 * POST /api/clients/tenant
 */
exports.createClientTenant = async (req, res) => {
    try {
        const companyId = req.user.company_id || req.user.entreprise_id;
        const dbName = req.tenant.dbName;
        const clientPool = getClientPool(companyId, dbName);
        
        const { 
            nom, prenom, raison_sociale, email, telephone, adresse, ville, 
            code_postal, pays, matricule_fiscal, numero_cin, type_client, notes 
        } = req.body;

        if (!nom) {
            return res.status(400).json({ message: 'Le nom est requis' });
        }

        // company_id injecté ici, jamais du frontend
        const [result] = await clientPool.promise().query(
            `INSERT INTO clients 
             (nom, prenom, raison_sociale, email, telephone, adresse, ville, 
              code_postal, pays, matricule_fiscal, numero_cin, type_client, notes, company_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nom, prenom || null, raison_sociale || null,
                email || null, telephone || null, adresse || null,
                ville || null, code_postal || null, pays || 'Tunisie',
                matricule_fiscal || null, numero_cin || null,
                type_client || 'particulier', notes || null,
                companyId
            ]
        );

        const [newClient] = await clientPool.promise().query(
            'SELECT * FROM clients WHERE id = ? AND company_id = ?',
            [result.insertId, companyId]
        );

        res.status(201).json({
            message: 'Client cree avec succes',
            client: newClient[0]
        });

    } catch (error) {
        console.error('Erreur createClientTenant:', error);
        res.status(500).json({ message: 'Erreur lors de la creation du client' });
    }
};

/**
 * Met à jour un client avec vérification company_id
 * PUT /api/clients/tenant/:id
 */
exports.updateClientTenant = async (req, res) => {
    try {
        const companyId = req.user.company_id || req.user.entreprise_id;
        const dbName = req.tenant.dbName;
        const clientId = req.params.id;
        const clientPool = getClientPool(companyId, dbName);

        const [existing] = await clientPool.promise().query(
            'SELECT * FROM clients WHERE id = ? AND company_id = ?',
            [clientId, companyId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Client non trouve' });
        }

        const client = existing[0];
        const { 
            nom, prenom, raison_sociale, email, telephone, adresse, ville, 
            code_postal, pays, matricule_fiscal, numero_cin, type_client, notes 
        } = req.body;

        await clientPool.promise().query(
            `UPDATE clients SET 
                nom = ?, prenom = ?, raison_sociale = ?, email = ?, telephone = ?,
                adresse = ?, ville = ?, code_postal = ?, pays = ?, 
                matricule_fiscal = ?, numero_cin = ?, type_client = ?, notes = ?,
                updated_at = NOW()
             WHERE id = ? AND company_id = ?`,
            [
                nom || client.nom,
                prenom !== undefined ? prenom : client.prenom,
                raison_sociale !== undefined ? raison_sociale : client.raison_sociale,
                email !== undefined ? email : client.email,
                telephone !== undefined ? telephone : client.telephone,
                adresse !== undefined ? adresse : client.adresse,
                ville !== undefined ? ville : client.ville,
                code_postal !== undefined ? code_postal : client.code_postal,
                pays || client.pays || 'Tunisie',
                matricule_fiscal !== undefined ? matricule_fiscal : client.matricule_fiscal,
                numero_cin !== undefined ? numero_cin : client.numero_cin,
                type_client || client.type_client || 'particulier',
                notes !== undefined ? notes : client.notes,
                clientId,
                companyId
            ]
        );

        const [updated] = await clientPool.promise().query(
            'SELECT * FROM clients WHERE id = ? AND company_id = ?',
            [clientId, companyId]
        );

        res.json({
            message: 'Client mis a jour avec succes',
            client: updated[0]
        });

    } catch (error) {
        console.error('Erreur updateClientTenant:', error);
        res.status(500).json({ message: 'Erreur lors de la mise a jour' });
    }
};

/**
 * Supprime un client avec vérification company_id
 * DELETE /api/clients/tenant/:id
 */
exports.deleteClientTenant = async (req, res) => {
    try {
        const companyId = req.user.company_id || req.user.entreprise_id;
        const dbName = req.tenant.dbName;
        const clientId = req.params.id;
        const clientPool = getClientPool(companyId, dbName);

        const [existing] = await clientPool.promise().query(
            'SELECT * FROM clients WHERE id = ? AND company_id = ?',
            [clientId, companyId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Client non trouve' });
        }

        const [commandes] = await clientPool.promise().query(
            'SELECT COUNT(*) as count FROM commandes WHERE client_id = ? AND company_id = ?',
            [clientId, companyId]
        );

        if (commandes[0].count > 0) {
            return res.status(400).json({ 
                message: `Impossible de supprimer ce client car il a ${commandes[0].count} commande(s) associee(s)` 
            });
        }

        await clientPool.promise().query(
            'DELETE FROM clients WHERE id = ? AND company_id = ?',
            [clientId, companyId]
        );

        res.json({ message: 'Client supprime avec succes' });

    } catch (error) {
        console.error('Erreur deleteClientTenant:', error);
        res.status(500).json({ message: 'Erreur lors de la suppression' });
    }
};

/**
 * Recherche de clients avec isolation company_id
 * GET /api/clients/tenant/search?q=...
 */
exports.searchClientsTenant = async (req, res) => {
    try {
        const companyId = req.user.company_id || req.user.entreprise_id;
        const dbName = req.tenant.dbName;
        const searchTerm = req.query.q || '';
        const clientPool = getClientPool(companyId, dbName);

        if (searchTerm.length < 2) {
            return res.json([]);
        }

        const pattern = `%${searchTerm}%`;
        const [clients] = await clientPool.promise().query(
            `SELECT * FROM clients 
             WHERE company_id = ? 
             AND (nom LIKE ? OR email LIKE ? OR telephone LIKE ? OR prenom LIKE ?)
             ORDER BY nom ASC
             LIMIT 20`,
            [companyId, pattern, pattern, pattern, pattern]
        );

        res.json(clients);
    } catch (error) {
        console.error('Erreur searchClientsTenant:', error);
        res.status(500).json({ message: 'Erreur lors de la recherche' });
    }
};