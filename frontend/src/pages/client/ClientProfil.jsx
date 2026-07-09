// src/pages/client/ClientProfil.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';

import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';

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

      await API.put('/auth/me', dataToSend);
      setMessage(' Profil mis à jour avec succès');
      setPassword('');
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      setError(apiErrors ? apiErrors.join(', ') : (err.response?.data?.message || 'Erreur'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}> Mon profil</h1>
          <p style={styles.subtitle}>Modifiez vos informations personnelles</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/client/dashboard')}>
          ← Retour
        </Button>
      </div>

      {message && (
        <div style={styles.successContainer}>
          <span>Done</span>
          <span style={styles.successText}>{message}</span>
        </div>
      )}
      {error && (
        <div style={styles.errorContainer}>
          <span>❌</span>
          <span style={styles.errorText}>{error}</span>
        </div>
      )}

      <Card title=" Informations personnelles" variant="primary" style={{ maxWidth: '500px' }}>
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <Input
              label="Nom"
              name="nom"
              value={form.nom}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div style={styles.formGroup}>
            <Input
              label="Prénom"
              name="prenom"
              value={form.prenom}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div style={styles.formGroup}>
            <Input
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div style={styles.formGroup}>
            <Input
              label="Nouveau mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Laisser vide si inchangé"
              disabled={loading}
            />
          </div>
          <Button type="submit" variant="primary" loading={loading} fullWidth>
            {loading ? 'Mise à jour...' : 'Mettre à jour'}
          </Button>
        </form>
      </Card>
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
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#0F172A',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748B',
    marginTop: '4px',
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
  formGroup: {
    marginBottom: '16px',
  },
};