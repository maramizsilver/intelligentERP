import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';

export default function ClientFactures() {
  const navigate = useNavigate();
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFactures();
  }, []);

  const loadFactures = async () => {
    try {
      // Le backend renvoie déjà uniquement les commandes du client connecté
      const res = await API.get('/commandes');
      const mesCommandes = res.data.commandes || [];

      // Tant que la table "factures" n'est pas branchée à l'API, on affiche
      // une facture simulée pour chaque commande confirmée/livrée.
      const facturesData = mesCommandes
        .filter(c => c.statut === 'livree' || c.statut === 'confirmee')
        .map(c => ({
          id: `F-${c.id}`,
          commande_id: c.id,
          date: c.date_commande,
          total: c.total,
          statut: c.statut === 'livree' ? 'Payée' : 'En attente'
        }));

      setFactures(facturesData);
    } catch (err) {
      setError('Impossible de charger vos factures');
    } finally {
      setLoading(false);
    }
  };

  const getStatutStyle = (statut) => {
    const styles = {
      'Payée': { backgroundColor: '#d1fae5', color: '#065f46' },
      'En attente': { backgroundColor: '#fef3c7', color: '#92400e' }
    };
    return { padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', ...styles[statut] };
  };

  if (loading) {
    return <div style={styles.loading}>Chargement de vos factures...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🧾 Mes factures</h2>
        <button style={styles.backBtn} onClick={() => navigate('/client/dashboard')}>← Retour</button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {factures.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyIcon}>🧾</p>
          <h3>Vous n'avez pas encore de factures</h3>
          <p style={styles.emptyText}>Les factures apparaîtront après la livraison de vos commandes.</p>
        </div>
      ) : (
        <div style={styles.card}>
          <table style={styles.table}>
            <thead>
              <tr><th>Facture</th><th>Commande</th><th>Date</th><th>Total</th><th>Statut</th></tr>
            </thead>
            <tbody>
              {factures.map((f) => (
                <tr key={f.id}>
                  <td>{f.id}</td>
                  <td>#{f.commande_id}</td>
                  <td>{new Date(f.date).toLocaleDateString('fr-FR')}</td>
                  <td>{f.total} DT</td>
                  <td><span style={getStatutStyle(f.statut)}>{f.statut}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' },
  loading: { textAlign: 'center', padding: '40px', fontSize: '18px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  title: { color: '#0f172a', margin: 0, fontSize: '22px' },
  backBtn: { padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  error: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '16px' },
  empty: { textAlign: 'center', padding: '60px 24px', backgroundColor: 'white', borderRadius: '12px' },
  emptyIcon: { fontSize: '48px', marginBottom: '16px' },
  emptyText: { color: '#64748b' },
  card: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' }
};
