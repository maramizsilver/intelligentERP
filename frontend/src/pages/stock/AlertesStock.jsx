// src/pages/stock/AlertesStock.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';

import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export default function AlertesStock() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAlertes();
  }, []);

  const loadAlertes = async () => {
    try {
      setLoading(true);
      const res = await API.get('/mouvements-stock/alertes/rupture');
      setAlertes(res.data.alertes || []);
    } catch (err) {
      setError('Impossible de charger les alertes');
    } finally {
      setLoading(false);
    }
  };

  const getLevelBadge = (stock) => {
    if (stock === 0) return { label: 'Rupture', variant: 'danger' };
    if (stock <= 2) return { label: 'Très critique', variant: 'danger' };
    if (stock <= 5) return { label: 'Critique', variant: 'warning' };
    return { label: 'Bas', variant: 'primary' };
  };

  const columns = [
    { key: 'nom', label: 'Produit' },
    {
      key: 'quantite_stock',
      label: 'Stock actuel',
      render: (row) => (
        <Badge variant={getLevelBadge(row.quantite_stock).variant}>
          {row.quantite_stock}
        </Badge>
      )
    },
    {
      key: 'niveau',
      label: 'Niveau',
      render: (row) => {
        const level = getLevelBadge(row.quantite_stock);
        return <Badge variant={level.variant}>{level.label}</Badge>;
      }
    }
  ];

  const actions = [
    {
      label: ' Commander',
      variant: 'primary',
      onClick: (row) => navigate('/achats')
    }
  ];

  if (loading) {
    return <LoadingSpinner size="lg" text="Chargement des alertes..." />;
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}> Alertes de rupture de stock</h1>
          <p style={styles.subtitle}>Surveillez les produits à risque</p>
        </div>
        <div style={styles.headerActions}>
          <Button variant="secondary" onClick={() => navigate('/dashboard')} icon="←">
            Retour
          </Button>
          <Button variant="primary" onClick={loadAlertes} icon="⟳" loading={loading}>
            Rafraîchir
          </Button>
        </div>
      </div>

      {error && (
        <div style={styles.errorContainer}>
          <span>❌</span>
          <span style={styles.errorText}>{error}</span>
        </div>
      )}

      <div style={styles.statsRow}>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #EF4444' }}>
          <span style={styles.statNumber}>{alertes.length}</span>
          <span style={styles.statLabel}>Produits en alerte</span>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #DC2626' }}>
          <span style={styles.statNumber}>
            {alertes.filter(a => a.quantite_stock === 0).length}
          </span>
          <span style={styles.statLabel}>En rupture totale</span>
        </div>
      </div>

      {alertes.length === 0 ? (
        <EmptyState
          icon="✅"
          title="Pas d'alerte de rupture"
          description="Tous vos produits ont un stock suffisant."
        />
      ) : (
        <Card title="Produits en alerte" variant="danger">
          <Table columns={columns} data={alertes} actions={actions} />
        </Card>
      )}
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  title: { fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: 0 },
  subtitle: { fontSize: '14px', color: '#64748B', margin: '4px 0 0' },
  headerActions: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '16px',
  },
  errorText: { color: '#991B1B', fontSize: '13px', fontWeight: 500 },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    padding: '18px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
  },
  statNumber: {
    fontSize: '26px',
    fontWeight: 'bold',
    color: '#0F172A',
  },
  statLabel: {
    color: '#64748B',
    fontSize: '13px',
    marginTop: '4px',
  },
};