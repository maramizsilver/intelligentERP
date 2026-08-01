/**
 * backend/utils/formCoherence.util.js
 * ---------------------------------------------------------------------------
 * Contrôles automatiques de cohérence des formulaires, en complément de la
 * validation de forme assurée par Joi (backend/middleware/validate.middleware.js).
 * Joi vérifie qu'un champ "est" du bon type ; ce module vérifie que
 * l'ENSEMBLE des champs d'un document est cohérent entre eux (règles métier).
 * ---------------------------------------------------------------------------
 */

const TOLERANCE_ARRONDI = 0.02; // tolérance en unité monétaire pour absorber les arrondis

/**
 * Vérifie la cohérence arithmétique d'un document financier (devis, facture,
 * bon de commande) : TTC = HT + TVA, et somme des lignes = HT global.
 */
function verifierCoherenceFinanciere({ montantHT, montantTVA, montantTTC, lignes = [] }) {
    const erreurs = [];

    if (typeof montantHT === 'number' && typeof montantTVA === 'number' && typeof montantTTC === 'number') {
        const ttcCalcule = montantHT + montantTVA;
        if (Math.abs(ttcCalcule - montantTTC) > TOLERANCE_ARRONDI) {
            erreurs.push({
                champ: 'montant_ttc',
                message: `Incohérence : HT (${montantHT}) + TVA (${montantTVA}) = ${ttcCalcule.toFixed(2)}, différent du TTC saisi (${montantTTC}).`
            });
        }
    }

    if (Array.isArray(lignes) && lignes.length > 0 && typeof montantHT === 'number') {
        const sommeLignes = lignes.reduce((acc, l) => acc + (Number(l.quantite || 0) * Number(l.prixUnitaireHT || 0)), 0);
        if (Math.abs(sommeLignes - montantHT) > TOLERANCE_ARRONDI) {
            erreurs.push({
                champ: 'montant_ht',
                message: `Incohérence : la somme des lignes (${sommeLignes.toFixed(2)}) ne correspond pas au total HT saisi (${montantHT}).`
            });
        }
    }

    return { coherent: erreurs.length === 0, erreurs };
}

/**
 * Vérifie la complétude d'un document avant enregistrement/génération :
 * s'assure qu'aucun champ obligatoire déclaré par le modèle n'est manquant
 * ou vide dans les données fournies par l'utilisateur.
 */
function verifierCompletude(champsObligatoires, donnees) {
    const manquants = champsObligatoires.filter(champ => {
        const valeur = donnees[champ];
        return valeur === undefined || valeur === null || String(valeur).trim() === '';
    });
    return { complet: manquants.length === 0, champsManquants: manquants };
}

/**
 * Point d'entrée unique combinant complétude + cohérence, utilisé juste avant
 * la génération d'un document Word ou l'enregistrement en base.
 */
function controlerFormulaireDocument({ donnees, champsObligatoires = [], estDocumentFinancier = false }) {
    const resultatCompletude = verifierCompletude(champsObligatoires, donnees);
    const erreurs = resultatCompletude.champsManquants.map(champ => ({
        champ, message: `Le champ "${champ}" est obligatoire.`
    }));

    if (estDocumentFinancier) {
        const resultatFinancier = verifierCoherenceFinanciere(donnees);
        erreurs.push(...resultatFinancier.erreurs);
    }

    return { valide: erreurs.length === 0, erreurs };
}

module.exports = {
    verifierCoherenceFinanciere,
    verifierCompletude,
    controlerFormulaireDocument
};
