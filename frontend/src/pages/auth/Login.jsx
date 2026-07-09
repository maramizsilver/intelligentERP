// src/pages/auth/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await API.post('/auth/login', { email, password });
      const { user, token } = res.data;
      login(user, token);

      let redirectPath = '/dashboard';
      if (user.is_super_admin) redirectPath = '/superadmin/dashboard';
      else if (user.is_external) redirectPath = '/client/dashboard';
      else if (user.essai_expire) redirectPath = '/essai-expire';
      navigate(redirectPath);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.bgDecoration}>
        <div style={styles.bgCircle1} />
        <div style={styles.bgCircle2} />
        <div style={styles.bgCircle3} />
      </div>

      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoWrapper}>
            <div style={styles.logoIcon}>🏢</div>
          </div>
          <h1 style={styles.title}>ERP</h1>
          <p style={styles.subtitle}>Plateforme de gestion d'entreprise</p>
        </div>

        {error && (
          <div style={styles.errorContainer}>
            
            <span style={styles.errorText}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email professionnel</label>
            <div style={styles.inputWrapper}>
              <input
                style={styles.input}
                type="email"
                placeholder="exemple@entreprise.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Mot de passe</label>
            <div style={styles.inputWrapper}>
              <input
                style={styles.input}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <button
            style={loading ? styles.buttonLoading : styles.button}
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <span style={styles.buttonContent}>
                <span style={styles.spinner} />
                Connexion en cours...
              </span>
            ) : (
              <span style={styles.buttonContent}>
                Se connecter
                <span style={styles.buttonArrow}>→</span>
              </span>
            )}
          </button>
        </form>

        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>ou</span>
          <span style={styles.dividerLine} />
        </div>

        <button style={styles.registerButton} onClick={() => navigate('/register')}>
          <span style={styles.registerIcon}>✨</span>
          Créer un compte entreprise
        </button>

        <p style={styles.footer}>© 2026 ERP - Tous droits réservés</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#F0F4F8',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  bgDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 0,
  },
  bgCircle1: {
    position: 'absolute',
    top: '-20%',
    right: '-10%',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(14, 165, 233, 0.08) 0%, transparent 70%)',
    animation: 'float 8s ease-in-out infinite',
  },
  bgCircle2: {
    position: 'absolute',
    bottom: '-15%',
    left: '-10%',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(14, 165, 233, 0.06) 0%, transparent 70%)',
    animation: 'float 10s ease-in-out infinite reverse',
  },
  bgCircle3: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(14, 165, 233, 0.03) 0%, transparent 70%)',
  },
  card: {
    position: 'relative',
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    padding: '48px 40px',
    borderRadius: '24px',
    boxShadow: '0 20px 60px rgba(14, 165, 233, 0.10), 0 4px 20px rgba(0, 0, 0, 0.04)',
    width: '420px',
    maxWidth: '92%',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logoWrapper: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  logoIcon: {
    fontSize: '48px',
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
    boxShadow: '0 8px 32px rgba(14, 165, 233, 0.30)',
    transition: 'transform 0.3s ease',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#0F172A',
    margin: '0 0 4px 0',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748B',
    margin: 0,
    fontWeight: 400,
  },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '12px',
    padding: '12px 16px',
    marginBottom: '24px',
  },
  errorIcon: { fontSize: '16px' },
  errorText: { color: '#991B1B', fontSize: '13px', fontWeight: 500 },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
    letterSpacing: '0.3px',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '12px',
    border: '2px solid #E2E8F0',
    fontSize: '14px',
    transition: 'all 0.3s ease',
    backgroundColor: '#F8FAFC',
    boxSizing: 'border-box',
    outline: 'none',
    fontFamily: 'inherit',
    color: '#0F172A',
  },
  button: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: '4px',
    boxShadow: '0 4px 16px rgba(14, 165, 233, 0.30)',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 32px rgba(14, 165, 233, 0.40)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
  },
  buttonLoading: {
    width: '100%',
    padding: '16px',
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
  buttonArrow: {
    display: 'inline-block',
    transition: 'transform 0.3s ease',
  },
  spinner: {
    display: 'inline-block',
    width: '20px',
    height: '20px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid #FFFFFF',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    margin: '24px 0',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: '12px',
    color: '#94A3B8',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  registerButton: {
    width: '100%',
    padding: '14px',
    backgroundColor: 'transparent',
    color: '#0EA5E9',
    border: '2px solid #0EA5E9',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    ':hover': {
      backgroundColor: '#0EA5E9',
      color: '#FFFFFF',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 24px rgba(14, 165, 233, 0.20)',
    },
  },
  registerIcon: { fontSize: '16px' },
  footer: {
    textAlign: 'center',
    marginTop: '24px',
    fontSize: '12px',
    color: '#94A3B8',
    letterSpacing: '0.3px',
  },
};

// Animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes float {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(30px, -30px) scale(1.1); }
    66% { transform: translate(-20px, 20px) scale(0.95); }
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  button:hover .button-arrow { transform: translateX(4px); }
`;
document.head.appendChild(styleSheet);