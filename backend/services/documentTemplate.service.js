/**
 * backend/services/documentTemplate.service.js
 * ---------------------------------------------------------------------------
 * Cœur du module transversal de gestion documentaire intelligente (GED).
 * Permet à N'IMPORTE QUEL module (CRM, Ventes, Achats, Comptabilité, Projets,
 * RH...) de générer un document Word à partir d'un modèle .docx contenant des
 * balises {tag}, en lui fournissant simplement un objet de données.
 *
 * Dépendances à ajouter dans backend/package.json :
 *   npm install docxtemplater pizzip
 * (Le paquet "docx" déjà présent reste utilisé pour la génération de
 * documents 100% programmatiques, sans modèle — voir genererDocxPurJS).
 * ---------------------------------------------------------------------------
 */

const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

const DOSSIER_MODELES = path.join(__dirname, '..', 'templates', 'documents');
const DOSSIER_GENERES = path.join(__dirname, '..', 'uploads', 'documents_generes');

/**
 * Remplit un modèle .docx (contenant des balises {ma_balise}) avec les
 * données fournies et enregistre le résultat sur disque.
 *
 * @param {Object} params
 * @param {string} params.cheminModele - chemin absolu du fichier .docx modèle
 * @param {Object} params.donnees - objet plat { tag: valeur } à injecter
 * @param {string} params.nomFichierSortie - nom du fichier .docx généré
 * @param {string} params.dossierSortie - dossier de destination (isolé par entreprise)
 * @returns {{ cheminFichier:string, tagsManquants:string[] }}
 */
function remplirModeleDocx({ cheminModele, donnees, nomFichierSortie, dossierSortie }) {
    if (!fs.existsSync(cheminModele)) {
        throw new Error(`Modèle introuvable : ${cheminModele}`);
    }

    const contenu = fs.readFileSync(cheminModele, 'binary');
    const zip = new PizZip(contenu);

    let tagsManquants = [];
    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        nullGetter: (part) => {
            // Trace les balises non fournies plutôt que de planter le rendu
            tagsManquants.push(part.value);
            return '';
        }
    });

    doc.render(donnees);

    const buffer = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });

    fs.mkdirSync(dossierSortie, { recursive: true });
    const cheminFichier = path.join(dossierSortie, nomFichierSortie);
    fs.writeFileSync(cheminFichier, buffer);

    return { cheminFichier, tagsManquants: [...new Set(tagsManquants)] };
}

/**
 * Liste les balises {tag} présentes dans un modèle .docx, pour permettre
 * au front d'afficher dynamiquement le formulaire de saisie correspondant
 * (ou de proposer l'auto-remplissage intelligent — voir autofill.service.js).
 */
function extraireTagsModele(cheminModele) {
    const contenu = fs.readFileSync(cheminModele, 'binary');
    const zip = new PizZip(contenu);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
    const texteXml = zip.files['word/document.xml'].asText();
    const matches = [...texteXml.matchAll(/{([a-zA-Z0-9_]+)}/g)];
    return [...new Set(matches.map(m => m[1]))];
}

/**
 * Liste les modèles disponibles pour un type de document et une entreprise
 * donnés (les modèles "génériques" du dossier /templates/documents/_communs
 * sont proposés à tous les tenants ; les modèles propres à une entreprise
 * vivent dans /templates/documents/<entreprise_id>).
 */
function listerModelesDisponibles(typeDocument, entrepriseId) {
    const resultats = [];
    for (const sousDossier of ['_communs', String(entrepriseId)]) {
        const dossier = path.join(DOSSIER_MODELES, sousDossier, typeDocument || '');
        if (fs.existsSync(dossier)) {
            fs.readdirSync(dossier)
                .filter(f => f.endsWith('.docx'))
                .forEach(f => resultats.push({
                    nom: f,
                    chemin: path.join(dossier, f),
                    portee: sousDossier === '_communs' ? 'commun' : 'entreprise'
                }));
        }
    }
    return resultats;
}

module.exports = {
    remplirModeleDocx,
    extraireTagsModele,
    listerModelesDisponibles,
    DOSSIER_MODELES,
    DOSSIER_GENERES
};
