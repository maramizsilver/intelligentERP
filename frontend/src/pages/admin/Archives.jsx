import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import API from '../../utils/api';

import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';

export default function Archives() {
  const { hasPermission } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type_entite: 'commande',
    entite_id: '',
    motif: '',
    supprimer_original: false
  });
  const [formLoading, setFormLoading] = useState(false);

  const [detailArchive, setDetailArchive] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const peutCreer = hasPermission('Documents', 'creation');
  const peutSupprimer = hasPermission('Documents', 'suppression');

  useEffect(() => {
    loadArchives();
  }, []);

  const loadArchives = async () => {
    try {
      setLoading(true);
      const res = await API.get('/archives');
      setArchives(res.data.archives || []);
    } catch (err) {
      setError(t('erreur_chargement_archives') || 'Impossible de charger les archives');
    } finally {
      setLoading(false);
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
      await API.post('/archives', form);
      setSuccess(t('entite_archivee') || 'Entité archivée avec succès');
      setShowForm(false);
      setForm({ type_entite: 'commande', entite_id: '', motif: '', supprimer_original: false });
      loadArchives();
    } catch (err) {
      setError(err.response?.data?.message || t('erreur_archivage') || 'Erreur');
    } finally {
      setFormLoading(false);
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const res = await API.get(`/archives/${id}`);
      setDetailArchive(res.data.archive);
      setShowDetail(true);
    } catch (err) {
      setError(t('erreur_chargement_archive') || 'Erreur lors du chargement des détails');
    }
  };

  const handleRestaurer = async (id) => {
    if (!window.confirm(t('restaurer_archive_confirmation') || 'Restaurer cette archive ?')) return;
    try {
      await API.post(`/archives/${id}/restaurer`);
      setSuccess(t('archive_restauree') || 'Archive restaurée avec succès');
      loadArchives();
    } catch (err) {
      setError(err.response?.data?.message || t('erreur_restauration_archive') || 'Erreur');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('supprimer_archive_confirmation') || 'Supprimer définitivement cette archive ?')) return;
    try {
      await API.delete(`/archives/${id}`);
      setSuccess(t('archive_supprimee_definitivement') || 'Archive supprimée définitivement');
      loadArchives();
    } catch (err) {
      setError(err.response?.data?.message || t('erreur_suppression_archive') || 'Erreur');
    }
  };

  const getTypeBadge = (type) => {
    const types = {
      commande: { label: t('type_commande_archive') || 'Commande', variant: 'primary' },
      devis: { label: t('type_devis_archive') || 'Devis', variant: 'warning' },
      achat: { label: t('type_achat_archive') || 'Achat', variant: 'success' },
      client: { label: t('type_client_archive') || 'Client', variant: 'secondary' }
    };
    return types[type] || { label: type, variant: 'outline' };
  };

  const getTypeLabel = (type) => {
    const types = {
      commande: t('commande') || 'Commande',
      devis: t('devis'),
      achat: t('achat') || 'Achat',
      client: t('client') || 'Client'
    };
    return types[type] || type;
  };

  const columns = [
    {
      key: 'type_entite',
      label: t('type_entite') || 'Type',
      render: (row) => {
        const type = getTypeBadge(row.type_entite);
        return <Badge variant={type.variant}>{type.label}</Badge>;
      }
    },
    {
      key: 'entite_id',
      label: t('id_original') || 'ID original',
      render: (row) => `#${row.entite_id}`
    },
    { key: 'motif', label: t('motif_archivage') || 'Motif' },
    { key: 'archived_by', label: t('archive_par') || 'Archivé par' },
    {
      key: 'archived_at',
      label: t('date_archivage') || 'Date',
      render: (row) => new Date(row.archived_at).toLocaleDateString('fr-FR')
    }
  ];

  const actions = [
    {
      label: t('voir_archive') || 'Voir',
      variant: 'primary',
      onClick: (row) => handleViewDetail(row.id)
    }
  ];

  if (peutCreer) {
    actions.push({
      label: t('restaurer_archive') || 'Restaurer',
      variant: 'success',
      onClick: (row) => handleRestaurer(row.id),
      disabled: (row) => row.type_entite !== 'client'
    });
  }

  if (peutSupprimer) {
    actions.push({
      label: t('supprimer_archive') || 'Supprimer',
      variant: 'danger',
      onClick: (row) => handleDelete(row.id)
    });
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{t('archivage_numerique_titre') || 'Archivage numérique'}</h1>
          <p style={styles.subtitle}>{t('gerer_archives_documents') || 'Gérez vos archives et documents historiques'}</p>
        </div>
        <div style={styles.headerActions}>
          <Button variant="secondary" onClick={() => navigate('/dashboard')} icon="←">
            {t('retour')}
          </Button>
          {peutCreer && (
            <Button
              variant="primary"
              icon={showForm ? '✕' : '+'}
              onClick={() => {
                setShowForm(!showForm);
                setForm({ type_entite: 'commande', entite_id: '', motif: '', supprimer_original: false });
              }}
            >
              {showForm ? t('fermer') : t('archiver_entite') || 'Archiver une entité'}
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
          <span>OK</span>
          <span style={styles.successText}>{success}</span>
        </div>
      )}

      {showForm && (
        <Card title={t('archiver_entite') || 'Archiver une entité'} variant="primary" style={{ marginBottom: '24px' }}>
          <form onSubmit={handleSubmit}>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>{t('type_entite') || "Type d'entité"} *</label>
                <select
                  style={styles.select}
                  name="type_entite"
                  value={form.type_entite}
                  onChange={handleChange}
                  disabled={formLoading}
                >
                  <option value="commande">{t('type_commande_archive') || 'Commande'}</option>
                  <option value="devis">{t('type_devis_archive') || 'Devis'}</option>
                  <option value="achat">{t('type_achat_archive') || 'Achat'}</option>
                  <option value="client">{t('type_client_archive') || 'Client'}</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>{t('entite_id_label') || "ID de l'entité *"}</label>
                <input
                  style={styles.input}
                  name="entite_id"
                  type="number"
                  placeholder={t('entite_id_label') || "ID de l'entité"}
                  value={form.entite_id}
                  onChange={handleChange}
                  required
                  disabled={formLoading}
                  min="1"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>{t('motif_archivage_label') || "Motif de l'archivage"}</label>
                <input
                  style={styles.input}
                  name="motif"
                  placeholder={t('motif_archivage_label') || "Motif de l'archivage"}
                  value={form.motif}
                  onChange={handleChange}
                  disabled={formLoading}
                />
              </div>
              <div style={styles.checkboxGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="supprimer_original"
                    checked={form.supprimer_original}
                    onChange={handleChange}
                    disabled={formLoading}
                  />
                  <span>{t('supprimer_original') || "Supprimer l'original après archivage"}</span>
                </label>
              </div>
            </div>
            <Button type="submit" variant="primary" loading={formLoading} fullWidth>
              {t('archiver') || 'Archiver'}
            </Button>
          </form>
        </Card>
      )}

      <Card title={t('liste_archives') || 'Liste des archives'} variant="primary">
        <Table columns={columns} data={archives} loading={loading} actions={actions} />
      </Card>

      {showDetail && detailArchive && (
        <div style={styles.modalOverlay} onClick={() => setShowDetail(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>{t('details_archive') || "Détails de l'archive"}</h3>
            <div style={styles.modalInfo}>
              <p><strong>{t('type_entite') || 'Type:'}</strong> {getTypeLabel(detailArchive.type_entite)}</p>
              <p><strong>{t('id_original') || 'ID original:'}</strong> #{detailArchive.entite_id}</p>
              <p><strong>{t('motif_archivage') || 'Motif:'}</strong> {detailArchive.motif || t('non_specifie_archive') || 'Non spécifié'}</p>
              <p><strong>{t('date_archivage') || 'Date:'}</strong> {new Date(detailArchive.archived_at).toLocaleString('fr-FR')}</p>
            </div>
            <hr style={styles.modalHr} />
            <h4>{t('donnees_archivees') || 'Données archivées (JSON)'}</h4>
            <pre style={styles.jsonPreview}>
              {JSON.stringify(JSON.parse(detailArchive.donnees), null, 2)}
            </pre>
            <div style={styles.modalActions}>
              <Button variant="secondary" onClick={() => setShowDetail(false)}>
                {t('fermer')}
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
    width: '100%',
    boxSizing: 'border-box',
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
  checkboxGroup: { display: 'flex', alignItems: 'center', marginBottom: '16px' },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#334155',
    cursor: 'pointer',
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
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalTitle: { margin: '0 0 16px', color: '#0F172A' },
  modalInfo: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    marginBottom: '16px',
  },
  modalHr: { margin: '16px 0', border: 'none', borderTop: '1px solid #E2E8F0' },
  jsonPreview: {
    backgroundColor: '#F1F5F9',
    padding: '16px',
    borderRadius: '8px',
    fontSize: '12px',
    maxHeight: '300px',
    overflow: 'auto',
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px',
    justifyContent: 'flex-end',
  },
};