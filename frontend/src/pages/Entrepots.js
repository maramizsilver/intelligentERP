// frontend/src/pages/stock/Entrepots.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';

export default function Entrepots() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const [entrepots, setEntrepots] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nom: '', adresse: '', responsable: '', actif: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const peutCreer = hasPermission('Stock', 'creation');
  const peutModifier = hasPermission('Stock', 'modification');
  const peutSupprimer = hasPermission('Stock', 'suppression');

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
      if (editingId) {
        await API.put(`/entrepots/${editingId}`, form);
        setSuccess('Entrepôt mis à jour avec succès');
      } else {
        await API.post('/entrepots', form);
        setSuccess(' Entrepôt créé avec succès');
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ nom: '', adresse: '', responsable: '', actif: true });
      loadEntrepots();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entrepot) => {
    setForm({
      nom: entrepot.nom,
      adresse: entrepot.adresse || '',
      responsable: entrepot.responsable || '',
      actif: entrepot.actif
    });
    setEditingId(entrepot.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet entrepôt ?')) return;
    try {
      await API.delete(`/entrepots/${id}`);
      setSuccess(' Entrepôt supprimé');
      loadEntrepots();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}> Gestion des Entrepôts</h2>
        <div>
          <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>← Retour</button>
          {peutCreer && (
            <button style={styles.addBtn} onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ nom: '', adresse: '', responsable: '', actif: true }); }}>
              {showForm ? '✕ Fermer' : '+ Nouvel entrepôt'}
            </button>
          )}
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.formCard}>
          <h3>{editingId ? 'Modifier' : 'Nouvel'} entrepôt</h3>
          <div style={styles.formGrid}>
            <input
              style={styles.input}
              name="nom"
              placeholder="Nom de l'entrepôt"
              value={form.nom}
              onChange={handleChange}
              required
              disabled={loading}
            />
            <input
              style={styles.input}
              name="adresse"
              placeholder="Adresse"
              value={form.adresse}
              onChange={handleChange}
              disabled={loading}
            />
            <input
              style={styles.input}
              name="responsable"
              placeholder="Responsable"
              value={form.responsable}
              onChange={handleChange}
              disabled={loading}
            />
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="actif"
                checked={form.actif}
                onChange={handleChange}
                disabled={loading}
              />
              Actif
            </label>
          </div>
          <button style={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? 'Enregistrement...' : (editingId ? 'Mettre à jour' : 'Créer')}
          </button>
        </form>
      )}

      <div style={styles.tableCard}>
        {loading && !showForm ? (
          <p style={styles.loading}>Chargement...</p>
        ) : entrepots.length === 0 ? (
          <p style={styles.empty}>Aucun entrepôt enregistré</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Adresse</th>
                <th>Responsable</th>
                <th>Statut</th>
                {(peutModifier || peutSupprimer) && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {entrepots.map((e) => (
                <tr key={e.id}>
                  <td><strong>{e.nom}</strong></td>
                  <td>{e.adresse || '—'}</td>
                  <td>{e.responsable || '—'}</td>
                  <td>
                    <span style={{ ...styles.badge, backgroundColor: e.actif ? '#d1fae5' : '#fee2e2', color: e.actif ? '#065f46' : '#991b1b' }}>
                      {e.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  {(peutModifier || peutSupprimer) && (
                    <td>
                      {peutModifier && <button style={styles.editBtn} onClick={() => handleEdit(e)}>modifier</button>}
                      {peutSupprimer && <button style={styles.deleteBtn} onClick={() => handleDelete(e.id)}>suppr</button>}
                    </td>
                  )}
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
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#334155' },
  submitBtn: { padding: '12px 24px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '600' },
  tableCard: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  badge: { padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
  editBtn: { padding: '4px 10px', backgroundColor: '#dbeafe', color: '#1e40af', border: 'none', borderRadius: '6px', cursor: 'pointer', marginRight: '4px', fontSize: '14px' },
  deleteBtn: { padding: '4px 10px', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
  loading: { textAlign: 'center', color: '#64748b', padding: '20px' },
  empty: { textAlign: 'center', color: '#94a3b8', padding: '40px' }
};