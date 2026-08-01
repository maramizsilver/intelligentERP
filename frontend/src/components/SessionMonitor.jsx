import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import Button from './common/Button';

export default function SessionMonitor({ children }) {
  const { user, logout } = useAuth();
  const [activeSessions, setActiveSessions] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [sessionDetails, setSessionDetails] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!user || user.is_super_admin) return;

    const checkSessions = async () => {
      try {
        const res = await API.get('/auth/sessions/active-detailed');
        const sessions = res.data.sessions?.filter(s => s.is_active) || [];
        const count = sessions.length;
        
        setActiveSessions(count);
        setAllSessions(sessions);
        
        if (count > 1) {
          setShowAlert(true);
          setSessionDetails(sessions);
          setTimeout(() => setShowAlert(false), 5000);
        }
      } catch (err) {
        console.error('Erreur verification sessions:', err);
      }
    };

    checkSessions();
    const interval = setInterval(checkSessions, 30000);

    return () => clearInterval(interval);
  }, [user]);

  const handleRevokeOtherSessions = async () => {
    try {
      setLoading(true);
      await API.post('/auth/sessions/revoke-others');
      setShowAlert(false);
      setActiveSessions(1);
      const res = await API.get('/auth/sessions/active-detailed');
      setAllSessions(res.data.sessions?.filter(s => s.is_active) || []);
    } catch (err) {
      setError('Erreur lors de la revocation');
      console.error('Erreur revocation sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReportSession = async (sessionId, lockAccount = false) => {
    const confirmMessage = lockAccount 
      ? 'Voulez-vous signaler cette session et verrouiller votre compte ?'
      : 'Voulez-vous signaler cette session comme suspecte ?';
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setLoading(true);
      await API.post(`/auth/sessions/${sessionId}/report`, {
        reason: 'Connexion suspecte - non reconnue par l\'utilisateur',
        lock_account: lockAccount
      });
      
      if (lockAccount) {
        logout();
        window.location.href = '/login?locked=true';
        return;
      }
      
      const res = await API.get('/auth/sessions/active-detailed');
      setAllSessions(res.data.sessions?.filter(s => s.is_active) || []);
    } catch (err) {
      setError('Erreur lors du signalement');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLockAccount = async () => {
    if (!window.confirm('Voulez-vous verrouiller votre compte ? Toutes vos sessions seront deconnectees.')) {
      return;
    }

    try {
      setLoading(true);
      await API.post('/auth/account/lock', {
        reason: 'Verrouillage volontaire par l\'utilisateur'
      });
      logout();
      window.location.href = '/login?locked=true';
    } catch (err) {
      setError('Erreur lors du verrouillage');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'mobile': return '📱';
      case 'tablet': return '📟';
      default: return '💻';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Determine if current session (check token)
  const isCurrentSession = (session) => {
    const token = localStorage.getItem('token');
    return session.token === token;
  };

  return (
    <>
      {/* Alerte flottante pour sessions multiples */}
      {showAlert && (
        <div style={styles.alert}>
          <div style={styles.alertContent}>
            <span style={styles.alertIcon}>🔐</span>
            <div style={styles.alertMessage}>
              <strong>{activeSessions} sessions actives detectees</strong>
              <span style={styles.alertDetail}>
                Votre compte est connecte sur plusieurs appareils
              </span>
              {sessionDetails.length > 0 && (
                <div style={styles.sessionList}>
                  {sessionDetails.slice(0, 3).map((s, i) => (
                    <div key={i} style={styles.sessionItem}>
                      <span>{getDeviceIcon(s.device_type)} {s.device_type || 'Appareil inconnu'}</span>
                      <span style={styles.sessionTime}>
                        {new Date(s.last_activity).toLocaleString('fr-FR')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={styles.alertActions}>
              <Button 
                variant="danger" 
                size="sm" 
                onClick={handleRevokeOtherSessions}
                disabled={loading}
              >
                Deconnecter les autres
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setShowAlert(false)}
              >
                Ignorer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bouton pour ouvrir le modal des sessions */}
      <div style={styles.fabContainer}>
        <button
          onClick={() => setShowModal(!showModal)}
          style={styles.fabButton}
          title="Voir mes sessions"
        >
          {allSessions.length > 1 ? '🔴' : '🟢'} {allSessions.length}
        </button>
      </div>

      {/* Modal de gestion des sessions */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Mes sessions actives</h3>
              <button 
                style={styles.modalClose} 
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            {error && (
              <div style={styles.errorContainer}>
                <span style={styles.errorText}>{error}</span>
                <button onClick={() => setError('')} style={styles.closeError}>✕</button>
              </div>
            )}

            <div style={styles.modalActions}>
              <button
                onClick={handleRevokeOtherSessions}
                disabled={loading || allSessions.length <= 1}
                style={{
                  ...styles.actionButton,
                  ...styles.dangerButton,
                  opacity: (loading || allSessions.length <= 1) ? 0.5 : 1,
                  cursor: (loading || allSessions.length <= 1) ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Chargement...' : 'Déconnecter les autres'}
              </button>
              <button
                onClick={handleLockAccount}
                disabled={loading}
                style={{
                  ...styles.actionButton,
                  ...styles.warningButton,
                  opacity: loading ? 0.5 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Chargement...' : '🔒 Verrouiller mon compte'}
              </button>
            </div>

            {allSessions.length === 0 ? (
              <div style={styles.noSessions}>Aucune session active</div>
            ) : (
              <div style={styles.sessionsList}>
                {allSessions.map((session) => {
                  const isCurrent = isCurrentSession(session);
                  return (
                    <div 
                      key={session.id} 
                      style={{
                        ...styles.sessionCard,
                        ...(isCurrent ? styles.sessionCardCurrent : {})
                      }}
                    >
                      <div style={styles.sessionHeader}>
                        <div style={styles.sessionIcon}>
                          {getDeviceIcon(session.device_type)}
                        </div>
                        <div style={styles.sessionInfo}>
                          <div style={styles.sessionDevice}>
                            <strong>{session.device_type || 'Appareil inconnu'}</strong>
                            {isCurrent && (
                              <span style={styles.badgeCurrent}>Session actuelle</span>
                            )}
                            {session.is_reported === 1 && (
                              <span style={styles.badgeReported}>Signalée</span>
                            )}
                          </div>
                          <div style={styles.sessionDetails}>
                            <span>OS: {session.os || 'Inconnu'}</span>
                            <span>|</span>
                            <span>Navigateur: {session.browser || 'Inconnu'}</span>
                          </div>
                          <div style={styles.sessionDetails}>
                            <span>IP: {session.ip_address || 'Inconnue'}</span>
                            <span>|</span>
                            <span>Connecté: {formatDate(session.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {!isCurrent && session.is_reported !== 1 && (
                        <div style={styles.sessionActions}>
                          <button
                            onClick={() => handleReportSession(session.id, false)}
                            disabled={loading}
                            style={{
                              ...styles.smallButton,
                              ...styles.reportButton,
                              opacity: loading ? 0.5 : 1,
                              cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                          >
                            Signaler
                          </button>
                          <button
                            onClick={() => handleReportSession(session.id, true)}
                            disabled={loading}
                            style={{
                              ...styles.smallButton,
                              ...styles.reportLockButton,
                              opacity: loading ? 0.5 : 1,
                              cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                          >
                            Signaler + Verrouiller
                          </button>
                        </div>
                      )}
                      
                      {session.is_reported === 1 && (
                        <div style={styles.reportedInfo}>
                          ⛔ Session signalée
                          {session.report_reason && (
                            <span style={styles.reportedReason}>: {session.report_reason}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div style={styles.modalFooter}>
              <button
                onClick={() => {
                  setShowModal(false);
                  const checkSessions = async () => {
                    const res = await API.get('/auth/sessions/active-detailed');
                    setAllSessions(res.data.sessions?.filter(s => s.is_active) || []);
                  };
                  checkSessions();
                }}
                style={styles.refreshButton}
              >
                🔄 Rafraîchir
              </button>
              <span style={styles.sessionCount}>
                {allSessions.length} session(s) active(s)
              </span>
            </div>
          </div>
        </div>
      )}

      {children}
    </>
  );
}

const styles = {
  // Alerte flottante
  alert: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 9999,
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    padding: '20px 24px',
    borderRadius: '12px',
    border: '1px solid #FDE68A',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    maxWidth: '480px',
    width: '100%',
    animation: 'slideUp 0.3s ease',
  },
  alertContent: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  alertIcon: {
    fontSize: '24px',
    flexShrink: 0,
  },
  alertMessage: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  alertDetail: {
    fontSize: '13px',
    color: '#64748B',
  },
  sessionList: {
    marginTop: '8px',
    padding: '8px 12px',
    backgroundColor: '#F8FAFC',
    borderRadius: '6px',
    fontSize: '12px',
  },
  sessionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 0',
    borderBottom: '1px solid #E2E8F0',
  },
  sessionTime: {
    color: '#94A3B8',
  },
  alertActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flexShrink: 0,
  },

  // Bouton flottant (FAB)
  fabContainer: {
    position: 'fixed',
    bottom: '80px',
    right: '24px',
    zIndex: 9998,
  },
  fabButton: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: '#0EA5E9',
    color: 'white',
    border: 'none',
    fontSize: '18px',
    fontWeight: 'bold',
    boxShadow: '0 4px 16px rgba(14, 165, 233, 0.4)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '600px',
    width: '95%',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  modalTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
    color: '#0F172A',
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#94A3B8',
    padding: '4px 8px',
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  actionButton: {
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    flex: 1,
    minWidth: '140px',
  },
  dangerButton: {
    backgroundColor: '#DC2626',
    color: 'white',
  },
  warningButton: {
    backgroundColor: '#F59E0B',
    color: 'white',
  },
  noSessions: {
    textAlign: 'center',
    padding: '40px',
    color: '#94A3B8',
    fontSize: '16px',
  },
  sessionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '400px',
    overflow: 'auto',
  },
  sessionCard: {
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '14px 16px',
    backgroundColor: '#F8FAFC',
  },
  sessionCardCurrent: {
    borderColor: '#0EA5E9',
    backgroundColor: '#F0F9FF',
  },
  sessionHeader: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  sessionIcon: {
    fontSize: '28px',
    flexShrink: 0,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDevice: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  sessionDetails: {
    fontSize: '13px',
    color: '#64748B',
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    marginTop: '2px',
  },
  badgeCurrent: {
    fontSize: '11px',
    backgroundColor: '#0EA5E9',
    color: 'white',
    padding: '2px 10px',
    borderRadius: '12px',
    fontWeight: '500',
  },
  badgeReported: {
    fontSize: '11px',
    backgroundColor: '#DC2626',
    color: 'white',
    padding: '2px 10px',
    borderRadius: '12px',
    fontWeight: '500',
  },
  sessionActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '10px',
    paddingTop: '10px',
    borderTop: '1px solid #E2E8F0',
  },
  smallButton: {
    padding: '6px 14px',
    borderRadius: '6px',
    border: 'none',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  reportButton: {
    backgroundColor: '#F59E0B',
    color: 'white',
  },
  reportLockButton: {
    backgroundColor: '#DC2626',
    color: 'white',
  },
  reportedInfo: {
    marginTop: '10px',
    paddingTop: '10px',
    borderTop: '1px solid #FECACA',
    color: '#DC2626',
    fontSize: '13px',
  },
  reportedReason: {
    color: '#6B7280',
    fontSize: '12px',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #E2E8F0',
  },
  refreshButton: {
    background: 'none',
    border: '1px solid #E2E8F0',
    padding: '6px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#64748B',
  },
  sessionCount: {
    fontSize: '13px',
    color: '#94A3B8',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '8px',
    padding: '10px 14px',
    marginBottom: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#991B1B',
    fontSize: '14px',
  },
  closeError: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#991B1B',
    padding: '0 0 0 12px',
  },
};