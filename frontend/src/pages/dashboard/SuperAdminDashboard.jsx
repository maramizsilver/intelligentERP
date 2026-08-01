// frontend/src/pages/dashboard/SuperAdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Table from '../../components/common/Table';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [entreprises, setEntreprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyId, setBusyId] = useState(null);
  
  // État pour le déverrouillage
  const [unlockUserId, setUnlockUserId] = useState('');
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [unlockMessage, setUnlockMessage] = useState('');

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

  const handleDelete = async (id) => {
    const entreprise = entreprises.find(e => e.id === id);
    if (!window.confirm(
      `Supprimer definitivement "${entreprise?.nom}" ?\n\n` +
      `Cette action est irreversible et supprimera :\n` +
      `- Toutes les donnees de l'entreprise\n` +
      `- La base de donnees complete\n` +
      `- Tous les comptes utilisateurs\n` +
      `- Toutes les sessions actives\n\n` +
      `Etes-vous sur ?`
    )) return;

    try {
      setBusyId(id);
      await API.delete(`/entreprises/${id}`);
      setSuccess(`Entreprise "${entreprise?.nom}" supprimee`);
      load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
      setTimeout(() => setError(''), 3000);
    } finally {
      setBusyId(null);
    }
  };

  // Fonction de déverrouillage
  const handleUnlockAccount = async () => {
    if (!unlockUserId) {
      setUnlockMessage('❌ Veuillez entrer un ID utilisateur');
      return;
    }

    if (!window.confirm(`Voulez-vous déverrouiller le compte utilisateur ${unlockUserId} ?`)) {
      return;
    }

    setUnlockLoading(true);
    setUnlockMessage('');
    try {
      await API.post(`/auth/account/unlock/${unlockUserId}`);
      setUnlockMessage(`✅ Compte ${unlockUserId} déverrouillé avec succès`);
      setUnlockUserId('');
    } catch (err) {
      setUnlockMessage(`❌ Erreur: ${err.response?.data?.message || err.message}`);
    } finally {
      setUnlockLoading(false);
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
          {row.plan_type === 'payant' ? 'Payant' : `Essai (${row.connexions_utilisees}/${row.limite_connexions_essai})`}
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
      onClick: (row) => valider(row.id),
      disabled: (row) => row.statut === 'actif' || busyId === row.id
    },
    {
      label: 'Suspendre',
      variant: 'danger',
      onClick: (row) => suspendre(row.id),
      disabled: (row) => row.statut === 'suspendu' || busyId === row.id
    },
    {
      label: 'Passer payant',
      variant: 'secondary',
      onClick: (row) => passerEnPayant(row.id),
      disabled: (row) => row.plan_type === 'payant' || busyId === row.id
    },
    {
      label: 'Supprimer',
      variant: 'danger',
      onClick: (row) => handleDelete(row.id),
      disabled: (row) => busyId === row.id
    }
  ];

  if (loading) return <LoadingSpinner size="lg" text="Chargement..." />;

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Plateforme SuperAdmin</h1>
          <p style={styles.subtitle}>Bonjour {user?.prenom}, voici les entreprises inscrites.</p>
        </div>
        <div style={styles.headerActions}>
          <Button variant="secondary" onClick={() => navigate('/superadmin/audit')}>
            Audit
          </Button>
          <Button variant="secondary" onClick={() => navigate('/superadmin/abonnements')}>
            Abonnements
          </Button>
          <Button variant="secondary" onClick={() => navigate('/superadmin/backup')}>
            Sauvegarde
          </Button>
          <Button variant="secondary" onClick={() => navigate('/superadmin/sessions')}>
            Sessions
          </Button>
          <Button variant="danger" onClick={logout}>
            Deconnexion
          </Button>
        </div>
      </div>

      {error && (
        <div style={styles.errorContainer}>
          <span style={styles.errorText}>{error}</span>
        </div>
      )}
      {success && (
        <div style={styles.successContainer}>
          <span style={styles.successText}>{success}</span>
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
        <div style={{ ...styles.statCard, borderLeft: '4px solid #8B5CF6' }}>
          <span style={styles.statNumber}>{entreprises.length}</span>
          <span style={styles.statLabel}>Total entreprises</span>
        </div>
      </div>

      {/* SECTION DE DÉVERROUILLAGE - AJOUTÉE */}
      <Card title="🔓 Déverrouiller un compte" variant="primary">
        <div style={styles.unlockContainer}>
          <div style={styles.unlockRow}>
            <div style={styles.unlockInputGroup}>
              <label style={styles.unlockLabel}>ID Utilisateur :</label>
              <input
                type="number"
                value={unlockUserId}
                onChange={(e) => setUnlockUserId(e.target.value)}
                placeholder="Entrez l'ID de l'utilisateur"
                style={styles.unlockInput}
                disabled={unlockLoading}
              />
            </div>
            <button
              onClick={handleUnlockAccount}
              disabled={unlockLoading || !unlockUserId}
              style={{
                ...styles.unlockButton,
                opacity: (unlockLoading || !unlockUserId) ? 0.6 : 1,
                cursor: (unlockLoading || !unlockUserId) ? 'not-allowed' : 'pointer'
              }}
            >
              {unlockLoading ? 'Déverrouillage...' : '🔓 Déverrouiller'}
            </button>
          </div>
          {unlockMessage && (
            <div style={{
              ...styles.unlockMessage,
              backgroundColor: unlockMessage.includes('✅') ? '#D1FAE5' : '#FEE2E2',
              color: unlockMessage.includes('✅') ? '#065F46' : '#991B1B',
            }}>
              {unlockMessage}
            </div>
          )}
          <div style={styles.unlockHelp}>
            <small style={styles.unlockHelpText}>
              💡 Astuce : Pour connaître l'ID d'un utilisateur, allez dans "Sessions" ou vérifiez dans la base de données.
            </small>
          </div>
        </div>
      </Card>

      <Card title="Liste des entreprises" variant="primary">
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
  // Styles pour le déverrouillage
  unlockContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  unlockRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  unlockInputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
    minWidth: '200px',
  },
  unlockLabel: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#334155',
  },
  unlockInput: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #E2E8F0',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s ease',
    width: '100%',
    boxSizing: 'border-box',
  },
  unlockButton: {
    padding: '8px 20px',
    backgroundColor: '#0EA5E9',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    height: '38px',
  },
  unlockMessage: {
    padding: '10px 14px',
    borderRadius: '6px',
    fontSize: '14px',
  },
  unlockHelp: {
    padding: '8px 0',
  },
  unlockHelpText: {
    color: '#94A3B8',
    fontSize: '12px',
  },
};