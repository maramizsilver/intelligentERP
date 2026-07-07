// Bloque l'accès aux routes métier (clients, produits, commandes, rôles...) quand
// l'essai gratuit de l'entreprise est épuisé. Les données restent intactes en base
// (rien n'est supprimé) et restent exportables via /api/export, qui n'utilise JAMAIS
// ce middleware.
// Le SuperAdmin et les comptes externes (portail client) ne sont jamais concernés
// par cette limite : elle s'applique uniquement au staff de l'entreprise.
module.exports = (req, res, next) => {
  if (req.user.is_super_admin || req.user.is_external) return next();

  if (req.user.essai_expire) {
    return res.status(403).json({
      message: "Votre période d'essai gratuite est terminée. Vos données sont conservées sans perte. Souscrivez à un abonnement pour continuer, ou exportez vos données.",
      essai_expire: true
    });
  }

  next();
};
