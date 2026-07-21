import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export default function TestNotifications() {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleTestEmail = async () => {
    if (!email) {
      setError('Veuillez entrer un email');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setResult(null);

    try {
      const response = await API.post('/notifications/test', {
        email: email
      });
      setResult(response.data);
      setSuccess('Email de test envoye avec succes !');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  const handleTestLoginAlert = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    setResult(null);

    try {
      const response = await API.post('/notifications/login-alert', {
        userId: user.id,
        device_type: 'Ordinateur',
        os: 'Windows 11',
        browser: 'Chrome 120',
        country: 'Tunisie',
        city: 'Tunis',
        ip: '192.168.1.1'
      });
      setResult(response.data);
      setSuccess('Alerte de connexion envoyee avec succes !');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Test des Notifications</h1>
          <p style={styles.subtitle}>Envoyez des notifications de test par email</p>
        </div>
      </div>

      {error && (
        <div style={styles.errorContainer}>
          <span style={styles.errorIcon}>X</span>
          <span style={styles.errorText}>{error}</span>
        </div>
      )}

      {success && (
        <div style={styles.successContainer}>
          <span style={styles.successIcon}>V</span>
          <span style={styles.successText}>{success}</span>
        </div>
      )}

      <div style={styles.grid}>
        <Card title="Test Email" variant="primary">
          <div style={styles.formGroup}>
            <Input
              label="Email de destination"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemple@email.com"
            />
            <p style={styles.hintText}>
              L'email sera envoye a l'adresse que vous saisissez ci-dessus.
            </p>
            <Button
              variant="primary"
              onClick={handleTestEmail}
              loading={loading}
              fullWidth
            >
              Envoyer un email de test
            </Button>
          </div>
        </Card>

        <Card title="Test Alerte de Connexion" variant="warning">
          <div style={styles.formGroup}>
            <p style={styles.infoText}>
              Envoie une alerte de connexion simulee pour tester les notifications.
              <br />
              <strong>Email du destinataire :</strong> {user?.email || 'Non defini'}
            </p>
            <Button
              variant="warning"
              onClick={handleTestLoginAlert}
              loading={loading}
              fullWidth
            >
              Envoyer une alerte de connexion
            </Button>
          </div>
        </Card>

        {result && (
          <Card title="Resultat" variant="success">
            <pre style={styles.jsonResult}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </Card>
        )}
      </div>
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '20px',
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
  errorIcon: {
    color: '#991B1B',
    fontSize: '16px',
    fontWeight: 'bold',
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
  successIcon: {
    color: '#065F46',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  successText: {
    color: '#065F46',
    fontSize: '13px',
    fontWeight: 500,
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  hintText: {
    fontSize: '12px',
    color: '#94A3B8',
    marginTop: '4px',
    marginBottom: '12px',
  },
  infoText: {
    fontSize: '14px',
    color: '#64748B',
    marginBottom: '16px',
    lineHeight: '1.6',
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
};