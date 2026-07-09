// src/pages/client/ClientProduits.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../utils/api';

import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

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
    return <LoadingSpinner size="lg" text="Chargement des produits..." />;
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}> Catalogue produits</h1>
          <p style={styles.subtitle}>Découvrez tous nos produits</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/client/dashboard')}>
          ← Retour
        </Button>
      </div>

      {error && (
        <div style={styles.errorContainer}>
          
          <span style={styles.errorText}>{error}</span>
        </div>
      )}

      {produits.length === 0 ? (
        <EmptyState
        
          title="Aucun produit disponible"
          description="Le catalogue de produits est vide pour le moment."
        />
      ) : (
        <div style={styles.grid}>
          {produits.map((p) => (
            <div key={p.id} style={styles.card}>
              <h3 style={styles.produitNom}>{p.nom}</h3>
              <p style={styles.produitDesc}>{p.description || 'Aucune description'}</p>
              <div style={styles.produitFooter}>
                <span style={styles.produitPrix}>{p.prix} DT</span>
                <Badge variant={p.quantite_stock > 0 ? 'success' : 'danger'}>
                  Stock: {p.quantite_stock || 0}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  subtitle: {
    fontSize: '14px',
    color: '#64748B',
    marginTop: '4px',
  },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '16px',
  },
  errorText: {
    color: '#991B1B',
    fontSize: '13px',
    fontWeight: 500,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '16px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid #E2E8F0',
    transition: 'all 0.2s ease',
    ':hover': {
      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
      transform: 'translateY(-2px)',
    },
  },
  produitNom: {
    margin: '0 0 8px',
    fontSize: '18px',
    fontWeight: 600,
    color: '#0F172A',
  },
  produitDesc: {
    color: '#64748B',
    fontSize: '14px',
    margin: '0 0 12px',
    minHeight: '40px',
  },
  produitFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '12px',
    borderTop: '1px solid #E2E8F0',
  },
  produitPrix: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#0EA5E9',
  },
};