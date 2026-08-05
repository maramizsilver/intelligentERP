// ---------------------------------------------------------------------------
// "Outils" (function calling) que le chatbot IA peut appeler pour aller
// chercher des données réelles dans la base de l'entreprise (req.db, déjà
// isolée par tenantMiddleware) avant de répondre à l'utilisateur.
// Principe : chaque outil est une fonction pure (db, args) -> Promise<objet
// JSON résumé>. Le modèle décide quand les appeler ; on ne lui donne jamais
// un accès SQL libre, uniquement ces requêtes prédéfinies et limitées.
//
// Chaque outil est en outre rattaché à un module de permission RBAC (le même
// référentiel "modules / permissions" que celui utilisé par
// permissionMiddleware pour les routes classiques). Avant d'exécuter un
// outil, on vérifie que le rôle de l'utilisateur a bien le droit de
// "consultation" sur ce module : le chatbot ne peut donc jamais montrer à un
// utilisateur des données qu'il ne pourrait pas voir via l'interface
// normale.
// ---------------------------------------------------------------------------

/** Exécute une requête callback mysql2 sous forme de Promise. */
function query(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

/**
 * Vérifie si le rôle de l'utilisateur a la permission "consultation" sur un
 * module donné (même logique que middleware/permissionMiddleware.js).
 */
async function aLaPermission(db, roleId, moduleNom) {
    if (!roleId) return false;
    const rows = await query(
        db,
        `SELECT p.consultation AS autorise
         FROM permissions p
         JOIN modules m ON p.module_id = m.id
         WHERE p.role_id = ? AND m.nom = ?`,
        [roleId, moduleNom]
    );
    return rows.length > 0 && !!rows[0].autorise;
}

// Rattachement de chaque outil à son module de permission RBAC (mêmes noms
// de module que ceux utilisés par les routes classiques : Stock, Ventes,
// Finance...).
const TOOL_MODULES = {
    rechercher_produits: 'Stock',
    lister_produits_stock_bas: 'Stock',
    rechercher_clients: 'Ventes',
    lister_commandes_client: 'Ventes',
    lister_factures_impayees: 'Finance',
    chiffre_affaires_periode: 'Finance'
};

// ============================================================
// Déclaration des outils au format attendu par l'API OpenAI
// (chat.completions "tools"), et de leur implémentation.
// ============================================================

const TOOL_DEFINITIONS = [
    {
        type: 'function',
        function: {
            name: 'rechercher_produits',
            description:
                "Recherche des produits du catalogue par nom, référence ou code-barre, et renvoie leur prix et leur stock actuel. À utiliser pour toute question sur un produit précis (prix, stock disponible, référence...).",
            parameters: {
                type: 'object',
                properties: {
                    recherche: {
                        type: 'string',
                        description: 'Nom (ou partie du nom), référence ou code-barre du produit recherché.'
                    }
                },
                required: ['recherche']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'lister_produits_stock_bas',
            description:
                "Liste les produits actifs dont le stock est au niveau ou en dessous de leur seuil d'alerte. À utiliser pour les questions du type 'quels produits sont en rupture / à réapprovisionner ?'.",
            parameters: { type: 'object', properties: {} }
        }
    },
    {
        type: 'function',
        function: {
            name: 'rechercher_clients',
            description:
                'Recherche des clients par nom, prénom, raison sociale, email ou téléphone.',
            parameters: {
                type: 'object',
                properties: {
                    recherche: { type: 'string', description: 'Terme de recherche (nom, email, téléphone...).' }
                },
                required: ['recherche']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'lister_commandes_client',
            description:
                "Liste les commandes les plus récentes d'un client, à partir de son identifiant (obtenu via rechercher_clients).",
            parameters: {
                type: 'object',
                properties: {
                    client_id: { type: 'integer', description: 'Identifiant du client.' },
                    limite: { type: 'integer', description: 'Nombre maximum de commandes à renvoyer (défaut 10).' }
                },
                required: ['client_id']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'lister_factures_impayees',
            description:
                "Liste les factures émises mais non encore payées (impayés), avec le nom du client et le montant TTC.",
            parameters: {
                type: 'object',
                properties: {
                    limite: { type: 'integer', description: 'Nombre maximum de factures à renvoyer (défaut 15).' }
                }
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'chiffre_affaires_periode',
            description:
                "Calcule le chiffre d'affaires (somme des factures payées, en TTC) sur une période donnée. À utiliser pour toute question du type 'quel est le CA de ce mois / cette semaine / entre telle et telle date ?'.",
            parameters: {
                type: 'object',
                properties: {
                    date_debut: { type: 'string', description: 'Date de début au format AAAA-MM-JJ.' },
                    date_fin: { type: 'string', description: 'Date de fin au format AAAA-MM-JJ.' }
                },
                required: ['date_debut', 'date_fin']
            }
        }
    }
];

const TOOL_IMPLEMENTATIONS = {
    async rechercher_produits(db, { recherche }) {
        const like = `%${recherche}%`;
        const rows = await query(
            db,
            `SELECT id, nom, reference, code_barre, prix, quantite_stock, seuil_alerte, actif
             FROM produits
             WHERE (nom LIKE ? OR reference LIKE ? OR code_barre LIKE ?)
             ORDER BY nom ASC
             LIMIT 10`,
            [like, like, like]
        );
        if (rows.length === 0) return { resultat: 'Aucun produit trouvé pour cette recherche.' };
        return {
            produits: rows.map((p) => ({
                id: p.id,
                nom: p.nom,
                reference: p.reference,
                prix: Number(p.prix),
                stock_disponible: p.quantite_stock,
                en_dessous_du_seuil: p.quantite_stock <= p.seuil_alerte,
                actif: !!p.actif
            }))
        };
    },

    async lister_produits_stock_bas(db) {
        const rows = await query(
            db,
            `SELECT id, nom, reference, quantite_stock, seuil_alerte
             FROM produits
             WHERE actif = 1 AND quantite_stock <= seuil_alerte
             ORDER BY quantite_stock ASC
             LIMIT 25`
        );
        if (rows.length === 0) return { resultat: 'Aucun produit en dessous de son seuil de stock.' };
        return { produits_stock_bas: rows };
    },

    async rechercher_clients(db, { recherche }) {
        const like = `%${recherche}%`;
        const rows = await query(
            db,
            `SELECT id, nom, prenom, raison_sociale, email, telephone, type_client
             FROM clients
             WHERE nom LIKE ? OR prenom LIKE ? OR raison_sociale LIKE ? OR email LIKE ? OR telephone LIKE ?
             ORDER BY nom ASC
             LIMIT 10`,
            [like, like, like, like, like]
        );
        if (rows.length === 0) return { resultat: 'Aucun client trouvé pour cette recherche.' };
        return { clients: rows };
    },

    async lister_commandes_client(db, { client_id, limite }) {
        const rows = await query(
            db,
            `SELECT id, numero_commande, date_commande, total_ttc, statut
             FROM commandes
             WHERE client_id = ?
             ORDER BY date_commande DESC
             LIMIT ?`,
            [client_id, Math.min(Number(limite) || 10, 30)]
        );
        if (rows.length === 0) return { resultat: 'Aucune commande trouvée pour ce client.' };
        return { commandes: rows };
    },

    async lister_factures_impayees(db, { limite }) {
        const rows = await query(
            db,
            `SELECT f.id, f.numero_facture, f.date_facture, f.total_ttc,
                    COALESCE(c.raison_sociale, CONCAT(c.nom, ' ', COALESCE(c.prenom, ''))) AS client
             FROM factures f
             JOIN clients c ON c.id = f.client_id
             WHERE f.statut = 'emise'
             ORDER BY f.date_facture ASC
             LIMIT ?`,
            [Math.min(Number(limite) || 15, 50)]
        );
        if (rows.length === 0) return { resultat: 'Aucune facture impayée actuellement.' };
        return { factures_impayees: rows };
    },

    async chiffre_affaires_periode(db, { date_debut, date_fin }) {
        const rows = await query(
            db,
            `SELECT COUNT(*) AS nombre_factures, COALESCE(SUM(total_ttc), 0) AS chiffre_affaires_ttc
             FROM factures
             WHERE statut = 'payee' AND date_facture BETWEEN ? AND ?`,
            [date_debut, `${date_fin} 23:59:59`]
        );
        return {
            periode: { du: date_debut, au: date_fin },
            nombre_factures_payees: rows[0].nombre_factures,
            chiffre_affaires_ttc: Number(rows[0].chiffre_affaires_ttc)
        };
    }
};

/** Exécute un outil demandé par le modèle et attrape toute erreur SQL/logique. */
async function executerOutil(nomOutil, argsJson, db, user) {
    const impl = TOOL_IMPLEMENTATIONS[nomOutil];
    if (!impl) return { erreur: `Outil inconnu : ${nomOutil}` };

    const moduleRequis = TOOL_MODULES[nomOutil];
    if (moduleRequis) {
        const autorise = await aLaPermission(db, user?.role_id, moduleRequis).catch((err) => {
            console.error(`[Chatbot IA] Erreur vérification permission (${moduleRequis}):`, err.message);
            return false;
        });
        if (!autorise) {
            return {
                erreur: `Accès refusé : tu n'as pas la permission de consulter le module "${moduleRequis}". Demande à un administrateur de te l'accorder si besoin.`
            };
        }
    }

    let args = {};
    try {
        args = argsJson ? JSON.parse(argsJson) : {};
    } catch {
        return { erreur: "Arguments d'outil invalides (JSON incorrect)." };
    }

    try {
        return await impl(db, args);
    } catch (err) {
        console.error(`[Chatbot IA] Erreur outil ${nomOutil}:`, err.message);
        return { erreur: "Erreur lors de l'accès aux données de l'entreprise." };
    }
}

module.exports = { TOOL_DEFINITIONS, executerOutil };
