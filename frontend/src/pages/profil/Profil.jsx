// frontend/src/pages/profil/Profil.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import API from '../../utils/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function Profil() {
  const { user, updateUser } = useAuth();
  const { t, dir } = useLanguage();
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
      setMessage({ type: 'success', text: t('profil_mis_a_jour') });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || t('erreur_chargement_profil') });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (passwordForm.new.length < 8) {
      setMessage({ type: 'error', text: t('mot_de_passe_min_8') });
      return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      setMessage({ type: 'error', text: t('mots_de_passe_correspondent_pas') });
      return;
    }

    setLoading(true);
    try {
      await API.put('/users/profil/password', {
        currentPassword: passwordForm.current,
        newPassword: passwordForm.new
      });
      setMessage({ type: 'success', text: t('mot_de_passe_change') });
      setPasswordForm({ current: '', new: '', confirm: '' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || t('erreur_changement_mot_de_passe') });
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    padding: '24px',
    maxWidth: '800px',
    margin: '0 auto',
    textAlign: dir === 'rtl' ? 'right' : 'left',
  };

  const inputStyle = {
    ...styles.input,
    textAlign: dir === 'rtl' ? 'right' : 'left',
  };

  return (
    <div style={containerStyle}>
      <h1 style={styles.title}>{t('mon_profil')}</h1>
      <p style={styles.subtitle}>
        {user?.entreprise_nom} · {user?.role_nom || t('utilisateur')}
        {user?.is_super_admin && ` (${t('superadmin')})`}
      </p>

      {message.text && (
        <div style={{
          ...styles.message,
          backgroundColor: message.type === 'success' ? '#D1FAE5' : '#FEE2E2',
          color: message.type === 'success' ? '#065F46' : '#991B1B'
        }}>
          {message.text}
        </div>
      )}

      <Card title={t('informations_personnelles')} variant="primary">
        <form onSubmit={handleSubmit}>
          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>{t('nom')} *</label>
              <input
                style={inputStyle}
                value={form.nom}
                onChange={(e) => setForm({...form, nom: e.target.value})}
                required
                disabled={loading}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>{t('prenom')} *</label>
              <input
                style={inputStyle}
                value={form.prenom}
                onChange={(e) => setForm({...form, prenom: e.target.value})}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>{t('email')}</label>
            <input
              style={{...inputStyle, backgroundColor: '#F1F5F9'}}
              value={form.email}
              disabled
            />
            <span style={styles.helpText}>{t('email_non_modifiable')}</span>
          </div>

          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>{t('telephone')}</label>
              <input
                style={inputStyle}
                value={form.telephone}
                onChange={(e) => setForm({...form, telephone: e.target.value})}
                placeholder={t('telephone')}
                disabled={loading}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>{t('matricule')}</label>
              <input
                style={inputStyle}
                value={form.matricule}
                onChange={(e) => setForm({...form, matricule: e.target.value})}
                placeholder={t('matricule')}
                disabled={loading}
              />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>{t('fonction')}</label>
              <input
                style={inputStyle}
                value={form.fonction}
                onChange={(e) => setForm({...form, fonction: e.target.value})}
                placeholder={t('fonction')}
                disabled={loading}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>{t('service')}</label>
              <input
                style={inputStyle}
                value={form.service}
                onChange={(e) => setForm({...form, service: e.target.value})}
                placeholder={t('service')}
                disabled={loading}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>{t('departement')}</label>
            <input
              style={inputStyle}
              value={form.departement}
              onChange={(e) => setForm({...form, departement: e.target.value})}
              placeholder={t('departement')}
              disabled={loading}
            />
          </div>

          <Button type="submit" variant="primary" loading={loading}>
            {t('enregistrer')}
          </Button>
        </form>
      </Card>

      <Card title={t('changer_mot_de_passe')} variant="primary" style={{ marginTop: '24px' }}>
        <form onSubmit={handlePasswordSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>{t('mot_de_passe_actuel')}</label>
            <input
              style={inputStyle}
              type="password"
              value={passwordForm.current}
              onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})}
              required
              disabled={loading}
              placeholder="••••••••"
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>{t('nouveau_mot_de_passe')}</label>
            <input
              style={inputStyle}
              type="password"
              value={passwordForm.new}
              onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})}
              required
              disabled={loading}
              placeholder={t('mot_de_passe_min_8')}
              minLength={8}
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>{t('confirmer_mot_de_passe')}</label>
            <input
              style={inputStyle}
              type="password"
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})}
              required
              disabled={loading}
              placeholder={t('confirmer_mot_de_passe')}
            />
          </div>
          <Button type="submit" variant="danger" loading={loading}>
            {t('changer_mot_de_passe')}
          </Button>
        </form>
      </Card>

      {user?.is_super_admin && (
        <Card title={t('acces_superadmin') || 'Accès SuperAdmin'} variant="secondary" style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Badge variant="primary">{t('superadmin')}</Badge>
            <Badge variant="secondary">{t('acces_total') || 'Accès total à toutes les données'}</Badge>
          </div>
          <p style={{ marginTop: '12px', fontSize: '14px', color: '#64748B' }}>
            {t('superadmin_acces_description') || 'Vous avez un accès complet à toutes les fonctionnalités de la plateforme.'}
          </p>
        </Card>
      )}
    </div>
  );
}

const styles = {
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