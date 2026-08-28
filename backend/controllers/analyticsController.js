// backend/controllers/analyticsController.js
// ============================================================
// Tableau de bord analytique : agrège des données 100% réelles
// depuis la base tenant (commandes, recettes, clients...) et les
// logs d'audit (activité récente). Aucune donnée simulée n'est
// jamais renvoyée : si l'entreprise n'a rien saisi, tout vaut 0.
// ============================================================
const db = require('../config/db');

const MOIS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

function query(pool, sql, params = []) {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
    });
}

function toISODate(d) {
    return d.toISOString().slice(0, 10);
}

function parseRange(req) {
    const today = new Date();
    let dateFin = req.query.date_fin ? new Date(req.query.date_fin) : today;
    let dateDebut = req.query.date_debut
        ? new Date(req.query.date_debut)
        : new Date(new Date(dateFin).setDate(dateFin.getDate() - 364));

    if (isNaN(dateDebut.getTime())) dateDebut = new Date(new Date(dateFin).setDate(dateFin.getDate() - 364));
    if (isNaN(dateFin.getTime())) dateFin = today;

    // Période précédente de même durée, immédiatement avant date_debut (pour les tendances)
    const dureeMs = dateFin.getTime() - dateDebut.getTime();
    const datePrecFin = new Date(dateDebut.getTime() - 24 * 60 * 60 * 1000);
    const datePrecDebut = new Date(datePrecFin.getTime() - dureeMs);

    return {
        debut: toISODate(dateDebut),
        fin: toISODate(dateFin),
        precDebut: toISODate(datePrecDebut),
        precFin: toISODate(datePrecFin)
    };
}

function calcTrend(actuel, precedent) {
    if (!precedent) {
        return { trend: actuel > 0 ? 100 : 0, trendDirection: actuel > 0 ? 'positive' : 'neutral' };
    }
    const pct = ((actuel - precedent) / precedent) * 100;
    return {
        trend: Math.round(pct * 10) / 10,
        trendDirection: pct > 0.5 ? 'positive' : pct < -0.5 ? 'negative' : 'neutral'
    };
}

