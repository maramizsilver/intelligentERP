// src/pages/auth/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import API from '../../utils/api';
import { collectDeviceInfo } from '../../utils/deviceFingerprint';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';
import Logo from '../../components/common/Logo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const deviceInfo = collectDeviceInfo();

      const res = await API.post('/auth/login', {
        email,
        password,
        device_info: deviceInfo
      });
      const { user, token } = res.data;
      login(user, token);

      let redirectPath = '/dashboard';
      if (user.is_super_admin) redirectPath = '/superadmin/dashboard';
      else if (user.is_external) redirectPath = '/client/dashboard';
      else if (user.essai_expire) redirectPath = '/essai-expire';
      navigate(redirectPath);
    } catch (err) {
      if (err.response?.status === 423 || err.response?.data?.code === 'ACCOUNT_LOCKED') {
        setError(err.response?.data?.message || t('compte_verrouille') || 'Compte verrouillé pour raisons de sécurité.');
      } else {
        setError(err.response?.data?.message || t('erreur_connexion') || 'Erreur de connexion');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* ============================================================
            PANNEAU GAUCHE - Sombre, branding
            ============================================================ */}
        <div style={styles.leftPanel}>
          <div style={styles.leftDecoCircle1} />
          <div style={styles.leftDecoCircle2} />

          <div style={styles.leftContent}>
            <div style={styles.logoRow}>
              <Logo size={36} textColor="#FFFFFF" variant="dark" />
            </div>

            <h2 style={styles.leftTitle}>
              {t('login_titre') || 'La solution ERP complète pour gérer votre entreprise avec intelligence'}
            </h2>
            <p style={styles.leftSubtitle}>
              {t('login_sous_titre') || 'Accédez à votre espace de travail sécurisé'}
            </p>

            {/* Mini dashboard décoratif */}
            <div style={styles.statCard}>
              <div style={styles.statCardHeader}>
                <span style={styles.statCardBadge}>
                  <span style={styles.statCardDot} /> Actif
                </span>
                <span style={styles.statCardTime}>Temps réel</span>
              </div>
              <span style={styles.statCardLabel}>Performance globale</span>
              <div style={styles.statCardValueRow}>
                <span style={styles.statCardValue}>+35.8%</span>
                <span style={styles.statCardArrow}>↗</span>
              </div>

              <svg viewBox="0 0 260 60" style={styles.sparkline} preserveAspectRatio="none">
                <polyline
                  points="0,45 30,40 60,42 90,30 120,32 150,18 180,22 210,10 240,14 260,5"
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="0,45 30,40 60,42 90,30 120,32 150,18 180,22 210,10 240,14 260,5 260,60 0,60"
                  fill="url(#sparkGradientLogin)"
                  stroke="none"
                />
                <defs>
                  <linearGradient id="sparkGradientLogin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>

              <div style={styles.statCardFooter}>
                <div>
                  <span style={styles.statCardFooterLabel}>CA mensuel</span>
                  <span style={styles.statCardFooterValue}>+24.5%</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={styles.statCardFooterLabel}>Nouveaux clients</span>
                  <span style={styles.statCardFooterValue}>128</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            PANNEAU DROIT - Formulaire clair
            ============================================================ */}
        <div style={styles.rightPanel}>
          <div style={styles.topBar}>
            <LanguageSwitcher />
          </div>

          <div style={styles.rightScroll}>
            <div style={styles.header}>
              <h1 style={styles.title}>{t('connexion') || 'Connexion'}</h1>
              <p style={styles.subtitle}>
                {t('accedez_espace_securise') || 'Accédez à votre espace de travail sécurisé'}
              </p>
            </div>

            {error && (
              <div style={styles.errorContainer}>
                <span style={styles.errorText}>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.section}>
                <label style={styles.sectionLabel}>{t('email_professionnel') || 'Identifiant'}</label>
                <input
                  style={styles.input}
                  type="email"
                  placeholder="exemple@entreprise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  onFocus={(e) => (e.target.style.borderColor = '#0EA5E9')}
                  onBlur={(e) => (e.target.style.borderColor = '#E2E8F0')}
                />
              </div>

              <div style={styles.section}>
                <label style={styles.sectionLabel}>{t('mot_de_passe') || 'Mot de passe'}</label>
                <input
                  style={styles.input}
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  onFocus={(e) => (e.target.style.borderColor = '#0EA5E9')}
                  onBlur={(e) => (e.target.style.borderColor = '#E2E8F0')}
                />
              </div>

              <div style={styles.optionsRow}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={styles.checkbox}
                  />
                  {t('se_souvenir_de_moi') || 'Se souvenir de moi'}
                </label>
                <span style={styles.link} onClick={() => navigate('/request-reset')}>
                  {t('mot_de_passe_oublie') || 'Mot de passe oublié ?'}
                </span>
              </div>

              <div style={styles.inviteBox}>
                <span style={styles.inviteIcon}>🚀</span>
                <div style={styles.inviteTextBlock}>
                  <strong style={styles.inviteTitle}>{t('creer_un_espace_erp') || 'Créer un espace ERP'}</strong>
                  <span style={styles.inviteDesc}>
                    {t('inscription_entreprise_desc') || "Inscription entreprise ou individu — Essai gratuit 30 connexions ou abonnement"}
                  </span>
                </div>
                <button
                  type="button"
                  style={styles.inviteButton}
                  onClick={() => navigate('/register')}
                >
                  {t('sinscrire') || "S'inscrire"}
                </button>
              </div>

              <button
                style={loading ? styles.buttonLoading : styles.button}
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <span style={styles.buttonContent}>
                    <span style={styles.spinner} />
                    {t('connexion_en_cours') || 'Connexion en cours...'}
                  </span>
                ) : (
                  <span style={styles.buttonContent}>
                    {t('se_connecter') || 'Se connecter'}
                    <span>→</span>
                  </span>
                )}
              </button>
            </form>

            <p style={styles.footer}>© 2026 ERP - {t('tous_droits_reserves') || 'Tous droits réservés'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#F1F5F9',
    padding: '24px 0',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  card: {
    display: 'flex',
    width: '960px',
    maxWidth: '94%',
    maxHeight: '90vh',
    backgroundColor: '#FFFFFF',
    borderRadius: '24px',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(15, 23, 42, 0.15)',
  },
  leftPanel: {
    flex: '0 0 42%',
    background: 'linear-gradient(160deg, #0F172A 0%, #0B1220 100%)',
    padding: '40px 36px',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  leftDecoCircle1: {
    position: 'absolute',
    top: '-60px',
    right: '-60px',
    width: '220px',
    height: '220px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(14,165,233,0.18) 0%, transparent 70%)',
  },
  leftDecoCircle2: {
    position: 'absolute',
    bottom: '-80px',
    left: '-40px',
    width: '260px',
    height: '260px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(14,165,233,0.10) 0%, transparent 70%)',
  },
  leftContent: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '40px',
  },
  leftTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#FFFFFF',
    lineHeight: '1.35',
    margin: '0 0 12px',
  },
  leftSubtitle: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.55)',
    lineHeight: '1.6',
    margin: '0 0 32px',
  },
  statCard: {
    marginTop: 'auto',
    backgroundColor: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '20px',
    backdropFilter: 'blur(10px)',
  },
  statCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
  },
  statCardBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#4ADE80',
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    padding: '3px 10px',
    borderRadius: '20px',
  },
  statCardDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#4ADE80',
    display: 'inline-block',
  },
  statCardTime: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.35)',
  },
  statCardLabel: {
    display: 'block',
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: '4px',
  },
  statCardValueRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '14px',
  },
  statCardValue: {
    fontSize: '26px',
    fontWeight: 700,
    color: '#FFFFFF',
  },
  statCardArrow: {
    fontSize: '16px',
    color: '#4ADE80',
  },
  sparkline: {
    width: '100%',
    height: '54px',
    display: 'block',
    marginBottom: '14px',
  },
  statCardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: '14px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
  },
  statCardFooterLabel: {
    display: 'block',
    fontSize: '10px',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    marginBottom: '2px',
  },
  statCardFooterValue: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    color: '#FFFFFF',
  },
  rightPanel: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    zIndex: 2,
  },
  rightScroll: {
    padding: '48px 40px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    flex: 1,
  },
  header: {
    marginBottom: '28px',
  },
  title: {
    fontSize: '26px',
    fontWeight: 700,
    color: '#0F172A',
    margin: 0,
    letterSpacing: '-0.4px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748B',
    margin: '6px 0 0',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '10px',
    padding: '12px 16px',
    marginBottom: '18px',
  },
  errorText: { color: '#991B1B', fontSize: '13px', fontWeight: 500 },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  sectionLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#475569',
    letterSpacing: '0.3px',
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    padding: '13px 14px',
    borderRadius: '10px',
    border: '2px solid #E2E8F0',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    backgroundColor: '#F8FAFC',
    boxSizing: 'border-box',
    outline: 'none',
    fontFamily: 'inherit',
    color: '#0F172A',
  },
  optionsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#475569',
    cursor: 'pointer',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    accentColor: '#0EA5E9',
    cursor: 'pointer',
  },
  link: {
    fontSize: '13px',
    color: '#0EA5E9',
    cursor: 'pointer',
    fontWeight: 500,
  },
  inviteBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    borderRadius: '12px',
    backgroundColor: '#F0F9FF',
    border: '1px solid #BAE6FD',
  },
  inviteIcon: {
    fontSize: '22px',
    flexShrink: 0,
  },
  inviteTextBlock: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  inviteTitle: {
    fontSize: '13px',
    color: '#0F172A',
  },
  inviteDesc: {
    fontSize: '11px',
    color: '#64748B',
    lineHeight: '1.4',
  },
  inviteButton: {
    flexShrink: 0,
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 8px rgba(14, 165, 233, 0.25)',
  },
  button: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 16px rgba(14, 165, 233, 0.30)',
  },
  buttonLoading: {
    width: '100%',
    padding: '14px',
    background: '#94A3B8',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'not-allowed',
    opacity: 0.7,
  },
  buttonContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  spinner: {
    display: 'inline-block',
    width: '18px',
    height: '18px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid #FFFFFF',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  footer: {
    textAlign: 'center',
    marginTop: '24px',
    fontSize: '12px',
    color: '#94A3B8',
  },
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);