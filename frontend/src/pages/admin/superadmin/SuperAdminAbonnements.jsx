import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import API from '../../../utils/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Table from '../../../components/common/Table';
import Badge from '../../../components/common/Badge';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import EmptyState from '../../../components/common/EmptyState';

export default function SuperAdminAbonnements() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [abonnements, setAbonnements] = useState([]);
  const [stats, setStats] = useState(null);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    statut: '',
    date_debut: '',
    date_fin: '',
    limit: 50,
    offset: 0
  });

  useEffect(() => {
    if (!user?.is_super_admin) {
      navigate('/dashboard');
      return;
    }
    loadAbonnements();
    loadStats();
  }, [filters]);

  const loadAbonnements = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.statut) params.append('statut', filters.statut);
      if (filters.date_debut) params.append('date_debut', filters.date_debut);
      if (filters.date_fin) params.append('date_fin', filters.date_fin);

      const res = await API.get(`/superadmin/abonnements?${params.toString()}`);
      setAbonnements(res.data.abonnements || []);
      setTotal(res.data.abonnements?.length || 0);
      setStats(res.data.stats);
    } catch (err) {
      console.error('Erreur chargement abonnements:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await API.get('/superadmin/abonnements/stats');
      setStats({ ...stats, ...res.data });
    } catch (err) {
      console.error('Erreur chargement stats:', err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const getStatutBadge = (statut) => {
    const statuses = {
      en_attente: { label: 'En attente', variant: 'warning' },
      paye: { label: 'Payé', variant: 'success' },
      echoue: { label: 'Échoué', variant: 'danger' },
      rembourse: { label: 'Remboursé', variant: 'outline' }
    };
    return statuses[statut] || { label: statut, variant: 'outline' };
  };

  const getEntrepriseStatutBadge = (statut) => {
    const statuses = {
      en_attente: { label: 'En attente', variant: 'warning' },
      actif: { label: 'Actif', variant: 'success' },
      suspendu: { label: 'Suspendu', variant: 'danger' }
    };
    return statuses[statut] || { label: statut, variant: 'outline' };
  };

  const columns = [
    {
      key: 'created_at',
      label: 'Date',
      render: (row) => new Date(row.created_at).toLocaleString('fr-FR')
    },
    { key: 'entreprise_nom', label: 'Entreprise' },
    { key: 'email', label: 'Email' },
    {
      key: 'montant',
      label: 'Montant',
      render: (row) => `${row.montant} DT`
    },
    {
      key: 'statut',
      label: 'Statut paiement',
      render: (row) => {
        const s = getStatutBadge(row.statut);
        return <Badge variant={s.variant}>{s.label}</Badge>;
      }
    },
    {
      key: 'entreprise_statut',
      label: 'Statut entreprise',
      render: (row) => {
        if (!row.entreprise_statut) return <Badge variant="outline">Inconnu</Badge>;
        const s = getEntrepriseStatutBadge(row.entreprise_statut);
        return <Badge variant={s.variant}>{s.label}</Badge>;
      }
    }
  ];

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Gestion des Abonnements</h1>
          <p style={styles.subtitle}>Consultez tous les paiements d'abonnement</p>
        </div>
        <div style={styles.headerActions}>
          <Button variant="secondary" onClick={() => navigate('/superadmin/dashboard')}>
            Retour
          </Button>
        </div>
      </div>

      {stats && (
        <div style={styles.statsGrid}>
          <div style={{ ...styles.statCard, borderLeft: '4px solid #22C55E' }}>
            <span style={styles.statNumber}>{stats.total_paye || 0} DT</span>
            <span style={styles.statLabel}>Total payé</span>
          </div>
          <div style={{ ...styles.statCard, borderLeft: '4px solid #F59E0B' }}>
            <span style={styles.statNumber}>{stats.total_attente || 0} DT</span>
            <span style={styles.statLabel}>En attente</span>
          </div>
          <div style={{ ...styles.statCard, borderLeft: '4px solid #EF4444' }}>
            <span style={styles.statNumber}>{stats.total_echoue || 0} DT</span>
            <span style={styles.statLabel}>Échoués</span>
          </div>
          <div style={{ ...styles.statCard, borderLeft: '4px solid #0EA5E9' }}>
            <span style={styles.statNumber}>{stats.count_paye || 0}</span>
            <span style={styles.statLabel}>Abonnements actifs</span>
          </div>
        </div>
      )}

      <Card title="Filtres" variant="primary" style={{ marginBottom: '20px' }}>
        <div style={styles.filterGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Statut</label>
            <select
              style={styles.select}
              name="statut"
              value={filters.statut}
              onChange={handleFilterChange}
            >
              <option value="">Tous</option>
              <option value="en_attente">En attente</option>
              <option value="paye">Payé</option>
              <option value="echoue">Échoué</option>
              <option value="rembourse">Remboursé</option>
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Date début</label>
            <input
              style={styles.input}
              type="date"
              name="date_debut"
              value={filters.date_debut}
              onChange={handleFilterChange}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Date fin</label>
            <input
              style={styles.input}
              type="date"
              name="date_fin"
              value={filters.date_fin}
              onChange={handleFilterChange}
            />
          </div>
          <div style={styles.filterActions}>
            <Button
              variant="secondary"
              onClick={() => setFilters({ statut: '', date_debut: '', date_fin: '', limit: 50, offset: 0 })}
            >
              Réinitialiser
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Liste des abonnements" variant="primary">
        <Table columns={columns} data={abonnements} loading={loading} />
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
  headerActions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
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
    marginTop: '4px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    padding: '18px 20px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid #E8EDF2',
    display: 'flex',
    flexDirection: 'column',
  },
  statNumber: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#0F172A',
  },
  statLabel: {
    color: '#64748B',
    fontSize: '13px',
    marginTop: '4px',
  },
  filterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    alignItems: 'end',
  },
  filterActions: {
    display: 'flex',
    alignItems: 'end',
    gap: '8px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
  },
  input: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '2px solid #E2E8F0',
    fontSize: '14px',
    backgroundColor: '#F8FAFC',
    outline: 'none',
    transition: 'all 0.2s ease',
    width: '100%',
    boxSizing: 'border-box',
  },
  select: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '2px solid #E2E8F0',
    fontSize: '14px',
    backgroundColor: '#F8FAFC',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
  },
};