function timeAgo(date) {
    const diffMs = Date.now() - new Date(date).getTime();
    const min = Math.floor(diffMs / 60000);
    if (min < 1) return "À l'instant";
    if (min < 60) return `Il y a ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `Il y a ${h} h`;
    const j = Math.floor(h / 24);
    if (j < 30) return `Il y a ${j} j`;
    return new Date(date).toLocaleDateString('fr-FR');
}

function moduleToType(mod = '') {
    const m = mod.toLowerCase();
    if (m.includes('vente') || m.includes('commande') || m.includes('devis')) return 'order';
    if (m.includes('finance') || m.includes('paiement')) return 'payment';
    if (m.includes('client')) return 'client';
    if (m.includes('stock') || m.includes('achat')) return 'alert';
    return 'order';
}

function actionLabel(action, module) {
    return `${action}${module ? ` — ${module}` : ''}`;
}

async function getRevenueEtOrders(pool, debut, fin) {
    const commandesRows = await query(pool,
        `SELECT COALESCE(SUM(total),0) AS revenue, COUNT(*) AS nb
         FROM commandes WHERE statut = 'livree' AND date_commande BETWEEN ? AND ?`,
        [debut, fin + ' 23:59:59']);
    const recettesRows = await query(pool,
        `SELECT COALESCE(SUM(montant),0) AS revenue
         FROM recettes WHERE date_recette BETWEEN ? AND ?`,
        [debut, fin]);
    const totalOrdersRows = await query(pool,
        `SELECT COUNT(*) AS nb FROM commandes WHERE date_commande BETWEEN ? AND ?`,
        [debut, fin + ' 23:59:59']);

    const revenue = Number(commandesRows[0].revenue) + Number(recettesRows[0].revenue);
    const commandesLivrees = Number(commandesRows[0].nb);
    const ordersTotal = Number(totalOrdersRows[0].nb);

    return { revenue, commandesLivrees, ordersTotal };
}

exports.getAnalytics = async (req, res) => {
    try {
        const pool = req.db;
        const { debut, fin, precDebut, precFin } = parseRange(req);

        // ------------------------------------------------------
        // 0. L'entreprise a-t-elle déjà saisi quoi que ce soit ?
        //    (indépendamment de la période sélectionnée)
        // ------------------------------------------------------
        const compteurs = await query(pool, `
            SELECT
                (SELECT COUNT(*) FROM clients)   AS nb_clients,
                (SELECT COUNT(*) FROM produits)  AS nb_produits,
                (SELECT COUNT(*) FROM commandes) AS nb_commandes,
                (SELECT COUNT(*) FROM devis)     AS nb_devis,
                (SELECT COUNT(*) FROM factures)  AS nb_factures
        `);
        const c = compteurs[0] || {};
        const hasAnyData = Object.values(c).some(v => Number(v) > 0);

        // ------------------------------------------------------
        // 1. KPIs (période actuelle vs période précédente)
        // ------------------------------------------------------
        const actuel = await getRevenueEtOrders(pool, debut, fin);
        const precedent = await getRevenueEtOrders(pool, precDebut, precFin);

        const nouveauxClientsRows = await query(pool,
            `SELECT COUNT(*) AS nb FROM clients WHERE created_at BETWEEN ? AND ?`,
            [debut, fin + ' 23:59:59']);
        const nouveauxClientsPrecRows = await query(pool,
            `SELECT COUNT(*) AS nb FROM clients WHERE created_at BETWEEN ? AND ?`,
            [precDebut, precFin + ' 23:59:59']);

        const nouveauxClients = Number(nouveauxClientsRows[0].nb);
        const nouveauxClientsPrec = Number(nouveauxClientsPrecRows[0].nb);

        const panierMoyen = actuel.commandesLivrees > 0 ? actuel.revenue / actuel.commandesLivrees : 0;
        const panierMoyenPrec = precedent.commandesLivrees > 0 ? precedent.revenue / precedent.commandesLivrees : 0;

        const kpis = {
            revenue:    { value: Math.round(actuel.revenue * 100) / 100, unit: 'DT', ...calcTrend(actuel.revenue, precedent.revenue) },
            orders:     { value: actuel.ordersTotal, unit: '', ...calcTrend(actuel.ordersTotal, precedent.ordersTotal) },
            newClients: { value: nouveauxClients, unit: '', ...calcTrend(nouveauxClients, nouveauxClientsPrec) },
            avgBasket:  { value: Math.round(panierMoyen * 100) / 100, unit: 'DT', ...calcTrend(panierMoyen, panierMoyenPrec) }
        };

        // ------------------------------------------------------
        // 2. Courbe d'évolution mensuelle du chiffre d'affaires
        // ------------------------------------------------------
        const commandesParMois = await query(pool, `
            SELECT DATE_FORMAT(date_commande, '%Y-%m') AS ym, SUM(total) AS total
            FROM commandes WHERE statut = 'livree' AND date_commande BETWEEN ? AND ?
            GROUP BY ym`, [debut, fin + ' 23:59:59']);
        const recettesParMois = await query(pool, `
            SELECT DATE_FORMAT(date_recette, '%Y-%m') AS ym, SUM(montant) AS total
            FROM recettes WHERE date_recette BETWEEN ? AND ?
            GROUP BY ym`, [debut, fin]);

        const moisMap = {};
        [...commandesParMois, ...recettesParMois].forEach(r => {
            moisMap[r.ym] = (moisMap[r.ym] || 0) + Number(r.total);
        });
        const revenueTrend = Object.keys(moisMap).sort().map(ym => {
            const [annee, mois] = ym.split('-');
            return { month: `${MOIS_FR[Number(mois) - 1]} ${annee}`, revenu: Math.round(moisMap[ym] * 100) / 100 };
        });

        // ------------------------------------------------------
        // 3. Commandes par semaine (livrées / en attente / annulées)
        // ------------------------------------------------------
        const commandesParSemaine = await query(pool, `
            SELECT YEARWEEK(date_commande, 3) AS yw, statut, COUNT(*) AS nb
            FROM commandes WHERE date_commande BETWEEN ? AND ?
            GROUP BY yw, statut ORDER BY yw`, [debut, fin + ' 23:59:59']);

        const semaineMap = {};
        commandesParSemaine.forEach(r => {
            if (!semaineMap[r.yw]) semaineMap[r.yw] = { livrees: 0, en_attente: 0, annulees: 0 };
            if (r.statut === 'livree') semaineMap[r.yw].livrees += Number(r.nb);
            else if (r.statut === 'annulee') semaineMap[r.yw].annulees += Number(r.nb);
            else semaineMap[r.yw].en_attente += Number(r.nb);
        });
        const semainesTriees = Object.keys(semaineMap).sort().slice(-8);
        const ordersByWeek = semainesTriees.map((yw, idx) => ({
            semaine: `S${idx + 1}`,
            ...semaineMap[yw]
        }));

        // ------------------------------------------------------
        // 4. Répartition du chiffre d'affaires par source
        // ------------------------------------------------------
        const totalCommandes = commandesParMois.reduce((s, r) => s + Number(r.total), 0);
        const totalRecettes = recettesParMois.reduce((s, r) => s + Number(r.total), 0);
        const totalRevenu = totalCommandes + totalRecettes;

        const revenueByModule = totalRevenu > 0 ? [
            { name: 'Commandes livrées', value: Math.round((totalCommandes / totalRevenu) * 1000) / 10, color: '#0EA5E9' },
            { name: 'Recettes manuelles', value: Math.round((totalRecettes / totalRevenu) * 1000) / 10, color: '#10B981' }
        ].filter(m => m.value > 0) : [];

        // ------------------------------------------------------
        // 5. Activité récente (issue des vrais logs d'audit)
        // ------------------------------------------------------
        const [logs] = await db.promisePoolMaster.query(`
            SELECT action, module, created_at
            FROM audit_logs
            WHERE entreprise_id = ?
            ORDER BY created_at DESC
            LIMIT 8`, [req.user.entreprise_id]);

        const recentActivity = logs.map((row, idx) => ({
            id: idx,
            label: actionLabel(row.action, row.module),
            time: timeAgo(row.created_at),
            type: moduleToType(row.module)
        }));

        res.json({
            hasAnyData,
            periode: { debut, fin },
            kpis,
            revenueTrend,
            ordersByWeek,
            revenueByModule,
            recentActivity
        });
    } catch (err) {
        console.error('Erreur getAnalytics:', err);
        res.status(500).json({ message: 'Erreur lors du chargement des statistiques' });
    }
};