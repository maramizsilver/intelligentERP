// src/pages/auth/Register.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../utils/api';

export default function Register() {
  const [form, setForm] = useState({
    entreprise_nom: '',
    nom: '',
    prenom: '',
    email: '',
    password: '',
    plan_type: 'essai',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setLoading(true);
    try {
      await API.post('/auth/register-entreprise', form);
      setSuccess(' Inscription envoyée ! Votre entreprise est en attente de validation.');
      setTimeout(() => navigate('/'), 4000);
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      setError(apiErrors ? apiErrors.join(', ') : (err.response?.data?.message || 'Erreur inscription'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.bgDecoration}>
        <div style={styles.bgCircle1} />
        <div style={styles.bgCircle2} />
      </div>

      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoWrapper}>
            <div style={styles.logoIcon}>🏢</div>
          </div>
          <h1 style={styles.title}>Créer mon compte</h1>
          <p style={styles.subtitle}>Inscrivez votre entreprise en quelques minutes</p>
        </div>

        {error && (
          <div style={styles.errorContainer}>
            <span style={styles.errorText}>{error}</span>
          </div>
        )}
        {success && (
          <div style={styles.successContainer}>
            <span style={styles.successIcon}>✅</span>
            <span style={styles.successText}>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Section Entreprise */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionTitle}>Informations de l'entreprise</span>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Nom de l'entreprise</label>
              <input
                style={styles.input}
                name="entreprise_nom"
                placeholder="Ex: Société ABC"
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div style={styles.divider} />

          {/* Section Admin */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionTitle}>Compte administrateur</span>
            </div>

            <div style={styles.row}>
              <div style={{ ...styles.inputGroup, flex: 1 }}>
                <label style={styles.label}>Nom</label>
                <input
                  style={styles.input}
                  name="nom"
                  placeholder="Dupont"
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div style={{ ...styles.inputGroup, flex: 1 }}>
                <label style={styles.label}>Prénom</label>
                <input
                  style={styles.input}
                  name="prenom"
                  placeholder="Jean"
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Email</label>
              <input
                style={styles.input}
                name="email"
                type="email"
                placeholder="jean.dupont@entreprise.com"
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Mot de passe</label>
              <input
                style={styles.input}
                name="password"
                type="password"
                placeholder="Minimum 8 caractères"
                onChange={handleChange}
                required
                minLength={8}
                disabled={loading}
              />
            </div>
          </div>

          <div style={styles.divider} />

          {/* Section Plan */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionTitle}>Choisissez votre formule</span>
            </div>

            <div style={styles.planGrid}>
              <div
                style={{
                  ...styles.planCard,
                  ...(form.plan_type === 'essai' ? styles.planCardActive : {}),
                }}
                onClick={() => setForm({ ...form, plan_type: 'essai' })}
              >
                <div style={styles.planRadio}>
                  <input
                    type="radio"
                    name="plan_type"
                    value="essai"
                    checked={form.plan_type === 'essai'}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
            
                <div style={styles.planTitle}>Essai gratuit</div>
                <div style={styles.planDesc}>30 connexions gratuites</div>
                <div style={styles.planBadge}>Sans engagement</div>
              </div>

              <div
                style={{
                  ...styles.planCard,
                  ...(form.plan_type === 'payant' ? styles.planCardActive : {}),
                }}
                onClick={() => setForm({ ...form, plan_type: 'payant' })}
              >
                <div style={styles.planRadio}>
                  <input
                    type="radio"
                    name="plan_type"
                    value="payant"
                    checked={form.plan_type === 'payant'}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
                <div style={styles.planIcon}>💳</div>
                <div style={styles.planTitle}>Abonnement</div>
                <div style={styles.planDesc}>Accès illimité</div>
                <div style={styles.planBadgePro}>Pro</div>
              </div>
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
                Inscription en cours...
              </span>
            ) : (
              <span style={styles.buttonContent}>
                S'inscrire
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

        <button style={styles.loginButton} onClick={() => navigate('/')}>
           Déjà un compte ? Se connecter
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
    padding: '24px 0',
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
    top: '-30%',
    right: '-10%',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(14, 165, 233, 0.06) 0%, transparent 70%)',
    animation: 'float 8s ease-in-out infinite',
  },
  bgCircle2: {
    position: 'absolute',
    bottom: '-20%',
    left: '-10%',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(14, 165, 233, 0.04) 0%, transparent 70%)',
    animation: 'float 10s ease-in-out infinite reverse',
  },
  card: {
    position: 'relative',
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    padding: '40px',
    borderRadius: '24px',
    boxShadow: '0 20px 60px rgba(14, 165, 233, 0.10)',
    width: '480px',
    maxWidth: '92%',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  header: {
    textAlign: 'center',
    marginBottom: '28px',
  },
  logoWrapper: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '12px',
  },
  logoIcon: {
    fontSize: '36px',
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
    boxShadow: '0 8px 32px rgba(14, 165, 233, 0.30)',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#0F172A',
    margin: 0,
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748B',
    margin: '4px 0 0',
  },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '12px',
    padding: '12px 16px',
    marginBottom: '20px',
  },
  errorIcon: { fontSize: '16px' },
  errorText: { color: '#991B1B', fontSize: '13px', fontWeight: 500 },
  successContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#F0FDF4',
    border: '1px solid #86EFAC',
    borderRadius: '12px',
    padding: '12px 16px',
    marginBottom: '20px',
  },
  successIcon: { fontSize: '16px' },
  successText: { color: '#065F46', fontSize: '13px', fontWeight: 500 },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#334155',
  },
  row: {
    display: 'flex',
    gap: '12px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#475569',
    letterSpacing: '0.3px',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '10px',
    border: '2px solid #E2E8F0',
    fontSize: '13px',
    transition: 'all 0.3s ease',
    backgroundColor: '#F8FAFC',
    boxSizing: 'border-box',
    outline: 'none',
    fontFamily: 'inherit',
    color: '#0F172A',
    ':focus': {
      borderColor: '#0EA5E9',
      boxShadow: '0 0 0 3px rgba(14, 165, 233, 0.15)',
      backgroundColor: '#FFFFFF',
    },
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #E2E8F0',
    margin: '4px 0',
  },
  planGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  planCard: {
    position: 'relative',
    padding: '16px',
    borderRadius: '12px',
    border: '2px solid #E2E8F0',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'center',
    backgroundColor: '#FAFBFC',
    ':hover': {
      borderColor: '#0EA5E9',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 16px rgba(14, 165, 233, 0.10)',
    },
  },
  planCardActive: {
    borderColor: '#0EA5E9',
    backgroundColor: '#F0F9FF',
    boxShadow: '0 4px 16px rgba(14, 165, 233, 0.15)',
  },
  planRadio: {
    position: 'absolute',
    top: '8px',
    right: '8px',
  },
  planIcon: { fontSize: '24px', marginBottom: '4px' },
  planTitle: { fontSize: '14px', fontWeight: 600, color: '#0F172A' },
  planDesc: { fontSize: '11px', color: '#64748B' },
  planBadge: {
    display: 'inline-block',
    marginTop: '6px',
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: 600,
    backgroundColor: '#E2E8F0',
    color: '#475569',
  },
  planBadgePro: {
    display: 'inline-block',
    marginTop: '6px',
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: 600,
    background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
    color: '#FFFFFF',
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
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 32px rgba(14, 165, 233, 0.40)',
    },
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
  dividerText: {
    fontSize: '12px',
    color: '#94A3B8',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#E2E8F0',
  },
  loginButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: 'transparent',
    color: '#0EA5E9',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    ':hover': {
      backgroundColor: '#F0F9FF',
    },
  },
  footer: {
    textAlign: 'center',
    marginTop: '20px',
    fontSize: '12px',
    color: '#94A3B8',
  },
};

const animStyle = document.createElement('style');
animStyle.textContent = `
  @keyframes float {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(30px, -30px) scale(1.1); }
    66% { transform: translate(-20px, 20px) scale(0.95); }
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(animStyle);