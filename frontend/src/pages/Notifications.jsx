import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import API from '../utils/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Notifications() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    phone: '',
    email_enabled: true,
    whatsapp_enabled: false,
  });
  const [testEmail, setTestEmail] = useState(user?.email || '');
  const [testPhone, setTestPhone] = useState('+216');
  const [testMessage, setTestMessage] = useState('Test depuis ERP');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [whatsappResult, setWhatsappResult] = useState(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const res = await API.get('/notifications/preferences');
      setPreferences(res.data.preferences);
      if (res.data.preferences?.phone) {
        setTestPhone(res.data.preferences.phone);
      }
    } catch (err) {
      console.error('Erreur chargement preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPreferences({
      ...preferences,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const savePreferences = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await API.put('/notifications/preferences', preferences);
      setMessage(t('preferences_enregistrees') || 'Préférences mises à jour avec succès');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      setError(t('email_destination_requis') || 'Veuillez entrer un email de test');
      return;
    }
    setSending(true);
    setError('');
    setMessage('');
    setResult(null);
    try {
      const res = await API.post('/notifications/test', {
        email: testEmail,
        phone: preferences.phone || '+216XXXXXXXXX'
      });
      setResult(res.data);
      setMessage(t('email_test_envoye') || 'Email de test envoyé avec succès');
    } catch (err) {
      setError(err.response?.data?.message || t('erreur_envoi_email') || 'Erreur envoi email');
    } finally {
      setSending(false);
    }
  };

  const sendTestWhatsApp = async () => {
    if (!testPhone || testPhone === '+216') {
      setError(t('numero_whatsapp_requis') || 'Veuillez entrer un numéro de téléphone valide pour WhatsApp');
      return;
    }
    if (!testMessage) {
      setError(t('message_requis') || 'Veuillez entrer un message');
      return;
    }
    
    setWhatsappLoading(true);
    setError('');
    setMessage('');
    setWhatsappResult(null);
    
    try {
      const res = await API.post('/notifications/test-canal', {
        canal: 'whatsapp',
        to: testPhone,
        message: testMessage
      });
      
      setWhatsappResult(res.data);
      if (res.data.success) {
        setMessage(t('whatsapp_envoye') || 'WhatsApp envoyé avec succès');
      } else {
        setError(t('erreur_whatsapp') || 'Erreur: ' + (res.data.result?.error || 'Échec de l\'envoi'));
      }
    } catch (err) {
      console.error('Erreur WhatsApp:', err);
      setError(err.response?.data?.error || err.response?.data?.message || t('erreur_whatsapp') || 'Erreur envoi WhatsApp');
    } finally {
      setWhatsappLoading(false);
    }
  };

  const sendLoginAlert = async () => {
    if (!user) {
      setError(t('connexion_requise') || 'Vous devez être connecté');
      return;
    }
    
    setSending(true);
    setError('');
    setMessage('');
    setResult(null);
    try {
      const res = await API.post('/notifications/login-alert', {
        userId: user.id,
        device_type: 'Ordinateur',
        os: 'Windows 11',
        browser: 'Chrome',
        country: 'Tunisie',
        city: 'Tunis',
        ip: '192.168.1.1'
      });
      setResult(res.data);
      setMessage(t('alerte_connexion_envoyee') || 'Alerte de connexion envoyée avec succès');
    } catch (err) {
      setError(err.response?.data?.message || t('erreur_envoi_alerte') || 'Erreur envoi alerte');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text={t('chargement_preferences') || 'Chargement des préférences...'} />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{t('notifications_titre') || 'Notifications'}</h1>
          <p style={styles.subtitle}>{t('gerer_preferences_notifications') || 'Gérez vos préférences de notification'}</p>
        </div>
      </div>

      {message && (
        <div style={styles.successContainer}>
          <span style={styles.successText}>{message}</span>
        </div>
      )}
      {error && (
        <div style={styles.errorContainer}>
          <span style={styles.errorText}>{error}</span>
        </div>
      )}

      <div style={styles.grid}>
        <Card title={t('preferences_notification') || 'Préférences de notification'} variant="primary">
          <div style={styles.formGroup}>
            <Input
              label={t('numero_telephone_whatsapp') || 'Numéro de téléphone (WhatsApp)'}
              name="phone"
              value={preferences.phone || ''}
              onChange={handleChange}
              placeholder="+216 00 000 000"
            />
          </div>

          <div style={styles.checkboxGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="email_enabled"
                checked={preferences.email_enabled}
                onChange={handleChange}
              />
              {t('preferences_email') || 'Email'}
            </label>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="whatsapp_enabled"
                checked={preferences.whatsapp_enabled}
                onChange={handleChange}
              />
              {t('preferences_whatsapp') || 'WhatsApp'}
            </label>
          </div>

          <Button variant="primary" onClick={savePreferences} loading={loading}>
            {t('enregistrer_preferences') || 'Enregistrer les préférences'}
          </Button>
        </Card>

        <Card title={t('tester_notifications') || 'Tester les notifications'} variant="success">
          <div style={styles.formGroup}>
            <Input
              label={t('email_destination') || 'Email de destination'}
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="exemple@email.com"
            />
            <Button
              variant="primary"
              onClick={sendTestEmail}
              loading={sending}
              fullWidth
            >
              {t('envoyer_email_test') || 'Envoyer un email de test'}
            </Button>
          </div>

          <div style={styles.divider} />

          <div style={styles.formGroup}>
            <Input
              label={t('numero_whatsapp') || 'Numéro WhatsApp'}
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="+216XXXXXXXXX"
            />
            <Input
              label={t('message_test') || 'Message'}
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder={t('message_whatsapp') || 'Votre message...'}
            />
            <Button
              variant="success"
              onClick={sendTestWhatsApp}
              loading={whatsappLoading}
              fullWidth
            >
              {whatsappLoading ? (t('envoi_whatsapp') || 'Envoi WhatsApp...') : (t('tester_whatsapp') || 'Tester WhatsApp')}
            </Button>
          </div>

          <div style={styles.divider} />

          <Button
            variant="warning"
            onClick={sendLoginAlert}
            loading={sending}
            fullWidth
          >
            {t('envoyer_alerte_connexion') || 'Envoyer une alerte de connexion'}
          </Button>
        </Card>
      </div>

      {result && (
        <Card title={t('resultat_email') || 'Résultat Email'} variant="info">
          <pre style={styles.jsonResult}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </Card>
      )}

      {whatsappResult && (
        <Card title={t('resultat_whatsapp') || 'Résultat WhatsApp'} variant="info">
          <pre style={styles.jsonResult}>
            {JSON.stringify(whatsappResult, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '16px',
  },
  checkboxGroup: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    marginBottom: '16px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    color: '#334155',
    cursor: 'pointer',
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #E2E8F0',
    margin: '16px 0',
  },
  jsonResult: {
    backgroundColor: '#F8FAFC',
    padding: '16px',
    borderRadius: '8px',
    fontSize: '12px',
    overflow: 'auto',
    maxHeight: '200px',
    border: '1px solid #E2E8F0',
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
};