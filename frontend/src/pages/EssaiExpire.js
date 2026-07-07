import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

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
      <div style={styles.card}>
        
        <h1 style={styles.title}>Votre période d'essai gratuite est terminée</h1>
        <p style={styles.text}>
          Vous avez utilisé vos 30 connexions gratuites{user?.entreprise ? ` pour ${user.entreprise}` : ''}.
          <br />
          <strong>Aucune donnée n'a été perdue</strong> — tout ce que vous avez ajouté reste enregistré et accessible dès la souscription d'un abonnement.
        </p>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.actions}>
          <button style={styles.btnPrimary} onClick={exporterDonnees} disabled={exporting}>
            {exporting ? 'Export en cours...' : '⬇Exporter mes données'}
          </button>
          <button
            style={styles.btnSecondary}
            onClick={() => window.location.href = 'mailto:contact@benjeddou-erp.com?subject=Souscription abonnement ERP'}
          >
            💳 Souscrire à un abonnement
          </button>
        </div>

        <p style={styles.link} onClick={logout}>Se déconnecter</p>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f8fafc', padding: '24px' },
  card: { backgroundColor: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 30px rgba(0,0,0,0.08)', maxWidth: '480px', textAlign: 'center' },
  icon: { fontSize: '48px', display: 'block', marginBottom: '12px' },
  title: { color: '#0f172a', fontSize: '20px', margin: '0 0 12px' },
  text: { color: '#475569', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' },
  error: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' },
  actions: { display: 'flex', flexDirection: 'column', gap: '10px' },
  btnPrimary: { padding: '12px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  btnSecondary: { padding: '12px', backgroundColor: '#f1f5f9', color: '#334155', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  link: { marginTop: '20px', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }
};
