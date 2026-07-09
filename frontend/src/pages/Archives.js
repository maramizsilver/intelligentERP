// frontend/src/pages/administratif/Archives.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

export default function Archives() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const [archives, setArchives] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type_entite: 'commande', entite_id: '', motif: '', supprimer_original: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
    setLoading(true);

    try {
      await API.post('/archives', form);
      setSuccess(' Entité archivée avec succès');
      setShowForm(false);
      setForm({ type_entite: 'commande', entite_id: '', motif: '', supprimer_original: false });
      loadArchives();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
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

  const getTypeLabel = (type) => {
    const labels = {
      commande: ' Commande',
      devis: ' Devis',
      achat: ' Achat',
      client: '👤 Client'
    };
    return labels[type] || type;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🗄️ Archivage numérique</h2>
        <div>
          <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>← Retour</button>
          {peutCreer && (
            <button style={styles.addBtn} onClick={() => { setShowForm(!showForm); setForm({ type_entite: 'commande', entite_id: '', motif: '', supprimer_original: false }); }}>
              {showForm ? '✕ Fermer' : '+ Archiver une entité'}
            </button>
          )}
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.formCard}>
          <h3>Archiver une entité</h3>
          <div style={styles.formGrid}>
            <select
              style={styles.input}
              name="type_entite"
              value={form.type_entite}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="commande">Commande</option>
              <option value="devis">Devis</option>
              <option value="achat">Achat</option>
              <option value="client">Client</option>
            </select>
            <input
              style={styles.input}
              name="entite_id"
              type="number"
              placeholder="ID de l'entité"
              value={form.entite_id}
              onChange={handleChange}
              required
              disabled={loading}
            />
            <input
              style={styles.input}
              name="motif"
              placeholder="Motif de l'archivage"
              value={form.motif}
              onChange={handleChange}
              disabled={loading}
            />
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="supprimer_original"
                checked={form.supprimer_original}
                onChange={handleChange}
                disabled={loading}
              />
              Supprimer l'original après archivage
            </label>
          </div>
          <button style={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? 'Archivage...' : 'Archiver'}
          </button>
        </form>
      )}

      <div style={styles.tableCard}>
        {loading && !showForm ? (
          <p style={styles.loading}>Chargement...</p>
        ) : archives.length === 0 ? (
          <p style={styles.empty}>Aucune archive</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Type</th>
                <th>ID original</th>
                <th>Motif</th>
                <th>Archivé par</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {archives.map((arch) => (
                <tr key={arch.id}>
                  <td>{getTypeLabel(arch.type_entite)}</td>
                  <td>#{arch.entite_id}</td>
                  <td>{arch.motif || '—'}</td>
                  <td>{arch.archived_by || '—'}</td>
                  <td>{new Date(arch.archived_at).toLocaleDateString('fr-FR')}</td>
                  <td>
                    <button style={styles.viewBtn} onClick={() => handleViewDetail(arch.id)}>voir</button>
                    {arch.type_entite === 'client' && (
                      <button style={styles.restoreBtn} onClick={() => handleRestaurer(arch.id)}>↩restaure</button>
                    )}
                    {peutSupprimer && (
                      <button style={styles.deleteBtn} onClick={() => handleDelete(arch.id)}>suppr</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showDetail && detailArchive && (
        <div style={styles.modalOverlay} onClick={() => setShowDetail(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Détails de l'archive</h3>
            <p><strong>Type:</strong> {getTypeLabel(detailArchive.type_entite)}</p>
            <p><strong>ID original:</strong> #{detailArchive.entite_id}</p>
            <p><strong>Motif:</strong> {detailArchive.motif || 'Non spécifié'}</p>
            <p><strong>Date:</strong> {new Date(detailArchive.archived_at).toLocaleString('fr-FR')}</p>
            <hr style={styles.modalHr} />
            <h4>Données archivées (JSON)</h4>
            <pre style={styles.jsonPreview}>
              {JSON.stringify(JSON.parse(detailArchive.donnees), null, 2)}
            </pre>
            <button style={styles.modalCloseBtn} onClick={() => setShowDetail(false)}>Fermer</button>
          </div>
        </div>
      )}
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
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#334155' },
  submitBtn: { padding: '12px 24px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '600' },
  tableCard: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  viewBtn: { padding: '4px 10px', backgroundColor: '#e0f2fe', color: '#075985', border: 'none', borderRadius: '6px', cursor: 'pointer', marginRight: '4px', fontSize: '14px' },
  restoreBtn: { padding: '4px 10px', backgroundColor: '#d1fae5', color: '#065f46', border: 'none', borderRadius: '6px', cursor: 'pointer', marginRight: '4px', fontSize: '14px' },
  deleteBtn: { padding: '4px 10px', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
  loading: { textAlign: 'center', color: '#64748b', padding: '20px' },
  empty: { textAlign: 'center', color: '#94a3b8', padding: '40px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflow: 'auto' },
  modalHr: { margin: '16px 0' },
  jsonPreview: { backgroundColor: '#f1f5f9', padding: '16px', borderRadius: '8px', fontSize: '12px', maxHeight: '300px', overflow: 'auto' },
  modalCloseBtn: { padding: '10px 20px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '16px' }
};
