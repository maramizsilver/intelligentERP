import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';

export default function ClientProduits() {
  const navigate = useNavigate();
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProduits();
  }, []);

  const loadProduits = async () => {
    try {
      const res = await API.get('/produits');
      setProduits(res.data.produits || []);
    } catch (err) {
      setError('Impossible de charger les produits');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Chargement des produits...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📦 Catalogue produits</h2>
        <button style={styles.backBtn} onClick={() => navigate('/client/dashboard')}>← Retour</button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {produits.length === 0 ? (
        <div style={styles.empty}>📭 Aucun produit disponible</div>
      ) : (
        <div style={styles.grid}>
          {produits.map((p) => (
            <div key={p.id} style={styles.card}>
              <h3 style={styles.produitNom}>{p.nom}</h3>
              <p style={styles.produitDesc}>{p.description || 'Aucune description'}</p>
              <div style={styles.produitFooter}>
                <span style={styles.produitPrix}>{p.prix} DT</span>
                <span style={styles.produitStock}>Stock: {p.quantite_stock || 0}</span>
              </div>
            </div>
          ))}
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
  empty: { textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '12px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' },
  card: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  produitNom: { margin: '0 0 8px', color: '#0f172a' },
  produitDesc: { color: '#64748b', fontSize: '14px', margin: '0 0 12px' },
  produitFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  produitPrix: { fontSize: '18px', fontWeight: 'bold', color: '#0ea5e9' },
  produitStock: { fontSize: '12px', color: '#64748b' }
};
