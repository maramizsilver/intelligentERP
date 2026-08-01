/**
 * backend/services/globalSearch.service.js
 * ---------------------------------------------------------------------------
 * Moteur de recherche global transversal (CRM, Ventes, Achats, RH, ...).
 * Recherche par nom, prénom, CIN, téléphone, e-mail, matricule ou mot-clé
 * libre, sur l'ensemble des tables métier de la base tenant courante.
 *
 * Conçu pour rester déclaratif : ajouter un nouveau module de recherche
 * (ex: RH -> table "employes") ne nécessite qu'une entrée dans SEARCH_TARGETS,
 * aucune autre modification n'est requise (réutilisabilité inter-modules).
 * ---------------------------------------------------------------------------
 */

// Déclaration des "cibles" de recherche. Chaque entrée décrit :
// - table : nom de la table dans la base tenant
// - module : libellé du module ERP correspondant (pour l'affichage/le filtre)
// - permission : nom du module de permission à vérifier avant de renvoyer les résultats
// - colonnes : colonnes textuelles interrogées (LIKE)
// - libelle : fonction qui construit le libellé d'affichage à partir d'une ligne
const SEARCH_TARGETS = [
    {
        table: 'clients',
        module: 'CRM / Ventes',
        permission: 'Clients',
        colonnes: ['nom', 'prenom', 'raison_sociale', 'numero_cin', 'telephone', 'email', 'matricule_fiscal'],
        libelle: (r) => r.raison_sociale || `${r.nom || ''} ${r.prenom || ''}`.trim()
    },
    {
        table: 'fournisseurs',
        module: 'Achats',
        permission: 'Fournisseurs',
        colonnes: ['nom', 'raison_sociale', 'telephone', 'email', 'matricule_fiscal'],
        libelle: (r) => r.raison_sociale || r.nom
    },
    {
        table: 'produits',
        module: 'Stock / Produits',
        permission: 'Produits',
        colonnes: ['nom', 'reference', 'code_barre'],
        libelle: (r) => `${r.nom} (${r.reference || 'sans réf.'})`
    },
    {
        table: 'users',
        module: 'Ressources Humaines',
        permission: 'Utilisateurs',
        colonnes: ['nom', 'prenom', 'email', 'telephone', 'matricule'],
        libelle: (r) => `${r.nom || ''} ${r.prenom || ''}`.trim()
    },
    {
        table: 'devis',
        module: 'Ventes',
        permission: 'Devis',
        colonnes: ['numero_devis', 'reference'],
        libelle: (r) => r.numero_devis || `Devis #${r.id}`
    },
    {
        table: 'commandes',
        module: 'Ventes / Achats',
        permission: 'Commandes',
        colonnes: ['numero_commande', 'reference'],
        libelle: (r) => r.numero_commande || `Commande #${r.id}`
    },
    {
        table: 'documents',
        module: 'GED',
        permission: 'Documents',
        colonnes: ['nom', 'nom_original'],
        libelle: (r) => r.nom || r.nom_original
    }
];

/**
 * Vérifie dynamiquement (INFORMATION_SCHEMA) l'existence des colonnes déclarées,
 * afin d'éviter une erreur SQL si un module n'a pas encore telle colonne
 * (compatibilité ascendante entre bases tenant à des stades de migration différents).
 */
function colonnesExistantes(db, table, colonnesSouhaitees) {
    return new Promise((resolve, reject) => {
        db.query(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
            [table],
            (err, rows) => {
                if (err) return reject(err);
                const existantes = new Set(rows.map(r => r.COLUMN_NAME));
                resolve(colonnesSouhaitees.filter(c => existantes.has(c)));
            }
        );
    });
}

function tableExiste(db, table) {
    return new Promise((resolve, reject) => {
        db.query(
            `SELECT COUNT(*) AS n FROM INFORMATION_SCHEMA.TABLES
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
            [table],
            (err, rows) => {
                if (err) return reject(err);
                resolve(rows[0].n > 0);
            }
        );
    });
}

/**
 * Recherche transversale.
 * @param {object} db - pool tenant (req.db)
 * @param {string} motCle
 * @param {object} options
 * @param {(module:string)=>boolean} [options.aAcces] - callback de vérification de permission par module
 * @param {string[]} [options.modules] - limiter la recherche à certains modules/tables
 * @param {number} [options.limitParTable=10]
 */
async function rechercheGlobale(db, motCle, options = {}) {
    const { aAcces = () => true, modules = null, limitParTable = 10 } = options;

    if (!motCle || motCle.trim().length < 2) {
        return { resultats: [], total: 0, message: 'Saisissez au moins 2 caractères.' };
    }

    const motRecherche = `%${motCle.trim()}%`;
    const cibles = SEARCH_TARGETS.filter(t =>
        (!modules || modules.includes(t.table)) && aAcces(t.permission)
    );

    const requetes = cibles.map(async (cible) => {
        const existeTable = await tableExiste(db, cible.table);
        if (!existeTable) return [];

        const colonnes = await colonnesExistantes(db, cible.table, cible.colonnes);
        if (colonnes.length === 0) return [];

        const conditions = colonnes.map(c => `${c} LIKE ?`).join(' OR ');
        const params = colonnes.map(() => motRecherche);
        const sql = `SELECT * FROM ${cible.table} WHERE ${conditions} LIMIT ${Number(limitParTable)}`;

        return new Promise((resolve) => {
            db.query(sql, params, (err, rows) => {
                if (err) {
                    console.error(`[rechercheGlobale] Erreur sur la table ${cible.table}:`, err.message);
                    return resolve([]);
                }
                resolve(rows.map(r => ({
                    module: cible.module,
                    table: cible.table,
                    id: r.id,
                    libelle: cible.libelle(r),
                    extrait: colonnes
                        .map(c => r[c])
                        .filter(Boolean)
                        .slice(0, 3)
                        .join(' · '),
                    donnees: r
                })));
            });
        });
    });

    const resultatsParTable = await Promise.all(requetes);
    const resultats = resultatsParTable.flat();

    return { resultats, total: resultats.length };
}

module.exports = { rechercheGlobale, SEARCH_TARGETS };
