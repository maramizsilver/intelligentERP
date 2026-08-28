// frontend/src/pages/dashboard/AnalyticsDashboard.jsx
// ---------------------------------------------------------------------------
// Tableau de bord analytique : cartes KPI + graphiques interactifs
// (courbe, barres, camembert) + flux d'activité récente.
//
// Les données viennent de src/data/dashboardAnalyticsData.js. Elles sont
// statiques mais structurées exactement comme une réponse d'API — le seul
// changement nécessaire pour brancher un vrai backend serait de remplacer
// les imports ci-dessous par un `useEffect` + `API.get('/dashboard/stats')`
// (voir le pattern déjà utilisé dans Dashboard.jsx).
//
// Cette page est indépendante de Dashboard.jsx (qui reste l'accès rapide
// par module) : elle est pensée comme un écran "Statistiques" complémentaire.
// ---------------------------------------------------------------------------
import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import KpiCard from '../../components/dashboard/KpiCard';
import ChartCard from '../../components/dashboard/ChartCard';
import RevenueLineChart from '../../components/dashboard/charts/RevenueLineChart';
import OrdersBarChart from '../../components/dashboard/charts/OrdersBarChart';
import RevenueDonutChart from '../../components/dashboard/charts/RevenueDonutChart';
import {
  kpiData,
  revenueTrend,
  ordersByWeek,
  revenueByModule,
  recentActivity,
} from '../../data/dashboardAnalyticsData';

import '../../styles/brand-tokens.css';
import '../../components/dashboard/charts/charts.css';
import './AnalyticsDashboard.css';

const ACTIVITY_ICON = {
  order: '🛒',
  client: '🤝',
  payment: '💳',
  alert: '⚠️',
};

export default function AnalyticsDashboard() {
  const { t } = useLanguage();

  return (
    <div className="ad-page">
      <header className="ad-header">
        <div>
          <p className="ad-eyebrow">Vue d'ensemble</p>
          <h1 className="ad-title">{t('moteur_calcul') ? 'Statistiques' : 'Statistiques'}</h1>
          <p className="ad-subtitle">Indicateurs clés de votre activité sur les 12 derniers mois</p>
        </div>
      </header>

      {/* --- Cartes KPI --- */}
      <section className="ad-kpi-grid" aria-label="Indicateurs clés">
        {kpiData.map((kpi) => (
          <KpiCard key={kpi.id} {...kpi} />
        ))}
      </section>

      {/* --- Graphiques --- */}
      <section className="ad-chart-grid">
        <ChartCard
          title="Évolution du chiffre d'affaires"
          subtitle="Réalisé vs objectif, sur les 12 derniers mois"
          className="ad-chart-span-2"
        >
          <RevenueLineChart data={revenueTrend} />
        </ChartCard>

        <ChartCard title="Répartition du CA par module" subtitle="Sur le mois en cours">
          <RevenueDonutChart data={revenueByModule} />
        </ChartCard>

        <ChartCard
          title="Commandes par semaine"
          subtitle="Livrées, en attente et annulées"
          className="ad-chart-span-2"
        >
          <OrdersBarChart data={ordersByWeek} />
        </ChartCard>

        <ChartCard title="Activité récente" subtitle="Derniers événements de la plateforme">
          <ul className="ad-activity-list">
            {recentActivity.map((item) => (
              <li key={item.id} className="ad-activity-item">
                <span className="ad-activity-icon" aria-hidden="true">{ACTIVITY_ICON[item.type] || '•'}</span>
                <div>
                  <p className="ad-activity-label">{item.label}</p>
                  <p className="ad-activity-time">{item.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </ChartCard>
      </section>
    </div>
  );
}