import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import API from '../../utils/api';

import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';

export default function Entrepots() {
  const { hasPermission } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [entrepots, setEntrepots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    adresse: '',
    capacite: '',
    gerant: '',
    actif: true
  });
  const [formLoading, setFormLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, nom: '' });

  const peutModifier = hasPermission('Entrepots', 'modification');
  const peutSupprimer = hasPermission('Entrepots', 'suppression');

  useEffect(() => {
    loadEntrepots();
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

  const handleOpenModal = (entrepot = null) => {
    if (entrepot) {
      setEditId(entrepot.id);
      setFormData({
        nom: entrepot.nom,
        adresse: entrepot.adresse || '',
        capacite: entrepot.capacite || '',
        gerant: entrepot.gerant || '',
        actif: entrepot.actif !== undefined ? entrepot.actif : true
      });
    } else {
      setEditId(null);
      setFormData({ nom: '', adresse: '', capacite: '', gerant: '', actif: true });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFormLoading(true);

    try {
      if (editId) {
        await API.put(`/entrepots/${editId}`, formData);
        setSuccess(t('entrepot_modifie'));
      } else {
        await API.post('/entrepots', formData);
        setSuccess(t('entrepot_cree'));
      }
      setModalOpen(false);
      loadEntrepots();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActif = async (id, actif) => {
    try {
      await API.patch(`/entrepots/${id}`, { actif: !actif });
      setSuccess(t('entrepot_actif_modifie'));
      loadEntrepots();
    } catch (err) {
      setError('Erreur');
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/entrepots/${deleteModal.id}`);
      setSuccess(t('entrepot_supprime_succes'));
      setDeleteModal({ open: false, id: null, nom: '' });
      loadEntrepots();
    } catch (err) {
      setError('Erreur');
    }
  };

  const columns = [
    { key: 'nom', label: t('nom_entrepot') },
    { key: 'adresse', label: t('adresse_entrepot') },
    { key: 'capacite', label: t('capacite_stock') },
    { key: 'gerant', label: t('gerant_entrepot') },
    {
      key: 'actif',
      label: t('statut'),
      render: (row) => (
        <Badge variant={row.actif ? 'success' : 'danger'}>
          {row.actif ? t('actif_entrepot') : t('inactif_entrepot')}
        </Badge>
      )
    }
  ];

  const actions = [
    {
      label: t('voir_stock_entrepot'),
      variant: 'primary',
      onClick: (row) => navigate(`/entrepots/${row.id}/stock`)
    },
    ...(peutModifier ? [{
      label: t('modifier'),
      variant: 'secondary',
      onClick: (row) => handleOpenModal(row)
    }] : []),
    ...(peutModifier ? [{
      label: row => row.actif ? t('inactif_entrepot') : t('actif_entrepot'),
      variant: 'warning',
      onClick: (row) => handleToggleActif(row.id, row.actif)
    }] : []),
    ...(peutSupprimer ? [{
      label: t('supprimer'),
      variant: 'danger',
      onClick: (row) => setDeleteModal({ open: true, id: row.id, nom: row.nom })
    }] : [])
  ];

  if (loading && entrepots.length === 0) {
    return <LoadingSpinner size="lg" text={t('chargement')} />;
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{t('gestion_entrepots')}</h1>
          <p style={styles.subtitle}>{t('entrepots_gerer')}</p>
        </div>
        <div style={styles.headerActions}>
          <Button variant="secondary" onClick={() => navigate('/dashboard')} icon="←">
            {t('retour')}
          </Button>
          {peutModifier && (
            <Button variant="primary" onClick={() => handleOpenModal()} icon="+">
              {t('ajouter_entrepot')}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div style={styles.errorContainer}>
          <span>X</span>
          <span style={styles.errorText}>{error}</span>
        </div>
      )}
      {success && (
        <div style={styles.successContainer}>
          <span>✅</span>
          <span style={styles.successText}>{success}</span>
        </div>
      )}

      {entrepots.length === 0 ? (
        <EmptyState
          title={t('aucun_entrepot')}
          description={t('entrepots_gerer')}
          action={peutModifier ? {
            label: t('ajouter_entrepot'),
            onClick: () => handleOpenModal()
          } : null}
        />
      ) : (
        <Card title={t('liste_entrepots')} variant="primary">
          <Table columns={columns} data={entrepots} actions={actions} />
        </Card>
      )}

      {/* Modal Création/Modification */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? t('modifier_entrepot_titre') : t('creer_entrepot_titre')}
      >
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={styles.modalError}>
              <span style={styles.errorText}>{error}</span>
            </div>
          )}
          <div style={styles.modalGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>{t('nom_entrepot')} *</label>
              <input
                style={styles.input}
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                required
                disabled={formLoading}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>{t('adresse_entrepot')}</label>
              <input
                style={styles.input}
                value={formData.adresse}
                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                disabled={formLoading}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>{t('capacite_stock')}</label>
              <input
                style={styles.input}
                type="number"
                value={formData.capacite}
                onChange={(e) => setFormData({ ...formData, capacite: e.target.value })}
                disabled={formLoading}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>{t('gerant_entrepot')}</label>
              <input
                style={styles.input}
                value={formData.gerant}
                onChange={(e) => setFormData({ ...formData, gerant: e.target.value })}
                disabled={formLoading}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>{t('statut')}</label>
              <select
                style={styles.select}
                value={formData.actif ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, actif: e.target.value === 'true' })}
                disabled={formLoading}
              >
                <option value="true">{t('actif_entrepot')}</option>
                <option value="false">{t('inactif_entrepot')}</option>
              </select>
            </div>
          </div>
          <div style={styles.modalActions}>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={formLoading}>
              {t('annuler')}
            </Button>
            <Button type="submit" variant="primary" loading={formLoading}>
              {editId ? t('modifier') : t('creer')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Suppression */}
      <Modal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null, nom: '' })}
        title={t('supprimer')}
        variant="danger"
      >
        <p>
          {t('entrepot_supprime_confirmation')}
          <br />
          <strong>"{deleteModal.nom}"</strong>
        </p>
        <div style={styles.modalActions}>
          <Button variant="secondary" onClick={() => setDeleteModal({ open: false, id: null, nom: '' })}>
            {t('annuler')}
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            {t('supprimer')}
          </Button>
        </div>
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
  modalError: {
    backgroundColor: '#FEF2F2',
    padding: '8px 12px',
    borderRadius: '6px',
    marginBottom: '12px',
  },
  modalGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '13px', fontWeight: 600, color: '#334155' },
  input: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '2px solid #E2E8F0',
    fontSize: '14px',
    backgroundColor: '#F8FAFC',
    outline: 'none',
    transition: 'all 0.2s ease',
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
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '16px',
  },
};