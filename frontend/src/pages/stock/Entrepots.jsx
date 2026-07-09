// src/pages/stock/Entrepots.jsx
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
import EmptyState from '../../components/common/EmptyState';

export default function Entrepots() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const [entrepots, setEntrepots] = useState([]);
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nom: '', adresse: '', responsable: '', actif: true });
  const [formLoading, setFormLoading] = useState(false);

  // États pour la gestion du stock
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedEntrepot, setSelectedEntrepot] = useState(null);
  const [stockForm, setStockForm] = useState({ produit_id: '', quantite: '' });
  const [stockList, setStockList] = useState([]);
  const [loadingStock, setLoadingStock] = useState(false);

  const peutCreer = hasPermission('Stock', 'creation');
  const peutModifier = hasPermission('Stock', 'modification');
  const peutSupprimer = hasPermission('Stock', 'suppression');

  useEffect(() => {
    loadEntrepots();
    loadProduits();
  }, []);

  const loadEntrepots = async () => {
    try {
      setLoading(true);
      const res = await API.get('/entrepots');
      setEntrepots(res.data.entrepots || []);
    } catch (err) {
      setError('Impossible de charger les entrepôts');
    } finally {
      setLoading(false);
    }
  };

  const loadProduits = async () => {
    try {
      const res = await API.get('/produits');
      setProduits(res.data.produits || []);
    } catch (err) {
      console.error('Erreur chargement produits:', err);
    }
  };

  const loadStockEntrepot = async (entrepotId) => {
    try {
      setLoadingStock(true);
      const res = await API.get(`/entrepots/${entrepotId}`);
      setStockList(res.data.entrepot?.stock || []);
    } catch (err) {
      setError('Impossible de charger le stock');
    } finally {
      setLoadingStock(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFormLoading(true);

    try {
      if (editingId) {
        await API.put(`/entrepots/${editingId}`, form);
        setSuccess(' Entrepôt mis à jour avec succès');
      } else {
        await API.post('/entrepots', form);
        setSuccess(' Entrepôt créé avec succès');
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ nom: '', adresse: '', responsable: '', actif: true });
      loadEntrepots();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (entrepot) => {
    setForm({
      nom: entrepot.nom,
      adresse: entrepot.adresse || '',
      responsable: entrepot.responsable || '',
      actif: entrepot.actif
    });
    setEditingId(entrepot.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet entrepôt ?')) return;
    try {
      await API.delete(`/entrepots/${id}`);
      setSuccess(' Entrepôt supprimé');
      loadEntrepots();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  // Gestion du stock
  const handleOpenStockModal = async (entrepot) => {
    setSelectedEntrepot(entrepot);
    setStockForm({ produit_id: '', quantite: '' });
    await loadStockEntrepot(entrepot.id);
    setShowStockModal(true);
  };

  const handleStockChange = (e) => {
    const { name, value } = e.target;
    setStockForm({ ...stockForm, [name]: value });
  };

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFormLoading(true);

    try {
      await API.put(`/entrepots/${selectedEntrepot.id}/stock`, {
        produit_id: parseInt(stockForm.produit_id),
        quantite: parseInt(stockForm.quantite)
      });
      setSuccess('Stock mis à jour avec succès');
      setStockForm({ produit_id: '', quantite: '' });
      await loadStockEntrepot(selectedEntrepot.id);
      loadEntrepots();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteStock = async (produitId) => {
    if (!window.confirm('Supprimer ce produit du stock ?')) return;
    try {
      await API.put(`/entrepots/${selectedEntrepot.id}/stock`, {
        produit_id: produitId,
        quantite: 0
      });
      setSuccess('Produit retiré du stock');
      await loadStockEntrepot(selectedEntrepot.id);
      loadEntrepots();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const columns = [
    { key: 'nom', label: 'Nom' },
    { key: 'adresse', label: 'Adresse' },
    { key: 'responsable', label: 'Responsable' },
    {
      key: 'actif',
      label: 'Statut',
      render: (row) => (
        <Badge variant={row.actif ? 'success' : 'danger'}>
          {row.actif ? 'Actif' : 'Inactif'}
        </Badge>
      )
    }
  ];

  const actions = [];
  if (peutModifier) {
    actions.push({
      label: ' Stock',
      variant: 'primary',
      onClick: (row) => handleOpenStockModal(row)
    });
    actions.push({
      label: 'modif',
      variant: 'primary',
      onClick: (row) => handleEdit(row)
    });
  }
  if (peutSupprimer) {
    actions.push({
      label: 'suppr',
      variant: 'danger',
      onClick: (row) => handleDelete(row.id)
    });
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}> Gestion des Entrepôts</h1>
          <p style={styles.subtitle}>Gérez vos entrepôts et leur stock</p>
        </div>
        <div style={styles.headerActions}>
          <Button variant="secondary" onClick={() => navigate('/dashboard')} icon="←">
            Retour
          </Button>
          {peutCreer && (
            <Button
              variant="primary"
              icon={showForm ? '✕' : '+'}
              onClick={() => {
                setShowForm(!showForm);
                setEditingId(null);
                setForm({ nom: '', adresse: '', responsable: '', actif: true });
              }}
            >
              {showForm ? 'Fermer' : 'Nouvel entrepôt'}
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

      {showForm && (
        <Card title={editingId ? 'Modifier l\'entrepôt' : ' Nouvel entrepôt'} variant="primary" style={{ marginBottom: '24px' }}>
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
                label="Adresse"
                name="adresse"
                value={form.adresse}
                onChange={handleChange}
                disabled={formLoading}
              />
              <Input
                label="Responsable"
                name="responsable"
                value={form.responsable}
                onChange={handleChange}
                disabled={formLoading}
              />
              <div style={styles.checkboxGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="actif"
                    checked={form.actif}
                    onChange={handleChange}
                    disabled={formLoading}
                  />
                  <span>Actif</span>
                </label>
              </div>
            </div>
            <Button type="submit" variant="primary" loading={formLoading} fullWidth>
              {editingId ? 'Mettre à jour' : 'Créer'}
            </Button>
          </form>
        </Card>
      )}

      <Card title=" Liste des entrepôts" variant="primary">
        <Table columns={columns} data={entrepots} loading={loading} actions={actions} />
      </Card>

      {/* Modal de gestion du stock */}
      {showStockModal && selectedEntrepot && (
        <div style={styles.modalOverlay} onClick={() => setShowStockModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}> Gestion du stock - {selectedEntrepot.nom}</h3>

            <form onSubmit={handleUpdateStock} style={styles.stockForm}>
              <div style={styles.stockFormGrid}>
                <select
                  style={styles.select}
                  name="produit_id"
                  value={stockForm.produit_id}
                  onChange={handleStockChange}
                  required
                  disabled={formLoading}
                >
                  <option value="">-- Choisir un produit --</option>
                  {produits.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nom} (Prix: {p.prix} DT)
                    </option>
                  ))}
                </select>
                <input
                  style={styles.input}
                  type="number"
                  name="quantite"
                  placeholder="Quantité"
                  value={stockForm.quantite}
                  onChange={handleStockChange}
                  required
                  min="0"
                  disabled={formLoading}
                />
                <Button type="submit" variant="success" loading={formLoading}>
                  + Ajouter
                </Button>
              </div>
            </form>

            <hr style={styles.modalHr} />

            <h4>Stock actuel</h4>
            {loadingStock ? (
              <LoadingSpinner size="md" text="Chargement du stock..." />
            ) : stockList.length === 0 ? (
              <EmptyState icon="📭" title="Aucun produit" description="Cet entrepôt est vide." />
            ) : (
              <table style={styles.modalTable}>
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Quantité</th>
                    <th>Prix</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stockList.map((item) => (
                    <tr key={item.produit_id}>
                      <td>{item.produit_nom}</td>
                      <td style={{ fontWeight: 'bold', color: item.quantite > 0 ? '#065F46' : '#DC2626' }}>
                        {item.quantite}
                      </td>
                      <td>{item.prix} DT</td>
                      <td>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteStock(item.produit_id)}
                        >
                          Supprimer
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div style={styles.modalActions}>
              <Button variant="secondary" onClick={() => setShowStockModal(false)}>
                Fermer
              </Button>
            </div>
          </div>
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
  checkboxGroup: { display: 'flex', alignItems: 'center', marginBottom: '16px' },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#334155',
    cursor: 'pointer',
  },
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
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    padding: '30px',
    borderRadius: '16px',
    maxWidth: '700px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalTitle: { margin: '0 0 16px', color: '#0F172A' },
  modalHr: { margin: '16px 0', border: 'none', borderTop: '1px solid #E2E8F0' },
  stockForm: { marginBottom: '16px' },
  stockFormGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr auto',
    gap: '12px',
    alignItems: 'end',
  },
  modalTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px',
    justifyContent: 'flex-end',
  },
};