const AuditService = require('../services/audit.service');
const db = require('../config/db');
const pool = () => db.promisePoolMaster;

// SuperAdmin : tout ; staff entreprise : uniquement SON entreprise
const portee = (req) => (req.user.is_super_admin ? null : req.user.entreprise_id);

exports.getLogs = async (req, res) => {
  try {
    const eid = portee(req);
    const logs = await AuditService.getLogs({ ...req.query, entreprise_id: eid });
    const [total] = eid
      ? await pool().query('SELECT COUNT(*) AS total FROM audit_logs WHERE entreprise_id = ?', [eid])
      : await pool().query('SELECT COUNT(*) AS total FROM audit_logs');
    res.json({ logs, total: total[0]?.total || 0 });
  } catch (err) { console.error('Erreur getLogs:', err); res.status(500).json({ message: 'Erreur serveur' }); }
};

exports.getConnexions = async (req, res) => {
  try {
    const eid = portee(req);
    const logs = await AuditService.getConnexions({ ...req.query, entreprise_id: eid });
    const [total] = eid
      ? await pool().query(`SELECT COUNT(*) AS total FROM audit_connexions ac
                            JOIN users u ON ac.utilisateur_id = u.id WHERE u.entreprise_id = ?`, [eid])
      : await pool().query('SELECT COUNT(*) AS total FROM audit_connexions');
    res.json({ logs, total: total[0]?.total || 0 });
  } catch (err) { console.error('Erreur getConnexions:', err); res.status(500).json({ message: 'Erreur serveur' }); }
};

exports.getOperations = async (req, res) => {
  try {
    const eid = portee(req);
    const logs = await AuditService.getOperations({ ...req.query, entreprise_id: eid });
    const [total] = eid
      ? await pool().query('SELECT COUNT(*) AS total FROM audit_operations WHERE entreprise_id = ?', [eid])
      : await pool().query('SELECT COUNT(*) AS total FROM audit_operations');
    res.json({ logs, total: total[0]?.total || 0 });
  } catch (err) { console.error('Erreur getOperations:', err); res.status(500).json({ message: 'Erreur serveur' }); }
};

exports.getAuditStats = async (req, res) => {
  try {
    const eid = portee(req);
    const w = eid ? ' WHERE entreprise_id = ?' : '';
    const p = eid ? [eid] : [];
    const [totalLogs] = await pool().query(`SELECT COUNT(*) AS total FROM audit_logs${w}`, p);
    const [logsByModule] = await pool().query(
      `SELECT module, COUNT(*) AS total FROM audit_logs${w} GROUP BY module ORDER BY total DESC`, p);
    const [connexionsByStatus] = eid
      ? await pool().query(`SELECT ac.status, COUNT(*) AS total FROM audit_connexions ac
                            JOIN users u ON ac.utilisateur_id = u.id WHERE u.entreprise_id = ? GROUP BY ac.status`, [eid])
      : await pool().query('SELECT status, COUNT(*) AS total FROM audit_connexions GROUP BY status');
    const [recentLogs] = await pool().query(`SELECT * FROM audit_logs${w} ORDER BY created_at DESC LIMIT 10`, p);

    res.json({
      total_logs: totalLogs[0]?.total || 0,
      logs_by_module: logsByModule,
      connexions_by_status: connexionsByStatus,
      recent_activities: recentLogs
    });
  } catch (err) { console.error('Erreur getAuditStats:', err); res.status(500).json({ message: 'Erreur serveur' }); }
};