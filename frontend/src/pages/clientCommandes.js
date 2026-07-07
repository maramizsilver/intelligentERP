import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';

export default function ClientCommandes() {
  const navigate = useNavigate();
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCommandes();
  }, []);

  // Le backend renvoie déjà uniquement les commandes du client connecté
  // (filtrage automatique via is_external + client_id du token, voir commandeController).
  const loadCommandes = async () => {
    try {
      const res = await API.get('/commandes');
      setCommandes(res.data.commandes || []);
    } catch (err) {
      setError('Impossible de charger vos commandes');
    } finally {
      setLoading(false);
    }
  };

  const annulerCommande = async (id) => {
    if (!window.confirm('Annuler cette commande ?')) return;
    try {
      await API.delete(`/commandes/${id}`);
      loadCommandes();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const getStatutStyle = (statut) => {
    const styles = {
      en_attente: { backgroundColor: '#fef3c7', color: '#92400e' },
      confirmee: { backgroundColor: '#dbeafe', color: '#1e40af' },
      livree: { backgroundColor: '#d1fae5', color: '#065f46' },
      annulee: { backgroundColor: '#fee2e2', color: '#991b1b' }
    };
    return { padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', ...styles[statut] };
  };

  const getStatutLabel = (statut) => {
    const labels = { en_attente: 'En attente', confirmee: 'Confirmée', livree: 'Livrée', annulee: 'Annulée' };
    return labels[statut] || statut;
  };

  if (loading) {
    return <div style={styles.loading}>Chargement de vos commandes...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🛒 Mes commandes</h2>
        <button style={styles.backBtn} onClick={() => navigate('/client/dashboard')}>← Retour</button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {commandes.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyIcon}>📭</p>
          <h3>Vous n'avez pas encore de commandes</h3>
          <button style={styles.btnPrimary} onClick={() => navigate('/client/produits')}>
            Découvrir les produits
          </button>
        </div>
      ) : (
        <div style={styles.card}>
          <table style={styles.table}>
            <thead>
              <tr><th>#</th><th>Date</th><th>Total</th><th>Statut</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {commandes.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{new Date(c.date_commande).toLocaleDateString('fr-FR')}</td>
                  <td>{c.total} DT</td>
                  <td><span style={getStatutStyle(c.statut)}>{getStatutLabel(c.statut)}</span></td>
                  <td>
                    <button style={styles.btnView} onClick={() => navigate(`/client/commande/${c.id}`)}>Voir</button>
                    {c.statut === 'en_attente' && (
                      <button style={styles.btnCancel} onClick={() => annulerCommande(c.id)}>Annuler</button>
                    )}
                  </td>
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
  btnPrimary: { padding: '12px 24px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  card: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  btnView: { padding: '4px 12px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginRight: '4px' },
  btnCancel: { padding: '4px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }
};
