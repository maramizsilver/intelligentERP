// src/pages/stock/Produits.jsx
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

export default function Produits() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nom: '', description: '', prix: '', quantite_stock: '' });
  const [formLoading, setFormLoading] = useState(false);

  const peutCreer = hasPermission('Stock', 'creation');
  const peutModifier = hasPermission('Stock', 'modification');
  const peutSupprimer = hasPermission('Stock', 'suppression');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await API.get('/produits');
      setProduits(res.data.produits || []);
    } catch (err) {
      setError('Impossible de charger les produits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);

    try {
      if (editingId) {
        await API.put(`/produits/${editingId}`, form);
        setSuccess('Produit mis à jour avec succès');
      } else {
        await API.post('/produits', form);
        setSuccess('Produit créé avec succès');
      }
      setIsModalOpen(false);
      setForm({ nom: '', description: '', prix: '', quantite_stock: '' });
      setEditingId(null);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (produit) => {
    setForm({
      nom: produit.nom,
      description: produit.description || '',
      prix: produit.prix,
      quantite_stock: produit.quantite_stock,
    });
    setEditingId(produit.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce produit ?')) return;
    try {
      await API.delete(`/produits/${id}`);
      setSuccess(' Produit supprimé');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const getStockBadge = (stock) => {
    if (stock <= 0) return { variant: 'danger', label: 'Rupture' };
    if (stock <= 5) return { variant: 'warning', label: 'Critique' };
    if (stock <= 10) return { variant: 'primary', label: 'Bas' };
    return { variant: 'success', label: 'Normal' };
  };

  const columns = [
    { key: 'nom', label: 'Nom' },
    { key: 'description', label: 'Description' },
    {
      key: 'prix',
      label: 'Prix',
      render: (row) => `${row.prix} DT`
    },
    {
      key: 'quantite_stock',
      label: 'Stock',
      render: (row) => {
        const badge = getStockBadge(row.quantite_stock);
        return <Badge variant={badge.variant}>{badge.label} ({row.quantite_stock})</Badge>;
      }
    }
  ];

  const actions = [];
  if (peutModifier) {
    actions.push({ label: 'modif', variant: 'primary', onClick: (row) => handleEdit(row) });
  }
  if (peutSupprimer) {
    actions.push({ label: 'suppr', variant: 'danger', onClick: (row) => handleDelete(row.id) });
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}> Gestion des Produits</h1>
          <p style={styles.subtitle}>Gérez votre catalogue produits</p>
        </div>
        <div style={styles.headerActions}>
          <Button variant="secondary" onClick={() => navigate('/dashboard')} icon="←">
            Retour
          </Button>
          {peutCreer && (
            <Button
              variant="primary"
              icon="+"
              onClick={() => {
                setForm({ nom: '', description: '', prix: '', quantite_stock: '' });
                setEditingId(null);
                setIsModalOpen(true);
              }}
            >
              Nouveau produit
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

      <Card title=" Catalogue des produits" variant="primary">
        <Table columns={columns} data={produits} loading={loading} actions={actions} />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? ' Modifier le produit' : ' Nouveau produit'}
        size="md"
        actions={[
          {
            label: editingId ? 'Mettre à jour' : 'Créer',
            variant: 'primary',
            onClick: handleSubmit,
            loading: formLoading,
          },
        ]}
      >
        <form onSubmit={handleSubmit}>
          <div style={styles.formGrid}>
            <Input
              label="Nom *"
              name="nom"
              value={form.nom}
              onChange={handleChange}
              required
              disabled={formLoading}
            />
            <Input
              label="Description"
              name="description"
              value={form.description}
              onChange={handleChange}
              disabled={formLoading}
            />
            <Input
              label="Prix (DT) *"
              name="prix"
              type="number"
              step="0.01"
              min="0"
              value={form.prix}
              onChange={handleChange}
              required
              disabled={formLoading}
            />
            <Input
              label="Quantité en stock"
              name="quantite_stock"
              type="number"
              min="0"
              value={form.quantite_stock}
              onChange={handleChange}
              disabled={formLoading}
            />
          </div>
        </form>
      </Modal>
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
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
};