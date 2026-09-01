// backend/services/documentResolvers.service.js
// ============================================================
// Résout toutes les données nécessaires à la génération d'un document
// (facture, devis, commande, achat, document métier) : informations de
// l'ÉMETTEUR (l'entreprise connectée elle-même), du TIERS (client ou
// fournisseur, avec ses coordonnées déchiffrées), les lignes de produits
// (avec TVA par ligne) et les totaux.
//
// Tout est lu depuis req.db (pool tenant), donc automatiquement isolé et
// relié à l'entreprise connectée — aucune donnée statique.
// ============================================================
const { getDocumentMetierById } = require('./documentsMetier.service');
const encryptionService = require('./encryption.service');

function query(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

// Les colonnes email/telephone/adresse de clients/fournisseurs sont
// chiffrées (AES-256-GCM) — il faut les déchiffrer avant de les afficher
// sur un document imprimé.
function decrypt(val) {
  return val ? encryptionService.decryptSafe(val) : val;
}

/**
 * Récupère les informations de l'entreprise émettrice (celle du tenant
 * courant). La table "entreprises" est répliquée dans chaque base tenant
 * et ne contient qu'une seule ligne : celle de l'entreprise propriétaire
 * de cette base.
 */
async function resoudreEntreprise(db) {
  const rows = await query(db, 'SELECT * FROM entreprises ORDER BY id LIMIT 1');
  const e = rows[0] || {};
  return {
    nom: e.nom || 'Mon Entreprise',
    raison_sociale: e.raison_sociale || e.nom || '',
    adresse: e.adresse || '',
    ville: e.ville || '',
    code_postal: e.code_postal || '',
    pays: e.pays || 'Tunisie',
    telephone: e.telephone || '',
    email: e.email || '',
    site_web: e.site_web || '',
    matricule_fiscal: e.matricule_fiscal || '',
    registre_commerce: e.registre_commerce || '',
    numero_tva: e.numero_tva || '',
    logo: e.logo || null,
    banque_nom: e.banque_nom || '',
    banque_rib: e.banque_rib || '',
    banque_iban: e.banque_iban || '',
    banque_swift: e.banque_swift || '',
    conditions_paiement: e.conditions_paiement || 'Paiement à réception de facture par virement bancaire'
  };
}

const RESOLVERS = {
  devis: async (db, id) => {
    const [d] = await query(db, `
      SELECT d.*, c.nom AS c_nom, c.prenom AS c_prenom, c.raison_sociale AS c_rs,
             c.email AS c_email, c.telephone AS c_tel, c.adresse AS c_adr,
             c.ville AS c_ville, c.matricule_fiscal AS c_mf
      FROM devis d JOIN clients c ON c.id = d.client_id WHERE d.id = ?`, [id]);
    if (!d) throw new Error('Devis introuvable');

    const lignesRaw = await query(db, `
      SELECT dp.*, p.nom AS produit_nom, p.tva AS produit_tva
      FROM devis_produits dp JOIN produits p ON p.id = dp.produit_id
      WHERE dp.devis_id = ?`, [id]);

    const entreprise = await resoudreEntreprise(db);
    return {
      titre: 'DEVIS', numero: d.numero_devis, date: d.date_devis,
      tiers: d.c_rs || `${d.c_nom} ${d.c_prenom || ''}`.trim(),
      tiers_contact: {
        email: decrypt(d.c_email), telephone: decrypt(d.c_tel),
        adresse: decrypt(d.c_adr), ville: d.c_ville, matricule_fiscal: d.c_mf
      },
      lignes: lignesRaw.map(l => ({
        designation: l.produit_nom, quantite: l.quantite,
        prix_unitaire: l.prix_unitaire, tva: l.produit_tva || 0, total: l.total_ligne
      })),
      montant_ht: d.total_ht, montant_tva: d.montant_tva, montant_ttc: d.total_ttc,
      statut: d.statut, entreprise, raw: d
    };
  },

  commande: async (db, id) => {
    const [c] = await query(db, `
      SELECT co.*, cl.nom AS c_nom, cl.prenom AS c_prenom, cl.raison_sociale AS c_rs,
             cl.email AS c_email, cl.telephone AS c_tel, cl.adresse AS c_adr,
             cl.ville AS c_ville, cl.matricule_fiscal AS c_mf
      FROM commandes co JOIN clients cl ON cl.id = co.client_id WHERE co.id = ?`, [id]);
    if (!c) throw new Error('Commande introuvable');

    const lignesRaw = await query(db, `
      SELECT cp.*, p.nom AS produit_nom, p.tva AS produit_tva
      FROM commande_produits cp JOIN produits p ON p.id = cp.produit_id
      WHERE cp.commande_id = ?`, [id]);

    const entreprise = await resoudreEntreprise(db);
    return {
      titre: 'BON DE COMMANDE CLIENT', numero: c.numero_commande || `CMD-${c.id}`, date: c.date_commande,
      tiers: c.c_rs || `${c.c_nom} ${c.c_prenom || ''}`.trim(),
      tiers_contact: {
        email: decrypt(c.c_email), telephone: decrypt(c.c_tel),
        adresse: decrypt(c.c_adr), ville: c.c_ville, matricule_fiscal: c.c_mf
      },
      lignes: lignesRaw.map(l => ({
        designation: l.produit_nom, quantite: l.quantite,
        prix_unitaire: l.prix_unitaire, tva: l.produit_tva || 0,
        total: l.quantite * l.prix_unitaire
      })),
      montant_ht: c.montant_ht || c.total, montant_tva: c.montant_tva || 0,
      montant_ttc: c.total_ttc || c.total, statut: c.statut, entreprise, raw: c
    };
  },

  facture: async (db, id) => {
    const [f] = await query(db, `
      SELECT f.*, c.nom AS c_nom, c.prenom AS c_prenom, c.raison_sociale AS c_rs,
             c.email AS c_email, c.telephone AS c_tel, c.adresse AS c_adr,
             c.ville AS c_ville, c.matricule_fiscal AS c_mf,
             co.numero_commande, dv.numero_devis
      FROM factures f
      JOIN clients c ON c.id = f.client_id
      LEFT JOIN commandes co ON co.id = f.commande_id
      LEFT JOIN devis dv ON dv.id = f.devis_id
      WHERE f.id = ?`, [id]);
    if (!f) throw new Error('Facture introuvable');

    // Les factures n'ont pas leurs propres lignes en base : elles héritent
    // de celles de la commande ou du devis d'origine.
    let lignes = [];
    if (f.commande_id) {
      const rows = await query(db, `
        SELECT cp.*, p.nom AS produit_nom, p.tva AS produit_tva
        FROM commande_produits cp JOIN produits p ON p.id = cp.produit_id
        WHERE cp.commande_id = ?`, [f.commande_id]);
      lignes = rows.map(l => ({
        designation: l.produit_nom, quantite: l.quantite,
        prix_unitaire: l.prix_unitaire, tva: l.produit_tva || 0,
        total: l.quantite * l.prix_unitaire
      }));
    } else if (f.devis_id) {
      const rows = await query(db, `
        SELECT dp.*, p.nom AS produit_nom, p.tva AS produit_tva
        FROM devis_produits dp JOIN produits p ON p.id = dp.produit_id
        WHERE dp.devis_id = ?`, [f.devis_id]);
      lignes = rows.map(l => ({
        designation: l.produit_nom, quantite: l.quantite,
        prix_unitaire: l.prix_unitaire, tva: l.produit_tva || 0, total: l.total_ligne
      }));
    }

    const entreprise = await resoudreEntreprise(db);
    return {
      titre: 'FACTURE', numero: f.numero_facture, date: f.date_facture,
      tiers: f.c_rs || `${f.c_nom} ${f.c_prenom || ''}`.trim(),
      tiers_contact: {
        email: decrypt(f.c_email), telephone: decrypt(f.c_tel),
        adresse: decrypt(f.c_adr), ville: f.c_ville, matricule_fiscal: f.c_mf
      },
      reference_commande: f.numero_commande || null,
      reference_devis: f.numero_devis || null,
      lignes,
      montant_ht: f.total_ht, montant_tva: f.montant_tva, montant_ttc: f.total_ttc,
      statut: f.statut, entreprise, raw: f
    };
  },

  achat: async (db, id) => {
    const [a] = await query(db, `
      SELECT a.*, f.nom AS f_nom, f.email AS f_email, f.telephone AS f_tel,
             f.adresse AS f_adr, f.ville AS f_ville, f.matricule_fiscal AS f_mf
      FROM achats a JOIN fournisseurs f ON f.id = a.fournisseur_id WHERE a.id = ?`, [id]);
    if (!a) throw new Error('Achat introuvable');

    const lignesRaw = await query(db, `
      SELECT ap.*, p.nom AS produit_nom, p.tva AS produit_tva
      FROM achat_produits ap JOIN produits p ON p.id = ap.produit_id
      WHERE ap.achat_id = ?`, [id]);

    const entreprise = await resoudreEntreprise(db);
    const totalHT = Number(a.total_ht || 0);
    const totalTTC = Number(a.total_ttc || 0);

    return {
      titre: 'BON DE COMMANDE FOURNISSEUR', numero: a.numero_bc, date: a.date_commande,
      tiers: a.f_nom,
      tiers_contact: {
        email: decrypt(a.f_email), telephone: decrypt(a.f_tel),
        adresse: decrypt(a.f_adr), ville: a.f_ville, matricule_fiscal: a.f_mf
      },
      lignes: lignesRaw.map(l => ({
        designation: l.produit_nom, quantite: l.quantite,
        prix_unitaire: l.prix_unitaire, tva: l.produit_tva || 0, total: l.total_ligne
      })),
      montant_ht: totalHT,
      montant_tva: Math.max(0, totalTTC - totalHT),
      montant_ttc: totalTTC,
      statut: a.statut, entreprise, raw: a
    };
  },

  documents_metier: async (db, id) => {
    const d = await getDocumentMetierById(db, id);
    const titres = {
      bon_livraison: 'BON DE LIVRAISON', bon_preparation: 'BON DE PRÉPARATION',
      bon_reception: 'BON DE RÉCEPTION', bon_entree: "BON D'ENTRÉE", bon_sortie: 'BON DE SORTIE',
      bon_transfert: 'BON DE TRANSFERT', demande_achat: "DEMANDE D'ACHAT", recu: 'REÇU DE PAIEMENT',
      facture_proforma: 'FACTURE PRO FORMA', facture_avoir: "FACTURE D'AVOIR", facture_electronique: 'FACTURE ÉLECTRONIQUE'
    };
    const entreprise = await resoudreEntreprise(db);
    return {
      titre: titres[d.type_document] || d.type_document.toUpperCase(),
      numero: d.numero, date: d.created_at, tiers: d.tiers_nom,
      tiers_contact: {},
      lignes: (d.donnees.lignes || []).map(l => ({
        designation: l.designation, quantite: l.quantite,
        prix_unitaire: l.prix_unitaire, tva: l.tva || 0, total: l.total
      })),
      montant_ht: d.montant_ht, montant_ttc: d.montant_ttc,
      montant_tva: Math.max(0, Number(d.montant_ttc || 0) - Number(d.montant_ht || 0)),
      statut: d.statut, entreprise, raw: d
    };
  }
};

async function resoudreDocument(db, type, id) {
  const resolver = RESOLVERS[type];
  if (!resolver) throw new Error(`Type de document non supporté : ${type}`);
  const resultat = await resolver(db, id);
  resultat.type = type;
  return resultat;
}

module.exports = { resoudreDocument, resoudreEntreprise, RESOLVERS };