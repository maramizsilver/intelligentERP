import React, { useState, useEffect, useMemo } from 'react';
import API from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export default function ClientProduits() {
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categorie, setCategorie] = useState('toutes');
  const [triPrix, setTriPrix] = useState('defaut');

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

  const categories = useMemo(() => {
    const set = new Set(produits.map((p) => p.categorie).filter(Boolean));
    return ['toutes', ...Array.from(set)];
  }, [produits]);

  const filtered = useMemo(() => {
    let list = produits.filter((p) => {
      const terme = search.trim().toLowerCase();
      const matchSearch = !terme || p.nom?.toLowerCase().includes(terme) || p.reference?.toLowerCase().includes(terme);
      const matchCat = categorie === 'toutes' || p.categorie === categorie;
      return matchSearch && matchCat;
    });
    if (triPrix === 'asc') list = [...list].sort((a, b) => (a.prix_vente || a.prix) - (b.prix_vente || b.prix));
    if (triPrix === 'desc') list = [...list].sort((a, b) => (b.prix_vente || b.prix) - (a.prix_vente || a.prix));
    return list;
  }, [produits, search, categorie, triPrix]);

  if (loading) return <LoadingSpinner size="lg" text="Chargement du catalogue..." />;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Catalogue produits</h1>
          <p style={styles.subtitle}>{filtered.length} produit(s) disponible(s)</p>
        </div>
      </div>

      <div style={styles.toolbar}>
        <div style={styles.searchWrapper}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Rechercher un produit ou une référence..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <select value={categorie} onChange={(e) => setCategorie(e.target.value)} style={styles.select}>
          {categories.map((c) => (
            <option key={c} value={c}>{c === 'toutes' ? 'Toutes catégories' : c}</option>
          ))}
        </select>
        <select value={triPrix} onChange={(e) => setTriPrix(e.target.value)} style={styles.select}>
          <option value="defaut">Trier par</option>
          <option value="asc">Prix croissant</option>
          <option value="desc">Prix décroissant</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="Aucun produit trouvé"
          description="Essayez un autre mot-clé ou une autre catégorie."
        />
      ) : (
        <div style={styles.grid}>
          {filtered.map((produit) => {
            const enStock = (produit.quantite_stock || 0) > 0;
            return (
              <div key={produit.id} style={styles.productCard}>
                <div style={styles.productTop}>
              
                  <span
                    style={{
                      ...styles.stockPill,
                      backgroundColor: enStock ? '#DCFCE7' : '#FEE2E2',
                      color: enStock ? '#166534' : '#991B1B',
                    }}
                  >
                    {enStock ? `${produit.quantite_stock} en stock` : 'Rupture'}
                  </span>
                </div>
                <h3 style={styles.productName}>{produit.nom}</h3>
                <p style={styles.productRef}>Réf: {produit.reference || '-'}</p>
                {produit.categorie && <span style={styles.categoryTag}>{produit.categorie}</span>}
                <div style={styles.productFooter}>
                  <span style={styles.productPrice}>{produit.prix_vente || produit.prix} €</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '24px', maxWidth: '1200px', margin: '0 auto' },
  header: { marginBottom: '18px' },
  title: { fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: 0 },
  subtitle: { fontSize: '13px', color: '#64748B', marginTop: '4px' },
  toolbar: { display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '22px' },
  searchWrapper: {
    flex: '1 1 260px', display: 'flex', alignItems: 'center',
    backgroundColor: '#FFFFFF', border: '2px solid #E2E8F0', borderRadius: '10px', padding: '2px 14px',
  },
  searchIcon: { fontSize: '14px', marginRight: '8px' },
  searchInput: { flex: 1, border: 'none', outline: 'none', padding: '10px 0', fontSize: '14px' },
  select: {
    padding: '10px 14px', borderRadius: '10px', border: '2px solid #E2E8F0',
    fontSize: '13px', backgroundColor: '#FFFFFF', outline: 'none', cursor: 'pointer',
  },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px',
  },
  productCard: {
    backgroundColor: '#FFFFFF', padding: '18px', borderRadius: '14px',
    border: '1px solid #E8EDF2', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', gap: '6px',
  },
  productTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  productIcon: { fontSize: '30px' },
  stockPill: { fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px' },
  productName: { fontSize: '15px', fontWeight: 600, color: '#0F172A', margin: '4px 0 0' },
  productRef: { fontSize: '12px', color: '#94A3B8', margin: 0 },
  categoryTag: {
    display: 'inline-block', fontSize: '11px', color: '#0EA5E9', backgroundColor: '#F0F9FF',
    padding: '2px 10px', borderRadius: '20px', width: 'fit-content', marginTop: '2px',
  },
  productFooter: { marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #F1F5F9' },
  productPrice: { fontSize: '20px', fontWeight: 700, color: '#0EA5E9' },
};