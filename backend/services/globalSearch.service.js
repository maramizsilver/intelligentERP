/**
 * backend/services/globalSearch.service.js
 * ---------------------------------------------------------------------------
 * Moteur de recherche global transversal (CRM, Ventes, Achats, RH, ...).
 * Recherche par nom, prénom, CIN, téléphone, e-mail, matricule ou mot-clé
 * libre, sur l'ensemble des tables métier de la base tenant courante.
 *
 * IMPORTANT : colonnes chiffrées (AES-256-GCM) :
 * `email`, `telephone` et `adresse` sont chiffrées au repos avec un IV
 * aléatoire à chaque chiffrement.
 *  Un `LIKE '%...%'` SQL sur ces colonnes ne
 * peut donc JAMAIS matcher. Pour ces colonnes, on récupère les lignes
 * candidates, on déchiffre en mémoire, puis on filtre côté application.
 * ---------------------------------------------------------------------------
 */

const encryptionService = require('./encryption.service');

// Colonnes réellement chiffrées en base
const CHAMPS_CHIFFRES = encryptionService
    .getEncryptedFieldNames()
    .filter(f => ['email', 'telephone', 'adresse'].includes(f));

// Déclaration des "cibles" de recherche.
const SEARCH_TARGETS = [
    {
        table: 'clients',
        module: 'CRM / Ventes',
        permission: 'Ventes',
        colonnes: ['nom', 'prenom', 'raison_sociale', 'numero_cin', 'telephone', 'email', 'matricule_fiscal'],
        colonnesChiffrees: CHAMPS_CHIFFRES,
        libelle: (r) => r.raison_sociale || `${r.nom || ''} ${r.prenom || ''}`.trim()
    },
    {
        table: 'fournisseurs',
        module: 'Achats',
        permission: 'Achats',
        colonnes: ['nom', 'raison_sociale', 'telephone', 'email', 'matricule_fiscal'],
        colonnesChiffrees: CHAMPS_CHIFFRES,
        libelle: (r) => r.raison_sociale || r.nom
    },
    {
        table: 'produits',
        module: 'Stock / Produits',
        permission: 'Stock',
        colonnes: ['nom', 'reference', 'code_barre'],
        libelle: (r) => `${r.nom} (${r.reference || 'sans réf.'})`
    },
    // ⛔ Entrée `users` SUPPRIMÉE (confidentialité RH : pas de recherche
    // globale sur les employés).
    {
        table: 'devis',
        module: 'Ventes',
        permission: 'Ventes',
        colonnes: ['numero_devis', 'reference'],
        libelle: (r) => r.numero_devis || `Devis #${r.id}`
    },
    {
        table: 'commandes',
        module: 'Ventes / Achats',
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
 * Vérifie dynamiquement l'existence des colonnes déclarées.
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

        const colonnesChiffrees = colonnes.filter(c => (cible.colonnesChiffrees || []).includes(c));
        const colonnesClaires = colonnes.filter(c => !colonnesChiffrees.includes(c));

        // ✅ `donnees: r` SUPPRIMÉ : on ne renvoie plus la ligne brute au front.
        const construireResultat = (r) => ({
            module: cible.module,
            table: cible.table,
            id: r.id,
            libelle: cible.libelle(r),
            extrait: colonnes
                .map(c => (colonnesChiffrees.includes(c) ? encryptionService.decryptSafe(r[c]) : r[c]))
                .filter(Boolean)
                .slice(0, 3)
                .join(' · ')
        });

        if (colonnesChiffrees.length === 0) {
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

        // Cas avec colonnes chiffrées : déchiffrement en mémoire.
        const motCleLower = motCle.trim().toLowerCase();
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