const { resoudreDocument } = require('../services/documentResolvers.service');
const { creerDocumentMetier } = require('../services/documentsMetier.service');
const SequenceService = require('../services/sequence.service');

const TYPES_VIA_DOCUMENTS_METIER = [
  'facture_proforma', 'facture_avoir', 'facture_electronique',
  'bon_livraison', 'bon_preparation', 'bon_sortie', 'recu'
];

exports.convertirFacture = async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { type_cible } = req.body;

  if (!type_cible) return res.status(400).json({ message: 'type_cible est requis' });

  try {
    const facture = await resoudreDocument(db, 'facture', id);

    // Cas 1 : conversion vers un devis (table dédiée existante)
    if (type_cible === 'devis') {
      const numero_devis = await SequenceService.genererNumeroDevis(db, req.user.entreprise_id);
      const [result] = await db.promise().query(
        `INSERT INTO devis (client_id, numero_devis, date_validite, total_ht, total_ttc, entreprise_id, company_id)
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY), ?, ?, ?, ?)`,
        [facture.raw.client_id, numero_devis, facture.montant_ht, facture.montant_ttc, req.user.entreprise_id, req.user.entreprise_id]
      );
      await db.promise().query(
        `INSERT INTO documents_historique (type_document, document_id, action, details, performed_by)
         VALUES ('facture', ?, 'conversion_devis', ?, ?)`,
        [id, JSON.stringify({ type_cible, nouveau_id: result.insertId }), req.user.id]
      );
      return res.status(201).json({ message: 'Facture convertie en devis', type_cible, id: result.insertId, numero: numero_devis });
    }

    // Cas 2 : tous les autres types passent par documents_metier
    if (!TYPES_VIA_DOCUMENTS_METIER.includes(type_cible)) {
      return res.status(400).json({
        message: `Conversion non supportée vers "${type_cible}". Valeurs autorisées : devis, ${TYPES_VIA_DOCUMENTS_METIER.join(', ')}`
      });
    }

    const resultat = await creerDocumentMetier(db, req.user.entreprise_id, {
      type_document: type_cible,
      tiers_nom: facture.tiers,
      donnees: { 
        lignes: facture.lignes, 
        origine: 'facture', 
        facture_numero: facture.numero,
        facture_id: id
      },
      montant_ht: facture.montant_ht,
      montant_ttc: facture.montant_ttc,
      reference_type: 'facture',
      reference_id: id,
      created_by: req.user.id
    });

    await db.promise().query(
      `INSERT INTO documents_historique (type_document, document_id, action, details, performed_by)
       VALUES ('facture', ?, 'conversion', ?, ?)`,
      [id, JSON.stringify({ type_cible, nouveau_id: resultat.id }), req.user.id]
    );

    res.status(201).json({ message: `Facture convertie en ${type_cible}`, type_cible, ...resultat });
  } catch (err) {
    console.error('Erreur convertirFacture:', err);
    res.status(500).json({ message: err.message || 'Erreur serveur' });
  }
};