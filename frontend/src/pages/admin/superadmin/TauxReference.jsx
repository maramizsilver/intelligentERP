// frontend/src/pages/admin/superadmin/TauxReference.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import API from '../../../utils/api';

import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Table from '../../../components/common/Table';
import Badge from '../../../components/common/Badge';
import Input from '../../../components/common/Input';
import Modal from '../../../components/common/Modal';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import EmptyState from '../../../components/common/EmptyState';

const CATEGORIES = ['TVA', 'INTERET', 'PENALITE', 'REMISE', 'TAXE', 'COMMISSION'];

export default function TauxReference() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [taux, setTaux] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    categorie: '',
    sous_categorie: '',
    nom: '',
    description: '',
    taux: '',
    date_debut: '',
    date_fin: '',
    actif: true
  });
  const [formLoading, setFormLoading] = useState(false);
  const [filterCategorie, setFilterCategorie] = useState('');
  const [filterActif, setFilterActif] = useState('');

  useEffect(() => {
    if (!user?.is_super_admin) {
      navigate('/dashboard');
      return;
    }
    loadTaux();
  }, []);

  const loadTaux = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterCategorie) params.categorie = filterCategorie;
      if (filterActif !== '') params.actif = filterActif;
      
      const res = await API.get('/admin/taux-reference', { params });
      setTaux(res.data.taux || []);
    } catch (err) {
      setError('Impossible de charger les taux de référence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.is_super_admin) {
      loadTaux();
    }
  }, [filterCategorie, filterActif]);

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
        await API.put(`/admin/taux-reference/${editingId}`, form);
        setSuccess('Taux de référence mis à jour avec succès');
      } else {
        await API.post('/admin/taux-reference', form);
        setSuccess('Taux de référence créé avec succès');
      }
      setIsModalOpen(false);
      setEditingId(null);
      setForm({ categorie: '', sous_categorie: '', nom: '', description: '', taux: '', date_debut: '', date_fin: '', actif: true });
      loadTaux();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (item) => {
    setForm({
      categorie: item.categorie,
      sous_categorie: item.sous_categorie || '',
      nom: item.nom || '',
      description: item.description || '',
      taux: item.taux,
      date_debut: item.date_debut.slice(0, 10),
      date_fin: item.date_fin.slice(0, 10),
      actif: !!item.actif
    });
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const handleToggle = async (id, actif) => {
    try {
      await API.put(`/admin/taux-reference/${id}/toggle`, { actif: !actif });
      setSuccess(`Taux ${actif ? 'désactivé' : 'activé'} avec succès`);
      loadTaux();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer définitivement ce taux de référence ?')) return;
    try {
      await API.delete(`/admin/taux-reference/${id}`);
      setSuccess('Taux de référence supprimé');
      loadTaux();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const columns = [
    { key: 'categorie', label: 'Catégorie' },
    { key: 'nom', label: 'Nom' },
    { key: 'description', label: 'Description' },
    { key: 'taux', label: 'Taux', render: (row) => `${row.taux}%` },
    {
      key: 'date_debut',
      label: 'Date début',
      render: (row) => new Date(row.date_debut).toLocaleDateString('fr-FR')
    },
    {
      key: 'date_fin',
      label: 'Date fin',
      render: (row) => new Date(row.date_fin).toLocaleDateString('fr-FR')
    },
    {
      key: 'actif',
      label: 'Statut',
      render: (row) => (
        <Badge variant={row.actif ? 'success' : 'danger'}>
          {row.actif ? 'Actif' : 'Inactif'}
        </Badge>
      )
    },
    {
      key: 'version',
      label: 'Version',
      render: (row) => `v${row.version || 1}`
    }
  ];

  const actions = [
    {
      label: 'Modifier',
      variant: 'primary',
      onClick: (row) => handleEdit(row)
    },
    {
      label: 'Activer/Désactiver',
      variant: 'warning',
      onClick: (row) => handleToggle(row.id, row.actif)
    },
    {
      label: 'Supprimer',
      variant: 'danger',
      onClick: (row) => handleDelete(row.id)
    }
  ];

  if (!user?.is_super_admin) {
    return (
      <div>
        <div style={styles.header}>
          <h1 style={styles.title}>Accès refusé</h1>
          <p style={styles.subtitle}>Cette page est réservée au SuperAdmin de la plateforme.</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/dashboard')}>
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Gestion des Taux de Référence</h1>
          <p style={styles.subtitle}>
            Base centralisée des taux et périodes - Gérée exclusivement par le SuperAdmin
          </p>
        </div>
        <div style={styles.headerActions}>
          <Button variant="secondary" onClick={() => navigate('/dashboard')}>
            Retour
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setForm({ categorie: '', sous_categorie: '', nom: '', description: '', taux: '', date_debut: '', date_fin: '', actif: true });
              setEditingId(null);
              setIsModalOpen(true);
            }}
          >
            Nouveau taux
          </Button>
        </div>
      </div>

      {error && (
        <div style={styles.errorContainer}>
          <span style={styles.errorIcon}>✕</span>
          <span style={styles.errorText}>{error}</span>
        </div>
      )}
      {success && (
        <div style={styles.successContainer}>
          <span style={styles.successIcon}>✓</span>
          <span style={styles.successText}>{success}</span>
        </div>
      )}

      <Card title="Filtres" variant="primary" style={{ marginBottom: '24px' }}>
        <div style={styles.filterGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Catégorie</label>
            <select
              style={styles.select}
              value={filterCategorie}
              onChange={(e) => setFilterCategorie(e.target.value)}
            >
              <option value="">Toutes</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Statut</label>
            <select
              style={styles.select}
              value={filterActif}
              onChange={(e) => setFilterActif(e.target.value)}
            >
              <option value="">Tous</option>
              <option value="true">Actifs</option>
              <option value="false">Inactifs</option>
            </select>
          </div>
          <div style={styles.filterActions}>
            <Button variant="secondary" onClick={() => { setFilterCategorie(''); setFilterActif(''); }}>
              Réinitialiser
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Liste des taux de référence" variant="primary">
        <div style={styles.statsRow}>
          <span style={styles.statsText}>
            Total: <strong>{taux.length}</strong> taux
            {taux.filter(t => t.actif).length > 0 && 
              ` · Actifs: ${taux.filter(t => t.actif).length}`
            }
          </span>
        </div>
        <Table columns={columns} data={taux} loading={loading} actions={actions} />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Modifier le taux de référence' : 'Nouveau taux de référence'}
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
            <div style={styles.formGroup}>
              <label style={styles.label}>Catégorie *</label>
              <select
                style={styles.select}
                name="categorie"
                value={form.categorie}
                onChange={handleChange}
                required
                disabled={formLoading}
              >
                <option value="">-- Choisir --</option>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <Input
              label="Sous-catégorie"
              name="sous_categorie"
              value={form.sous_categorie}
              onChange={handleChange}
              disabled={formLoading}
              placeholder="Ex: Standard, Réduite..."
            />
            <Input
              label="Nom *"
              name="nom"
              value={form.nom}
              onChange={handleChange}
              required
              disabled={formLoading}
              placeholder="Ex: TVA Standard 2024"
            />
            <Input
              label="Taux (%) *"
              name="taux"
              type="number"
              step="0.01"
              min="0"
              value={form.taux}
              onChange={handleChange}
              required
              disabled={formLoading}
              placeholder="Ex: 19.5"
            />
            <Input
              label="Date début *"
              name="date_debut"
              type="date"
              value={form.date_debut}
              onChange={handleChange}
              required
              disabled={formLoading}
            />
            <Input
              label="Date fin *"
              name="date_fin"
              type="date"
              value={form.date_fin}
              onChange={handleChange}
              required
              disabled={formLoading}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              style={styles.textarea}
              name="description"
              value={form.description}
              onChange={handleChange}
              disabled={formLoading}
              rows="3"
              placeholder="Description détaillée du taux"
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
  errorIcon: { color: '#991B1B', fontSize: '16px', fontWeight: 'bold' },
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
  successIcon: { color: '#065F46', fontSize: '16px', fontWeight: 'bold' },
  successText: { color: '#065F46', fontSize: '13px', fontWeight: 500 },
  filterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    alignItems: 'end',
  },
  filterActions: { display: 'flex', alignItems: 'end', gap: '8px' },
  statsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  statsText: { fontSize: '14px', color: '#64748B' },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '16px',
  },
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