import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import Button from './common/Button';

export default function SessionMonitor({ children }) {
  const { user, logout } = useAuth();
  const [activeSessions, setActiveSessions] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [sessionDetails, setSessionDetails] = useState([]);

  useEffect(() => {
    if (!user || user.is_super_admin) return;

    const checkSessions = async () => {
      try {
        const res = await API.get('/auth/sessions/active');
        const sessions = res.data.sessions?.filter(s => s.is_active) || [];
        const count = sessions.length;
        
        if (count > 1 && activeSessions === 0) {
          setShowAlert(true);
          setSessionDetails(sessions);
          setTimeout(() => setShowAlert(false), 5000);
        }
        setActiveSessions(count);
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
      await API.post('/auth/sessions/revoke-others');
      setShowAlert(false);
      setActiveSessions(1);
    } catch (err) {
      console.error('Erreur revocation sessions:', err);
    }
  };

  return (
    <>
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
                      <span>{s.device_type || 'Appareil inconnu'}</span>
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
      {children}
    </>
  );
}

const styles = {
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
};