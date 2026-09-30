// backend/scripts/createTemplates.js
// Script pour creer les fichiers DOCX de base

const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates', 'documents', '_communs');

const TEMPLATES = {
  devis: {
    nom: 'modele_standard.docx',
    contenu: `Devis n° {devis_numero}
Date : {devis_date}
Validite : {devis_date_validite}

Client : {client_nom} {client_prenom}
Adresse : {client_adresse}
Ville : {client_ville}
Telephone : {client_telephone}
Email : {client_email}

Description :

Lignes du devis :
{devis_produits}

Montant HT : {devis_total_ht} TND
TVA : {devis_montant_tva} TND
Montant TTC : {devis_total_ttc} TND

Conditions de paiement : {devis_conditions_paiement}

Arrête le present devis a la somme de {devis_total_ttc} TND
{devis_total_ttc_lettres}

Notes : {devis_notes}`
  },
  facture: {
    nom: 'modele_standard.docx',
    contenu: `Facture n° {facture_numero}
Date : {facture_date}

Client : {client_nom} {client_prenom}
Adresse : {client_adresse}
Ville : {client_ville}
Telephone : {client_telephone}
Email : {client_email}

Designation | Quantite | Prix Unitaire | Total HT
{facture_lignes}

Sous-total HT : {facture_total_ht} TND
TVA ({facture_tva}%) : {facture_montant_tva} TND
Total TTC : {facture_total_ttc} TND

Arrête la presente facture a la somme de {facture_total_ttc} TND
{facture_total_ttc_lettres}

Conditions de paiement : {facture_conditions_paiement}`
  },
  bon_commande: {
    nom: 'modele_standard.docx',
    contenu: `Bon de commande n° {bon_commande_numero}
Date : {bon_commande_date}

Fournisseur : {fournisseur_nom}
Adresse : {fournisseur_adresse}
Ville : {fournisseur_ville}
Telephone : {fournisseur_telephone}
Email : {fournisseur_email}

Livraison prevue le : {bon_commande_date_livraison}

Article | Quantite | Prix Unitaire | Total
{bon_commande_lignes}

Total HT : {bon_commande_total_ht} TND
TVA : {bon_commande_montant_tva} TND
Total TTC : {bon_commande_total_ttc} TND

Arrête le present bon de commande a la somme de {bon_commande_total_ttc} TND
{bon_commande_total_ttc_lettres}

Notes : {bon_commande_notes}`
  },
  contrat: {
    nom: 'modele_standard.docx',
    contenu: `CONTRAT N° {contrat_numero}

Entre :
{entreprise_nom}
Adresse : {entreprise_adresse}
Ville : {entreprise_ville}
Telephone : {entreprise_telephone}
Email : {entreprise_email}
Matricule fiscal : {entreprise_matricule_fiscal}
Representee par : {entreprise_representant}

Et :
{client_nom} {client_prenom}
Adresse : {client_adresse}
Ville : {client_ville}
Telephone : {client_telephone}
Email : {client_email}

OBJET : {contrat_objet}

Duree : {contrat_duree}
Date de signature : {contrat_date_signature}
Date d'effet : {contrat_date_effet}

Montant du contrat : {contrat_montant} TND
{contrat_montant_lettres}

Clauses particulieres :
{contrat_clauses}

Fait a {contrat_lieu}, le {contrat_date_signature}

Signature :
{entreprise_nom}                     {client_nom}`
  },
  autre: {
    nom: 'modele_standard.docx',
    contenu: `Document n° {document_numero}
Type : {document_type}
Date : {document_date}

Titre : {document_titre}

Contenu :
{document_contenu}

Auteur : {document_auteur}`
  }
};

function creerModeleWord(contenu, cheminFichier) {
  // Creer un fichier ZIP contenant le XML Word
  const zip = new PizZip();
  
  // Creer le contenu XML minimal de Word
  const xmlContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${contenu.split('\n').map(line => 
      `<w:p><w:r><w:t>${line}</w:t></w:r></w:p>`
    ).join('')}
  </w:body>
</w:document>`;

  zip.file('word/document.xml', xmlContent);
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);
  
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

  const buffer = zip.generate({ type: 'nodebuffer' });
  fs.writeFileSync(cheminFichier, buffer);
  console.log(`✅ Fichier cree : ${cheminFichier}`);
}

function creerTousLesModeles() {
  const dossiers = ['devis', 'facture', 'bon_commande', 'contrat', 'autre'];
  
  for (const dossier of dossiers) {
    const dossierPath = path.join(TEMPLATES_DIR, dossier);
    if (!fs.existsSync(dossierPath)) {
      fs.mkdirSync(dossierPath, { recursive: true });
    }
    
    const template = TEMPLATES[dossier];
    if (template) {
      const chemin = path.join(dossierPath, template.nom);
      creerModeleWord(template.contenu, chemin);
    }
  }
  
  console.log('✅ Tous les modeles ont ete crees avec succes !');
}

// Executer le script
creerTousLesModeles();