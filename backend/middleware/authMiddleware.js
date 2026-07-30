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