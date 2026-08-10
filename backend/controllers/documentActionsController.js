const { traiterAction } = require('../services/documentActions.service');

const TYPES_AUTORISES = ['devis', 'commande', 'facture', 'achat', 'documents_metier'];

exports.executerAction = async (req, res) => {
  const { type, id, action } = req.params;
  if (!TYPES_AUTORISES.includes(type)) {
    return res.status(400).json({ message: `Type de document non supporté : ${type}` });
  }

  try {
    const resultat = await traiterAction(req.db, {
      action, type, id: Number(id), user: req.user, options: req.body || {}
    });

    if (['pdf', 'word', 'excel'].includes(action)) {
      res.setHeader('Content-Type', resultat.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${resultat.filename}"`);
      if (resultat.signature) res.setHeader('X-Signature', resultat.signature);
      return res.send(resultat.buffer);
    }

    res.json(resultat);
  } catch (err) {
    console.error(`[DocumentActions] Erreur action "${action}" sur ${type}#${id}:`, err.message);
    res.status(400).json({ message: err.message });
  }
};