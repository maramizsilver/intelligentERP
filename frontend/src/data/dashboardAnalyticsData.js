// frontend/src/data/dashboardAnalyticsData.js
// ---------------------------------------------------------------------------
// Données statiques pour le tableau de bord analytique. Elles sont
// structurées comme une réponse d'API réelle (ex: GET /api/dashboard/stats)
// pour qu'il suffise de remplacer cet import par un appel `API.get(...)`
// le jour où l'endpoint backend existera — aucun composant n'a besoin de
// changer de forme de données.
// ---------------------------------------------------------------------------

/**
 * Cartes KPI affichées en haut du dashboard.
 * `trend` est le pourcentage d'évolution vs la période précédente,
 * `trendDirection` détermine la couleur (positive/negative/neutral).
 */
export const kpiData = [
  {
    id: 'revenue',
    label: 'Chiffre d\'affaires',
    value: 128450,
    unit: 'DT',
    trend: 12.4,
    trendDirection: 'positive',
    icon: 'revenue',
    accent: '#0EA5E9',
  },
  {
    id: 'orders',
    label: 'Commandes',
    value: 342,
    unit: '',
    trend: 8.1,
    trendDirection: 'positive',
    icon: 'orders',
    accent: '#6366F1',
  },
  {
    id: 'clients',
    label: 'Nouveaux clients',
    value: 57,
    unit: '',
    trend: -3.2,
    trendDirection: 'negative',
    icon: 'clients',
    accent: '#10B981',
  },
  {
    id: 'panier',
    label: 'Panier moyen',
    value: 375,
    unit: 'DT',
    trend: 0.6,
    trendDirection: 'neutral',
    icon: 'panier',
    accent: '#F59E0B',
  },
];

/** Évolution mensuelle du chiffre d'affaires (courbe). */
export const revenueTrend = [
  { month: 'Jan', revenu: 68000, objectif: 70000 },
  { month: 'Fév', revenu: 74500, objectif: 72000 },
  { month: 'Mar', revenu: 81200, objectif: 78000 },
  { month: 'Avr', revenu: 79800, objectif: 80000 },
  { month: 'Mai', revenu: 92100, objectif: 85000 },
  { month: 'Jun', revenu: 98700, objectif: 90000 },
  { month: 'Jul', revenu: 104300, objectif: 95000 },
  { month: 'Aoû', revenu: 111950, objectif: 100000 },
  { month: 'Sep', revenu: 118400, objectif: 108000 },
  { month: 'Oct', revenu: 122600, objectif: 115000 },
  { month: 'Nov', revenu: 125900, objectif: 120000 },
  { month: 'Déc', revenu: 128450, objectif: 125000 },
];

/** Commandes par statut, par semaine (barres). */
export const ordersByWeek = [
  { semaine: 'S1', livrees: 42, en_attente: 12, annulees: 3 },
  { semaine: 'S2', livrees: 51, en_attente: 9, annulees: 2 },
  { semaine: 'S3', livrees: 47, en_attente: 15, annulees: 4 },
  { semaine: 'S4', livrees: 60, en_attente: 8, annulees: 1 },
];

/** Répartition du chiffre d'affaires par module métier (camembert). */
export const revenueByModule = [
  { name: 'Ventes', value: 54, color: '#0EA5E9' },
  { name: 'Achats reversés', value: 18, color: '#6366F1' },
  { name: 'Abonnements', value: 16, color: '#10B981' },
  { name: 'Prestations', value: 12, color: '#F59E0B' },
];

/** Activité récente pour la liste latérale du dashboard. */
export const recentActivity = [
  { id: 1, label: 'Nouvelle commande #CMD-2026-0842', time: 'Il y a 12 min', type: 'order' },
  { id: 2, label: 'Client "Société ABC" a signé un devis', time: 'Il y a 48 min', type: 'client' },
  { id: 3, label: 'Facture #FAC-2026-0311 réglée', time: 'Il y a 2 h', type: 'payment' },
  { id: 4, label: 'Stock produit "Ramette A4" sous le seuil', time: 'Il y a 3 h', type: 'alert' },
];