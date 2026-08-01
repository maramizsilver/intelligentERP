/**
 * backend/services/ocr.service.js
 * ---------------------------------------------------------------------------
 * Numérisation intelligente : extraction du texte d'un document scanné
 * (image ou PDF scanné) via OCR, puis reconnaissance de champs structurés
 * courants (CIN, matricule fiscal, téléphone, e-mail, montants, dates)
 * afin d'alimenter automatiquement la saisie intelligente (autofill.service.js).
 *
 * Dépendance à ajouter dans backend/package.json :
 *   npm install tesseract.js
 * ---------------------------------------------------------------------------
 */

const Tesseract = require('tesseract.js');

// Langues Tesseract disponibles : fra (français), eng (anglais), ara (arabe)
const LANGUES_SUPPORTEES = { fr: 'fra', en: 'eng', ar: 'ara' };

/**
 * Exécute l'OCR sur une image (chemin fichier ou buffer).
 * @param {string|Buffer} source
 * @param {string} [langue='fr']
 * @returns {Promise<{texte:string, confiance:number}>}
 */
async function extraireTexte(source, langue = 'fr') {
    const codeLangue = LANGUES_SUPPORTEES[langue] || 'fra';
    const { data } = await Tesseract.recognize(source, codeLangue, {
        logger: () => {} // silencieux ; brancher un logger applicatif si besoin de progression
    });
    return { texte: data.text, confiance: data.confidence };
}

// ============================================================
// RECONNAISSANCE DE CHAMPS STRUCTURÉS DANS LE TEXTE OCRISÉ
// ============================================================
const PATTERNS = {
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
    telephone: /(?:\+216|00216)?\s?\d{2}\s?\d{3}\s?\d{3}\b/,
    cin: /\b\d{8}\b/, // CIN tunisienne : 8 chiffres
    matriculeFiscal: /\b\d{7}[A-Z]{1}\/?[A-Z]{3}\/?\d{3}\b/i,
    date: /\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/,
    montant: /\b\d{1,3}(?:[ .]\d{3})*(?:[,.]\d{1,3})?\s?(?:DT|TND|EUR|USD|€|\$)?\b/g
};

/**
 * Extrait les champs métier probables d'un texte OCRisé.
 * Retourne un objet directement exploitable pour préremplir un formulaire
 * (ex: création automatique d'une fiche client à partir d'une CIN scannée).
 */
function detecterChampsStructures(texte) {
    const resultat = {};

    const email = texte.match(PATTERNS.email);
    if (email) resultat.email = email[0];

    const tel = texte.match(PATTERNS.telephone);
    if (tel) resultat.telephone = tel[0].replace(/\s+/g, ' ').trim();

    const cin = texte.match(PATTERNS.cin);
    if (cin) resultat.numero_cin = cin[0];

    const matriculeFiscal = texte.match(PATTERNS.matriculeFiscal);
    if (matriculeFiscal) resultat.matricule_fiscal = matriculeFiscal[0];

    const date = texte.match(PATTERNS.date);
    if (date) resultat.date_detectee = date[0];

    return resultat;
}

/**
 * Pipeline complet : scan -> texte -> champs structurés.
 */
async function numeriserEtAnalyser(source, langue = 'fr') {
    const { texte, confiance } = await extraireTexte(source, langue);
    const champs = detecterChampsStructures(texte);
    return { texte, confiance, champsDetectes: champs };
}

module.exports = {
    extraireTexte,
    detecterChampsStructures,
    numeriserEtAnalyser,
    LANGUES_SUPPORTEES
};
