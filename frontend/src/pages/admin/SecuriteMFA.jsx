import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function SecuriteMFA() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ enabled: false });
  const [step, setStep] = useState('status');
  const [mfaData, setMfaData] = useState(null);
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const res = await API.get('/auth/mfa/status');
      setStatus(res.data.data);
      if (res.data.data.enabled) setStep('complete');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInitiate = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await API.post('/auth/mfa/initiate');
      setMfaData(res.data.data);
      setBackupCodes(res.data.data.backupCodes);
      setStep('activate');
      setMessage('Scannez le QR Code avec Google Authenticator');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!code || code.length !== 6) {
      setError('Veuillez saisir un code à 6 chiffres');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await API.post('/auth/mfa/activate', { token: code });
      setStep('complete');
      setMessage('MFA activée avec succès !');
      loadStatus();
    } catch (err) {
      setError(err.response?.data?.message || 'Code invalide');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!code || code.length !== 6) {
      setError('Veuillez saisir un code à 6 chiffres');
      return;
    }
    if (!window.confirm('Désactiver la MFA ?')) return;

    try {
      setLoading(true);
      setError('');
      await API.post('/auth/mfa/deactivate', { token: code });
      setStep('status');
      setMessage('MFA désactivée');
      setCode('');
      loadStatus();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" text="Chargement..." />;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Sécurité du compte</h1>
      <p style={styles.subtitle}>Authentification à deux facteurs (2FA)</p>

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

      <Card variant="primary" style={styles.card}>
        {step === 'status' && (
          <div>
            <div style={styles.statusRow}>
              <span style={styles.statusLabel}>Statut :</span>
              <span style={status.enabled ? styles.statusActive : styles.statusInactive}>
                {status.enabled ? 'Activée' : 'Désactivée'}
              </span>
            </div>
            {!status.enabled && (
              <>
                <p style={styles.infoText}>
                  L'authentification à deux facteurs ajoute une couche de sécurité supplémentaire.
                </p>
                <Button variant="primary" onClick={handleInitiate} fullWidth>
                  Activer la MFA
                </Button>
              </>
            )}
          </div>
        )}

        {step === 'activate' && mfaData && (
          <div>
            <h3 style={styles.stepTitle}>Étape 1 : Scannez le QR Code</h3>
            <div style={styles.qrContainer}>
              <img src={mfaData.qrCode} alt="QR Code" style={styles.qrImage} />
            </div>
            <code style={styles.secretCode}>{mfaData.secret}</code>

            <h3 style={styles.stepTitle}>Étape 2 : Saisissez le code</h3>
            <div style={styles.codeRow}>
              <Input
                label="Code à 6 chiffres"
                type="text"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                disabled={loading}
              />
              <Button variant="primary" onClick={handleActivate} loading={loading}>
                Activer
              </Button>
            </div>

            <h3 style={styles.stepTitle}>Codes de sauvegarde</h3>
            <div style={styles.backupCodesContainer}>
              {backupCodes.map((c, i) => (
                <div key={i} style={styles.backupCodeItem}>{c}</div>
              ))}
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div>
            <div style={styles.statusRow}>
              <span style={styles.statusLabel}>Statut :</span>
              <span style={styles.statusActive}>Activée</span>
            </div>
            <p style={styles.successText}> Votre compte est protégé par MFA</p>
            <div style={styles.codeRow}>
              <Input
                label="Code MFA pour désactiver"
                type="text"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                disabled={loading}
              />
              <Button variant="danger" onClick={handleDeactivate} loading={loading}>
                Désactiver
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

const styles = {
  container: { maxWidth: '600px', margin: '0 auto' },
  title: { fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' },
  subtitle: { fontSize: '14px', color: '#64748B', marginBottom: '24px' },
  card: { padding: '24px' },
  statusRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
  statusLabel: { fontSize: '14px', fontWeight: 500, color: '#334155' },
  statusActive: { fontSize: '14px', fontWeight: 600, color: '#065F46' },
  statusInactive: { fontSize: '14px', fontWeight: 600, color: '#991B1B' },
  infoText: { fontSize: '14px', color: '#475569', lineHeight: '1.6', marginBottom: '16px' },
  stepTitle: { fontSize: '16px', fontWeight: 600, color: '#0F172A', marginTop: '20px', marginBottom: '12px' },
  qrContainer: { textAlign: 'center', margin: '16px 0' },
  qrImage: { width: '200px', height: '200px', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px' },
  secretCode: { display: 'block', backgroundColor: '#F1F5F9', padding: '12px 16px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '16px', letterSpacing: '2px', marginBottom: '16px', wordBreak: 'break-all' },
  codeRow: { display: 'flex', gap: '12px', alignItems: 'end', marginBottom: '16px' },
  backupCodesContainer: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', margin: '12px 0' },
  backupCodeItem: { backgroundColor: '#F1F5F9', padding: '8px 12px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '14px', textAlign: 'center', letterSpacing: '1px' },
  errorContainer: { backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' },
  errorText: { color: '#991B1B', fontSize: '13px', fontWeight: 500 },
  successContainer: { backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' },
  successText: { color: '#065F46', fontSize: '13px', fontWeight: 500 },
};