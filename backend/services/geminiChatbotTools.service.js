// backend/services/geminiChatbotTools.service.js
// ---------------------------------------------------------------------------
// Outils (function calling Gemini) pour l'agent IA "Stock / Sécurité /
// Fonctionnement plateforme". Même principe que chatbotTools.service.js
// (OpenAI) : chaque outil est une fonction (db, args, user) -> objet JSON,
// jamais d'accès SQL libre donné au modèle.
// ---------------------------------------------------------------------------
const { SchemaType } = require('@google/generative-ai');

function query(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => err ? reject(err) : resolve(results));
    });
}

/** Vérifie la permission RBAC "consultation" sur un module (même logique que permissionMiddleware). */
async function aLaPermission(db, roleId, moduleNom) {
    if (!roleId) return false;
    const admin = await query(db, 'SELECT est_admin_entreprise FROM roles WHERE id = ?', [roleId]);
    if (admin.length && admin[0].est_admin_entreprise) return true;
    const rows = await query(
        db,
        `SELECT p.consultation AS autorise
         FROM permissions p JOIN modules m ON p.module_id = m.id
         WHERE p.role_id = ? AND m.nom = ?`,
        [roleId, moduleNom]
    );
    return rows.length > 0 && !!rows[0].autorise;
}

// Modules RBAC associés à chaque outil (mêmes noms que dans la table "modules")
const TOOL_MODULES = {
    rechercher_produits_stock: 'Stock',
    lister_stock_bas: 'Stock',
    detail_mouvements_produit: 'Stock',
    lister_alertes_rupture: 'Stock',
    consulter_mes_permissions: 'Utilisateurs',
    lister_roles_entreprise: 'Utilisateurs'
    // expliquer_fonctionnement_plateforme : pas de module -> accessible à tous les internes
};

// ============================================================
// Déclarations au format Gemini (functionDeclarations)
// ============================================================
const TOOL_DECLARATIONS = [
    {
        name: 'rechercher_produits_stock',
        description: "Recherche un ou plusieurs produits par nom, référence ou code-barre, et renvoie leur prix, stock actuel et seuil d'alerte.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                recherche: { type: SchemaType.STRING, description: 'Nom, référence ou code-barre recherché.' }
            },
            required: ['recherche']
        }
    },
    {
        name: 'lister_stock_bas',
        description: "Liste les produits actifs dont le stock est au niveau ou en dessous de leur seuil d'alerte (rupture / à réapprovisionner).",
        parameters: { type: SchemaType.OBJECT, properties: {} }
    },
    {
        name: 'detail_mouvements_produit',
        description: "Donne l'historique récent des mouvements de stock (entrées/sorties/ajustements) d'un produit précis à partir de son identifiant.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                produit_id: { type: SchemaType.NUMBER, description: 'Identifiant du produit (obtenu via rechercher_produits_stock).' },
                limite: { type: SchemaType.NUMBER, description: 'Nombre max de mouvements à renvoyer (défaut 10).' }
            },
            required: ['produit_id']
        }
    },
    {
        name: 'lister_alertes_rupture',
        description: "Liste rapide (sans détail) des produits en alerte de rupture, pour une réponse synthétique.",
        parameters: { type: SchemaType.OBJECT, properties: {} }
    },
    {
        name: 'consulter_mes_permissions',
        description: "Renvoie les permissions RBAC (consultation/création/modification/suppression/validation/export) de l'utilisateur qui pose la question, module par module. À utiliser pour toute question du type 'ai-je le droit de...', 'quels sont mes accès'.",
        parameters: { type: SchemaType.OBJECT, properties: {} }
    },
    {
        name: 'lister_roles_entreprise',
        description: "Liste les rôles définis dans l'entreprise (nom, si admin entreprise ou non). Utile pour les questions sur l'organisation des accès.",
        parameters: { type: SchemaType.OBJECT, properties: {} }
    },
    {
        name: 'expliquer_fonctionnement_plateforme',
        description: "Renvoie une fiche explicative sur le fonctionnement général de la plateforme ERP (modules disponibles, rôles, sécurité, multi-tenant, essai gratuit...) pour un sujet donné. À utiliser pour toute question générale du type 'comment fonctionne la plateforme', 'c'est quoi le module X', 'comment marche la sécurité'.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                sujet: {
                    type: SchemaType.STRING,
                    description: "Sujet demandé.",
                    enum: ['general', 'modules', 'securite', 'roles_permissions', 'multi_tenant', 'essai_gratuit', 'mfa']
                }
            },
            required: ['sujet']
        }
    }
];

