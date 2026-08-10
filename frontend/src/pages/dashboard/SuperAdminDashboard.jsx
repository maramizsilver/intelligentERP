// frontend/src/pages/dashboard/SuperAdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import API from '../../utils/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Table from '../../components/common/Table';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [entreprises, setEntreprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyId, setBusyId] = useState(null);

  const [unlockUserId, setUnlockUserId] = useState('');
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [unlockMessage, setUnlockMessage] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await API.get('/entreprises');
      setEntreprises(res.data.entreprises || []);
    } catch (err) {
      setError(t('impossible_charger_entreprises') || 'Impossible de charger les entreprises');
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
      setError(err.response?.data?.message || t('erreur_validation') || 'Erreur');
    } finally {
      setBusyId(null);
    }
  };

  const suspendre = async (id) => {
    if (!window.confirm(t('confirmation_suspension') || 'Suspendre cette entreprise ?')) return;
    setBusyId(id);
    try {
      await API.put(`/entreprises/${id}/suspendre`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || t('erreur_suspension') || 'Erreur');
    } finally {
      setBusyId(null);
    }
  };

  const passerEnPayant = async (id) => {
    if (!window.confirm(t('confirmation_passage_payant') || 'Faire passer cette entreprise en abonnement payant ?')) return;
    setBusyId(id);
    try {
      await API.put(`/entreprises/${id}/passer-payant`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || t('erreur_passage_payant') || 'Erreur');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    const entreprise = entreprises.find(e => e.id === id);
    const msg = `${t('confirmation_suppression_entreprise') || 'Supprimer définitivement'} "${entreprise?.nom}" ?\n\n` +
      `${t('suppression_irreversible') || 'Cette action est irréversible et supprimera :'}\n` +
      `${t('suppression_donnees_entreprise') || '- Toutes les données de l\'entreprise'}\n` +
      `${t('suppression_base_donnees') || '- La base de données complète'}\n` +
      `${t('suppression_comptes') || '- Tous les comptes utilisateurs'}\n` +
      `${t('suppression_sessions') || '- Toutes les sessions actives'}\n\n` +
      `${t('etes_vous_sur') || 'Êtes-vous sûr ?'}`;

    if (!window.confirm(msg)) return;

    try {
      setBusyId(id);
      await API.delete(`/entreprises/${id}`);
      setSuccess(`${t('entreprise_supprimee') || 'Entreprise supprimée'} "${entreprise?.nom}"`);
      load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || t('erreur_suppression_entreprise') || 'Erreur lors de la suppression');
      setTimeout(() => setError(''), 3000);
    } finally {
      setBusyId(null);
    }
  };

  const handleUnlockAccount = async () => {
    if (!unlockUserId) {
      setUnlockMessage(t('entrer_id_utilisateur') || 'Veuillez entrer un ID utilisateur');
      return;
    }

    if (!window.confirm(`${t('deverrouiller_compte') || 'Déverrouiller le compte'} ${unlockUserId} ?`)) {
      return;
    }

    setUnlockLoading(true);
    setUnlockMessage('');
    try {
      await API.post(`/auth/account/unlock/${unlockUserId}`);
      setUnlockMessage(t('compte_deverrouille') || 'Compte déverrouillé avec succès');
      setUnlockUserId('');
    } catch (err) {
      setUnlockMessage(t('erreur_deverrouillage') || 'Erreur lors du déverrouillage');
    } finally {
      setUnlockLoading(false);
    }
  };

  const statutInfo = {
    en_attente: { label: t('en_attente') || 'En attente', variant: 'warning' },
    actif: { label: t('actif') || 'Actif', variant: 'success' },
    suspendu: { label: t('suspendu') || 'Suspendu', variant: 'danger' }
  };

  const compteurs = entreprises.reduce((acc, e) => {
    acc[e.statut] = (acc[e.statut] || 0) + 1;
    return acc;
  }, {});

  const columns = [
    { key: 'nom', label: t('entreprise') || 'Entreprise' },
    { key: 'email', label: t('email') },
    {
      key: 'date_inscription',
      label: t('date_inscription') || 'Inscrite le',
      render: (row) => new Date(row.date_inscription).toLocaleDateString('fr-FR')
    },
    {
      key: 'plan_type',
      label: t('plan') || 'Plan',
      render: (row) => (
        <Badge variant={row.plan_type === 'payant' ? 'secondary' : 'primary'}>
          {row.plan_type === 'payant' ? (t('plan_payant') || 'Payant') : `${t('plan_essai') || 'Essai'} (${row.connexions_utilisees}/${row.limite_connexions_essai})`}
        </Badge>
      )
    },
    {
      key: 'statut',
      label: t('statut_entreprise') || 'Statut',
      render: (row) => {
        const info = statutInfo[row.statut] || { label: row.statut, variant: 'outline' };
        return <Badge variant={info.variant}>{info.label}</Badge>;
      }
    }
  ];

  const actions = [
    {
      label: t('valider_entreprise') || 'Valider',
      variant: 'success',
      onClick: (row) => valider(row.id),
      disabled: (row) => row.statut === 'actif' || busyId === row.id
    },
    {
      label: t('suspendre_entreprise') || 'Suspendre',
      variant: 'danger',
      onClick: (row) => suspendre(row.id),
      disabled: (row) => row.statut === 'suspendu' || busyId === row.id
    },
    {
      label: t('passer_payant') || 'Passer payant',
      variant: 'secondary',
      onClick: (row) => passerEnPayant(row.id),
      disabled: (row) => row.plan_type === 'payant' || busyId === row.id
    },
    {
      label: t('supprimer_entreprise') || 'Supprimer',
      variant: 'danger',
      onClick: (row) => handleDelete(row.id),
      disabled: (row) => busyId === row.id
    }
  ];

  if (loading) return <LoadingSpinner size="lg" text={t('chargement') || 'Chargement...'} />;

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{t('superadmin_dashboard') || 'Plateforme SuperAdmin'}</h1>
          <p style={styles.subtitle}>
            {t('bonjour') || 'Bonjour'} {user?.prenom}, {t('entreprises_inscrites') || 'voici les entreprises inscrites.'}
          </p>
        </div>
        <div style={styles.headerActions}>
          <Button variant="secondary" onClick={() => navigate('/superadmin/audit')}>
            {t('audit') || 'Audit'}
          </Button>
          <Button variant="secondary" onClick={() => navigate('/superadmin/abonnements')}>
            {t('abonnements') || 'Abonnements'}
          </Button>
          <Button variant="secondary" onClick={() => navigate('/superadmin/backup')}>
            {t('sauvegarde') || 'Sauvegarde'}
          </Button>
          <Button variant="secondary" onClick={() => navigate('/superadmin/sessions')}>
            {t('sessions') || 'Sessions'}
          </Button>
          <Button variant="danger" onClick={logout}>
            {t('deconnexion_superadmin') || 'Déconnexion'}
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
          <span style={styles.statLabel}>{t('en_attente_validation') || 'En attente de validation'}</span>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #22C55E' }}>
          <span style={styles.statNumber}>{compteurs.actif || 0}</span>
          <span style={styles.statLabel}>{t('actives') || 'Actives'}</span>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #EF4444' }}>
          <span style={styles.statNumber}>{compteurs.suspendu || 0}</span>
          <span style={styles.statLabel}>{t('suspendues') || 'Suspendues'}</span>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #8B5CF6' }}>
          <span style={styles.statNumber}>{entreprises.length}</span>
          <span style={styles.statLabel}>{t('total_entreprises') || 'Total entreprises'}</span>
        </div>
      </div>

      <Card title={t('deverrouiller_compte') || 'Déverrouiller un compte'} variant="primary">
        <div style={styles.unlockContainer}>
          <div style={styles.unlockRow}>
            <div style={styles.unlockInputGroup}>
              <label style={styles.unlockLabel}>{t('id_utilisateur') || 'ID Utilisateur'}</label>
              <input
                type="number"
                value={unlockUserId}
                onChange={(e) => setUnlockUserId(e.target.value)}
                placeholder={t('entrer_id_utilisateur') || "Entrez l'ID de l'utilisateur"}
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
              {unlockLoading ? (t('deverrouillage_en_cours') || 'Déverrouillage...') : (t('deverrouiller') || 'Déverrouiller')}
            </button>
          </div>
          {unlockMessage && (
            <div style={{
              ...styles.unlockMessage,
              backgroundColor: unlockMessage.includes('succès') || unlockMessage.includes('success') ? '#D1FAE5' : '#FEE2E2',
              color: unlockMessage.includes('succès') || unlockMessage.includes('success') ? '#065F46' : '#991B1B',
            }}>
              {unlockMessage}
            </div>
          )}
          <div style={styles.unlockHelp}>
            <small style={styles.unlockHelpText}>
              {t('astuce_id') || '💡 Astuce : Pour connaître l\'ID d\'un utilisateur, allez dans "Sessions" ou vérifiez dans la base de données.'}
            </small>
          </div>
        </div>
      </Card>

      <Card title={t('liste_entreprises') || 'Liste des entreprises'} variant="primary">
        <Table
          columns={columns}
          data={entreprises}
          loading={loading}
          actions={actions}
          emptyMessage={t('aucune_entreprise') || 'Aucune entreprise inscrite pour le moment.'}
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