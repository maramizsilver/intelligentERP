import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';

export default function Register() {
  const [form, setForm] = useState({ entreprise_nom: '', nom: '', prenom: '', email: '', password: '', plan_type: 'essai' });
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
      // Crée une nouvelle entreprise + son Admin Entreprise.
      // L'entreprise reste "en_attente" jusqu'à validation par le SuperAdmin de la plateforme.
      await API.post('/auth/register-entreprise', form);
      setSuccess('✅ Inscription envoyée ! Votre entreprise est en attente de validation par la plateforme. Vous recevrez un accès dès l\'activation.');
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
      <div style={styles.card}>
        <h2 style={styles.title}>🏢 Créer mon compte ERP</h2>
        <p style={styles.hint}>Chaque entreprise dispose de son propre espace isolé et sécurisé.</p>
        {error && <p style={styles.error}>{error}</p>}
        {success && <p style={styles.success}>{success}</p>}
        <form onSubmit={handleSubmit}>
          <input style={styles.input} name="entreprise_nom" placeholder="Nom de l'entreprise" onChange={handleChange} required disabled={loading} />
          <hr style={styles.separator} />
          <p style={styles.sectionLabel}>Compte administrateur de l'entreprise</p>
          <input style={styles.input} name="nom" placeholder="Nom" onChange={handleChange} required disabled={loading} />
          <input style={styles.input} name="prenom" placeholder="Prénom" onChange={handleChange} required disabled={loading} />
          <input style={styles.input} name="email" type="email" placeholder="Email" onChange={handleChange} required disabled={loading} />
          <input style={styles.input} name="password" type="password" placeholder="Mot de passe (min. 8 caractères)" onChange={handleChange} required minLength={8} disabled={loading} />

          <hr style={styles.separator} />
          <p style={styles.sectionLabel}>Choisissez votre formule</p>
          <div style={styles.planGrid}>
            <label style={{ ...styles.planCard, ...(form.plan_type === 'essai' ? styles.planCardActive : {}) }}>
              <input
                type="radio" name="plan_type" value="essai"
                checked={form.plan_type === 'essai'} onChange={handleChange}
                style={styles.planRadio} disabled={loading}
              />
              <span style={styles.planTitle}>🎁 Essai gratuit</span>
              <span style={styles.planDesc}>30 connexions gratuites, sans engagement</span>
            </label>
            <label style={{ ...styles.planCard, ...(form.plan_type === 'payant' ? styles.planCardActive : {}) }}>
              <input
                type="radio" name="plan_type" value="payant"
                checked={form.plan_type === 'payant'} onChange={handleChange}
                style={styles.planRadio} disabled={loading}
              />
              <span style={styles.planTitle}>💳 Abonnement payant</span>
              <span style={styles.planDesc}>Accès illimité dès validation</span>
            </label>
          </div>

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Envoi...' : "S'inscrire"}
          </button>
        </form>
        <p style={styles.link} onClick={() => navigate('/')}>
          Déjà un compte ? Se connecter
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5', padding: '24px 0' },
  card: { background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: '420px', maxWidth: '90%' },
  title: { textAlign: 'center', marginBottom: '8px', color: '#1a1a2e' },
  hint: { textAlign: 'center', color: '#64748b', fontSize: '13px', marginBottom: '20px' },
  sectionLabel: { fontSize: '13px', fontWeight: '600', color: '#475569', margin: '0 0 10px' },
  separator: { border: 'none', borderTop: '1px solid #e2e8f0', margin: '16px 0' },
  planGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' },
  planCard: { position: 'relative', display: 'flex', flexDirection: 'column', gap: '4px', padding: '14px', borderRadius: '10px', border: '2px solid #e2e8f0', cursor: 'pointer', fontSize: '13px' },
  planCardActive: { borderColor: '#4f46e5', backgroundColor: '#eef2ff' },
  planRadio: { position: 'absolute', top: '10px', right: '10px' },
  planTitle: { fontWeight: '600', color: '#1a1a2e', fontSize: '14px' },
  planDesc: { color: '#64748b', fontSize: '12px' },
  input: { width: '100%', padding: '12px', marginBottom: '16px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' },
  button: { width: '100%', padding: '12px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' },
  error: { color: 'red', textAlign: 'center', marginBottom: '12px', fontSize: '14px' },
  success: { color: 'green', textAlign: 'center', marginBottom: '12px', fontSize: '14px' },
  link: { textAlign: 'center', marginTop: '16px', color: '#4f46e5', cursor: 'pointer' }
};
