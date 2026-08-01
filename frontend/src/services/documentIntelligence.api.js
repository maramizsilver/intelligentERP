// frontend/src/services/documentIntelligence.api.js
// ---------------------------------------------------------------------------
// Réutilise l'instance axios déjà configurée (intercepteurs auth, CSRF,
// X-Enterprise-Id, gestion 401...) au lieu d'en recréer une : on reste
// cohérent avec le reste du front (voir src/utils/api.js).
// ---------------------------------------------------------------------------
import API from '../utils/api';

const BASE = '/documents-intelligents';

const documentIntelligenceApi = {
    // --- Génération / remplissage Word ---
    listerModeles: (type) => API.get(`${BASE}/modeles`, { params: { type } }),
    tagsDuModele: (type, nom) => API.get(`${BASE}/modeles/${type}/${nom}/tags`),
    genererDocument: (payload) => API.post(`${BASE}/generer`, payload),

    // --- Numérisation intelligente (OCR) ---
    numeriser: (fichier, langue = 'fr') => {
        const formData = new FormData();
        formData.append('fichier', fichier);
        formData.append('langue', langue);
        return API.post(`${BASE}/ocr`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },

    // --- Saisie intelligente ---
    autoRemplir: (typeEntite, identifiant) => API.get(`${BASE}/autofill/${typeEntite}/${identifiant}`),

    // --- Recherche globale ---
    rechercheGlobale: (q, modules) => API.get(`${BASE}/recherche`, { params: { q, modules: modules?.join(',') } }),

    // --- Dictionnaire intelligent ---
    verifierOrthographe: (texte, langue = 'fr', appliquer = false) =>
        API.post(`${BASE}/orthographe`, { texte, langue, appliquer }),

    // --- Calendrier intelligent ---
    validerDate: (valeur, options = {}) => API.post(`${BASE}/valider-date`, { valeur, ...options }),

    // --- Montants en toutes lettres ---
    montantEnLettres: (montant, langue = 'fr', devise = 'TND') =>
        API.post(`${BASE}/montant-en-lettres`, { montant, langue, devise })
};

export default documentIntelligenceApi;
