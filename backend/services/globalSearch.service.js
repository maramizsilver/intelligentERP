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
 *
 * IMPORTANT — colonnes chiffrées (AES-256-GCM) :
 * `email`, `telephone` et `adresse` sont chiffrées au repos (voir
 * encryption.service.js) avec un IV aléatoire à chaque chiffrement. Un
 * `LIKE '%...%'` SQL sur ces colonnes ne peut donc JAMAIS matcher, même
 * avec la bonne clé, puisque deux chiffrements de la même valeur ne
 * produisent jamais le même texte chiffré. Pour ces colonnes, on ne peut
 * pas filtrer en SQL : on récupère les lignes candidates, on déchiffre en
 * mémoire, puis on filtre côté application (voir `colonnesChiffrees`
 * ci-dessous et `rechercheGlobale`).
 * ---------------------------------------------------------------------------
 */

const encryptionService = require('./encryption.service');

// Colonnes réellement chiffrées en base (doit rester cohérent avec les
// SENSITIVE_FIELDS déclarés dans clientController.js / fournisseurController.js)
const CHAMPS_CHIFFRES = encryptionService
    .getEncryptedFieldNames()
    .filter(f => ['email', 'telephone', 'adresse'].includes(f));

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
        // ⚠️ Doit correspondre au nom du module de permission réellement utilisé
        // dans clientRoutes.js (checkPermission('Ventes', ...)), pas 'Clients'.
        permission: 'Ventes',
        colonnes: ['nom', 'prenom', 'raison_sociale', 'numero_cin', 'telephone', 'email', 'matricule_fiscal'],
        // Sous-ensemble de "colonnes" qui est chiffré en base pour cette table
        colonnesChiffrees: CHAMPS_CHIFFRES,
        libelle: (r) => r.raison_sociale || `${r.nom || ''} ${r.prenom || ''}`.trim()
    },
    {
        table: 'fournisseurs',
        module: 'Achats',
        // Correspond à checkPermission('Achats', ...) dans fournisseurRoutes.js
        permission: 'Achats',
        colonnes: ['nom', 'raison_sociale', 'telephone', 'email', 'matricule_fiscal'],
        colonnesChiffrees: CHAMPS_CHIFFRES,
        libelle: (r) => r.raison_sociale || r.nom
    },
    {
        table: 'produits',
        module: 'Stock / Produits',
        // Correspond à checkPermission('Stock', ...) dans produitRoutes.js
        permission: 'Stock',
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
        // Correspond à checkPermission('Ventes', ...) dans devisRoutes.js
        permission: 'Ventes',
        colonnes: ['numero_devis', 'reference'],
        libelle: (r) => r.numero_devis || `Devis #${r.id}`
    },
    {
        table: 'commandes',
        module: 'Ventes / Achats',
        // Correspond à checkPermission('Ventes', ...) dans commandeRoutes.js
        permission: 'Ventes',
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

        // On sépare les colonnes en clair (filtrables en SQL) des colonnes
        // chiffrées (qu'il faut déchiffrer en mémoire pour les comparer)
        const colonnesChiffrees = colonnes.filter(c => (cible.colonnesChiffrees || []).includes(c));
        const colonnesClaires = colonnes.filter(c => !colonnesChiffrees.includes(c));

        const construireResultat = (r) => ({
            module: cible.module,
            table: cible.table,
            id: r.id,
            libelle: cible.libelle(r),
            extrait: colonnes
                .map(c => (colonnesChiffrees.includes(c) ? encryptionService.decryptSafe(r[c]) : r[c]))
                .filter(Boolean)
                .slice(0, 3)
                .join(' · '),
            donnees: r
        });

        if (colonnesChiffrees.length === 0) {
            // Cas simple : aucune colonne chiffrée dans cette cible -> LIKE SQL classique
            const conditions = colonnesClaires.map(c => `${c} LIKE ?`).join(' OR ');
            const params = colonnesClaires.map(() => motRecherche);
            const sql = `SELECT * FROM ${cible.table} WHERE ${conditions} LIMIT ${Number(limitParTable)}`;

            return new Promise((resolve) => {
                db.query(sql, params, (err, rows) => {
                    if (err) {
                        console.error(`[rechercheGlobale] Erreur sur la table ${cible.table}:`, err.message);
                        return resolve([]);
                    }
                    resolve(rows.map(construireResultat));
                });
            });
        }

        // Cas avec colonnes chiffrées : un LIKE SQL est impossible (AES-GCM avec
        // IV aléatoire -> même valeur en clair = chiffré différent à chaque fois).
        // On récupère les lignes candidates puis on filtre en mémoire après
        // déchiffrement. Le LIKE SQL sur les colonnes en clair reste utilisé pour
        // réduire le nombre de lignes remontées quand c'est possible.
        const motCleLower = motCle.trim().toLowerCase();

        // On ne peut pas restreindre en SQL sur les colonnes chiffrées : on
        // charge la table (limitée à un plafond raisonnable côté sécurité/
        // performance) et on filtre en mémoire après déchiffrement.
        const PLAFOND_LECTURE = 5000;
        const sql = `SELECT * FROM ${cible.table} LIMIT ${PLAFOND_LECTURE}`;

        return new Promise((resolve) => {
            db.query(sql, [], (err, rows) => {
                if (err) {
                    console.error(`[rechercheGlobale] Erreur sur la table ${cible.table}:`, err.message);
                    return resolve([]);
                }

                const correspond = (r) => {
                    const matchClair = colonnesClaires.some(c =>
                        r[c] && String(r[c]).toLowerCase().includes(motCleLower)
                    );
                    if (matchClair) return true;

                    return colonnesChiffrees.some(c => {
                        const valeurClaire = encryptionService.decryptSafe(r[c]);
                        return valeurClaire && String(valeurClaire).toLowerCase().includes(motCleLower);
                    });
                };

                const resultats = rows
                    .filter(correspond)
                    .slice(0, Number(limitParTable))
                    .map(construireResultat);

                resolve(resultats);
            });
        });
    });

    const resultatsParTable = await Promise.all(requetes);
    const resultats = resultatsParTable.flat();

    return { resultats, total: resultats.length };
}

module.exports = { rechercheGlobale, SEARCH_TARGETS };