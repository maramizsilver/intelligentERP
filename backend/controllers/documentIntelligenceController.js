/**
 * backend/controllers/documentIntelligenceController.js
 * ---------------------------------------------------------------------------
 * Contrôleur unique exposant, à tous les modules de la plateforme, les
 * fonctionnalités transversales du module de gestion documentaire intelligente :
 *   - génération/remplissage automatique de documents Word (.docx)
 *   - numérisation intelligente (OCR)
 *   - saisie intelligente (auto-remplissage depuis la base)
 *   - recherche globale
 *   - dictionnaire intelligent (orthographe)
 *   - calendrier intelligent (validation de dates)
 *   - conversion de montants en toutes lettres
 * ---------------------------------------------------------------------------
 */

const path = require('path');
const fs = require('fs');

const { remplirModeleDocx, extraireTagsModele, listerModelesDisponibles } = require('../services/documentTemplate.service');
const { numeriserEtAnalyser } = require('../services/ocr.service');
const { autoRemplir } = require('../services/autofill.service');
const { rechercheGlobale } = require('../services/globalSearch.service');
const { verifierTexte, appliquerCorrections } = require('../services/spellcheck.service');
const { validerDate } = require('../utils/dateValidator.util');
const { montantEnLettres, genererMentionsMontants } = require('../services/numberToWords.service');
const { controlerFormulaireDocument } = require('../utils/formCoherence.util');

// ============================================================
// GÉNÉRATION / REMPLISSAGE DE DOCUMENTS WORD
// ============================================================

