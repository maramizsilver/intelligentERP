import React, { useState, useEffect } from 'react';
import API from '../../utils/api';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function ClientProduits() {
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadProduits();
  }, []);

  const loadProduits = async () => {
    try {
      const res = await API.get('/client/produits');
      setProduits(res.data.produits || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = produits.filter(p =>
    p.nom?.toLowerCase().includes(search.toLowerCase()) ||
    p.reference?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner size="lg" text="Chargement du catalogue..." />;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Catalogue produits</h1>
        <input
          type="text"
          placeholder=" Rechercher un produit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      <div style={styles.grid}>
        {filtered.length === 0 ? (
          <p style={{ color: '#94A3B8', textAlign: 'center', gridColumn: '1 / -1' }}>
            Aucun produit trouvé
          </p>
        ) : (
          filtered.map(produit => (
            <div key={produit.id} style={styles.productCard}>
              <div style={styles.productIcon}>📦</div>
              <h3 style={styles.productName}>{produit.nom}</h3>
              <p style={styles.productRef}>Réf: {produit.reference || '-'}</p>
              <p style={styles.productPrice}>{produit.prix_vente || produit.prix} €</p>
              <p style={styles.productCategory}>{produit.categorie || '-'}</p>
              <p style={{
                ...styles.productStock,
                color: (produit.quantite_stock || 0) > 0 ? '#22C55E' : '#EF4444'
              }}>
                {produit.quantite_stock > 0 ? `✅ ${produit.quantite_stock} en stock` : ' Rupture de stock'}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  searchInput: {
    padding: '10px 16px',
    borderRadius: '10px',
    border: '2px solid #E2E8F0',
    fontSize: '14px',
    minWidth: '250px',
    outline: 'none',
    transition: 'all 0.3s ease',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '16px',
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #E8EDF2',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    transition: 'all 0.2s ease',
    textAlign: 'center',
  },
  productIcon: {
    fontSize: '36px',
    marginBottom: '8px',
  },
  productName: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#0F172A',
    margin: '0 0 4px 0',
  },
  productRef: {
    fontSize: '12px',
    color: '#94A3B8',
    marginBottom: '8px',
  },
  productPrice: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#0EA5E9',
    marginBottom: '4px',
  },
  productCategory: {
    fontSize: '12px',
    color: '#64748B',
    marginBottom: '8px',
  },
  productStock: {
    fontSize: '13px',
    fontWeight: 500,
  },
};