// src/pages/admin/Archives.jsx
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

export default function Archives() {
  const { hasPermission } = useAuth();
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
      setError('Impossible de charger les archives');
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
      setSuccess(' Entité archivée avec succès');
      setShowForm(false);
      setForm({ type_entite: 'commande', entite_id: '', motif: '', supprimer_original: false });
      loadArchives();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
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
      setError('Erreur lors du chargement des détails');
    }
  };

  const handleRestaurer = async (id) => {
    if (!window.confirm('Restaurer cette archive ?')) return;
    try {
      await API.post(`/archives/${id}/restaurer`);
      setSuccess(' Archive restaurée avec succès');
      loadArchives();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer définitivement cette archive ?')) return;
    try {
      await API.delete(`/archives/${id}`);
      setSuccess(' Archive supprimée définitivement');
      loadArchives();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const getTypeBadge = (type) => {
    const types = {
      commande: { label: ' Commande', variant: 'primary' },
      devis: { label: ' Devis', variant: 'warning' },
      achat: { label: ' Achat', variant: 'success' },
      client: { label: ' Client', variant: 'secondary' }
    };
    return types[type] || { label: type, variant: 'outline' };
  };

  const columns = [
    {
      key: 'type_entite',
      label: 'Type',
      render: (row) => {
        const type = getTypeBadge(row.type_entite);
        return <Badge variant={type.variant}>{type.label}</Badge>;
      }
    },
    {
      key: 'entite_id',
      label: 'ID original',
      render: (row) => `#${row.entite_id}`
    },
    { key: 'motif', label: 'Motif' },
    { key: 'archived_by', label: 'Archivé par' },
    {
      key: 'archived_at',
      label: 'Date',
      render: (row) => new Date(row.archived_at).toLocaleDateString('fr-FR')
    }
  ];

  const actions = [
    {
      label: ' Voir',
      variant: 'primary',
      onClick: (row) => handleViewDetail(row.id)
    }
  ];

  if (peutCreer) {
    actions.push({
      label: '↩ Restaurer',
      variant: 'success',
      onClick: (row) => handleRestaurer(row.id),
      disabled: (row) => row.type_entite !== 'client'
    });
  }

  if (peutSupprimer) {
    actions.push({
      label: ' Supprimer',
      variant: 'danger',
      onClick: (row) => handleDelete(row.id)
    });
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}> Archivage numérique</h1>
          <p style={styles.subtitle}>Gérez vos archives et documents historiques</p>
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
                setForm({ type_entite: 'commande', entite_id: '', motif: '', supprimer_original: false });
              }}
            >
              {showForm ? 'Fermer' : 'Archiver une entité'}
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
          <span>Done</span>
          <span style={styles.successText}>{success}</span>
        </div>
      )}

      {showForm && (
        <Card title=" Archiver une entité" variant="primary" style={{ marginBottom: '24px' }}>
          <form onSubmit={handleSubmit}>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Type d'entité *</label>
                <select
                  style={styles.select}
                  name="type_entite"
                  value={form.type_entite}
                  onChange={handleChange}
                  disabled={formLoading}
                >
                  <option value="commande">Commande</option>
                  <option value="devis"> Devis</option>
                  <option value="achat"> Achat</option>
                  <option value="client">Client</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>ID de l'entité *</label>
                <input
                  style={styles.input}
                  name="entite_id"
                  type="number"
                  placeholder="ID de l'entité"
                  value={form.entite_id}
                  onChange={handleChange}
                  required
                  disabled={formLoading}
                  min="1"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Motif de l'archivage</label>
                <input
                  style={styles.input}
                  name="motif"
                  placeholder="Motif de l'archivage"
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
                  <span> Supprimer l'original après archivage</span>
                </label>
              </div>
            </div>
            <Button type="submit" variant="primary" loading={formLoading} fullWidth>
              Archiver
            </Button>
          </form>
        </Card>
      )}

      <Card title=" Liste des archives" variant="primary">
        <Table columns={columns} data={archives} loading={loading} actions={actions} />
      </Card>

      {/* Modal Détails */}
      {showDetail && detailArchive && (
        <div style={styles.modalOverlay} onClick={() => setShowDetail(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Détails de l'archive</h3>
            <div style={styles.modalInfo}>
              <p><strong>Type:</strong> {getTypeBadge(detailArchive.type_entite).label}</p>
              <p><strong>ID original:</strong> #{detailArchive.entite_id}</p>
              <p><strong>Motif:</strong> {detailArchive.motif || 'Non spécifié'}</p>
              <p><strong>Date:</strong> {new Date(detailArchive.archived_at).toLocaleString('fr-FR')}</p>
            </div>
            <hr style={styles.modalHr} />
            <h4> Données archivées (JSON)</h4>
            <pre style={styles.jsonPreview}>
              {JSON.stringify(JSON.parse(detailArchive.donnees), null, 2)}
            </pre>
            <div style={styles.modalActions}>
              <Button variant="secondary" onClick={() => setShowDetail(false)}>
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
    ':focus': {
      borderColor: '#0EA5E9',
      boxShadow: '0 0 0 3px rgba(14, 165, 233, 0.15)',
    },
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