/**
 * backend/services/numberToWords.service.js
 * ---------------------------------------------------------------------------
 * Conversion des montants numériques en toutes lettres.
 * Utilisé par le module documentaire pour générer automatiquement la mention
 * "Arrêté le présent devis/facture à la somme de ..." dans les documents
 * Word générés (devis, factures, bons de commande, contrats).
 *
 * Langues supportées : fr, en, ar
 * Devises supportées : TND, EUR, USD (facilement extensible via CURRENCIES)
 * ---------------------------------------------------------------------------
 */

// ============================================================
// CONFIGURATION DES DEVISES
// ============================================================
const CURRENCIES = {
    TND: {
        fr: { unit: 'dinar', unitPlural: 'dinars', sub: 'millime', subPlural: 'millimes', subDecimals: 3 },
        en: { unit: 'dinar', unitPlural: 'dinars', sub: 'millime', subPlural: 'millimes', subDecimals: 3 },
        ar: { unit: 'دينار', unitPlural: 'دينار', sub: 'مليم', subPlural: 'مليم', subDecimals: 3 }
    },
    EUR: {
        fr: { unit: 'euro', unitPlural: 'euros', sub: 'centime', subPlural: 'centimes', subDecimals: 2 },
        en: { unit: 'euro', unitPlural: 'euros', sub: 'cent', subPlural: 'cents', subDecimals: 2 },
        ar: { unit: 'يورو', unitPlural: 'يورو', sub: 'سنت', subPlural: 'سنت', subDecimals: 2 }
    },
    USD: {
        fr: { unit: 'dollar', unitPlural: 'dollars', sub: 'cent', subPlural: 'cents', subDecimals: 2 },
        en: { unit: 'dollar', unitPlural: 'dollars', sub: 'cent', subPlural: 'cents', subDecimals: 2 },
        ar: { unit: 'دولار', unitPlural: 'دولار', sub: 'سنت', subPlural: 'سنت', subDecimals: 2 }
    }
};

// ============================================================
// FRANÇAIS
// ============================================================
const FR_UNITES = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
    'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
const FR_DIZAINES = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];

function frDeuxChiffres(n) {
    if (n < 20) return FR_UNITES[n];
    const d = Math.floor(n / 10);
    const u = n % 10;
    if (d === 7 || d === 9) {
        // soixante-dix / quatre-vingt-dix
        const base = FR_DIZAINES[d - 1];
        return `${base}-${FR_UNITES[10 + u]}`;
    }
    if (u === 0) return FR_DIZAINES[d] + (d === 8 ? 's' : '');
    if (u === 1 && d !== 8) return `${FR_DIZAINES[d]}-et-un`;
    return `${FR_DIZAINES[d]}-${FR_UNITES[u]}`;
}

function frTroisChiffres(n, showCent = true) {
    const c = Math.floor(n / 100);
    const reste = n % 100;
    let s = '';
    if (c > 0) {
        s += (c === 1 ? 'cent' : `${FR_UNITES[c]} cent`);
        if (c > 1 && reste === 0) s += 's';
        if (reste > 0) s += ' ';
    }
    if (reste > 0) s += frDeuxChiffres(reste);
    return s.trim();
}

function nombreEnLettresFR(nombre) {
    let n = Math.floor(Math.abs(nombre));
    if (n === 0) return 'zéro';

    const tranches = [
        { valeur: 1000000000, singulier: 'milliard', pluriel: 'milliards' },
        { valeur: 1000000, singulier: 'million', pluriel: 'millions' },
        { valeur: 1000, singulier: 'mille', pluriel: 'mille' }
    ];

    let mots = [];
    for (const tranche of tranches) {
        const q = Math.floor(n / tranche.valeur);
        if (q > 0) {
            if (tranche.valeur === 1000 && q === 1) {
                mots.push('mille');
            } else {
                mots.push(`${frTroisChiffres(q)} ${q > 1 ? tranche.pluriel : tranche.singulier}`);
            }
            n %= tranche.valeur;
        }
    }
    if (n > 0) mots.push(frTroisChiffres(n));

    return mots.join(' ').replace(/\s+/g, ' ').trim();
}

// ============================================================
// ANGLAIS
// ============================================================
const EN_UNITS = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
    'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const EN_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function enTwoDigits(n) {
    if (n < 20) return EN_UNITS[n];
    const t = Math.floor(n / 10);
    const u = n % 10;
    return u === 0 ? EN_TENS[t] : `${EN_TENS[t]}-${EN_UNITS[u]}`;
}

function enThreeDigits(n) {
    const h = Math.floor(n / 100);
    const rest = n % 100;
    let s = '';
    if (h > 0) s += `${EN_UNITS[h]} hundred`;
    if (rest > 0) s += (h > 0 ? ' and ' : '') + enTwoDigits(rest);
    return s;
}

function numberToWordsEN(nombre) {
    let n = Math.floor(Math.abs(nombre));
    if (n === 0) return 'zero';

    const scales = [
        { value: 1000000000, name: 'billion' },
        { value: 1000000, name: 'million' },
        { value: 1000, name: 'thousand' }
    ];

    let words = [];
    for (const scale of scales) {
        const q = Math.floor(n / scale.value);
        if (q > 0) {
            words.push(`${enThreeDigits(q)} ${scale.name}`);
            n %= scale.value;
        }
    }
    if (n > 0) words.push(enThreeDigits(n));

    return words.join(' ').replace(/\s+/g, ' ').trim();
}

