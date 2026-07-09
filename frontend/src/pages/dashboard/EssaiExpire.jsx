// src/pages/dashboard/EssaiExpire.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

export default function EssaiExpire() {
  const { user, logout } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const exporterDonnees = async () => {
    setError('');
    setExporting(true);
    try {
      const res = await API.get('/export/mes-donnees', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `export-donnees-erp-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Impossible d'exporter vos données pour le moment.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={styles.container}>
      <Card variant="danger" style={styles.card}>
        
        <h1 style={styles.title}>Votre période d'essai gratuite est terminée</h1>
        <p style={styles.text}>
          Vous avez utilisé vos 30 connexions gratuites{user?.entreprise ? ` pour ${user.entreprise}` : ''}.
          <br />
          <strong>Aucune donnée n'a été perdue</strong> — tout ce que vous avez ajouté reste enregistré.
        </p>

        {error && (
          <div style={styles.errorContainer}>
            <span style={styles.errorText}>{error}</span>
          </div>
        )}

        <div style={styles.actions}>
          <Button
            variant="primary"
            onClick={exporterDonnees}
            loading={exporting}
            icon="⬇️"
            fullWidth
          >
            Exporter mes données
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = 'mailto:contact@erp.com?subject=Souscription abonnement'}
            icon="💳"
            fullWidth
          >
            Souscrire à un abonnement
          </Button>
        </div>

        <p style={styles.link} onClick={logout}>Se déconnecter</p>
      </Card>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#F8FAFC',
    padding: '24px',
  },
  card: {
    maxWidth: '480px',
    textAlign: 'center',
    padding: '40px',
  },
  icon: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '12px',
  },
  title: {
    color: '#0F172A',
    fontSize: '20px',
    margin: '0 0 12px',
  },
  text: {
    color: '#475569',
    fontSize: '14px',
    lineHeight: '1.6',
    marginBottom: '24px',
  },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '8px',
    padding: '10px 14px',
    marginBottom: '16px',
  },
  errorText: {
    color: '#991B1B',
    fontSize: '13px',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  link: {
    marginTop: '20px',
    color: '#94A3B8',
    fontSize: '13px',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
};