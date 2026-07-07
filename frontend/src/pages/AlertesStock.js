import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

export default function AlertesStock() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAlertes();
  }, []);

  const loadAlertes = async () => {
    try {
      setLoading(true);
      const res = await API.get('/mouvements-stock/alertes/rupture');
      setAlertes(res.data.alertes || []);
    } catch (err) {
      setError('Impossible de charger les alertes');
    } finally {
      setLoading(false);
    }
  };

  const getLevel = (stock) => {
    if (stock === 0) return { label: 'Rupture', color: '#ef4444', bg: '#fee2e2' };
    if (stock <= 2) return { label: 'Très critique', color: '#dc2626', bg: '#fef2f2' };
    if (stock <= 5) return { label: 'Critique', color: '#f59e0b', bg: '#fef3c7' };
    return { label: 'Bas', color: '#3b82f6', bg: '#dbeafe' };
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>⚠️ Alertes de rupture de stock</h2>
        <div>
          <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>← Retour</button>
          <button style={styles.refreshBtn} onClick={loadAlertes} disabled={loading}>
            🔄 {loading ? '...' : 'Rafraîchir'}
          </button>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.statsCard}>
        <div style={styles.stat}>
          <span style={styles.statNumber}>{alertes.length}</span>
          <span style={styles.statLabel}>Produits en alerte</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statNumber}>
            {alertes.filter(a => a.quantite_stock === 0).length}
          </span>
          <span style={styles.statLabel}>En rupture totale</span>
        </div>
      </div>

      <div style={styles.tableCard}>
        {loading ? (
          <p style={styles.loading}>Chargement des alertes...</p>
        ) : alertes.length === 0 ? (
          <div style={styles.empty}>
            <span style={styles.emptyIcon}>✅</span>
            <h3>Pas d'alerte de rupture</h3>
            <p style={styles.emptyText}>Tous vos produits ont un stock suffisant.</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Stock actuel</th>
                <th>Niveau</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {alertes.map((a) => {
                const level = getLevel(a.quantite_stock);
                return (
                  <tr key={a.id}>
                    <td style={styles.produitNom}>{a.nom}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        ...styles.stockBadge,
                        backgroundColor: level.bg,
                        color: level.color
                      }}>
                        {a.quantite_stock}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        ...styles.levelBadge,
                        backgroundColor: level.bg,
                        color: level.color
                      }}>
                        {level.label}
                      </span>
                    </td>
                    <td>
                      <button
                        style={styles.actionBtn}
                        onClick={() => navigate(`/achats`)}
                      >
                        📦 Commander
                      </button>
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
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  title: { color: '#0f172a', margin: 0, fontSize: '22px' },
  backBtn: { padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginRight: '8px' },
  refreshBtn: { padding: '8px 16px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  error: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '16px' },
  statsCard: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '20px' },
  stat: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  statNumber: { display: 'block', fontSize: '32px', fontWeight: 'bold', color: '#0f172a' },
  statLabel: { color: '#64748b', fontSize: '13px', marginTop: '4px' },
  tableCard: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  produitNom: { fontWeight: '500', color: '#0f172a' },
  stockBadge: { padding: '4px 12px', borderRadius: '12px', fontSize: '14px', fontWeight: '600' },
  levelBadge: { padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
  actionBtn: { padding: '6px 14px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  loading: { textAlign: 'center', color: '#64748b', padding: '40px' },
  empty: { textAlign: 'center', padding: '60px 20px' },
  emptyIcon: { fontSize: '48px', display: 'block', marginBottom: '12px' },
  emptyText: { color: '#94a3b8' }
};