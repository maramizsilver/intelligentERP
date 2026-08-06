import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

export default function Profil() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    poste: '',
    departement: '',
    fonction: '',
    service: '',
    matricule: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setForm({
        nom: user.nom || '',
        prenom: user.prenom || '',
        email: user.email || '',
        telephone: user.telephone || '',
        poste: user.poste || '',
        departement: user.departement || '',
        fonction: user.fonction || '',
        service: user.service || '',
        matricule: user.matricule || ''
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await API.put('/users/profil', form);
      updateUser(res.data.user);
      setMessage({ type: 'success', text: 'Profil mis à jour avec succès' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Erreur lors de la mise à jour' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (passwordForm.new.length < 8) {
      setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 8 caractères' });
      return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
      return;
    }

    setLoading(true);
    try {
      await API.put('/users/profil/password', {
        currentPassword: passwordForm.current,
        newPassword: passwordForm.new
      });
      setMessage({ type: 'success', text: 'Mot de passe changé avec succès' });
      setPasswordForm({ current: '', new: '', confirm: '' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Erreur' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Mon profil</h1>
      <p style={styles.subtitle}>{user?.entreprise_nom} · {user?.role_nom || 'Utilisateur'}</p>

      {message.text && (
        <div style={{
          ...styles.message,
          backgroundColor: message.type === 'success' ? '#D1FAE5' : '#FEE2E2',
          color: message.type === 'success' ? '#065F46' : '#991B1B'
        }}>
          {message.text}
        </div>
      )}

      <Card title="Informations personnelles" variant="primary">
        <form onSubmit={handleSubmit}>
          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Nom *</label>
              <input style={styles.input} value={form.nom} onChange={(e) => setForm({...form, nom: e.target.value})} required disabled={loading} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Prénom *</label>
              <input style={styles.input} value={form.prenom} onChange={(e) => setForm({...form, prenom: e.target.value})} required disabled={loading} />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input style={{...styles.input, backgroundColor: '#F1F5F9'}} value={form.email} disabled />
            <span style={styles.helpText}>L'email ne peut pas être modifié</span>
          </div>

          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Téléphone</label>
              <input style={styles.input} value={form.telephone} onChange={(e) => setForm({...form, telephone: e.target.value})} placeholder="+216 XX XXX XXX" disabled={loading} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Matricule</label>
              <input style={styles.input} value={form.matricule} onChange={(e) => setForm({...form, matricule: e.target.value})} placeholder="Matricule interne" disabled={loading} />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Fonction</label>
              <input style={styles.input} value={form.fonction} onChange={(e) => setForm({...form, fonction: e.target.value})} placeholder="Responsable Commercial" disabled={loading} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Service</label>
              <input style={styles.input} value={form.service} onChange={(e) => setForm({...form, service: e.target.value})} placeholder="Commercial, RH, IT..." disabled={loading} />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Département</label>
            <input style={styles.input} value={form.departement} onChange={(e) => setForm({...form, departement: e.target.value})} placeholder="Direction Commerciale" disabled={loading} />
          </div>

          <Button type="submit" variant="primary" loading={loading}>Enregistrer</Button>
        </form>
      </Card>

      <Card title="Changer mon mot de passe" variant="primary" style={{ marginTop: '24px' }}>
        <form onSubmit={handlePasswordSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Mot de passe actuel</label>
            <input style={styles.input} type="password" value={passwordForm.current} onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})} required disabled={loading} placeholder="••••••••" />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Nouveau mot de passe</label>
            <input style={styles.input} type="password" value={passwordForm.new} onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})} required disabled={loading} placeholder="Minimum 8 caractères" minLength={8} />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirmer</label>
            <input style={styles.input} type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})} required disabled={loading} placeholder="Confirmer le mot de passe" />
          </div>
          <Button type="submit" variant="danger" loading={loading}>Changer le mot de passe</Button>
        </form>
      </Card>
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#0F172A',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748B',
    marginTop: '2px',
    marginBottom: '20px',
  },
  message: {
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: '16px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
  },
  input: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '2px solid #E2E8F0',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
    color: '#0F172A',
  },
  helpText: {
    fontSize: '12px',
    color: '#94A3B8',
    marginTop: '4px',
  },
};