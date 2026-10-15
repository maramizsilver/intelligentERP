// controllers/userController.js
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const SessionService = require('../services/session.service');

const POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;

exports.updateProfil = async (req, res) => {
  const { nom, prenom, telephone, matricule, fonction, service } = req.body;
  if (!nom || nom.trim().length < 2 || !prenom || prenom.trim().length < 2) {
    return res.status(400).json({ message: 'Nom et prénom requis (2 caractères min)' });
  }
  const vals = [nom.trim(), prenom.trim(), telephone || null, matricule || null, fonction || null, service || null, req.user.id];
  const sql = 'UPDATE users SET nom=?, prenom=?, telephone=?, matricule=?, fonction=?, service=? WHERE id=?';
  try {
    await db.promisePoolMaster.query(sql, vals);
    if (!req.user.is_super_admin) await req.db.promise().query(sql, vals);
    res.json({
      message: 'Profil mis à jour',
      user: { nom: vals[0], prenom: vals[1], telephone: vals[2], matricule: vals[3], fonction: vals[4], service: vals[5] }
    });
  } catch (err) {
    console.error('[updateProfil]', err.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Champs requis' });
  if (!POLICY.test(newPassword)) {
    return res.status(400).json({ message: 'Mot de passe : 8 caractères min, majuscule, minuscule, chiffre et caractère spécial (!@#$%^&*)' });
  }
  try {
    const [rows] = await db.promisePoolMaster.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length || !(await bcrypt.compare(currentPassword, rows[0].password))) {
      return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
    }
    const hash = await bcrypt.hash(newPassword, 10);
    await db.promisePoolMaster.query('UPDATE users SET password = ? WHERE id = ?', [hash, req.user.id]);
    if (!req.user.is_super_admin) await req.db.promise().query('UPDATE users SET password = ? WHERE id = ?', [hash, req.user.id]);
    const tokenCourant = req.headers.authorization?.split(' ')[1];
    await SessionService.revokeOtherSessions(req.user.id, tokenCourant);
    res.json({ message: 'Mot de passe changé' });
  } catch (err) {
    console.error('[changePassword]', err.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};