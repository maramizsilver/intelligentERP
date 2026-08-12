import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import API from '../../../utils/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Table from '../../../components/common/Table';
import Badge from '../../../components/common/Badge';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import EmptyState from '../../../components/common/EmptyState';

export default function SuperAdminAbonnements() {
  const { user } = useAuth();
  const { t } = useLanguage();
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
      en_attente: { label: t('statut_en_attente'), variant: 'warning' },
      paye: { label: t('statut_paye'), variant: 'success' },
      echoue: { label: t('statut_echoue'), variant: 'danger' },
      rembourse: { label: t('statut_rembourse'), variant: 'outline' }
    };
    return statuses[statut] || { label: statut, variant: 'outline' };
  };

  const getEntrepriseStatutBadge = (statut) => {
    const statuses = {
      en_attente: { label: t('en_attente'), variant: 'warning' },
      actif: { label: t('entreprise_statut_actif'), variant: 'success' },
      suspendu: { label: t('entreprise_statut_suspendu'), variant: 'danger' }
    };
    return statuses[statut] || { label: t('entreprise_statut_inconnu'), variant: 'outline' };
  };

  const columns = [
    {
      key: 'created_at',
      label: t('date'),
      render: (row) => new Date(row.created_at).toLocaleString('fr-FR')
    },
    { key: 'entreprise_nom', label: t('entreprise') },
    { key: 'email', label: t('email') },
    {
      key: 'montant',
      label: t('montant'),
      render: (row) => `${row.montant} DT`
    },
    {
      key: 'statut',
      label: t('statut_paiement'),
      render: (row) => {
        const s = getStatutBadge(row.statut);
        return <Badge variant={s.variant}>{s.label}</Badge>;
      }
    },
    {
      key: 'entreprise_statut',
      label: t('statut_entreprise'),
      render: (row) => {
        if (!row.entreprise_statut) return <Badge variant="outline">{t('inconnu')}</Badge>;
        const s = getEntrepriseStatutBadge(row.entreprise_statut);
        return <Badge variant={s.variant}>{s.label}</Badge>;
      }
    }
  ];

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{t('gestion_abonnements')}</h1>
          <p style={styles.subtitle}>{t('consulter_paiements_abonnement')}</p>
        </div>
        <div style={styles.headerActions}>
          <Button variant="secondary" onClick={() => navigate('/superadmin/dashboard')}>
            {t('retour')}
          </Button>
        </div>
      </div>

      {stats && (
        <div style={styles.statsGrid}>
          <div style={{ ...styles.statCard, borderLeft: '4px solid #22C55E' }}>
            <span style={styles.statNumber}>{stats.total_paye || 0} DT</span>
            <span style={styles.statLabel}>{t('total_paye')}</span>
          </div>
          <div style={{ ...styles.statCard, borderLeft: '4px solid #F59E0B' }}>
            <span style={styles.statNumber}>{stats.total_attente || 0} DT</span>
            <span style={styles.statLabel}>{t('en_attente_paiement')}</span>
          </div>
          <div style={{ ...styles.statCard, borderLeft: '4px solid #EF4444' }}>
            <span style={styles.statNumber}>{stats.total_echoue || 0} DT</span>
            <span style={styles.statLabel}>{t('echoues')}</span>
          </div>
          <div style={{ ...styles.statCard, borderLeft: '4px solid #0EA5E9' }}>
            <span style={styles.statNumber}>{stats.count_paye || 0}</span>
            <span style={styles.statLabel}>{t('abonnements_actifs')}</span>
          </div>
        </div>
      )}

      <Card title={t('filtres')} variant="primary" style={{ marginBottom: '20px' }}>
        <div style={styles.filterGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>{t('statut_paiement')}</label>
            <select
              style={styles.select}
              name="statut"
              value={filters.statut}
              onChange={handleFilterChange}
            >
              <option value="">{t('tous')}</option>
              <option value="en_attente">{t('statut_en_attente')}</option>
              <option value="paye">{t('statut_paye')}</option>
              <option value="echoue">{t('statut_echoue')}</option>
              <option value="rembourse">{t('statut_rembourse')}</option>
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>{t('date_debut')}</label>
            <input
              style={styles.input}
              type="date"
              name="date_debut"
              value={filters.date_debut}
              onChange={handleFilterChange}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>{t('date_fin')}</label>
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
              {t('reinitialiser_filtres')}
            </Button>
          </div>
        </div>
      </Card>

      <Card title={t('liste_abonnements')} variant="primary">
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