// ============================================================
// Base de connaissance statique (fonctionnement plateforme)
// ============================================================
const FICHES_PLATEFORME = {
    general: `La plateforme est un ERP multi-tenant : chaque entreprise dispose de sa propre base de données MySQL isolée. Modules principaux : Ventes (clients, devis, commandes, promotions), Achats (fournisseurs, bons de commande), Stock (produits, entrepôts, inventaires, mouvements), Finance (dépenses, recettes, paiements), Documents (GED), Utilisateurs (rôles et permissions).`,
    modules: `Chaque module est protégé par un système de permissions à 6 actions : consultation, création, modification, suppression, validation, export. Un Admin Entreprise a automatiquement tous les droits sur tous les modules ; les autres rôles sont configurés au cas par cas dans "Utilisateurs & Rôles".`,
    securite: `Sécurité : authentification par JWT, mots de passe hashés (bcrypt), MFA (TOTP) disponible par utilisateur, chiffrement AES-256-GCM des champs sensibles (email, téléphone, adresse), verrouillage de compte après tentatives échouées, suivi des sessions/appareils actifs, alertes de connexion suspecte.`,
    roles_permissions: `Chaque rôle a une matrice de permissions par module (consultation/création/modification/suppression/validation/export). L'Admin Entreprise a tout par défaut. Un compte externe (portail client) n'a pas de rôle interne : il ne voit que ses propres commandes/factures.`,
    multi_tenant: `Chaque entreprise a sa propre base de données (isolation totale des données). Une base "master" centralise uniquement les comptes, l'authentification et les informations d'abonnement.`,
    essai_gratuit: `Le plan d'essai offre 30 connexions gratuites. Une fois épuisées, l'accès aux modules métier est bloqué (mais aucune donnée n'est supprimée) ; l'entreprise peut exporter ses données ou souscrire un abonnement payant.`,
    mfa: `La MFA (authentification à deux facteurs) utilise un code TOTP (type Google Authenticator) avec des codes de secours. Elle se configure depuis "Sécurité MFA" dans le profil utilisateur.`
};

// ============================================================
// Implémentations
// ============================================================
const TOOL_IMPLEMENTATIONS = {
    async rechercher_produits_stock(db, { recherche }) {
        const like = `%${recherche}%`;
        const rows = await query(db,
            `SELECT id, nom, reference, code_barre, prix, quantite_stock, seuil_alerte, actif
             FROM produits WHERE (nom LIKE ? OR reference LIKE ? OR code_barre LIKE ?)
             ORDER BY nom ASC LIMIT 10`,
            [like, like, like]);
        if (rows.length === 0) return { resultat: 'Aucun produit trouvé.' };
        return { produits: rows.map(p => ({
            id: p.id, nom: p.nom, reference: p.reference, prix: Number(p.prix),
            stock_disponible: p.quantite_stock, en_dessous_du_seuil: p.quantite_stock <= p.seuil_alerte, actif: !!p.actif
        })) };
    },

    async lister_stock_bas(db) {
        const rows = await query(db,
            `SELECT id, nom, reference, quantite_stock, seuil_alerte
             FROM produits WHERE actif = 1 AND quantite_stock <= seuil_alerte
             ORDER BY quantite_stock ASC LIMIT 25`);
        if (rows.length === 0) return { resultat: 'Aucun produit en dessous de son seuil.' };
        return { produits_stock_bas: rows };
    },

    async detail_mouvements_produit(db, { produit_id, limite }) {
        const rows = await query(db,
            `SELECT type, quantite, ancien_stock, nouveau_stock, motif, created_at
             FROM mouvements_stock WHERE produit_id = ?
             ORDER BY created_at DESC LIMIT ?`,
            [produit_id, Math.min(Number(limite) || 10, 30)]);
        if (rows.length === 0) return { resultat: 'Aucun mouvement trouvé pour ce produit.' };
        return { mouvements: rows };
    },

    async lister_alertes_rupture(db) {
        const rows = await query(db,
            `SELECT nom, quantite_stock FROM produits
             WHERE actif = 1 AND quantite_stock <= seuil_alerte
             ORDER BY quantite_stock ASC LIMIT 15`);
        return { nombre_alertes: rows.length, produits: rows };
    },

    async consulter_mes_permissions(db, _args, user) {
        if (!user.role_id) return { resultat: "Ce compte n'a pas de rôle assigné." };
        const admin = await query(db, 'SELECT est_admin_entreprise FROM roles WHERE id = ?', [user.role_id]);
        if (admin.length && admin[0].est_admin_entreprise) {
            return { est_admin_entreprise: true, resultat: 'Ce compte est Admin Entreprise : accès total à tous les modules.' };
        }
        const rows = await query(db,
            `SELECT m.nom AS module_nom, p.consultation, p.creation, p.modification, p.suppression, p.validation, p.export
             FROM permissions p JOIN modules m ON p.module_id = m.id
             WHERE p.role_id = ? ORDER BY m.nom`, [user.role_id]);
        return { permissions: rows };
    },

    async lister_roles_entreprise(db) {
        const rows = await query(db, 'SELECT nom, description, est_admin_entreprise FROM roles ORDER BY nom');
        return { roles: rows };
    },

    async expliquer_fonctionnement_plateforme(db, { sujet }) {
        return { fiche: FICHES_PLATEFORME[sujet] || FICHES_PLATEFORME.general };
    }
};

async function executerOutil(nomOutil, argsObj, db, user) {
    const impl = TOOL_IMPLEMENTATIONS[nomOutil];
    if (!impl) return { erreur: `Outil inconnu : ${nomOutil}` };

    const moduleRequis = TOOL_MODULES[nomOutil];
    if (moduleRequis) {
        const autorise = await aLaPermission(db, user?.role_id, moduleRequis).catch(() => false);
        if (!autorise) {
            return { erreur: `Accès refusé : permission "consultation" manquante sur le module "${moduleRequis}".` };
        }
    }

    try {
        return await impl(db, argsObj || {}, user);
    } catch (err) {
        console.error(`[Gemini IA] Erreur outil ${nomOutil}:`, err.message);
        return { erreur: "Erreur lors de l'accès aux données de l'entreprise." };
    }
}

module.exports = { TOOL_DECLARATIONS, executerOutil };