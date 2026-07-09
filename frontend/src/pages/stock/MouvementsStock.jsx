// src/pages/stock/MouvementsStock.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';

import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function MouvementsStock() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const [produits, setProduits] = useState([]);
  const [produitId, setProduitId] = useState('');
  const [mouvements, setMouvements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showAjustement, setShowAjustement] = useState(false);
  const [formAjustement, setFormAjustement] = useState({
    produit_id: '',
    quantite: '',
    motif: ''
  });
  const [formLoading, setFormLoading] = useState(false);

  const peutModifier = hasPermission('Stock', 'modification');

  useEffect(() => {
    loadProduits();
  }, []);

  const loadProduits = async () => {
    try {
      const res = await API.get('/produits');
      setProduits(res.data.produits || []);
    } catch (err) {
      setError('Impossible de charger les produits');
    }
  };

  const loadMouvements = async () => {
    if (!produitId) {
      setMouvements([]);
      return;
    }
    try {
      setLoading(true);
      const res = await API.get(`/mouvements-stock/produit/${produitId}`);
      setMouvements(res.data.mouvements || []);
    } catch (err) {
      setError('Impossible de charger les mouvements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (produitId) {
      loadMouvements();
    }
  }, [produitId]);

  const handleAjustement = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFormLoading(true);

    try {
      await API.post('/mouvements-stock/ajuster', formAjustement);
      setSuccess(' Stock ajusté avec succès');
      setShowAjustement(false);
      setFormAjustement({ produit_id: '', quantite: '', motif: '' });
      loadProduits();
      if (produitId) loadMouvements();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setFormLoading(false);
    }
  };

  const getTypeBadge = (type) => {
    const types = {
      entree: { label: 'Entrée', variant: 'success' },
      sortie: { label: 'Sortie', variant: 'danger' },
      ajustement: { label: 'Ajustement', variant: 'warning' },
      commande_client: { label: 'Commande client', variant: 'primary' },
      achat_fournisseur: { label: 'Achat fournisseur', variant: 'secondary' }
    };
    return types[type] || { label: type, variant: 'outline' };
  };

  const produitSelectionne = produits.find(p => p.id === Number(produitId));

  const columns = [
    {
      key: 'created_at',
      label: 'Date',
      render: (row) => (
        <span style={{ fontSize: '12px' }}>
          {new Date(row.created_at).toLocaleDateString('fr-FR')}
          <br />
          {new Date(row.created_at).toLocaleTimeString('fr-FR')}
        </span>
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (row) => {
        const type = getTypeBadge(row.type);
        return <Badge variant={type.variant}>{type.label}</Badge>;
      }
    },
    {
      key: 'quantite',
      label: 'Quantité',
      render: (row) => (
        <span style={{ fontWeight: 'bold', color: row.quantite > 0 ? '#22C55E' : '#EF4444' }}>
          {row.quantite > 0 ? `+${row.quantite}` : row.quantite}
        </span>
      )
    },
    { key: 'ancien_stock', label: 'Ancien stock' },
    { key: 'nouveau_stock', label: 'Nouveau stock' },
    { key: 'motif', label: 'Motif' },
    {
      key: 'created_by',
      label: 'Par',
      render: (row) => (
        <span style={{ fontSize: '13px', color: '#64748B' }}>
          {row.created_by_prenom} {row.created_by_nom}
        </span>
      )
    }
  ];

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}> Mouvements de stock</h1>
          <p style={styles.subtitle}>Consultez l'historique des mouvements par produit</p>
        </div>
        <div style={styles.headerActions}>
          <Button variant="secondary" onClick={() => navigate('/dashboard')} icon="←">
            Retour
          </Button>
          {peutModifier && (
            <Button
              variant="warning"
              icon={showAjustement ? '✕' : '⚙️'}
              onClick={() => setShowAjustement(!showAjustement)}
            >
              {showAjustement ? 'Fermer' : 'Ajuster le stock'}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div style={styles.errorContainer}>
          <span>❌</span>
          <span style={styles.errorText}>{error}</span>
        </div>
      )}
      {success && (
        <div style={styles.successContainer}>
          <span>done</span>
          <span style={styles.successText}>{success}</span>
        </div>
      )}

      {showAjustement && (
        <Card title=" Ajuster le stock" variant="warning" style={{ marginBottom: '24px' }}>
          <form onSubmit={handleAjustement}>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Produit *</label>
                <select
                  style={styles.select}
                  value={formAjustement.produit_id}
                  onChange={(e) => setFormAjustement({ ...formAjustement, produit_id: e.target.value })}
                  required
                  disabled={formLoading}
                >
                  <option value="">-- Choisir un produit --</option>
                  {produits.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nom} (Stock: {p.quantite_stock})
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Quantité (+ entrée, - sortie) *</label>
                <input
                  style={styles.input}
                  type="number"
                  step="1"
                  placeholder="+10 ou -5"
                  value={formAjustement.quantite}
                  onChange={(e) => setFormAjustement({ ...formAjustement, quantite: e.target.value })}
                  required
                  disabled={formLoading}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Motif *</label>
                <input
                  style={styles.input}
                  placeholder="Raison de l'ajustement"
                  value={formAjustement.motif}
                  onChange={(e) => setFormAjustement({ ...formAjustement, motif: e.target.value })}
                  required
                  disabled={formLoading}
                />
              </div>
            </div>
            <Button type="submit" variant="primary" loading={formLoading} fullWidth>
              Appliquer l'ajustement
            </Button>
          </form>
        </Card>
      )}

      <Card title=" Sélectionner un produit" variant="primary" style={{ marginBottom: '24px' }}>
        <div style={styles.selectWrapper}>
          <select
            style={styles.selectLarge}
            value={produitId}
            onChange={(e) => setProduitId(e.target.value)}
          >
            <option value="">-- Sélectionner un produit --</option>
            {produits.map(p => (
              <option key={p.id} value={p.id}>
                {p.nom} (Stock: {p.quantite_stock})
              </option>
            ))}
          </select>
        </div>
      </Card>

      {produitId && (
        <Card
          title={` Historique des mouvements - ${produitSelectionne?.nom || ''}`}
          subtitle={`Stock actuel: ${produitSelectionne?.quantite_stock || 0}`}
          variant="primary"
        >
          <Table columns={columns} data={mouvements} loading={loading} />
        </Card>
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
  title: { fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: 0 },
  subtitle: { fontSize: '14px', color: '#64748B', margin: '4px 0 0' },
  headerActions: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
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
  errorText: { color: '#991B1B', fontSize: '13px', fontWeight: 500 },
  successContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#F0FDF4',
    border: '1px solid #86EFAC',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '16px',
  },
  successText: { color: '#065F46', fontSize: '13px', fontWeight: 500 },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '13px', fontWeight: 600, color: '#334155' },
  select: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '2px solid #E2E8F0',
    fontSize: '14px',
    backgroundColor: '#F8FAFC',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'all 0.2s ease',
    ':focus': {
      borderColor: '#0EA5E9',
      boxShadow: '0 0 0 3px rgba(14, 165, 233, 0.15)',
    },
  },
  selectLarge: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '2px solid #E2E8F0',
    fontSize: '14px',
    backgroundColor: '#F8FAFC',
    width: '100%',
    maxWidth: '400px',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'all 0.2s ease',
    ':focus': {
      borderColor: '#0EA5E9',
      boxShadow: '0 0 0 3px rgba(14, 165, 233, 0.15)',
    },
  },
  selectWrapper: { display: 'flex', justifyContent: 'center' },
  input: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '2px solid #E2E8F0',
    fontSize: '14px',
    backgroundColor: '#F8FAFC',
    outline: 'none',
    transition: 'all 0.2s ease',
    ':focus': {
      borderColor: '#0EA5E9',
      boxShadow: '0 0 0 3px rgba(14, 165, 233, 0.15)',
    },
  },
};