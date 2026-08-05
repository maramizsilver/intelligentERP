const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token manquant' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    // Récupérer la langue préférée
    const acceptLanguage = req.headers['accept-language'] || 'fr';
    const supportedLanguages = ['fr', 'en', 'ar'];
    const preferredLanguage = acceptLanguage.split(',')[0].split('-')[0];
    req.language = supportedLanguages.includes(preferredLanguage) ? preferredLanguage : 'fr';
    
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expirée, veuillez vous reconnecter' });
    }
    return res.status(401).json({ message: 'Token invalide' });
  }
};

// NOUVEAU - Middleware avec company_id pour le multi-tenant
const { promisePoolMaster } = require('../config/db');

const verifyTokenWithCompany = async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token manquant' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Vérifier que l'utilisateur existe et a un company_id
    const [users] = await promisePoolMaster.query(
      `SELECT u.id, u.email, u.entreprise_id, u.role_id, u.is_super_admin,
              e.db_name, e.statut as entreprise_statut
       FROM users u
       LEFT JOIN entreprises e ON u.entreprise_id = e.id
       WHERE u.id = ? AND u.actif = 1`,
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Utilisateur non trouvé ou inactif' });
    }

    const user = users[0];

    if (user.entreprise_statut !== 'actif') {
      return res.status(403).json({ 
        message: 'Votre entreprise est inactive. Contactez l administrateur.' 
      });
    }

    if (!user.db_name) {
      return res.status(500).json({ 
        message: 'Erreur de configuration : base de donnees non associee' 
      });
    }

    // Attacher company_id à req.user (CLÉ du multi-tenant)
    req.user = {
      id: user.id,
      email: user.email,
      company_id: user.entreprise_id,
      entreprise_id: user.entreprise_id,
      db_name: user.db_name,
      role_id: user.role_id || 1,
      is_super_admin: user.is_super_admin || false
    };

    req.tenant = {
      dbName: user.db_name,
      entrepriseId: user.entreprise_id
    };

    // Récupérer la langue préférée
    const acceptLanguage = req.headers['accept-language'] || 'fr';
    const supportedLanguages = ['fr', 'en', 'ar'];
    const preferredLanguage = acceptLanguage.split(',')[0].split('-')[0];
    req.language = supportedLanguages.includes(preferredLanguage) ? preferredLanguage : 'fr';
    
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expirée, veuillez vous reconnecter' });
    }
    console.error('Erreur verifyTokenWithCompany:', err);
    return res.status(401).json({ message: 'Token invalide' });
  }
};

// Exporter les deux versions
module.exports.verifyTokenWithCompany = verifyTokenWithCompany;
module.exports.default = module.exports;