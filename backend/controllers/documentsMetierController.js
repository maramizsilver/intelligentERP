const { creerDocumentMetier, getDocumentMetierById, getAllDocumentsMetier, updateDocumentMetierStatut } = require('../services/documentsMetier.service');

exports.getAll = async (req, res) => {
  try {
    const rows = await getAllDocumentsMetier(req.db, req.query.type, req.user.entreprise_id);
    res.json({ documents: rows });
  } catch (err) {
    console.error('Erreur getAll documentsMetier:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.getById = async (req, res) => {
  try {
    const doc = await getDocumentMetierById(req.db, req.params.id);
    res.json({ document: doc });
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { type_document, tiers_nom, donnees, montant_ht, montant_ttc, reference_type, reference_id } = req.body;
    if (!type_document) return res.status(400).json({ message: 'type_document est requis' });

    const result = await creerDocumentMetier(req.db, req.user.entreprise_id, {
      type_document, tiers_nom, donnees, montant_ht, montant_ttc,
      reference_type, reference_id, created_by: req.user.id
    });
    res.status(201).json({ message: 'Document créé avec succès', ...result });
  } catch (err) {
    console.error('Erreur create documentMetier:', err);
    res.status(400).json({ message: err.message });
  }
};

exports.updateStatut = async (req, res) => {
  try {
    const { statut } = req.body;
    const { id } = req.params;
    await updateDocumentMetierStatut(req.db, id, statut);
    res.json({ message: 'Statut mis à jour' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};