import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Notifications() {
  const { user } = useAuth();
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
      setMessage('Preferences mises a jour avec succes');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      setError('Veuillez entrer un email de test');
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
      setMessage('Email de test envoye avec succes');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur envoi email');
    } finally {
      setSending(false);
    }
  };

  const sendTestWhatsApp = async () => {
    if (!testPhone || testPhone === '+216') {
      setError('Veuillez entrer un numero de telephone valide pour WhatsApp');
      return;
    }
    if (!testMessage) {
      setError('Veuillez entrer un message');
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
        setMessage('WhatsApp envoye avec succes');
      } else {
        setError('Erreur: ' + (res.data.result?.error || 'Echec de l\'envoi'));
      }
    } catch (err) {
      console.error('Erreur WhatsApp:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Erreur envoi WhatsApp');
    } finally {
      setWhatsappLoading(false);
    }
  };

  const sendLoginAlert = async () => {
    if (!user) {
      setError('Vous devez etre connecte');
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
      setMessage('Alerte de connexion envoyee avec succes');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur envoi alerte');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Chargement des preferences..." />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Notifications</h1>
          <p style={styles.subtitle}>Gerez vos preferences de notification</p>
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
        <Card title="Preferences de notification" variant="primary">
          <div style={styles.formGroup}>
            <Input
              label="Numero de telephone (WhatsApp)"
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
              Email
            </label>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="whatsapp_enabled"
                checked={preferences.whatsapp_enabled}
                onChange={handleChange}
              />
              WhatsApp
            </label>
          </div>

          <Button variant="primary" onClick={savePreferences} loading={loading}>
            Enregistrer les preferences
          </Button>
        </Card>

        <Card title="Tester les notifications" variant="success">
          <div style={styles.formGroup}>
            <Input
              label="Email de destination"
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
              Envoyer un email de test
            </Button>
          </div>

          <div style={styles.divider} />

          <div style={styles.formGroup}>
            <Input
              label="Numero WhatsApp"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="+216XXXXXXXXX"
            />
            <Input
              label="Message"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Votre message..."
            />
            <Button
              variant="success"
              onClick={sendTestWhatsApp}
              loading={whatsappLoading}
              fullWidth
            >
              {whatsappLoading ? 'Envoi WhatsApp...' : 'Tester WhatsApp'}
            </Button>
          </div>

          <div style={styles.divider} />

          <Button
            variant="warning"
            onClick={sendLoginAlert}
            loading={sending}
            fullWidth
          >
            Envoyer une alerte de connexion
          </Button>
        </Card>
      </div>

      {result && (
        <Card title="Resultat Email" variant="info">
          <pre style={styles.jsonResult}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </Card>
      )}

      {whatsappResult && (
        <Card title="Resultat WhatsApp" variant="info">
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