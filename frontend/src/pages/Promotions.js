import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

export default function Promotions() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState([]);
  const [showForm, setShowForm] = useState(false);
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
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    setLoading(true);

    try {
      // Valider les dates
      if (new Date(form.date_debut) >= new Date(form.date_fin)) {
        setError('La date de début doit être antérieure à la date de fin');
        setLoading(false);
        return;
      }

      const data = {
        ...form,
        produits_concernes: form.produits_concernes ? form.produits_concernes.split(',').map(Number) : null,
        clients_concernes: form.clients_concernes ? form.clients_concernes.split(',').map(Number) : null,
      };

      if (editingId) {
        await API.put(`/promotions/${editingId}`, data);
        setSuccess('✅ Promotion mise à jour avec succès');
      } else {
        await API.post('/promotions', data);
        setSuccess('✅ Promotion créée avec succès');
      }

      setShowForm(false);
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
      setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
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
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette promotion ?')) return;
    try {
      await API.delete(`/promotions/${id}`);
      setSuccess('✅ Promotion supprimée');
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

  const getStatutStyle = (promo) => {
    const maintenant = new Date();
    const debut = new Date(promo.date_debut);
    const fin = new Date(promo.date_fin);

    if (!promo.actif) return { bg: '#f1f5f9', color: '#64748b', label: 'Inactif' };
    if (maintenant < debut) return { bg: '#dbeafe', color: '#1e40af', label: 'À venir' };
    if (maintenant > fin) return { bg: '#fee2e2', color: '#991b1b', label: 'Expirée' };
    return { bg: '#d1fae5', color: '#065f46', label: 'Active' };
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🏷️ Gestion des Promotions</h2>
        <div>
          <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>← Retour</button>
          {peutCreer && (
            <button style={styles.addBtn} onClick={() => { setShowForm(!showForm); setEditingId(null); }}>
              {showForm ? '✕ Fermer' : '+ Nouvelle promotion'}
            </button>
          )}
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      {/* Formulaire */}
      {showForm && (
        <form onSubmit={handleSubmit} style={styles.formCard}>
          <h3>{editingId ? 'Modifier' : 'Nouvelle'} promotion</h3>
          <div style={styles.formGrid}>
            <input
              style={styles.input}
              name="code"
              placeholder="Code promo (ex: PROMO20)"
              value={form.code}
              onChange={handleChange}
              required
              disabled={loading}
            />
            <input
              style={styles.input}
              name="nom"
              placeholder="Nom de la promotion"
              value={form.nom}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <textarea
            style={styles.textarea}
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
            disabled={loading}
          />

          <div style={styles.formGrid}>
            <select
              style={styles.input}
              name="type"
              value={form.type}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="pourcentage">Pourcentage (%)</option>
              <option value="fixe">Montant fixe (DT)</option>
              <option value="livraison_offerte">Livraison offerte</option>
            </select>
            <input
              style={styles.input}
              name="valeur"
              type="number"
              step="0.01"
              min="0"
              placeholder="Valeur"
              value={form.valeur}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div style={styles.formGrid}>
            <input
              style={styles.input}
              name="date_debut"
              type="datetime-local"
              value={form.date_debut}
              onChange={handleChange}
              required
              disabled={loading}
            />
            <input
              style={styles.input}
              name="date_fin"
              type="datetime-local"
              value={form.date_fin}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div style={styles.formGrid}>
            <input
              style={styles.input}
              name="utilisation_max"
              type="number"
              min="1"
              placeholder="Utilisation max (laisser vide = illimité)"
              value={form.utilisation_max}
              onChange={handleChange}
              disabled={loading}
            />
            <input
              style={styles.input}
              name="produits_concernes"
              placeholder="IDs produits (ex: 1,2,3 - vide = tous)"
              value={form.produits_concernes}
              onChange={handleChange}
              disabled={loading}
            />
            <input
              style={styles.input}
              name="clients_concernes"
              placeholder="IDs clients (ex: 1,2,3 - vide = tous)"
              value={form.clients_concernes}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

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

          <button style={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? 'Enregistrement...' : (editingId ? 'Mettre à jour' : 'Créer')}
          </button>
        </form>
      )}

      {/* Liste des promotions */}
      <div style={styles.tableCard}>
        {loading && !showForm ? (
          <p style={styles.loading}>Chargement...</p>
        ) : promotions.length === 0 ? (
          <p style={styles.empty}>Aucune promotion enregistrée</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Nom</th>
                <th>Type</th>
                <th>Valeur</th>
                <th>Période</th>
                <th>Statut</th>
                <th>Utilisations</th>
                {peutModifier && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {promotions.map((p) => {
                const statut = getStatutStyle(p);
                return (
                  <tr key={p.id}>
                    <td><strong>{p.code}</strong></td>
                    <td>{p.nom}</td>
                    <td>{getTypeLabel(p.type)}</td>
                    <td>{p.valeur} {p.type === 'pourcentage' ? '%' : 'DT'}</td>
                    <td style={{ fontSize: '12px' }}>
                      {new Date(p.date_debut).toLocaleDateString('fr-FR')}
                      <br />
                      → {new Date(p.date_fin).toLocaleDateString('fr-FR')}
                    </td>
                    <td>
                      <span style={{ ...styles.badge, backgroundColor: statut.bg, color: statut.color }}>
                        {statut.label}
                      </span>
                    </td>
                    <td>
                      {p.utilisation_count || 0}
                      {p.utilisation_max && ` / ${p.utilisation_max}`}
                    </td>
                    {peutModifier && (
                      <td>
                        <button style={styles.editBtn} onClick={() => handleEdit(p)}>✏️</button>
                        {peutSupprimer && (
                          <button style={styles.deleteBtn} onClick={() => handleDelete(p.id)}>🗑️</button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
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
  textarea: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', minHeight: '60px', boxSizing: 'border-box', marginBottom: '12px' },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '14px', color: '#334155' },
  submitBtn: { padding: '12px 24px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '600' },
  tableCard: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  badge: { padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
  editBtn: { padding: '4px 10px', backgroundColor: '#dbeafe', color: '#1e40af', border: 'none', borderRadius: '6px', cursor: 'pointer', marginRight: '4px', fontSize: '14px' },
  deleteBtn: { padding: '4px 10px', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
  loading: { textAlign: 'center', color: '#64748b', padding: '20px' },
  empty: { textAlign: 'center', color: '#94a3b8', padding: '40px' }
};