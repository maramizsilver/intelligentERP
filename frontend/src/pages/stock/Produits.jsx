import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import API from '../../utils/api';

import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';

export default function Produits() {
  const { hasPermission } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [produits, setProduits] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ 
    nom: '', reference: '', code_barre: '', description: '', prix: '',
    prix_achat: '', prix_vente: '', prix_unitaire_ht: '', tva: '0',
    unite: 'unité', categorie: '', fournisseur_id: '', seuil_alerte: '5',
    actif: true, quantite_stock: ''
  });
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

  const loadFournisseurs = async () => {
    try {
      const res = await API.get('/fournisseurs');
      setFournisseurs(res.data.fournisseurs || []);
    } catch (err) {
      console.error('Erreur chargement fournisseurs:', err);
    }
  };

  useEffect(() => {
    loadData();
    loadFournisseurs();
  }, []);
const produitsFiltres = useMemo(() => {
  if (!searchTerm.trim()) return produits;
  const terme = searchTerm.trim().toLowerCase();
  return produits.filter(p =>
    (p.nom || '').toLowerCase().startsWith(terme) ||
    (p.reference || '').toLowerCase().startsWith(terme) ||
    (p.code_barre || '').toLowerCase().startsWith(terme) ||
    (p.categorie || '').toLowerCase().startsWith(terme) ||
    (p.description || '').toLowerCase().startsWith(terme)
  );
}, [produits, searchTerm]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);

    try {
      if (editingId) {
        await API.put(`/produits/${editingId}`, form);
        setSuccess(t('produit_modifie') || 'Produit mis à jour avec succès');
      } else {
        await API.post('/produits', form);
        setSuccess(t('produit_cree') || 'Produit créé avec succès');
      }
      setIsModalOpen(false);
      setForm({ 
        nom: '', reference: '', code_barre: '', description: '', prix: '',
        prix_achat: '', prix_vente: '', prix_unitaire_ht: '', tva: '0',
        unite: 'unité', categorie: '', fournisseur_id: '', seuil_alerte: '5',
        actif: true, quantite_stock: ''
      });
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
      nom: produit.nom || '', reference: produit.reference || '',
      code_barre: produit.code_barre || '', description: produit.description || '',
      prix: produit.prix || '', prix_achat: produit.prix_achat || '',
      prix_vente: produit.prix_vente || '', prix_unitaire_ht: produit.prix_unitaire_ht || '',
      tva: produit.tva || '0', unite: produit.unite || 'unité',
      categorie: produit.categorie || '', fournisseur_id: produit.fournisseur_id || '',
      seuil_alerte: produit.seuil_alerte || '5', actif: produit.actif !== undefined ? !!produit.actif : true,
      quantite_stock: produit.quantite_stock || ''
    });
    setEditingId(produit.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirmation_suppression'))) return;
    try {
      await API.delete(`/produits/${id}`);
      setSuccess(t('produit_supprime') || 'Produit supprimé');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const getStockBadge = (stock) => {
    if (stock <= 0) return { variant: 'danger', label: t('rupture') || 'Rupture' };
    if (stock <= 5) return { variant: 'warning', label: t('critique') || 'Critique' };
    if (stock <= 10) return { variant: 'primary', label: t('bas') || 'Bas' };
    return { variant: 'success', label: t('normal') || 'Normal' };
  };

  const columns = [
    { key: 'nom', label: t('nom') },
    { key: 'reference', label: 'Référence' },
    { key: 'description', label: t('description') },
    {
      key: 'prix',
      label: t('prix'),
      render: (row) => `${row.prix} DT`
    },
    {
      key: 'quantite_stock',
      label: t('stock') || 'Stock',
      render: (row) => {
        const badge = getStockBadge(row.quantite_stock);
        return <Badge variant={badge.variant}>{badge.label} ({row.quantite_stock})</Badge>;
      }
    }
  ];

  const actions = [];
  if (peutModifier) {
    actions.push({ label: t('modifier'), variant: 'primary', onClick: (row) => handleEdit(row) });
  }
  if (peutSupprimer) {
    actions.push({ label: t('supprimer'), variant: 'danger', onClick: (row) => handleDelete(row.id) });
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{t('gestion_produits') || 'Gestion des Produits'}</h1>
          <p style={styles.subtitle}>{t('gerer_produits') || 'Gérez votre catalogue produits'}</p>
        </div>
        <div style={styles.headerActions}>
          <Button variant="secondary" onClick={() => navigate('/dashboard')} icon="←">
            {t('retour')}
          </Button>
          {peutCreer && (
            <Button
              variant="primary"
              icon="+"
              onClick={() => {
                setForm({ 
                  nom: '', reference: '', code_barre: '', description: '', prix: '',
                  prix_achat: '', prix_vente: '', prix_unitaire_ht: '', tva: '0',
                  unite: 'unité', categorie: '', fournisseur_id: '', seuil_alerte: '5',
                  actif: true, quantite_stock: ''
                });
                setEditingId(null);
                setIsModalOpen(true);
              }}
            >
              {t('nouveau_produit') || 'Nouveau produit'}
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
          <span>✅</span>
          <span style={styles.successText}>{success}</span>
        </div>
      )}

      <Card title={t('catalogue_produits') || 'Catalogue des produits'} variant="primary">
        {searchTerm && (
          <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '8px' }}>
            {produitsFiltres.length} résultat(s) sur {produits.length}
          </p>
        )}
        <Table
          columns={columns}
          data={produitsFiltres}
          loading={loading}
          actions={actions}
          searchable
          onSearch={setSearchTerm}
        />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? t('modifier_produit') || 'Modifier le produit' : t('nouveau_produit') || 'Nouveau produit'}
        size="lg"
        actions={[
          {
            label: editingId ? t('modifier') : t('creer'),
            variant: 'primary',
            onClick: handleSubmit,
            loading: formLoading,
          },
        ]}
      >
        <form onSubmit={handleSubmit}>
          <div style={styles.formGrid}>
            <Input label={t('nom') + ' *'} name="nom" value={form.nom} onChange={handleChange} required disabled={formLoading} />
            <Input label="Référence" name="reference" value={form.reference} onChange={handleChange} disabled={formLoading} />
            <Input label="Code barre" name="code_barre" value={form.code_barre} onChange={handleChange} disabled={formLoading} />
            <Input label={t('description')} name="description" value={form.description} onChange={handleChange} disabled={formLoading} />
            <Input label={t('prix') + ' (DT) *'} name="prix" type="number" step="0.001" min="0" value={form.prix} onChange={handleChange} required disabled={formLoading} />
            <Input label="Prix d'achat (DT)" name="prix_achat" type="number" step="0.001" min="0" value={form.prix_achat} onChange={handleChange} disabled={formLoading} />
            <Input label="Prix de vente (DT)" name="prix_vente" type="number" step="0.001" min="0" value={form.prix_vente} onChange={handleChange} disabled={formLoading} />
            <Input label="Prix unitaire HT (DT)" name="prix_unitaire_ht" type="number" step="0.001" min="0" value={form.prix_unitaire_ht} onChange={handleChange} disabled={formLoading} />
            <Input label="TVA (%)" name="tva" type="number" step="0.01" min="0" value={form.tva} onChange={handleChange} disabled={formLoading} />
            <div>
              <label style={styles.label}>Unité</label>
              <select name="unite" value={form.unite} onChange={handleChange} style={styles.select} disabled={formLoading}>
                <option value="unité">Unité</option>
                <option value="kg">Kg</option>
                <option value="litre">Litre</option>
                <option value="carton">Carton</option>
                <option value="palette">Palette</option>
                <option value="m">Mètre</option>
                <option value="m²">Mètre carré</option>
              </select>
            </div>
            <Input label="Catégorie" name="categorie" value={form.categorie} onChange={handleChange} disabled={formLoading} />
            <div>
              <label style={styles.label}>Fournisseur</label>
              <select name="fournisseur_id" value={form.fournisseur_id} onChange={handleChange} style={styles.select} disabled={formLoading}>
                <option value="">-- Aucun --</option>
                {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
              </select>
            </div>
            <Input label="Seuil d'alerte" name="seuil_alerte" type="number" min="0" value={form.seuil_alerte} onChange={handleChange} disabled={formLoading} />
            <div>
              <label style={styles.label}>Actif</label>
              <div style={styles.checkboxContainer}>
                <input type="checkbox" name="actif" checked={form.actif} onChange={handleChange} disabled={formLoading} />
                <span style={styles.checkboxLabel}>Oui</span>
              </div>
            </div>
            <Input label={t('quantite_stock') || 'Quantité en stock'} name="quantite_stock" type="number" min="0" value={form.quantite_stock} onChange={handleChange} disabled={formLoading} />
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
  label: { display: 'block', fontSize: '13px', fontWeight: 500, color: '#1E293B', marginBottom: '4px' },
  select: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '2px solid #E2E8F0',
    fontSize: '14px',
    backgroundColor: '#F8FAFC',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  checkboxContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 0',
  },
  checkboxLabel: {
    fontSize: '14px',
    color: '#1E293B',
  },
};