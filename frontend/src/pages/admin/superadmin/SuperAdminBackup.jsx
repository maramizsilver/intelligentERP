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

export default function SuperAdminBackup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [backups, setBackups] = useState([]);
  const [total, setTotal] = useState(0);
  const [backupLoading, setBackupLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.is_super_admin) {
      navigate('/dashboard');
      return;
    }
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      setLoading(true);
      const res = await API.get('/superadmin/backup/history');
      setBackups(res.data.backups || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Erreur chargement backups:', err);
      setError('Impossible de charger l\'historique des sauvegardes');
    } finally {
      setLoading(false);
    }
  };

  const triggerBackup = async () => {
    if (!window.confirm('Lancer une sauvegarde manuelle de toutes les bases de données ?')) return;
    setBackupLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await API.post('/superadmin/backup');
      setMessage(`${res.data.total} bases de données sauvegardées avec succès`);
      loadBackups();
    } catch (err) {
      setError('Erreur lors de la sauvegarde');
    } finally {
      setBackupLoading(false);
    }
  };

  const cleanupBackups = async () => {
    const days = prompt('Nombre de jours à conserver (défaut: 30) :', '30');
    if (days === null) return;
    setCleanupLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await API.delete(`/superadmin/backup/cleanup?days=${parseInt(days) || 30}`);
      setMessage(`${res.data.deleted} sauvegardes supprimées`);
      loadBackups();
    } catch (err) {
      setError('Erreur lors du nettoyage');
    } finally {
      setCleanupLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / 1048576).toFixed(1)} Mo`;
  };

  const columns = [
    {
      key: 'created_at',
      label: 'Date',
      render: (row) => new Date(row.created_at).toLocaleString('fr-FR')
    },
    { key: 'dbName', label: 'Base de données' },
    {
      key: 'filename',
      label: 'Fichier',
      render: (row) => (
        <span style={{ fontSize: '12px', color: '#64748B' }}>{row.filename}</span>
      )
    },
    {
      key: 'size',
      label: 'Taille',
      render: (row) => formatFileSize(row.size)
    }
  ];

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Sauvegarde des données</h1>
          <p style={styles.subtitle}>Gérez les sauvegardes automatiques de la plateforme</p>
        </div>
        <div style={styles.headerActions}>
          <Button variant="secondary" onClick={() => navigate('/superadmin/dashboard')}>
            Retour
          </Button>
        </div>
      </div>

      {message && (
        <div style={styles.successContainer}>
          <span style={styles.successText}>{message}</span>
        </div>
      )}
      {error && (
        <div style={styles.errorContainer}>
          <span style={styles.errorText}>{error}</span>
        </div>
      )}

      <div style={styles.statsGrid}>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #22C55E' }}>
          <span style={styles.statNumber}>{total}</span>
          <span style={styles.statLabel}>Sauvegardes disponibles</span>
        </div>
      </div>

      <div style={styles.actionRow}>
        <Button
          variant="primary"
          onClick={triggerBackup}
          loading={backupLoading}
        >
          Lancer une sauvegarde
        </Button>
        <Button
          variant="secondary"
          onClick={cleanupBackups}
          loading={cleanupLoading}
        >
          Nettoyer les anciennes sauvegardes
        </Button>
        <Button
          variant="outline"
          onClick={loadBackups}
          loading={loading}
        >
          Actualiser
        </Button>
      </div>

      <Card title="Historique des sauvegardes" variant="primary" style={{ marginTop: '20px' }}>
        {backups.length === 0 ? (
          <EmptyState
            title="Aucune sauvegarde"
            description="Aucune sauvegarde n'a encore été effectuée."
          />
        ) : (
          <Table columns={columns} data={backups} loading={loading} />
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
  actionRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '20px',
  },
  successContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#F0FDF4',
    border: '1px solid #86EFAC',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '16px',
  },
  successText: {
    color: '#065F46',
    fontSize: '13px',
    fontWeight: 500,
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
};