exports.repondreErreurDb = (res, err, messageDefaut = 'Erreur serveur') => {
  if (err && (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED')) {
    return res.status(409).json({
      message: "Suppression impossible : cet élément est utilisé dans d'autres documents (commandes, devis, factures…). Archivez-le plutôt."
    });
  }
  console.error(err);
  return res.status(500).json({ message: messageDefaut });
};