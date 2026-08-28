// frontend/src/components/dashboard/KpiCard.jsx
// ---------------------------------------------------------------------------
// Carte KPI réutilisable. Reçoit un objet conforme à la forme définie dans
// dashboardAnalyticsData.js (id, label, value, unit, trend, trendDirection,
// icon, accent) — un seul composant sert donc pour tous les indicateurs
// clés du dashboard (ventes, commandes, clients, panier moyen...).
// ---------------------------------------------------------------------------
import React from 'react';
import './KpiCard.css';

const ICONS = {
  revenue: '💰',
  orders: '🛒',
  clients: '👥',
  panier: '🧾',
};

function formatValue(value, unit) {
  const formatted = new Intl.NumberFormat('fr-FR').format(value);
  return unit ? `${formatted} ${unit}` : formatted;
}

export default function KpiCard({ label, value, unit, trend, trendDirection, icon, accent }) {
  const trendLabel = `${trend > 0 ? '+' : ''}${trend}% vs période précédente`;

  return (
    <div className="kpi-card" style={{ '--kpi-accent': accent }}>
      <div className="kpi-card-top">
        <span className="kpi-icon" aria-hidden="true">{ICONS[icon] || '📊'}</span>
        <span className={`kpi-trend kpi-trend--${trendDirection}`} title={trendLabel}>
          {trendDirection === 'positive' && '▲'}
          {trendDirection === 'negative' && '▼'}
          {trendDirection === 'neutral' && '▬'}
          {' '}{Math.abs(trend)}%
        </span>
      </div>

      <div className="kpi-value" aria-label={formatValue(value, unit)}>
        {formatValue(value, unit)}
      </div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}