// ============================================================
// ARABE (implémentation simplifiée — les règles d'accord grammatical
// complexes de l'arabe (genre, nombre 3-10 vs 11+) sont approximées ;
// à valider par un relecteur natif avant usage juridique/officiel)
// ============================================================
const AR_UNITES = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة',
    'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
const AR_DIZAINES = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
const AR_CENTAINES = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

function arDeuxChiffres(n) {
    if (n < 20) return AR_UNITES[n];
    const d = Math.floor(n / 10);
    const u = n % 10;
    if (u === 0) return AR_DIZAINES[d];
    return `${AR_UNITES[u]} و${AR_DIZAINES[d]}`;
}

function arTroisChiffres(n) {
    const c = Math.floor(n / 100);
    const reste = n % 100;
    let parts = [];
    if (c > 0) parts.push(AR_CENTAINES[c]);
    if (reste > 0) parts.push(arDeuxChiffres(reste));
    return parts.join(' و');
}

function numberToWordsAR(nombre) {
    let n = Math.floor(Math.abs(nombre));
    if (n === 0) return 'صفر';

    const tranches = [
        { valeur: 1000000000, mot: 'مليار' },
        { valeur: 1000000, mot: 'مليون' },
        { valeur: 1000, mot: 'ألف' }
    ];

    let parts = [];
    for (const tranche of tranches) {
        const q = Math.floor(n / tranche.valeur);
        if (q > 0) {
            parts.push(q === 1 ? tranche.mot : `${arTroisChiffres(q)} ${tranche.mot}`);
            n %= tranche.valeur;
        }
    }
    if (n > 0) parts.push(arTroisChiffres(n));

    return parts.join(' و').trim();
}

// ============================================================
// FONCTION PRINCIPALE
// ============================================================
/**
 * Convertit un montant en toutes lettres, avec gestion de la devise.
 * @param {number} montant - montant à convertir (ex: 1234.560)
 * @param {Object} options
 * @param {'fr'|'en'|'ar'} [options.langue='fr']
 * @param {'TND'|'EUR'|'USD'} [options.devise='TND']
 * @returns {string} montant en toutes lettres
 */
function montantEnLettres(montant, options = {}) {
    const langue = (options.langue || 'fr').toLowerCase();
    const deviseCode = (options.devise || 'TND').toUpperCase();
    const devise = CURRENCIES[deviseCode] ? CURRENCIES[deviseCode][langue] : null;

    if (!devise) {
        throw new Error(`Devise/langue non supportée : ${deviseCode}/${langue}`);
    }
    if (typeof montant !== 'number' || Number.isNaN(montant)) {
        throw new Error('Montant invalide');
    }

    const negatif = montant < 0;
    const partieEntiere = Math.floor(Math.abs(montant));
    const facteurDecimal = Math.pow(10, devise.subDecimals);
    const partieDecimale = Math.round((Math.abs(montant) - partieEntiere) * facteurDecimal);

    let convertisseur;
    if (langue === 'en') convertisseur = numberToWordsEN;
    else if (langue === 'ar') convertisseur = numberToWordsAR;
    else convertisseur = nombreEnLettresFR;

    const unitMot = partieEntiere > 1 ? devise.unitPlural : devise.unit;
    const subMot = partieDecimale > 1 ? devise.subPlural : devise.sub;

    let resultat;
    if (langue === 'ar') {
        resultat = `${convertisseur(partieEntiere)} ${unitMot}`;
        if (partieDecimale > 0) {
            resultat += ` و${convertisseur(partieDecimale)} ${subMot}`;
        }
    } else if (langue === 'en') {
        resultat = `${convertisseur(partieEntiere)} ${unitMot}`;
        if (partieDecimale > 0) {
            resultat += ` and ${convertisseur(partieDecimale)} ${subMot}`;
        }
        resultat = resultat.charAt(0).toUpperCase() + resultat.slice(1);
    } else {
        resultat = `${convertisseur(partieEntiere)} ${unitMot}`;
        if (partieDecimale > 0) {
            resultat += ` et ${convertisseur(partieDecimale)} ${subMot}`;
        }
        resultat = resultat.charAt(0).toUpperCase() + resultat.slice(1);
    }

    if (negatif) {
        const prefixe = { fr: 'moins ', en: 'minus ', ar: 'سالب ' }[langue];
        resultat = prefixe + resultat;
    }

    return resultat.replace(/\s+/g, ' ').trim();
}

/**
 * Génère en une seule fois les mentions HT / TVA / TTC en lettres,
 * pratique pour l'injection directe dans un template docx (devis/facture).
 */
function genererMentionsMontants({ montantHT, montantTVA, montantTTC, langue = 'fr', devise = 'TND' }) {
    return {
        montant_ht_lettres: montantEnLettres(montantHT, { langue, devise }),
        montant_tva_lettres: montantEnLettres(montantTVA, { langue, devise }),
        montant_ttc_lettres: montantEnLettres(montantTTC, { langue, devise })
    };
}

module.exports = {
    montantEnLettres,
    genererMentionsMontants,
    CURRENCIES
};
