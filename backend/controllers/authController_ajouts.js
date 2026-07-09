
// ============================================================

// ============================================================
// ADMIN ENTREPRISE : supprimer un utilisateur interne de son entreprise
// - impossible de se supprimer soi-même (garde-fou)
// - impossible de supprimer le dernier compte Admin Entreprise restant
//   (sinon plus personne ne peut gérer l'entreprise)
// ============================================================
exports.deleteUser = (req, res) => {
    const { id } = req.params;

    if (Number(id) === req.user.id) {
        return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    const sqlInfo = `
        SELECT u.id, r.est_admin_entreprise
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.id = ? AND u.entreprise_id = ?
    `;
    db.query(sqlInfo, [id, req.user.entreprise_id], (errInfo, rows) => {
        if (errInfo) { console.error(errInfo); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (rows.length === 0) return res.status(404).json({ message: 'Utilisateur introuvable dans votre entreprise' });

        const cible = rows[0];

        const supprimer = () => {
            db.query('DELETE FROM users WHERE id = ? AND entreprise_id = ?', [id, req.user.entreprise_id], (err, result) => {
                if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
                if (result.affectedRows === 0) return res.status(404).json({ message: 'Utilisateur introuvable' });
                res.json({ message: 'Utilisateur supprimé avec succès' });
            });
        };

        if (!cible.est_admin_entreprise) {
            return supprimer();
        }

        // La cible est un Admin Entreprise : vérifier qu'il n'est pas le dernier
        const sqlCountAdmins = `
            SELECT COUNT(*) AS total
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.entreprise_id = ? AND r.est_admin_entreprise = TRUE
        `;
        db.query(sqlCountAdmins, [req.user.entreprise_id], (errCount, countRows) => {
            if (errCount) { console.error(errCount); return res.status(500).json({ message: 'Erreur serveur' }); }
            if (countRows[0].total <= 1) {
                return res.status(400).json({ message: "Impossible de supprimer le dernier compte Admin Entreprise" });
            }
            supprimer();
        });
    });
};

// ============================================================
// ADMIN ENTREPRISE : statistiques des comptes par rôle
// (utilisé par le frontend pour l'onglet "Comptes utilisateurs")
// ============================================================
exports.getUserStats = (req, res) => {
    const sql = `
        SELECT
            COALESCE(r.nom, 'Externe / sans rôle') AS role_nom,
            COUNT(*) AS total
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.entreprise_id = ?
        GROUP BY r.nom
        ORDER BY total DESC
    `;
    db.query(sql, [req.user.entreprise_id], (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }

        const sqlTotalExternes = 'SELECT COUNT(*) AS total FROM users WHERE entreprise_id = ? AND is_external = TRUE';
        db.query(sqlTotalExternes, [req.user.entreprise_id], (err2, rowsExt) => {
            if (err2) { console.error(err2); return res.status(500).json({ message: 'Erreur serveur' }); }
            res.json({
                stats_par_role: results,
                total_comptes_externes: rowsExt[0].total
            });
        });
    });
};
