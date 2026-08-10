// frontend/src/pages/admin/superadmin/TauxReference.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
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
  const { t } = useLanguage();
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
      setError(t('erreur_chargement_taux') || 'Impossible de charger les taux de référence');
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
        setSuccess(t('taux_modifie') || 'Taux de référence mis à jour avec succès');
      } else {
        await API.post('/admin/taux-reference', form);
        setSuccess(t('taux_cree') || 'Taux de référence créé avec succès');
      }
      setIsModalOpen(false);
      setEditingId(null);
      setForm({ categorie: '', sous_categorie: '', nom: '', description: '', taux: '', date_debut: '', date_fin: '', actif: true });
      loadTaux();
    } catch (err) {
      setError(err.response?.data?.message || t('erreur_taux') || 'Erreur');
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
      setSuccess(actif ? t('taux_desactive') || 'Taux désactivé' : t('taux_active') || 'Taux activé');
      loadTaux();
    } catch (err) {
      setError(err.response?.data?.message || t('erreur_toggle_taux') || 'Erreur');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirmation_suppression_taux') || 'Supprimer définitivement ce taux de référence ?')) return;
    try {
      await API.delete(`/admin/taux-reference/${id}`);
      setSuccess(t('taux_supprime') || 'Taux de référence supprimé');
      loadTaux();
    } catch (err) {
      setError(err.response?.data?.message || t('erreur_suppression_taux') || 'Erreur');
    }
  };

  const columns = [
    { key: 'categorie', label: t('categorie') || 'Catégorie' },
    { key: 'nom', label: t('nom') },
    { key: 'description', label: t('description') },
    { key: 'taux', label: t('taux') || 'Taux', render: (row) => `${row.taux}%` },
    {
      key: 'date_debut',
      label: t('date_debut') || 'Date début',
      render: (row) => new Date(row.date_debut).toLocaleDateString('fr-FR')
    },
    {
      key: 'date_fin',
      label: t('date_fin') || 'Date fin',
      render: (row) => new Date(row.date_fin).toLocaleDateString('fr-FR')
    },
    {
      key: 'actif',
      label: t('statut'),
      render: (row) => (
        <Badge variant={row.actif ? 'success' : 'danger'}>
          {row.actif ? (t('taux_actif') || 'Actif') : (t('taux_inactif') || 'Inactif')}
        </Badge>
      )
    },
    {
      key: 'version',
      label: t('version') || 'Version',
      render: (row) => {
        const versionText = t('taux_version') || 'v{version}';
        return versionText.replace('{version}', row.version || 1);
      }
    }
  ];

  const actions = [
    {
      label: t('modifier'),
      variant: 'primary',
      onClick: (row) => handleEdit(row)
    },
    {
      label: t('actif_inactif') || 'Activer/Désactiver',
      variant: 'warning',
      onClick: (row) => handleToggle(row.id, row.actif)
    },
    {
      label: t('supprimer'),
      variant: 'danger',
      onClick: (row) => handleDelete(row.id)
    }
  ];

  if (!user?.is_super_admin) {
    return (
      <div>
        <div style={styles.header}>
          <h1 style={styles.title}>{t('acces_refuse') || 'Accès refusé'}</h1>
          <p style={styles.subtitle}>{t('acces_reserve_superadmin') || 'Cette page est réservée au SuperAdmin de la plateforme.'}</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/dashboard')}>
          {t('retour')}
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{t('gestion_taux_reference') || 'Gestion des Taux de Référence'}</h1>
          <p style={styles.subtitle}>
            {t('base_centralisee_taux') || 'Base centralisée des taux et périodes - Gérée exclusivement par le SuperAdmin'}
          </p>
        </div>
        <div style={styles.headerActions}>
          <Button variant="secondary" onClick={() => navigate('/dashboard')}>
            {t('retour')}
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setForm({ categorie: '', sous_categorie: '', nom: '', description: '', taux: '', date_debut: '', date_fin: '', actif: true });
              setEditingId(null);
              setIsModalOpen(true);
            }}
          >
            {t('nouveau_taux') || 'Nouveau taux'}
          </Button>
        </div>
      </div>

      {error && (
        <div style={styles.errorContainer}>
          <span style={styles.errorText}>{error}</span>
        </div>
      )}
      {success && (
        <div style={styles.successContainer}>
          <span style={styles.successText}>{success}</span>
        </div>
      )}

      <Card title={t('filtres') || 'Filtres'} variant="primary" style={{ marginBottom: '24px' }}>
        <div style={styles.filterGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>{t('categorie') || 'Catégorie'}</label>
            <select
              style={styles.select}
              value={filterCategorie}
              onChange={(e) => setFilterCategorie(e.target.value)}
            >
              <option value="">{t('toutes_categories') || 'Toutes'}</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>{t('statut')}</label>
            <select
              style={styles.select}
              value={filterActif}
              onChange={(e) => setFilterActif(e.target.value)}
            >
              <option value="">{t('tous') || 'Tous'}</option>
              <option value="true">{t('taux_actifs') || 'Actifs'}</option>
              <option value="false">{t('taux_inactifs') || 'Inactifs'}</option>
            </select>
          </div>
          <div style={styles.filterActions}>
            <Button variant="secondary" onClick={() => { setFilterCategorie(''); setFilterActif(''); }}>
              {t('reinitialiser_filtres') || 'Réinitialiser'}
            </Button>
          </div>
        </div>
      </Card>

      <Card title={t('liste_taux') || 'Liste des taux de référence'} variant="primary">
        <div style={styles.statsRow}>
          <span style={styles.statsText}>
            {t('total_taux') || 'Total:'} <strong>{taux.length}</strong> {t('taux') || 'taux'}
            {taux.filter(t => t.actif).length > 0 && 
              ` · ${t('taux_actifs') || 'Actifs'}: ${taux.filter(t => t.actif).length}`
            }
          </span>
        </div>
        <Table columns={columns} data={taux} loading={loading} actions={actions} />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? (t('modifier_taux') || 'Modifier le taux de référence') : (t('creer_taux') || 'Nouveau taux de référence')}
        size="lg"
        actions={[
          {
            label: editingId ? (t('modifier') || 'Mettre à jour') : (t('creer') || 'Créer'),
            variant: 'primary',
            onClick: handleSubmit,
            loading: formLoading,
          },
        ]}
      >
        <form onSubmit={handleSubmit}>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>{t('categorie') || 'Catégorie'} *</label>
              <select
                style={styles.select}
                name="categorie"
                value={form.categorie}
                onChange={handleChange}
                required
                disabled={formLoading}
              >
                <option value="">-- {t('choisir') || 'Choisir'} --</option>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <Input
              label={t('sous_categorie') || 'Sous-catégorie'}
              name="sous_categorie"
              value={form.sous_categorie}
              onChange={handleChange}
              disabled={formLoading}
              placeholder={t('exemple_sous_categorie') || 'Ex: Standard, Réduite...'}
            />
            <Input
              label={t('nom') + ' *'}
              name="nom"
              value={form.nom}
              onChange={handleChange}
              required
              disabled={formLoading}
              placeholder={t('exemple_taux') || 'Ex: TVA Standard 2024'}
            />
            <Input
              label={t('taux_obligatoire') || 'Taux (%) *'}
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
              label={t('date_debut_obligatoire') || 'Date début *'}
              name="date_debut"
              type="date"
              value={form.date_debut}
              onChange={handleChange}
              required
              disabled={formLoading}
            />
            <Input
              label={t('date_fin_obligatoire') || 'Date fin *'}
              name="date_fin"
              type="date"
              value={form.date_fin}
              onChange={handleChange}
              required
              disabled={formLoading}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>{t('description')}</label>
            <textarea
              style={styles.textarea}
              name="description"
              value={form.description}
              onChange={handleChange}
              disabled={formLoading}
              rows="3"
              placeholder={t('description_taux') || 'Description détaillée du taux'}
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
              <span>{t('actif_taux') || 'Actif'}</span>
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