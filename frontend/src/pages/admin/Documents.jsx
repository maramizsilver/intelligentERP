// src/pages/admin/Documents.jsx
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

export default function Documents() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nom: '',
    type_document: 'autre',
    reference_type: '',
    reference_id: ''
  });
  const [file, setFile] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const peutCreer = hasPermission('Documents', 'creation');
  const peutSupprimer = hasPermission('Documents', 'suppression');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const res = await API.get('/documents');
      setDocuments(res.data.documents || []);
    } catch (err) {
      setError('Impossible de charger les documents');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFormLoading(true);

    if (!file) {
      setError('Veuillez sélectionner un fichier');
      setFormLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('nom', form.nom || file.name);
    formData.append('type_document', form.type_document);
    formData.append('reference_type', form.reference_type || '');
    formData.append('reference_id', form.reference_id || '');
    formData.append('fichier', file);

    try {
      await API.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(' Document uploadé avec succès');
      setShowForm(false);
      setForm({ nom: '', type_document: 'autre', reference_type: '', reference_id: '' });
      setFile(null);
      loadDocuments();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'upload');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDownload = async (id, nomOriginal) => {
    try {
      const res = await API.get(`/documents/${id}/telecharger`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', nomOriginal);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Erreur lors du téléchargement');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce document ?')) return;
    try {
      await API.delete(`/documents/${id}`);
      setSuccess(' Document supprimé');
      loadDocuments();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const getTypeBadge = (type) => {
    const types = {
      facture: { label: ' Facture', variant: 'primary' },
      contrat: { label: ' Contrat', variant: 'secondary' },
      bon_commande: { label: ' Bon de commande', variant: 'success' },
      devis: { label: ' Devis', variant: 'warning' },
      identite: { label: ' Identité', variant: 'danger' },
      autre: { label: ' Autre', variant: 'outline' }
    };
    return types[type] || types.autre;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / 1048576).toFixed(1)} Mo`;
  };

  const columns = [
    { key: 'nom', label: 'Nom' },
    {
      key: 'type_document',
      label: 'Type',
      render: (row) => {
        const type = getTypeBadge(row.type_document);
        return <Badge variant={type.variant}>{type.label}</Badge>;
      }
    },
    {
      key: 'reference',
      label: 'Référence',
      render: (row) => (
        row.reference_type && row.reference_id
          ? `${row.reference_type} #${row.reference_id}`
          : '—'
      )
    },
    {
      key: 'taille_octets',
      label: 'Taille',
      render: (row) => formatFileSize(row.taille_octets)
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (row) => new Date(row.created_at).toLocaleDateString('fr-FR')
    }
  ];

  const actions = [
    {
      label: '⬇️',
      variant: 'primary',
      onClick: (row) => handleDownload(row.id, row.nom_original)
    }
  ];

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
          <h1 style={styles.title}>Gestion Documentaire</h1>
          <p style={styles.subtitle}>Gérez tous vos documents</p>
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
                setForm({ nom: '', type_document: 'autre', reference_type: '', reference_id: '' });
                setFile(null);
              }}
            >
              {showForm ? 'Fermer' : 'Uploader un document'}
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
        <Card title=" Uploader un document" variant="primary" style={{ marginBottom: '24px' }}>
          <form onSubmit={handleSubmit}>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nom du document</label>
                <input
                  style={styles.input}
                  name="nom"
                  placeholder="Nom du document"
                  value={form.nom}
                  onChange={handleChange}
                  disabled={formLoading}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Type *</label>
                <select
                  style={styles.select}
                  name="type_document"
                  value={form.type_document}
                  onChange={handleChange}
                  disabled={formLoading}
                >
                  <option value="autre"> Autre</option>
                  <option value="facture"> Facture</option>
                  <option value="contrat"> Contrat</option>
                  <option value="bon_commande">Bon de commande</option>
                  <option value="devis"> Devis</option>
                  <option value="identite">Identité</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Type de référence</label>
                <select
                  style={styles.select}
                  name="reference_type"
                  value={form.reference_type}
                  onChange={handleChange}
                  disabled={formLoading}
                >
                  <option value="">Sans référence</option>
                  <option value="commande">Commande</option>
                  <option value="devis">Devis</option>
                  <option value="client">Client</option>
                  <option value="fournisseur">Fournisseur</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>ID de référence</label>
                <input
                  style={styles.input}
                  name="reference_id"
                  placeholder="ID de référence"
                  value={form.reference_id}
                  onChange={handleChange}
                  disabled={formLoading}
                />
              </div>
            </div>

            <div style={styles.fileInput}>
              <label style={styles.fileLabel}>
                📎 Sélectionner un fichier
                <input
                  type="file"
                  onChange={handleFileChange}
                  style={styles.hiddenFileInput}
                  disabled={formLoading}
                />
              </label>
              {file && (
                <span style={styles.fileName}>
                  {file.name} ({formatFileSize(file.size)})
                </span>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={formLoading}
              disabled={!file}
              fullWidth
            >
              {formLoading ? 'Upload en cours...' : ' Uploader le document'}
            </Button>
          </form>
        </Card>
      )}

      <Card title=" Liste des documents" variant="primary">
        <Table columns={columns} data={documents} loading={loading} actions={actions} />
      </Card>
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
  fileInput: {
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  fileLabel: {
    display: 'inline-block',
    padding: '10px 20px',
    backgroundColor: '#E2E8F0',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#CBD5E1',
    },
  },
  hiddenFileInput: { display: 'none' },
  fileName: {
    fontSize: '14px',
    color: '#334155',
    fontWeight: 500,
  },
};