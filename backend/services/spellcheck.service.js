/**
 * backend/services/spellcheck.service.js
 * ---------------------------------------------------------------------------
 * Dictionnaire intelligent : correction orthographique, suggestions de mots
 * et assistance à la formulation, utilisable par tous les champs de saisie
 * texte de la plateforme (descriptions produit, notes de commande, contrats...).
 *
 * S'appuie sur le moteur LanguageTool (open-source, multi-langue : fr/en/ar).
 * -> En développement : utilise l'API publique https://api.languagetool.org
 * -> En production : auto-héberger LanguageTool (image Docker officielle
 *    "erikvl87/languagetool") pour la confidentialité des données et éviter
 *    les limites de débit de l'API publique. Définir LANGUAGETOOL_URL dans .env.
 * ---------------------------------------------------------------------------
 */

const LANGUAGETOOL_URL = process.env.LANGUAGETOOL_URL || 'https://api.languagetool.org/v2/check';

const CODES_LANGUE = { fr: 'fr', en: 'en-US', ar: 'ar' };

/**
 * Vérifie un texte et retourne la liste des corrections suggérées.
 * @param {string} texte
 * @param {'fr'|'en'|'ar'} [langue='fr']
 * @returns {Promise<{fautes: Array, texteOriginal:string}>}
 */
async function verifierTexte(texte, langue = 'fr') {
    if (!texte || !texte.trim()) return { fautes: [], texteOriginal: texte };

    const params = new URLSearchParams({
        text: texte,
        language: CODES_LANGUE[langue] || 'fr'
    });

    const reponse = await fetch(LANGUAGETOOL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    });

    if (!reponse.ok) {
        throw new Error(`Service de correction indisponible (${reponse.status})`);
    }

    const data = await reponse.json();

    const fautes = (data.matches || []).map(match => ({
        message: match.message,
        offset: match.offset,
        longueur: match.length,
        extraitFautif: texte.substring(match.offset, match.offset + match.length),
        suggestions: (match.replacements || []).slice(0, 5).map(r => r.value),
        categorie: match.rule?.category?.name || 'Orthographe/Grammaire'
    }));

    return { fautes, texteOriginal: texte };
}

/**
 * Applique automatiquement la première suggestion pour chaque faute détectée
 * (utile pour un bouton "Corriger tout" côté front).
 */
function appliquerCorrections(texte, fautes) {
    // On applique du dernier offset vers le premier pour ne pas décaler les indices
    const fautesTriees = [...fautes]
        .filter(f => f.suggestions && f.suggestions.length > 0)
        .sort((a, b) => b.offset - a.offset);

    let resultat = texte;
    for (const faute of fautesTriees) {
        resultat = resultat.slice(0, faute.offset) + faute.suggestions[0] + resultat.slice(faute.offset + faute.longueur);
    }
    return resultat;
}

module.exports = { verifierTexte, appliquerCorrections };
