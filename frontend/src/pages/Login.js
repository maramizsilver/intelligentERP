import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { colors, buttons, inputs } from '../styles/globalStyles';

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

      // La redirection dépend du type de compte, pas d'un rôle texte figé :
      // - SuperAdmin plateforme -> back-office plateforme
      // - Utilisateur externe (portail client) -> espace client
      // - Utilisateur interne -> dashboard entreprise (le menu s'adapte ensuite à ses permissions)
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
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>🏢</div>
          <h2 style={styles.title}>ERP</h2>
          <p style={styles.subtitle}>Connexion</p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            style={inputs.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
          <input
            style={{...inputs.input, marginTop: '12px'}}
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
          <button
            style={{...buttons.primary, width: '100%', marginTop: '16px', borderRadius: '8px'}}
            type="submit"
            disabled={loading}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p style={styles.link} onClick={() => navigate('/register')}>
          Vous représentez une entreprise ? Créer un compte ERP
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: colors.bg,
    backgroundImage: 'linear-gradient(135deg, #f0f9ff 0%, #f0fdf4 100%)'
  },
  card: {
    backgroundColor: colors.white,
    padding: '40px',
    borderRadius: '16px',
    boxShadow: '0 4px 40px rgba(14, 165, 233, 0.10)',
    width: '380px',
    maxWidth: '90%',
    border: `1px solid ${colors.border}`
  },
  header: { textAlign: 'center', marginBottom: '24px' },
  logo: { fontSize: '40px', marginBottom: '8px' },
  title: { color: colors.text, margin: '0', fontSize: '24px', fontWeight: '700' },
  subtitle: { color: colors.textLight, fontSize: '14px', margin: '4px 0 0' },
  error: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '16px',
    textAlign: 'center'
  },
  link: {
    textAlign: 'center',
    marginTop: '16px',
    color: colors.primary,
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  }
};
