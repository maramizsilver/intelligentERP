
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

export default function Promotions() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    code: '',
    nom: '',
    description: '',
    type: 'pourcentage',
    valeur: '',
    date_debut: '',
    date_fin: '',
    utilisation_max: '',
    produits_concernes: '',
    clients_concernes: '',
    actif: true
  });
  const [formLoading, setFormLoading] = useState(false);

  const peutCreer = hasPermission('Ventes', 'creation');
  const peutModifier = hasPermission('Ventes', 'modification');
  const peutSupprimer = hasPermission('Ventes', 'suppression');

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const res = await API.get('/promotions');
      setPromotions(res.data.promotions || []);
    } catch (err) {
      setError('Impossible de charger les promotions');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFormLoading(true);

    try {
      if (new Date(form.date_debut) >= new Date(form.date_fin)) {
        setError('La date de début doit être antérieure à la date de fin');
        setFormLoading(false);
        return;
      }

      const data = {
        ...form,
        produits_concernes: form.produits_concernes ? form.produits_concernes.split(',').map(Number) : null,
        clients_concernes: form.clients_concernes ? form.clients_concernes.split(',').map(Number) : null,
      };

      if (editingId) {
        await API.put(`/promotions/${editingId}`, data);
        setSuccess(' Promotion mise à jour avec succès');
      } else {
        await API.post('/promotions', data);
        setSuccess(' Promotion créée avec succès');
      }

      setIsModalOpen(false);
      setEditingId(null);
      setForm({
        code: '',
        nom: '',
        description: '',
        type: 'pourcentage',
        valeur: '',
        date_debut: '',
        date_fin: '',
        utilisation_max: '',
        produits_concernes: '',
        clients_concernes: '',
        actif: true
      });
      loadPromotions();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (promo) => {
    setForm({
      code: promo.code,
      nom: promo.nom,
      description: promo.description || '',
      type: promo.type,
      valeur: promo.valeur,
      date_debut: promo.date_debut.slice(0, 16),
      date_fin: promo.date_fin.slice(0, 16),
      utilisation_max: promo.utilisation_max || '',
      produits_concernes: promo.produits_concernes ? JSON.parse(promo.produits_concernes).join(',') : '',
      clients_concernes: promo.clients_concernes ? JSON.parse(promo.clients_concernes).join(',') : '',
      actif: promo.actif
    });
    setEditingId(promo.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette promotion ?')) return;
    try {
      await API.delete(`/promotions/${id}`);
      setSuccess(' Promotion supprimée');
      loadPromotions();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      pourcentage: '%',
      fixe: 'DT fixe',
      livraison_offerte: 'Livraison offerte'
    };
    return labels[type] || type;
  };

  const getStatutBadge = (promo) => {
    const maintenant = new Date();
    const debut = new Date(promo.date_debut);
    const fin = new Date(promo.date_fin);

    if (!promo.actif) return { label: 'Inactif', variant: 'outline' };
    if (maintenant < debut) return { label: 'À venir', variant: 'primary' };
    if (maintenant > fin) return { label: 'Expirée', variant: 'danger' };
    return { label: 'Active', variant: 'success' };
  };

  const columns = [
    { key: 'code', label: 'Code' },
    { key: 'nom', label: 'Nom' },
    {
      key: 'type',
      label: 'Type',
      render: (row) => getTypeLabel(row.type)
    },
    {
      key: 'valeur',
      label: 'Valeur',
      render: (row) => `${row.valeur} ${row.type === 'pourcentage' ? '%' : 'DT'}`
    },
    {
      key: 'date_debut',
      label: 'Période',
      render: (row) => (
        <span style={{ fontSize: '12px' }}>
          {new Date(row.date_debut).toLocaleDateString('fr-FR')}
          <br />→ {new Date(row.date_fin).toLocaleDateString('fr-FR')}
        </span>
      )
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (row) => {
        const statut = getStatutBadge(row);
        return <Badge variant={statut.variant}>{statut.label}</Badge>;
      }
    },
    {
      key: 'utilisation_count',
      label: 'Utilisations',
      render: (row) => (
        <span>
          {row.utilisation_count || 0}
          {row.utilisation_max && ` / ${row.utilisation_max}`}
        </span>
      )
    }
  ];

  const actions = [];
  if (peutModifier) {
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
          <h1 style={styles.title}> Gestion des Promotions</h1>
          <p style={styles.subtitle}>Gérez vos promotions et codes promo</p>
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
                setForm({
                  code: '',
                  nom: '',
                  description: '',
                  type: 'pourcentage',
                  valeur: '',
                  date_debut: '',
                  date_fin: '',
                  utilisation_max: '',
                  produits_concernes: '',
                  clients_concernes: '',
                  actif: true
                });
                setEditingId(null);
                setIsModalOpen(true);
              }}
            >
              Nouvelle promotion
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

      <Card title=" Liste des promotions" variant="primary">
        <Table columns={columns} data={promotions} loading={loading} actions={actions} />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Modifier la promotion' : ' Nouvelle promotion'}
        size="lg"
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
              label="Code *"
              name="code"
              value={form.code}
              onChange={handleChange}
              placeholder="PROMO20"
              required
              disabled={formLoading}
            />
            <Input
              label="Nom *"
              name="nom"
              value={form.nom}
              onChange={handleChange}
              placeholder="Nom de la promotion"
              required
              disabled={formLoading}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              style={styles.textarea}
              name="description"
              placeholder="Description de la promotion"
              value={form.description}
              onChange={handleChange}
              disabled={formLoading}
            />
          </div>

          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Type *</label>
              <select
                style={styles.select}
                name="type"
                value={form.type}
                onChange={handleChange}
                disabled={formLoading}
              >
                <option value="pourcentage">Pourcentage (%)</option>
                <option value="fixe">Montant fixe (DT)</option>
                <option value="livraison_offerte">Livraison offerte</option>
              </select>
            </div>
            <Input
              label="Valeur *"
              name="valeur"
              type="number"
              step="0.01"
              value={form.valeur}
              onChange={handleChange}
              placeholder="0.00"
              required
              disabled={formLoading}
            />
          </div>

          <div style={styles.formGrid}>
            <Input
              label="Date de début *"
              name="date_debut"
              type="datetime-local"
              value={form.date_debut}
              onChange={handleChange}
              required
              disabled={formLoading}
            />
            <Input
              label="Date de fin *"
              name="date_fin"
              type="datetime-local"
              value={form.date_fin}
              onChange={handleChange}
              required
              disabled={formLoading}
            />
          </div>

          <div style={styles.formGrid}>
            <Input
              label="Utilisation max"
              name="utilisation_max"
              type="number"
              min="1"
              value={form.utilisation_max}
              onChange={handleChange}
              placeholder="Illimité"
              disabled={formLoading}
            />
            <Input
              label="Produits concernés (IDs)"
              name="produits_concernes"
              value={form.produits_concernes}
              onChange={handleChange}
              placeholder="1,2,3 (vide = tous)"
              disabled={formLoading}
            />
            <Input
              label="Clients concernés (IDs)"
              name="clients_concernes"
              value={form.clients_concernes}
              onChange={handleChange}
              placeholder="1,2,3 (vide = tous)"
              disabled={formLoading}
            />
          </div>

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
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' },
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
  textarea: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '2px solid #E2E8F0',
    fontSize: '14px',
    backgroundColor: '#F8FAFC',
    minHeight: '60px',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    ':focus': {
      borderColor: '#0EA5E9',
      boxShadow: '0 0 0 3px rgba(14, 165, 233, 0.15)',
    },
  },
  checkboxGroup: { marginBottom: '16px' },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#334155',
    cursor: 'pointer',
  },
};