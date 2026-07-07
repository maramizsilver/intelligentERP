import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

export default function ClientProfil() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    email: user?.email || ''
  });
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const dataToSend = { ...form };
      if (password) {
        dataToSend.password = password;
      }

      // On met à jour SON PROPRE profil : la route déduit l'utilisateur via le token,
      // pas besoin (et pas possible) de passer un id dans l'URL.
      await API.put('/auth/me', dataToSend);
      setMessage('✅ Profil mis à jour avec succès');
      setPassword('');
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      setError(apiErrors ? apiErrors.join(', ') : (err.response?.data?.message || 'Erreur'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>👤 Mon profil</h2>
        <button style={styles.backBtn} onClick={() => navigate('/client/dashboard')}>← Retour</button>
      </div>

      {message && <div style={styles.success}>{message}</div>}
      {error && <div style={styles.error}>{error}</div>}

      <form style={styles.card} onSubmit={handleSubmit}>
        <div style={styles.group}>
          <label style={styles.label}>Nom</label>
          <input style={styles.input} name="nom" value={form.nom} onChange={handleChange} required disabled={loading} />
        </div>
        <div style={styles.group}>
          <label style={styles.label}>Prénom</label>
          <input style={styles.input} name="prenom" value={form.prenom} onChange={handleChange} required disabled={loading} />
        </div>
        <div style={styles.group}>
          <label style={styles.label}>Email</label>
          <input style={styles.input} name="email" type="email" value={form.email} onChange={handleChange} required disabled={loading} />
        </div>
        <div style={styles.group}>
          <label style={styles.label}>Nouveau mot de passe</label>
          <input style={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Laisser vide si inchangé" disabled={loading} />
        </div>
        <button style={styles.submitBtn} type="submit" disabled={loading}>
          {loading ? 'Mise à jour...' : 'Mettre à jour'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: { padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  title: { color: '#0f172a', margin: 0, fontSize: '22px' },
  backBtn: { padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  error: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '16px' },
  success: { backgroundColor: '#d1fae5', color: '#065f46', padding: '12px', borderRadius: '8px', marginBottom: '16px' },
  card: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', maxWidth: '500px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  group: { marginBottom: '18px' },
  label: { display: 'block', marginBottom: '6px', fontWeight: '600', color: '#0f172a', fontSize: '14px' },
  input: { width: '100%', padding: '12px 16px', borderRadius: '8px', border: '2px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box' },
  submitBtn: { width: '100%', padding: '12px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '600' }
};
