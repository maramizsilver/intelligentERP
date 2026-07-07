import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const [entreprises, setEntreprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await API.get('/entreprises');
      setEntreprises(res.data.entreprises || []);
    } catch (err) {
      setError('Impossible de charger les entreprises');
    } finally {
      setLoading(false);
    }
  };

  const valider = async (id) => {
    setBusyId(id);
    try {
      await API.put(`/entreprises/${id}/valider`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setBusyId(null);
    }
  };

  const suspendre = async (id) => {
    if (!window.confirm('Suspendre cette entreprise ? Ses utilisateurs ne pourront plus se connecter.')) return;
    setBusyId(id);
    try {
      await API.put(`/entreprises/${id}/suspendre`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setBusyId(null);
    }
  };

  const passerEnPayant = async (id) => {
    if (!window.confirm('Faire passer cette entreprise en abonnement payant ? Toute limite de connexions sera levée.')) return;
    setBusyId(id);
    try {
      await API.put(`/entreprises/${id}/passer-payant`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setBusyId(null);
    }
  };

  const statutInfo = {
    en_attente: { label: 'En attente', bg: '#fef3c7', color: '#92400e' },
    actif: { label: 'Actif', bg: '#d1fae5', color: '#065f46' },
    suspendu: { label: 'Suspendu', bg: '#fee2e2', color: '#991b1b' }
  };

  const compteurs = entreprises.reduce((acc, e) => {
    acc[e.statut] = (acc[e.statut] || 0) + 1;
    return acc;
  }, {});

  if (loading) return <div style={styles.loading}>Chargement...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🛡️ Plateforme — SuperAdmin</h1>
          <p style={styles.subtitle}>Bonjour {user?.prenom}, voici les entreprises inscrites sur la plateforme.</p>
        </div>
        <button style={styles.logoutBtn} onClick={logout}>Déconnexion</button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.statsRow}>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #f59e0b' }}>
          <span style={styles.statNumber}>{compteurs.en_attente || 0}</span>
          <span style={styles.statLabel}>En attente de validation</span>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #22c55e' }}>
          <span style={styles.statNumber}>{compteurs.actif || 0}</span>
          <span style={styles.statLabel}>Actives</span>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #ef4444' }}>
          <span style={styles.statNumber}>{compteurs.suspendu || 0}</span>
          <span style={styles.statLabel}>Suspendues</span>
        </div>
      </div>

      <div style={styles.card}>
        {entreprises.length === 0 ? (
          <p style={styles.empty}>Aucune entreprise inscrite pour le moment.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Entreprise</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Inscrite le</th>
                <th style={styles.th}>Plan</th>
                <th style={styles.th}>Statut</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entreprises.map((e) => {
                const info = statutInfo[e.statut] || { label: e.statut, bg: '#e2e8f0', color: '#334155' };
                return (
                  <tr key={e.id}>
                    <td style={styles.td}><strong>{e.nom}</strong></td>
                    <td style={styles.td}>{e.email || '—'}</td>
                    <td style={styles.td}>{new Date(e.date_inscription).toLocaleDateString('fr-FR')}</td>
                    <td style={styles.td}>
                      {e.plan_type === 'payant' ? (
                        <span style={{ ...styles.badge, backgroundColor: '#ede9fe', color: '#5b21b6' }}>💳 Payant</span>
                      ) : (
                        <span style={{ ...styles.badge, backgroundColor: '#e0f2fe', color: '#075985' }}>
                          🎁 Essai ({e.connexions_utilisees}/{e.limite_connexions_essai})
                        </span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, backgroundColor: info.bg, color: info.color }}>{info.label}</span>
                    </td>
                    <td style={styles.td}>
                      {e.statut !== 'actif' && (
                        <button style={styles.btnValider} disabled={busyId === e.id} onClick={() => valider(e.id)}>
                          Valider
                        </button>
                      )}
                      {e.statut !== 'suspendu' && (
                        <button style={styles.btnSuspendre} disabled={busyId === e.id} onClick={() => suspendre(e.id)}>
                          Suspendre
                        </button>
                      )}
                      {e.plan_type !== 'payant' && (
                        <button style={styles.btnPayant} disabled={busyId === e.id} onClick={() => passerEnPayant(e.id)}>
                          Passer payant
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' },
  loading: { textAlign: 'center', padding: '40px', fontSize: '18px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  title: { color: '#0f172a', margin: 0, fontSize: '22px' },
  subtitle: { color: '#64748b', marginTop: '4px', fontSize: '14px' },
  logoutBtn: { padding: '10px 20px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  error: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '16px' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' },
  statCard: { backgroundColor: 'white', padding: '18px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column' },
  statNumber: { fontSize: '26px', fontWeight: 'bold', color: '#0f172a' },
  statLabel: { color: '#64748b', fontSize: '13px', marginTop: '4px' },
  card: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'auto' },
  empty: { color: '#64748b', textAlign: 'center', padding: '24px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px', borderBottom: '2px solid #e2e8f0', color: '#334155', fontSize: '13px' },
  td: { padding: '10px', borderBottom: '1px solid #f1f5f9', fontSize: '14px' },
  badge: { padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
  btnValider: { padding: '6px 14px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginRight: '6px', fontSize: '13px' },
  btnSuspendre: { padding: '6px 14px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  btnPayant: { padding: '6px 14px', backgroundColor: '#7c3aed', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', marginLeft: '6px' }
};
