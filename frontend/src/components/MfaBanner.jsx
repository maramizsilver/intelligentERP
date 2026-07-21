import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

export default function MfaBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkMFAStatus = async () => {
      try {
        const res = await API.get('/auth/mfa/status');
        setMfaEnabled(res.data.data?.enabled || false);
      } catch (err) {
        // En cas d'erreur, considerer que MFA est desactivee
        console.warn('[MFA] Erreur chargement statut:', err.message);
        setMfaEnabled(false);
      } finally {
        setChecking(false);
      }
    };

    checkMFAStatus();
  }, []);

  // Ne rien afficher pendant le chargement
  if (checking) return null;
  
  // Ne rien afficher si SuperAdmin
  if (user?.is_super_admin) return null;
  
  // Ne rien afficher si MFA deja active ou banner masque
  if (mfaEnabled || user?.mfa_enabled) return null;
  
  if (!visible) return null;

  const dismissBanner = async () => {
    try {
      setLoading(true);
      await API.post('/auth/mfa/dismiss-banner');
      setVisible(false);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.banner}>
      <div style={styles.content}>
        <div style={styles.icon}>🔐</div>
        <div style={styles.message}>
          <strong>Securisez votre compte</strong>
          <span>Activez l'authentification à deux facteurs pour proteger votre compte.</span>
        </div>
        <div style={styles.actions}>
          <button style={styles.primaryBtn} onClick={() => navigate('/securite/mfa')}>
            Activer maintenant
          </button>
          <button style={styles.secondaryBtn} onClick={dismissBanner} disabled={loading}>
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  banner: {
    backgroundColor: '#EFF6FF',
    border: '1px solid #BFDBFE',
    borderRadius: '10px',
    padding: '14px 20px',
    marginBottom: '20px',
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '12px',
  },
  icon: { fontSize: '24px', flexShrink: 0 },
  message: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    fontSize: '14px',
    color: '#1E293B',
  },
  actions: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  primaryBtn: {
    padding: '8px 20px',
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  secondaryBtn: {
    padding: '8px 20px',
    backgroundColor: 'transparent',
    color: '#64748B',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  },
};