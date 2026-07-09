// src/pages/dashboard/SuperAdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Table from '../../components/common/Table';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const [entreprises, setEntreprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await API.get('/entreprises');
      setEntreprises(res.data.entreprises || []);
    } catch (err) {
      setError('Impossible de charger les entreprises');
    } finally {
      setLoading(false);
    }
  };

  const valider = async (id) => {
    setBusyId(id);
    try {
      await API.put(`/entreprises/${id}/valider`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setBusyId(null);
    }
  };

  const suspendre = async (id) => {
    if (!window.confirm('Suspendre cette entreprise ?')) return;
    setBusyId(id);
    try {
      await API.put(`/entreprises/${id}/suspendre`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setBusyId(null);
    }
  };

  const passerEnPayant = async (id) => {
    if (!window.confirm('Faire passer cette entreprise en abonnement payant ?')) return;
    setBusyId(id);
    try {
      await API.put(`/entreprises/${id}/passer-payant`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setBusyId(null);
    }
  };

  const statutInfo = {
    en_attente: { label: 'En attente', variant: 'warning' },
    actif: { label: 'Actif', variant: 'success' },
    suspendu: { label: 'Suspendu', variant: 'danger' }
  };

  const compteurs = entreprises.reduce((acc, e) => {
    acc[e.statut] = (acc[e.statut] || 0) + 1;
    return acc;
  }, {});

  const columns = [
    { key: 'nom', label: 'Entreprise' },
    { key: 'email', label: 'Email' },
    {
      key: 'date_inscription',
      label: 'Inscrite le',
      render: (row) => new Date(row.date_inscription).toLocaleDateString('fr-FR')
    },
    {
      key: 'plan_type',
      label: 'Plan',
      render: (row) => (
        <Badge variant={row.plan_type === 'payant' ? 'secondary' : 'primary'}>
          {row.plan_type === 'payant' ? '💳 Payant' : ` Essai (${row.connexions_utilisees}/${row.limite_connexions_essai})`}
        </Badge>
      )
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (row) => {
        const info = statutInfo[row.statut] || { label: row.statut, variant: 'outline' };
        return <Badge variant={info.variant}>{info.label}</Badge>;
      }
    }
  ];

  const actions = [
    {
      label: 'Valider',
      variant: 'success',
      icon: '✅',
      onClick: (row) => valider(row.id),
      disabled: (row) => row.statut === 'actif' || busyId === row.id
    },
    {
      label: 'Suspendre',
      variant: 'danger',
      icon: '⛔',
      onClick: (row) => suspendre(row.id),
      disabled: (row) => row.statut === 'suspendu' || busyId === row.id
    },
    {
      label: 'Passer payant',
      variant: 'secondary',
      icon: '💳',
      onClick: (row) => passerEnPayant(row.id),
      disabled: (row) => row.plan_type === 'payant' || busyId === row.id
    }
  ];

  if (loading) return <LoadingSpinner size="lg" text="Chargement..." />;

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}> Plateforme — SuperAdmin</h1>
          <p style={styles.subtitle}>Bonjour {user?.prenom}, voici les entreprises inscrites.</p>
        </div>
        <Button variant="danger" onClick={logout}>Déconnexion</Button>
      </div>

      {error && (
        <div style={styles.errorContainer}>
          
          <span style={styles.errorText}>{error}</span>
        </div>
      )}

      <div style={styles.statsRow}>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #F59E0B' }}>
          <span style={styles.statNumber}>{compteurs.en_attente || 0}</span>
          <span style={styles.statLabel}>En attente de validation</span>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #22C55E' }}>
          <span style={styles.statNumber}>{compteurs.actif || 0}</span>
          <span style={styles.statLabel}>Actives</span>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #EF4444' }}>
          <span style={styles.statNumber}>{compteurs.suspendu || 0}</span>
          <span style={styles.statLabel}>Suspendues</span>
        </div>
      </div>

      <Card title=" Liste des entreprises" variant="primary">
        <Table
          columns={columns}
          data={entreprises}
          loading={loading}
          actions={actions}
          emptyMessage="Aucune entreprise inscrite pour le moment."
        />
      </Card>
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
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#0F172A',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748B',
    margin: '4px 0 0',
  },
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
  errorText: {
    color: '#991B1B',
    fontSize: '13px',
    fontWeight: 500,
  },
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