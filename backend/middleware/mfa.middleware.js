module.exports = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }
  if (!req.user.mfa_verified) {
    return res.status(403).json({ 
      success: false, 
      message: 'MFA requise pour accéder à cette ressource',
      code: 'MFA_REQUIRED'
    });
  }
  next();
};

module.exports.isMFAEnabled = async (req, res, next) => {
  try {
    const db = req.db;
    const [rows] = await db.promise().query(
      'SELECT mfa_enabled FROM users WHERE id = ?',
      [req.user.id]
    );
    req.mfa_enabled = rows.length > 0 && rows[0].mfa_enabled === 1;
    next();
  } catch (error) {
    req.mfa_enabled = false;
    next();
  }
};