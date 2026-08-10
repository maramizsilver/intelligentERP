const { getDocumentMetierById } = require('./documentsMetier.service');

function query(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
  });
}

const RESOLVERS = {
  devis: async (db, id) => {
    const [d] = await query(db, `SELECT d.*, c.nom AS client_nom FROM devis d JOIN clients c ON c.id=d.client_id WHERE d.id=?`, [id]);
    if (!d) throw new Error('Devis introuvable');
    const lignes = await query(db, `SELECT dp.*, p.nom AS produit_nom FROM devis_produits dp JOIN produits p ON p.id=dp.produit_id WHERE dp.devis_id=?`, [id]);
    return {
      titre: 'DEVIS', numero: d.numero_devis, tiers: d.client_nom, date: d.date_devis,
      lignes: lignes.map(l => ({ designation: l.produit_nom, quantite: l.quantite, prix_unitaire: l.prix_unitaire, total: l.total_ligne })),
      montant_ht: d.total_ht, montant_ttc: d.total_ttc, statut: d.statut, raw: d
    };
  },
  commande: async (db, id) => {
    const [c] = await query(db, `SELECT co.*, cl.nom AS client_nom FROM commandes co JOIN clients cl ON cl.id=co.client_id WHERE co.id=?`, [id]);
    if (!c) throw new Error('Commande introuvable');
    const lignes = await query(db, `SELECT cp.*, p.nom AS produit_nom FROM commande_produits cp JOIN produits p ON p.id=cp.produit_id WHERE cp.commande_id=?`, [id]);
    return {
      titre: 'BON DE COMMANDE CLIENT', numero: c.numero_commande || `CMD-${c.id}`, tiers: c.client_nom, date: c.date_commande,
      lignes: lignes.map(l => ({ designation: l.produit_nom, quantite: l.quantite, prix_unitaire: l.prix_unitaire, total: l.quantite * l.prix_unitaire })),
      montant_ht: c.montant_ht || c.total, montant_ttc: c.total_ttc || c.total, statut: c.statut, raw: c
    };
  },
  facture: async (db, id) => {
    const [f] = await query(db, `SELECT f.*, c.nom AS client_nom, c.prenom AS client_prenom FROM factures f JOIN clients c ON c.id=f.client_id WHERE f.id=?`, [id]);
    if (!f) throw new Error('Facture introuvable');
    return {
      titre: 'FACTURE', numero: f.numero_facture, tiers: `${f.client_nom} ${f.client_prenom || ''}`.trim(), date: f.date_facture,
      lignes: [], montant_ht: f.total_ht, montant_ttc: f.total_ttc, statut: f.statut, raw: f
    };
  },
  achat: async (db, id) => {
    const [a] = await query(db, `SELECT a.*, f.nom AS fournisseur_nom FROM achats a JOIN fournisseurs f ON f.id=a.fournisseur_id WHERE a.id=?`, [id]);
    if (!a) throw new Error('Achat introuvable');
    const lignes = await query(db, `SELECT ap.*, p.nom AS produit_nom FROM achat_produits ap JOIN produits p ON p.id=ap.produit_id WHERE ap.achat_id=?`, [id]);
    return {
      titre: 'BON DE COMMANDE FOURNISSEUR', numero: a.numero_bc, tiers: a.fournisseur_nom, date: a.date_commande,
      lignes: lignes.map(l => ({ designation: l.produit_nom, quantite: l.quantite, prix_unitaire: l.prix_unitaire, total: l.total_ligne })),
      montant_ht: a.total_ht, montant_ttc: a.total_ttc, statut: a.statut, raw: a
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
    return {
      titre: titres[d.type_document] || d.type_document.toUpperCase(), numero: d.numero, tiers: d.tiers_nom, date: d.created_at,
      lignes: d.donnees.lignes || [], montant_ht: d.montant_ht, montant_ttc: d.montant_ttc, statut: d.statut, raw: d
    };
  }
};

async function resoudreDocument(db, type, id) {
  const resolver = RESOLVERS[type];
  if (!resolver) throw new Error(`Type de document non supporté : ${type}`);
  return resolver(db, id);
}

module.exports = { resoudreDocument, RESOLVERS };