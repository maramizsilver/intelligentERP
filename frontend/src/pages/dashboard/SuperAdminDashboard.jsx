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
  const { t, dir } = useLanguage();
  const navigate = useNavigate();
  const [entreprises, setEntreprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyId, setBusyId] = useState(null);
  
  const [rechercheKyc, setRechercheKyc] = useState('');
  const [resultatsKyc, setResultatsKyc] = useState([]);
  const [rechercheEnCours, setRechercheEnCours] = useState(false);
  const [compteSelectionne, setCompteSelectionne] = useState(null);
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [unlockMessage, setUnlockMessage] = useState('');
  
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockReason, setLockReason] = useState('');
  const [lockTarget, setLockTarget] = useState(null);
  const [lockLoading, setLockLoading] = useState(false);

  useEffect(() => { 
    load(); 
  }, []);

  useEffect(() => {
    if (rechercheKyc.trim().length < 2) {
      setResultatsKyc([]);
      return;
    }
    const timer = setTimeout(async () => {
      setRechercheEnCours(true);
      try {
        const res = await API.get('/auth/users/search-lock', { params: { q: rechercheKyc.trim() } });
        setResultatsKyc(res.data.users || []);
      } catch (err) {
        setResultatsKyc([]);
      } finally {
        setRechercheEnCours(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [rechercheKyc]);

  const load = async () => {
    try {
      const res = await API.get('/entreprises');
      setEntreprises(res.data.entreprises || []);
    } catch (err) {
      setError(t('impossible_charger_entreprises'));
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
      setError(err.response?.data?.message || t('erreur_validation'));
    } finally {
      setBusyId(null);
    }
  };

  const suspendre = async (id) => {
    if (!window.confirm(t('confirmation_suspension'))) return;
    setBusyId(id);
    try {
      await API.put(`/entreprises/${id}/suspendre`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || t('erreur_suspension'));
    } finally {
      setBusyId(null);
    }
  };

  const passerEnPayant = async (id) => {
    if (!window.confirm(t('confirmation_passage_payant'))) return;
    setBusyId(id);
    try {
      await API.put(`/entreprises/${id}/passer-payant`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || t('erreur_passage_payant'));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    const entreprise = entreprises.find(e => e.id === id);
    const msg = `${t('confirmation_suppression_entreprise')} "${entreprise?.nom}" ?\n\n` +
      `${t('suppression_irreversible')}\n` +
      `${t('suppression_donnees_entreprise')}\n` +
      `${t('suppression_base_donnees')}\n` +
      `${t('suppression_comptes')}\n` +
      `${t('suppression_sessions')}\n\n` +
      `${t('etes_vous_sur')}`;

    if (!window.confirm(msg)) return;

    try {
      setBusyId(id);
      await API.delete(`/entreprises/${id}`);
      setSuccess(`${t('entreprise_supprimee')} "${entreprise?.nom}"`);
      load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || t('erreur_suppression_entreprise'));
      setTimeout(() => setError(''), 3000);
    } finally {
      setBusyId(null);
    }
  };

  const handleUnlockAccount = async () => {
    if (!compteSelectionne) return;

    if (!window.confirm(
      `${t('deverrouiller_compte_confirm')} ${compteSelectionne.prenom} ${compteSelectionne.nom} (${compteSelectionne.email}) - ${t('entreprise')} "${compteSelectionne.entreprise_nom || t('non_disponible')}" ?`
    )) return;

    setUnlockLoading(true);
    setUnlockMessage('');
    try {
      await API.post(`/auth/account/unlock/${compteSelectionne.id}`);
      setUnlockMessage(t('compte_deverrouille_succes'));
      setCompteSelectionne(null);
      setRechercheKyc('');
      setResultatsKyc([]);
      load();
    } catch (err) {
      setUnlockMessage(err.response?.data?.message || t('erreur_deverrouillage'));
    } finally {
      setUnlockLoading(false);
    }
  };

  const handleLockAccount = async (user) => {
    if (!user) return;
    setLockTarget(user);
    setLockReason('');
    setShowLockModal(true);
  };

  const confirmLockAccount = async () => {
    if (!lockTarget) return;
    
    if (!lockReason || lockReason.trim().length < 3) {
      alert(t('raison_min_3_caracteres'));
      return;
    }
    
    if (!window.confirm(
      `${t('verrouiller_compte_confirm')} ${lockTarget.prenom} ${lockTarget.nom} (${lockTarget.email}) ?\n\n` +
      `${t('raison')} : ${lockReason.trim()}`
    )) return;
    
    setLockLoading(true);
    try {
      await API.post(`/auth/account/lock/${lockTarget.id}`, { 
        reason: lockReason.trim() 
      });
      setUnlockMessage(`${t('compte_verrouille_succes')} ${lockTarget.prenom} ${lockTarget.nom}`);
      setShowLockModal(false);
      setLockTarget(null);
      setLockReason('');
      setRechercheKyc(rechercheKyc);
      load();
    } catch (err) {
      setUnlockMessage(err.response?.data?.message || t('erreur_verrouillage'));
    } finally {
      setLockLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const statutInfo = {
    en_attente: { label: t('statut_en_attente'), variant: 'warning' },
    actif: { label: t('statut_actif'), variant: 'success' },
    suspendu: { label: t('statut_suspendu'), variant: 'danger' }
  };

  const compteurs = entreprises.reduce((acc, e) => {
    acc[e.statut] = (acc[e.statut] || 0) + 1;
    return acc;
  }, {});

  const columns = [
    { key: 'nom', label: t('colonne_entreprise') },
    { key: 'email', label: t('colonne_email') },
    {
      key: 'date_inscription',
      label: t('colonne_date_inscription'),
      render: (row) => new Date(row.date_inscription).toLocaleDateString('fr-FR')
    },
    {
      key: 'plan_type',
      label: t('colonne_plan'),
      render: (row) => (
        <Badge variant={row.plan_type === 'payant' ? 'secondary' : 'primary'}>
          {row.plan_type === 'payant' ? t('plan_payant') : `${t('plan_essai')} (${row.connexions_utilisees}/${row.limite_connexions_essai})`}
        </Badge>
      )
    },
    {
      key: 'statut',
      label: t('colonne_statut_entreprise'),
      render: (row) => {
        const info = statutInfo[row.statut] || { label: row.statut, variant: 'outline' };
        return <Badge variant={info.variant}>{info.label}</Badge>;
      }
    }
  ];

  const actions = [
    {
      label: t('action_valider'),
      variant: 'success',
      onClick: (row) => valider(row.id),
      disabled: (row) => row.statut === 'actif' || busyId === row.id
    },
    {
      label: t('action_suspendre'),
      variant: 'danger',
      onClick: (row) => suspendre(row.id),
      disabled: (row) => row.statut === 'suspendu' || busyId === row.id
    },
    {
      label: t('action_passer_payant'),
      variant: 'secondary',
      onClick: (row) => passerEnPayant(row.id),
      disabled: (row) => row.plan_type === 'payant' || busyId === row.id
    },
    {
      label: t('action_supprimer'),
      variant: 'danger',
      onClick: (row) => handleDelete(row.id),
      disabled: (row) => busyId === row.id
    }
  ];

  if (loading) return <LoadingSpinner size="lg" text={t('chargement')} />;

  return (
    <div style={{ textAlign: dir === 'rtl' ? 'right' : 'left' }}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{t('superadmin_dashboard')}</h1>
          <p style={styles.subtitle}>
            {t('bonjour')} {user?.prenom}, {t('entreprises_inscrites')}
          </p>
        </div>
        <div style={styles.headerActions}>
          <Button variant="secondary" onClick={() => navigate('/superadmin/audit')}>
            {t('menu_audit')}
          </Button>
          <Button variant="secondary" onClick={() => navigate('/superadmin/abonnements')}>
            {t('menu_abonnements')}
          </Button>
          <Button variant="secondary" onClick={() => navigate('/superadmin/backup')}>
            {t('menu_sauvegarde')}
          </Button>
          <Button variant="secondary" onClick={() => navigate('/superadmin/sessions')}>
            {t('menu_sessions')}
          </Button>
          <Button variant="danger" onClick={handleLogout}>
            {t('deconnexion')}
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
          <span style={styles.statLabel}>{t('statut_en_attente')}</span>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #22C55E' }}>
          <span style={styles.statNumber}>{compteurs.actif || 0}</span>
          <span style={styles.statLabel}>{t('statut_actif')}</span>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #EF4444' }}>
          <span style={styles.statNumber}>{compteurs.suspendu || 0}</span>
          <span style={styles.statLabel}>{t('statut_suspendu')}</span>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #8B5CF6' }}>
          <span style={styles.statNumber}>{entreprises.length}</span>
          <span style={styles.statLabel}>{t('total_entreprises')}</span>
        </div>
      </div>

      <Card title={t('deverrouiller_compte')} variant="primary">
        <div style={styles.unlockContainer}>
          <div style={styles.unlockInputGroup}>
            <label style={styles.unlockLabel}>{t('rechercher_par_nom_prenom_email_id')}</label>
            <input
              type="text"
              value={rechercheKyc}
              onChange={(e) => { 
                setRechercheKyc(e.target.value); 
                setCompteSelectionne(null); 
              }}
              placeholder={t('exemple_recherche_utilisateur')}
              style={{...styles.unlockInput, textAlign: dir === 'rtl' ? 'right' : 'left'}}
              disabled={unlockLoading}
            />
          </div>

          {rechercheEnCours && (
            <div style={{ fontSize: '13px', color: '#94A3B8' }}>{t('recherche_en_cours')}</div>
          )}

          {!rechercheEnCours && resultatsKyc.length > 0 && !compteSelectionne && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '260px', overflowY: 'auto' }}>
              {resultatsKyc.map((u) => (
                <div
                  key={u.id}
                  onClick={() => setCompteSelectionne(u)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: `1px solid ${u.is_account_locked ? '#FECACA' : '#E2E8F0'}`,
                    backgroundColor: u.is_account_locked ? '#FEF2F2' : '#F8FAFC',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '6px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#0F172A' }}>
                      {u.prenom} {u.nom} <span style={{ color: '#94A3B8', fontWeight: 400 }}>#{u.id}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>
                      {u.email} · {u.entreprise_nom || t('sans_entreprise')}
                    </div>
                  </div>
                  <Badge variant={u.is_account_locked ? 'danger' : 'success'}>
                    {u.is_account_locked ? t('statut_verrouille') : t('statut_actif')}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {compteSelectionne && (
            <div style={{
              padding: '16px',
              borderRadius: '12px',
              border: '2px solid #0EA5E9',
              backgroundColor: '#F0F9FF'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#0EA5E9', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                {t('fiche_identite_kyc')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: '13px', marginBottom: '14px' }}>
                <div><strong>{t('nom')} :</strong> {compteSelectionne.prenom} {compteSelectionne.nom}</div>
                <div><strong>{t('id')} :</strong> #{compteSelectionne.id}</div>
                <div><strong>{t('email')} :</strong> {compteSelectionne.email}</div>
                <div><strong>{t('telephone')} :</strong> {compteSelectionne.telephone || '—'}</div>
                <div><strong>{t('entreprise')} :</strong> {compteSelectionne.entreprise_nom || '—'}</div>
                <div><strong>{t('statut_entreprise')} :</strong> {compteSelectionne.entreprise_statut || '—'}</div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <strong>{t('statut_compte')} :</strong>{' '}
                  <Badge variant={compteSelectionne.is_account_locked ? 'danger' : 'success'}>
                    {compteSelectionne.is_account_locked ? t('statut_verrouille') : t('statut_actif')}
                  </Badge>
                </div>
                {compteSelectionne.is_account_locked && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <strong>{t('raison')} :</strong> {compteSelectionne.account_lock_reason || t('non_precisee')}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {!compteSelectionne.is_account_locked ? (
                  <button
                    onClick={() => handleLockAccount(compteSelectionne)}
                    style={{
                      ...styles.unlockButton,
                      backgroundColor: '#F59E0B'
                    }}
                  >
                    {t('verrouiller_compte')}
                  </button>
                ) : (
                  <button
                    onClick={handleUnlockAccount}
                    disabled={unlockLoading}
                    style={{
                      ...styles.unlockButton,
                      backgroundColor: '#EF4444'
                    }}
                  >
                    {unlockLoading ? t('deverrouillage_en_cours') : t('deverrouiller_compte')}
                  </button>
                )}
                <button
                  onClick={() => setCompteSelectionne(null)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#E2E8F0',
                    color: '#334155',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  {t('annuler')}
                </button>
              </div>
            </div>
          )}

          {unlockMessage && (
            <div style={{
              ...styles.unlockMessage,
              backgroundColor: unlockMessage.includes('succes') || unlockMessage.includes('avec succès') ? '#D1FAE5' : '#FEE2E2',
              color: unlockMessage.includes('succes') || unlockMessage.includes('avec succès') ? '#065F46' : '#991B1B',
            }}>
              {unlockMessage}
            </div>
          )}

          <div style={styles.unlockHelp}>
            <small style={styles.unlockHelpText}>
              {t('recherche_affiche_identite_complete')}
            </small>
          </div>
        </div>
      </Card>

      <Card title={t('liste_entreprises')} variant="primary">
        <Table
          columns={columns}
          data={entreprises}
          loading={loading}
          actions={actions}
          emptyMessage={t('aucune_entreprise')}
        />
      </Card>

      {showLockModal && lockTarget && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.modal, textAlign: dir === 'rtl' ? 'right' : 'left'}}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{t('verrouiller_compte_titre')}</h3>
              <button 
                onClick={() => { setShowLockModal(false); setLockTarget(null); setLockReason(''); }}
                style={styles.modalClose}
              >
                ✕
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.modalUserInfo}>
                <div><strong>{t('utilisateur')} :</strong> {lockTarget.prenom} {lockTarget.nom}</div>
                <div><strong>{t('email')} :</strong> {lockTarget.email}</div>
                <div><strong>{t('entreprise')} :</strong> {lockTarget.entreprise_nom || t('sans_entreprise')}</div>
                <div><strong>{t('statut_actuel')} :</strong> <Badge variant="success">{t('statut_actif')}</Badge></div>
              </div>
              <div style={styles.modalFormGroup}>
                <label style={styles.modalLabel}>{t('raison_verrouillage')} *</label>
                <textarea
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                  placeholder={t('exemple_raison_verrouillage')}
                  style={{...styles.modalTextarea, textAlign: dir === 'rtl' ? 'right' : 'left'}}
                  rows={4}
                  disabled={lockLoading}
                />
                <small style={styles.modalHelper}>
                  {t('raison_visible_par_utilisateur')}
                </small>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button
                onClick={() => { setShowLockModal(false); setLockTarget(null); setLockReason(''); }}
                style={styles.modalCancelBtn}
                disabled={lockLoading}
              >
                {t('annuler')}
              </button>
              <button
                onClick={confirmLockAccount}
                disabled={lockLoading || lockReason.trim().length < 3}
                style={{
                  ...styles.modalLockBtn,
                  opacity: (lockLoading || lockReason.trim().length < 3) ? 0.6 : 1,
                  cursor: (lockLoading || lockReason.trim().length < 3) ? 'not-allowed' : 'pointer'
                }}
              >
                {lockLoading ? t('verrouillage_en_cours') : t('verrouiller_compte')}
              </button>
            </div>
          </div>
        </div>
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
  unlockInputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
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
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #E2E8F0',
  },
  modalTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: '#0F172A',
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#94A3B8',
    padding: '0 4px',
  },
  modalBody: {
    padding: '20px',
  },
  modalUserInfo: {
    backgroundColor: '#F8FAFC',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '4px 16px',
  },
  modalFormGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  modalLabel: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#334155',
  },
  modalTextarea: {
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #E2E8F0',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
    outline: 'none',
    minHeight: '80px',
  },
  modalHelper: {
    fontSize: '12px',
    color: '#94A3B8',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    padding: '16px 20px',
    borderTop: '1px solid #E2E8F0',
  },
  modalCancelBtn: {
    padding: '8px 16px',
    backgroundColor: '#E2E8F0',
    color: '#334155',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  modalLockBtn: {
    padding: '8px 20px',
    backgroundColor: '#EF4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
};