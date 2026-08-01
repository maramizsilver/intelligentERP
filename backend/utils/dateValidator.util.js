/**
 * backend/utils/dateValidator.util.js
 * ---------------------------------------------------------------------------
 * Brique "calendrier intelligent" côté serveur : valide, normalise et
 * uniformise le format des dates saisies partout dans la plateforme,
 * quel que soit le format d'entrée (ISO, JJ/MM/AAAA, MM/JJ/AAAA, texte FR).
 * Le composant front SmartDatePicker (voir frontend/components) s'appuie
 * sur le même format de sortie pour garantir la cohérence UI <-> API <-> DB.
 * ---------------------------------------------------------------------------
 */

const FORMAT_STOCKAGE = 'YYYY-MM-DD'; // format unique utilisé pour la persistance MySQL (DATE)

const MOIS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

function estAnneeBissextile(annee) {
    return (annee % 4 === 0 && annee % 100 !== 0) || annee % 400 === 0;
}

function joursDansMois(mois, annee) {
    const jours = [31, estAnneeBissextile(annee) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return jours[mois - 1];
}

/**
 * Tente de parser une date saisie sous plusieurs formats courants.
 * @param {string} valeur
 * @returns {{ jour:number, mois:number, annee:number } | null}
 */
function parserDate(valeur) {
    if (!valeur || typeof valeur !== 'string') return null;
    const v = valeur.trim();

    // ISO : 2026-08-01
    let m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) return { annee: +m[1], mois: +m[2], jour: +m[3] };

    // JJ/MM/AAAA ou JJ-MM-AAAA (format courant FR/TN)
    m = v.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m) return { jour: +m[1], mois: +m[2], annee: +m[3] };

    // JJ/MM/AA
    m = v.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
    if (m) return { jour: +m[1], mois: +m[2], annee: 2000 + (+m[3]) };

    // "1 août 2026"
    m = v.match(/^(\d{1,2})\s+([a-zéû]+)\s+(\d{4})$/i);
    if (m) {
        const idx = MOIS_FR.findIndex(mois => mois === m[2].toLowerCase());
        if (idx !== -1) return { jour: +m[1], mois: idx + 1, annee: +m[3] };
    }

    return null;
}

/**
 * Valide une date candidate (existence calendaire réelle : jours du mois,
 * années bissextiles, etc.) et retourne un rapport détaillé exploitable
 * directement par le contrôle de formulaire côté back et par le composant
 * front pour afficher un message d'erreur ciblé.
 */
function validerDate(valeur, options = {}) {
    const { autoriserPasse = true, autoriserFutur = true, dateMin = null, dateMax = null } = options;

    const parsed = parserDate(valeur);
    if (!parsed) {
        return { valide: false, erreur: "FORMAT_NON_RECONNU", message: "Format de date non reconnu. Utilisez JJ/MM/AAAA." };
    }

    const { jour, mois, annee } = parsed;

    if (mois < 1 || mois > 12) {
        return { valide: false, erreur: 'MOIS_INVALIDE', message: `Le mois ${mois} est invalide (1-12 attendu).` };
    }
    if (annee < 1900 || annee > 2100) {
        return { valide: false, erreur: 'ANNEE_INVALIDE', message: `L'année ${annee} semble incorrecte.` };
    }
    const maxJour = joursDansMois(mois, annee);
    if (jour < 1 || jour > maxJour) {
        return { valide: false, erreur: 'JOUR_INVALIDE', message: `Le mois ${mois}/${annee} comporte au maximum ${maxJour} jours.` };
    }

    const dateObj = new Date(Date.UTC(annee, mois - 1, jour));
    const aujourdHui = new Date();
    aujourdHui.setUTCHours(0, 0, 0, 0);

    if (!autoriserPasse && dateObj < aujourdHui) {
        return { valide: false, erreur: 'DATE_PASSEE_INTERDITE', message: "Cette date ne peut pas être antérieure à aujourd'hui." };
    }
    if (!autoriserFutur && dateObj > aujourdHui) {
        return { valide: false, erreur: 'DATE_FUTURE_INTERDITE', message: "Cette date ne peut pas être postérieure à aujourd'hui." };
    }
    if (dateMin) {
        const min = parserDate(dateMin);
        if (min && dateObj < new Date(Date.UTC(min.annee, min.mois - 1, min.jour))) {
            return { valide: false, erreur: 'ANTERIEURE_AU_MIN', message: `La date doit être postérieure ou égale au ${dateMin}.` };
        }
    }
    if (dateMax) {
        const max = parserDate(dateMax);
        if (max && dateObj > new Date(Date.UTC(max.annee, max.mois - 1, max.jour))) {
            return { valide: false, erreur: 'POSTERIEURE_AU_MAX', message: `La date doit être antérieure ou égale au ${dateMax}.` };
        }
    }

    return {
        valide: true,
        iso: `${String(annee).padStart(4, '0')}-${String(mois).padStart(2, '0')}-${String(jour).padStart(2, '0')}`,
        formateFR: `${String(jour).padStart(2, '0')}/${String(mois).padStart(2, '0')}/${annee}`,
        formateLettresFR: `${jour} ${MOIS_FR[mois - 1]} ${annee}`
    };
}

/** Normalise une date quelconque vers le format unique de stockage (ISO). */
function normaliserPourStockage(valeur) {
    const res = validerDate(valeur, { autoriserPasse: true, autoriserFutur: true });
    return res.valide ? res.iso : null;
}

module.exports = {
    FORMAT_STOCKAGE,
    parserDate,
    validerDate,
    normaliserPourStockage
};
