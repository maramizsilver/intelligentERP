module.exports = (req, res, next) => {
  if (!req.user || !req.user.is_super_admin) {
    return res.status(403).json({ message: 'Accès réservé au SuperAdmin plateforme' });
  }
  next();
};
