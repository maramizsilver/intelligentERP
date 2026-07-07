// frontend/src/pages/administratif/Documents.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';

export default function Documents() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nom: '',
    type_document: 'autre',
    reference_type: '',
    reference_id: ''
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    setLoading(true);

    if (!file) {
      setError('Veuillez sélectionner un fichier');
      setLoading(false);
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
      setSuccess('✅ Document uploadé avec succès');
      setShowForm(false);
      setForm({ nom: '', type_document: 'autre', reference_type: '', reference_id: '' });
      setFile(null);
      loadDocuments();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'upload');
    } finally {
      setLoading(false);
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

  const getTypeLabel = (type) => {
    const labels = {
      facture: '📄 Facture',
      contrat: ' Contrat',
      bon_commande: ' Bon de commande',
      devis: ' Devis',
      identite: ' Identité',
      autre: ' Autre'
    };
    return labels[type] || type;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / 1048576).toFixed(1)} Mo`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}> Gestion Documentaire</h2>
        <div>
          <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>← Retour</button>
          {peutCreer && (
            <button style={styles.addBtn} onClick={() => { setShowForm(!showForm); setForm({ nom: '', type_document: 'autre', reference_type: '', reference_id: '' }); setFile(null); }}>
              {showForm ? '✕ Fermer' : '+ Uploader un document'}
            </button>
          )}
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.formCard}>
          <h3>Uploader un document</h3>
          <div style={styles.formGrid}>
            <input
              style={styles.input}
              name="nom"
              placeholder="Nom du document"
              value={form.nom}
              onChange={handleChange}
              disabled={loading}
            />
            <select
              style={styles.input}
              name="type_document"
              value={form.type_document}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="autre">Autre</option>
              <option value="facture">Facture</option>
              <option value="contrat">Contrat</option>
              <option value="bon_commande">Bon de commande</option>
              <option value="devis">Devis</option>
              <option value="identite">Identité</option>
            </select>
            <select
              style={styles.input}
              name="reference_type"
              value={form.reference_type}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="">Sans référence</option>
              <option value="commande">Commande</option>
              <option value="devis">Devis</option>
              <option value="client">Client</option>
              <option value="fournisseur">Fournisseur</option>
            </select>
            <input
              style={styles.input}
              name="reference_id"
              placeholder="ID de référence"
              value={form.reference_id}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div style={styles.fileInput}>
            <label style={styles.fileLabel}>
              📎 Sélectionner un fichier
              <input
                type="file"
                onChange={handleFileChange}
                style={styles.hiddenFileInput}
                disabled={loading}
              />
            </label>
            {file && <span style={styles.fileName}>{file.name} ({formatFileSize(file.size)})</span>}
          </div>

          <button style={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? 'Upload en cours...' : ' Uploader'}
          </button>
        </form>
      )}

      <div style={styles.tableCard}>
        {loading && !showForm ? (
          <p style={styles.loading}>Chargement...</p>
        ) : documents.length === 0 ? (
          <p style={styles.empty}>Aucun document</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Type</th>
                <th>Référence</th>
                <th>Taille</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td><strong>{doc.nom}</strong></td>
                  <td>{getTypeLabel(doc.type_document)}</td>
                  <td>
                    {doc.reference_type && doc.reference_id
                      ? `${doc.reference_type} #${doc.reference_id}`
                      : '—'}
                  </td>
                  <td>{formatFileSize(doc.taille_octets)}</td>
                  <td>{new Date(doc.created_at).toLocaleDateString('fr-FR')}</td>
                  <td>
                    <button style={styles.downloadBtn} onClick={() => handleDownload(doc.id, doc.nom_original)}>⬇️</button>
                    {peutSupprimer && (
                      <button style={styles.deleteBtn} onClick={() => handleDelete(doc.id)}>suppr</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  title: { color: '#0f172a', margin: 0, fontSize: '22px' },
  backBtn: { padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginRight: '8px' },
  addBtn: { padding: '8px 20px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  error: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '16px' },
  success: { backgroundColor: '#d1fae5', color: '#065f46', padding: '12px', borderRadius: '8px', marginBottom: '16px' },
  formCard: { backgroundColor: 'white', padding: '24px', borderRadius: '12px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' },
  input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
  fileInput: { marginBottom: '16px' },
  fileLabel: { display: 'inline-block', padding: '10px 20px', backgroundColor: '#e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  hiddenFileInput: { display: 'none' },
  fileName: { marginLeft: '12px', fontSize: '14px', color: '#334155' },
  submitBtn: { padding: '12px 24px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '600' },
  tableCard: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  downloadBtn: { padding: '4px 10px', backgroundColor: '#dbeafe', color: '#1e40af', border: 'none', borderRadius: '6px', cursor: 'pointer', marginRight: '4px', fontSize: '14px' },
  deleteBtn: { padding: '4px 10px', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
  loading: { textAlign: 'center', color: '#64748b', padding: '20px' },
  empty: { textAlign: 'center', color: '#94a3b8', padding: '40px' }
};