import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../utils/api';

export default function ClientCommandeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [commande, setCommande] = useState(null);
  const [lignes, setLignes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCommande();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadCommande = async () => {
    try {
      const res = await API.get(`/commandes/${id}`);
      setCommande(res.data.commande);
      setLignes(res.data.commande.lignes || []);
    } catch (err) {
      setError('Impossible de charger la commande');
    } finally {
      setLoading(false);
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
    return <div style={styles.loading}>Chargement de la commande...</div>;
  }

  if (error || !commande) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error || 'Commande introuvable'}</div>
        <button style={styles.backBtn} onClick={() => navigate('/client/commandes')}>← Retour</button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📦 Commande #{commande.id}</h2>
        <button style={styles.backBtn} onClick={() => navigate('/client/commandes')}>← Retour</button>
      </div>

      <div style={styles.card}>
        <div style={styles.infoGrid}>
          <div><strong>Date :</strong> {new Date(commande.date_commande).toLocaleDateString('fr-FR')}</div>
          <div><strong>Total :</strong> {commande.total} DT</div>
          <div><strong>Statut :</strong> <span style={getStatutStyle(commande.statut)}>{getStatutLabel(commande.statut)}</span></div>
        </div>

        <h3 style={styles.subtitle}>🛍️ Produits commandés</h3>
        <table style={styles.table}>
          <thead>
            <tr><th>Produit</th><th>Quantité</th><th>Prix unitaire</th><th>Total</th></tr>
          </thead>
          <tbody>
            {lignes.map((l, i) => (
              <tr key={i}>
                <td>{l.produit_nom || `Produit #${l.produit_id}`}</td>
                <td>{l.quantite}</td>
                <td>{l.prix_unitaire} DT</td>
                <td>{(l.quantite * l.prix_unitaire).toFixed(2)} DT</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold' }}>Total :</td>
              <td style={{ fontWeight: 'bold' }}>{commande.total} DT</td>
            </tr>
          </tfoot>
        </table>
      </div>
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
  card: { backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' },
  subtitle: { margin: '24px 0 12px', color: '#0f172a' },
  table: { width: '100%', borderCollapse: 'collapse' }
};
