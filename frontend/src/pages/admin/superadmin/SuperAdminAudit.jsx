import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import API from '../../../utils/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Table from '../../../components/common/Table';
import Badge from '../../../components/common/Badge';
import Input from '../../../components/common/Input';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import EmptyState from '../../../components/common/EmptyState';

export default function SuperAdminAudit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('logs');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    entreprise_id: '',
    action: '',
    module: '',
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
    loadLogs();
    loadStats();
  }, [filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.entreprise_id) params.append('entreprise_id', filters.entreprise_id);
      if (filters.action) params.append('action', filters.action);
      if (filters.module) params.append('module', filters.module);
      if (filters.date_debut) params.append('date_debut', filters.date_debut);
      if (filters.date_fin) params.append('date_fin', filters.date_fin);
      params.append('limit', filters.limit);
      params.append('offset', filters.offset);

      const res = await API.get(`/superadmin/audit/${activeTab === 'logs' ? 'logs' : 'connexions'}?${params.toString()}`);
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Erreur chargement logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await API.get('/superadmin/audit/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Erreur chargement stats:', err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value, offset: 0 });
  };

  const getStatusBadge = (status) => {
    const statuses = {
      success: { label: 'Succès', variant: 'success' },
      failed: { label: 'Échec', variant: 'danger' },
      locked: { label: 'Bloqué', variant: 'warning' },
      error: { label: 'Erreur', variant: 'danger' }
    };
    return statuses[status] || { label: status, variant: 'outline' };
  };

  const logsColumns = [
    {
      key: 'created_at',
      label: 'Date',
      render: (row) => new Date(row.created_at).toLocaleString('fr-FR')
    },
    { key: 'entreprise_nom', label: 'Entreprise' },
    { key: 'nom', label: 'Utilisateur', render: (row) => `${row.prenom || ''} ${row.nom || ''}` },
    { key: 'action', label: 'Action' },
    { key: 'module', label: 'Module' },
    {
      key: 'status',
      label: 'Statut',
      render: (row) => {
        const s = getStatusBadge(row.status);
        return <Badge variant={s.variant}>{s.label}</Badge>;
      }
    },
    { key: 'ip', label: 'IP' }
  ];

  const connexionsColumns = [
    {
      key: 'created_at',
      label: 'Date',
      render: (row) => new Date(row.created_at).toLocaleString('fr-FR')
    },
    { key: 'entreprise_nom', label: 'Entreprise' },
    { key: 'nom', label: 'Utilisateur', render: (row) => `${row.prenom || ''} ${row.nom || ''}` },
    { key: 'email', label: 'Email' },
    {
      key: 'status',
      label: 'Statut',
      render: (row) => {
        const s = getStatusBadge(row.status);
        return <Badge variant={s.variant}>{s.label}</Badge>;
      }
    },
    { key: 'ip', label: 'IP' }
  ];

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Audit Global</h1>
          <p style={styles.subtitle}>Consultez tous les logs de la plateforme</p>
        </div>
        <div style={styles.headerActions}>
          <Button variant="secondary" onClick={() => navigate('/superadmin/dashboard')}>
            Retour
          </Button>
        </div>
      </div>

      {stats && (
        <div style={styles.statsGrid}>
          <div style={{ ...styles.statCard, borderLeft: '4px solid #0EA5E9' }}>
            <span style={styles.statNumber}>{stats.logs_by_entreprise?.length || 0}</span>
            <span style={styles.statLabel}>Entreprises avec logs</span>
          </div>
          <div style={{ ...styles.statCard, borderLeft: '4px solid #22C55E' }}>
            <span style={styles.statNumber}>{stats.top_actions?.length || 0}</span>
            <span style={styles.statLabel}>Actions distinctes</span>
          </div>
          <div style={{ ...styles.statCard, borderLeft: '4px solid #F59E0B' }}>
            <span style={styles.statNumber}>{stats.top_modules?.length || 0}</span>
            <span style={styles.statLabel}>Modules utilisés</span>
          </div>
        </div>
      )}

      <div style={styles.tabContainer}>
        <button
          style={{ ...styles.tab, ...(activeTab === 'logs' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('logs')}
        >
          Logs d'actions ({total})
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === 'connexions' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('connexions')}
        >
          Logs de connexion
        </button>
      </div>

      <Card title="Filtres" variant="primary" style={{ marginBottom: '20px' }}>
        <div style={styles.filterGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Entreprise ID</label>
            <input
              style={styles.input}
              type="text"
              name="entreprise_id"
              placeholder="ID entreprise"
              value={filters.entreprise_id}
              onChange={handleFilterChange}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Action</label>
            <input
              style={styles.input}
              type="text"
              name="action"
              placeholder="Rechercher une action"
              value={filters.action}
              onChange={handleFilterChange}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Module</label>
            <input
              style={styles.input}
              type="text"
              name="module"
              placeholder="Module"
              value={filters.module}
              onChange={handleFilterChange}
            />
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
              onClick={() => {
                setFilters({
                  entreprise_id: '',
                  action: '',
                  module: '',
                  date_debut: '',
                  date_fin: '',
                  limit: 50,
                  offset: 0
                });
              }}
            >
              Réinitialiser
            </Button>
          </div>
        </div>
      </Card>

      <Card title={activeTab === 'logs' ? 'Logs d\'actions' : 'Logs de connexion'} variant="primary">
        <Table
          columns={activeTab === 'logs' ? logsColumns : connexionsColumns}
          data={logs}
          loading={loading}
        />
        {total > filters.limit && (
          <div style={styles.pagination}>
            <Button
              variant="outline"
              disabled={filters.offset === 0}
              onClick={() => setFilters({ ...filters, offset: filters.offset - filters.limit })}
            >
              Précédent
            </Button>
            <span style={styles.paginationInfo}>
              {filters.offset + 1} - {Math.min(filters.offset + filters.limit, total)} sur {total}
            </span>
            <Button
              variant="outline"
              disabled={filters.offset + filters.limit >= total}
              onClick={() => setFilters({ ...filters, offset: filters.offset + filters.limit })}
            >
              Suivant
            </Button>
          </div>
        )}
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
  tabContainer: {
    display: 'flex',
    gap: '4px',
    backgroundColor: '#E2E8F0',
    borderRadius: '10px',
    padding: '4px',
    marginBottom: '20px',
    width: 'fit-content',
  },
  tab: {
    padding: '8px 20px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    color: '#475569',
    transition: 'all 0.2s ease',
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
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
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #E2E8F0',
  },
  paginationInfo: {
    fontSize: '14px',
    color: '#64748B',
  },
};