// GET /api/documents-intelligents/modeles?type=devis
exports.listerModeles = (req, res) => {
    try {
        const modeles = listerModelesDisponibles(req.query.type, req.user.entreprise_id);
        res.json({ modeles: modeles.map(m => ({ nom: m.nom, portee: m.portee })) });
    } catch (err) {
        console.error('Erreur listerModeles:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// GET /api/documents-intelligents/modeles/:type/:nom/tags
exports.tagsDuModele = (req, res) => {
    try {
        const modeles = listerModelesDisponibles(req.params.type, req.user.entreprise_id);
        const modele = modeles.find(m => m.nom === req.params.nom);
        if (!modele) return res.status(404).json({ message: 'Modèle introuvable' });
        res.json({ tags: extraireTagsModele(modele.chemin) });
    } catch (err) {
        console.error('Erreur tagsDuModele:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// POST /api/documents-intelligents/generer
// Body: { typeDocument, nomModele, donnees, champsObligatoires, estDocumentFinancier, langueMontants, deviseMontants }
exports.genererDocument = (req, res) => {
    const {
        typeDocument, nomModele, donnees = {},
        champsObligatoires = [], estDocumentFinancier = false,
        langueMontants = 'fr', deviseMontants = 'TND'
    } = req.body;

    if (!typeDocument || !nomModele) {
        return res.status(400).json({ message: 'typeDocument et nomModele sont requis' });
    }

    // 1. Contrôle automatique du formulaire (complétude + cohérence)
    const controle = controlerFormulaireDocument({ donnees, champsObligatoires, estDocumentFinancier });
    if (!controle.valide) {
        return res.status(400).json({ message: 'Formulaire invalide', erreurs: controle.erreurs });
    }

    try {
        // 2. Ajout automatique des montants en toutes lettres si document financier
        let donneesCompletes = { ...donnees };
        if (estDocumentFinancier && donnees.montantHT !== undefined) {
            donneesCompletes = {
                ...donneesCompletes,
                ...genererMentionsMontants({
                    montantHT: Number(donnees.montantHT),
                    montantTVA: Number(donnees.montantTVA || 0),
                    montantTTC: Number(donnees.montantTTC),
                    langue: langueMontants,
                    devise: deviseMontants
                })
            };
        }

        // 3. Résolution du modèle (commun ou propre à l'entreprise)
        const modeles = listerModelesDisponibles(typeDocument, req.user.entreprise_id);
        const modele = modeles.find(m => m.nom === nomModele);
        if (!modele) return res.status(404).json({ message: 'Modèle introuvable' });

        // 4. Génération
        const dossierSortie = path.join(__dirname, '..', 'uploads', 'documents_generes', String(req.user.entreprise_id));
        const nomFichierSortie = `${typeDocument}_${Date.now()}.docx`;
        const { cheminFichier, tagsManquants } = remplirModeleDocx({
            cheminModele: modele.chemin,
            donnees: donneesCompletes,
            nomFichierSortie,
            dossierSortie
        });

        // 5. Traçabilité : on enregistre le document généré dans la table "documents"
        //    existante, comme n'importe quel document uploadé, pour que le module
        //    reste homogène avec le reste de la GED (téléchargement, suppression...).
        const db = req.db;
        db.query(
            `INSERT INTO documents (nom, type_document, reference_type, reference_id, chemin_fichier, nom_original, mime_type, taille_octets, uploaded_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nomFichierSortie, typeDocument, req.body.referenceType || null, req.body.referenceId || null,
                cheminFichier, nomFichierSortie,
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                fs.statSync(cheminFichier).size, req.user.id
            ],
            (err, result) => {
                if (err) {
                    console.error('Erreur enregistrement document généré:', err);
                    return res.status(500).json({ message: 'Document généré mais non tracé en base' });
                }
                res.status(201).json({
                    message: 'Document généré avec succès',
                    documentId: result.insertId,
                    tagsManquants
                });
            }
        );
    } catch (err) {
        console.error('Erreur genererDocument:', err);
        res.status(500).json({ message: err.message || 'Erreur lors de la génération du document' });
    }
};

// ============================================================
// NUMÉRISATION INTELLIGENTE (OCR)
// ============================================================

// POST /api/documents-intelligents/ocr  (multipart/form-data, champ "fichier")
exports.numeriser = async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier fourni' });

    try {
        const langue = req.body.langue || 'fr';
        const resultat = await numeriserEtAnalyser(req.file.path, langue);
        res.json(resultat);
    } catch (err) {
        console.error('Erreur numeriser:', err);
        res.status(500).json({ message: "Erreur lors de l'analyse OCR" });
    } finally {
        // Fichier temporaire uploadé pour l'OCR : on le supprime après analyse
        // (le résultat structuré est ce qui doit être conservé, pas le scan brut,
        // sauf si l'utilisateur choisit explicitement de l'archiver via /documents).
        fs.unlink(req.file.path, () => {});
    }
};

// ============================================================
// SAISIE INTELLIGENTE (AUTO-REMPLISSAGE)
// ============================================================

// GET /api/documents-intelligents/autofill/:typeEntite/:identifiant
exports.autoRemplirChamp = async (req, res) => {
    try {
        const resultat = await autoRemplir(req.db, req.params.typeEntite, req.params.identifiant);
        res.json(resultat);
    } catch (err) {
        console.error('Erreur autoRemplirChamp:', err);
        res.status(400).json({ message: err.message });
    }
};

// ============================================================
// RECHERCHE GLOBALE
// ============================================================

// GET /api/documents-intelligents/recherche?q=...&modules=clients,fournisseurs
exports.rechercheGlobaleHandler = async (req, res) => {
    try {
        const { q, modules } = req.query;

        // Filtrage par permissions réelles de l'utilisateur (délègue à la logique
        // déjà en place dans permissionMiddleware / req.user.permissions).
        const aAcces = (nomModule) => {
            if (req.user.is_super_admin) return true;
            if (!req.user.permissions) return true; // repli permissif si non chargé ; à durcir selon l'implémentation RBAC existante
            const perm = req.user.permissions[nomModule];
            return !!(perm && perm.consultation);
        };

        const resultat = await rechercheGlobale(req.db, q, {
            aAcces,
            modules: modules ? modules.split(',') : null
        });
        res.json(resultat);
    } catch (err) {
        console.error('Erreur rechercheGlobaleHandler:', err);
        res.status(500).json({ message: 'Erreur lors de la recherche' });
    }
};

// ============================================================
// DICTIONNAIRE INTELLIGENT (ORTHOGRAPHE)
// ============================================================

// POST /api/documents-intelligents/orthographe  Body: { texte, langue, appliquer }
exports.verifierOrthographe = async (req, res) => {
    try {
        const { texte, langue = 'fr', appliquer = false } = req.body;
        const resultat = await verifierTexte(texte, langue);
        if (appliquer) {
            resultat.texteCorrige = appliquerCorrections(texte, resultat.fautes);
        }
        res.json(resultat);
    } catch (err) {
        console.error('Erreur verifierOrthographe:', err);
        res.status(503).json({ message: err.message || 'Service de correction indisponible' });
    }
};

// ============================================================
// CALENDRIER INTELLIGENT
// ============================================================

// POST /api/documents-intelligents/valider-date  Body: { valeur, autoriserPasse, autoriserFutur, dateMin, dateMax }
exports.validerDateHandler = (req, res) => {
    const resultat = validerDate(req.body.valeur, req.body);
    res.json(resultat);
};

// ============================================================
// MONTANTS EN LETTRES
// ============================================================

// POST /api/documents-intelligents/montant-en-lettres  Body: { montant, langue, devise }
exports.montantEnLettresHandler = (req, res) => {
    try {
        const { montant, langue = 'fr', devise = 'TND' } = req.body;
        const resultat = montantEnLettres(Number(montant), { langue, devise });
        res.json({ montant, resultat });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
