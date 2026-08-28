import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import analyticsApi from '../../services/analytics.api';
import KpiCard from '../../components/dashboard/KpiCard';
import ChartCard from '../../components/dashboard/ChartCard';
import RevenueLineChart from '../../components/dashboard/charts/RevenueLineChart';
import OrdersBarChart from '../../components/dashboard/charts/OrdersBarChart';
import RevenueDonutChart from '../../components/dashboard/charts/RevenueDonutChart';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';

import '../../styles/brand-tokens.css';
import '../../components/dashboard/charts/charts.css';
import './AnalyticsDashboard.css';

const ACTIVITY_ICON = {
  order: '🛒',
  client: '🤝',
  payment: '💳',
  alert: '⚠️',
};

const KPI_META = {
  revenue: { icon: 'revenue', accent: '#0EA5E9', label: "Chiffre d'affaires" },
  orders: { icon: 'orders', accent: '#486ea6', label: 'Commandes' },
  newClients: { icon: 'clients', accent: '#2610b9', label: 'Nouveaux clients' },
  avgBasket: { icon: 'panier', accent: '#200c64', label: 'Panier moyen' },
};

const PRESETS = [
  { key: '7j', label: '7 derniers jours', days: 7 },
  { key: '30j', label: '30 derniers jours', days: 30 },
  { key: '90j', label: '3 derniers mois', days: 90 },
  { key: '365j', label: '12 derniers mois', days: 365 },
];

function toISO(d) {
  return d.toISOString().slice(0, 10);
}

export default function AnalyticsDashboard() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [preset, setPreset] = useState('365j');
  const [customDebut, setCustomDebut] = useState('');
  const [customFin, setCustomFin] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const getRange = useCallback(() => {
    if (useCustom && customDebut && customFin) {
      return { date_debut: customDebut, date_fin: customFin };
    }
    const days = PRESETS.find(p => p.key === preset)?.days || 365;
    const fin = new Date();
    const debut = new Date();
    debut.setDate(fin.getDate() - (days - 1));
    return { date_debut: toISO(debut), date_fin: toISO(fin) };
  }, [preset, useCustom, customDebut, customFin]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await analyticsApi.getAnalytics(getRange());
      setData(res.data);
    } catch (err) {
      setError('Impossible de charger les statistiques pour le moment.');
    } finally {
      setLoading(false);
    }
  }, [getRange]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, useCustom]);

  const applyCustomRange = () => {
    if (customDebut && customFin) {
      setUseCustom(true);
    }
  };

  if (loading && !data) {
    return <LoadingSpinner size="lg" text={t('chargement') || 'Chargement des statistiques...'} />;
  }

  if (error) {
    return (
      <div className="ad-page">
        <div className="ad-error">{error}</div>
        <Button variant="primary" onClick={loadData}>Réessayer</Button>
      </div>
    );
  }

  if (!data) return null;

  // ------------------------------------------------------------
  // Aucune donnée saisie du tout dans l'entreprise (premier usage)
  // ------------------------------------------------------------
  if (!data.hasAnyData) {
    return (
      <div className="ad-page">
        <div className="ad-empty-hero">
          <h1 className="ad-empty-title">Votre parcours analytique commence ici</h1>
          <p className="ad-empty-text">
            Commencez à ajouter des produits, des clients, des ventes et des transactions
            à votre ERP. Votre tableau de bord se remplira automatiquement au fur et à
            mesure que votre activité grandit.
          </p>
          <div className="ad-empty-actions">
            <Button variant="primary" size="lg" onClick={() => navigate('/produits')}>
              + Ajouter votre premier produit
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/commandes')}>
              + Créer votre première vente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const kpis = data.kpis || {};

  return (
    <div className="ad-page">
      <header className="ad-header">
        <div>
          <p className="ad-eyebrow">Vue d'ensemble</p>
          <h1 className="ad-title">Statistiques</h1>
          <p className="ad-subtitle">
            Indicateurs calculés à partir de vos données réelles, du {data.periode?.debut} au {data.periode?.fin}
          </p>
        </div>
      </header>

      {/* --- Filtres de période --- */}
      <div className="ad-filters">
        {PRESETS.map(p => (
          <button
            key={p.key}
            className={`ad-filter-chip ${!useCustom && preset === p.key ? 'ad-filter-chip--active' : ''}`}
            onClick={() => { setUseCustom(false); setPreset(p.key); }}
          >
            {p.label}
          </button>
        ))}
        <div className="ad-filter-custom">
          <input type="date" value={customDebut} onChange={(e) => setCustomDebut(e.target.value)} className="ad-filter-date" />
          <span>→</span>
          <input type="date" value={customFin} onChange={(e) => setCustomFin(e.target.value)} className="ad-filter-date" />
          <button className="ad-filter-apply" onClick={applyCustomRange}>Appliquer</button>
        </div>
      </div>

      {/* --- Cartes KPI --- */}
      <section className="ad-kpi-grid" aria-label="Indicateurs clés">
        {Object.keys(KPI_META).map((key) => {
          const meta = KPI_META[key];
          const kpi = kpis[key] || { value: 0, unit: '', trend: 0, trendDirection: 'neutral' };
          return (
            <KpiCard
              key={key}
              label={meta.label}
              value={kpi.value}
              unit={kpi.unit}
              trend={kpi.trend}
              trendDirection={kpi.trendDirection}
              icon={meta.icon}
              accent={meta.accent}
            />
          );
        })}
      </section>

      {/* --- Graphiques --- */}
      <section className="ad-chart-grid">
        <ChartCard
          title="Évolution du chiffre d'affaires"
          subtitle="Commandes livrées + recettes manuelles, sur la période sélectionnée"
          className="ad-chart-span-2"
        >
          {data.revenueTrend?.length > 0 ? (
            <RevenueLineChart data={data.revenueTrend} />
          ) : (
            <EmptyChart message="Aucune vente enregistrée sur cette période." />
          )}
        </ChartCard>

        <ChartCard title="Répartition du CA par source" subtitle="Sur la période sélectionnée">
          {data.revenueByModule?.length > 0 ? (
            <RevenueDonutChart data={data.revenueByModule} />
          ) : (
            <EmptyChart message="Pas encore de chiffre d'affaires à répartir." />
          )}
        </ChartCard>

        <ChartCard
          title="Commandes par semaine"
          subtitle="Livrées, en attente et annulées"
          className="ad-chart-span-2"
        >
          {data.ordersByWeek?.length > 0 ? (
            <OrdersBarChart data={data.ordersByWeek} />
          ) : (
            <EmptyChart message="Aucune commande sur cette période." />
          )}
        </ChartCard>

        <ChartCard title="Activité récente" subtitle="Derniers événements de votre entreprise">
          {data.recentActivity?.length > 0 ? (
            <ul className="ad-activity-list">
              {data.recentActivity.map((item) => (
                <li key={item.id} className="ad-activity-item">
                  <span className="ad-activity-icon" aria-hidden="true">{ACTIVITY_ICON[item.type] || '•'}</span>
                  <div>
                    <p className="ad-activity-label">{item.label}</p>
                    <p className="ad-activity-time">{item.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyChart message="Aucune activité récente." />
          )}
        </ChartCard>
      </section>
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="ad-chart-empty">
      <span className="ad-chart-empty-icon">📭</span>
      <p>{message}</p>
    </div>
  );
}