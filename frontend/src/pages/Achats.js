import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

export default function Achats() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const [achats, setAchats] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [produits, setProduits] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    fournisseur_id: '',
    date_livraison_prevue: '',
    notes: '',
    lignes: [{ produit_id: '', quantite: 1, prix_unitaire: '' }]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [receivingId, setReceivingId] = useState(null);

  const peutCreer = hasPermission('Achats', 'creation');
  const peutModifier = hasPermission('Achats', 'modification');
  const peutSupprimer = hasPermission('Achats', 'suppression');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [achatsRes, fournisseursRes, produitsRes] = await Promise.all([
        API.get('/achats'),
        API.get('/fournisseurs'),
        API.get('/produits')
      ]);
      setAchats(achatsRes.data.achats || []);
      setFournisseurs(fournisseursRes.data.fournisseurs || []);
      setProduits(produitsRes.data.produits || []);
    } catch (err) {
      setError('Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const handleLigneChange = (index, field, value) => {
    const newLignes = [...form.lignes];
    newLignes[index][field] = value;
    
    // Si un produit est sélectionné, charger automatiquement son prix
    if (field === 'produit_id' && value) {
      const produit = produits.find(p => p.id === Number(value));
      if (produit && !newLignes[index].prix_unitaire) {
        newLignes[index].prix_unitaire = produit.prix;
      }
    }
    
    setForm({ ...form, lignes: newLignes });
  };

  const addLigne = () => {
    setForm({
      ...form,
      lignes: [...form.lignes, { produit_id: '', quantite: 1, prix_unitaire: '' }]
    });
  };

  const removeLigne = (index) => {
    setForm({
      ...form,
      lignes: form.lignes.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const data = {
        ...form,
        lignes: form.lignes.filter(l => l.produit_id && l.quantite > 0)
      };

      if (data.lignes.length === 0) {
        setError('Ajoutez au moins un produit');
        setLoading(false);
        return;
      }

      await API.post('/achats', data);
      setSuccess('✅ Bon de commande créé avec succès');
      setShowForm(false);
      setForm({
        fournisseur_id: '',
        date_livraison_prevue: '',
        notes: '',
        lignes: [{ produit_id: '', quantite: 1, prix_unitaire: '' }]
      });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleRecevoir = async (id) => {
    const quantites = {};
    const lignes = achats.find(a => a.id === id)?.lignes || [];
    
    for (const ligne of lignes) {
      const qte = prompt(`Quantité reçue pour ${ligne.produit_nom || 'produit'} (max: ${ligne.quantite - (ligne.quantite_recue || 0)})`);
      if (qte !== null && !isNaN(qte) && Number(qte) > 0) {
        quantites[ligne.produit_id] = Number(qte);
      }
    }

    if (Object.keys(quantites).length === 0) {
      alert('Aucune quantité saisie');
      return;
    }

    try {
      setReceivingId(id);
      await API.put(`/achats/${id}/recevoir`, { quantites_recues: quantites });
      setSuccess('✅ Réception enregistrée, stock mis à jour');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la réception');
    } finally {
      setReceivingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce bon de commande ?')) return;
    try {
      await API.delete(`/achats/${id}`);
      setSuccess('✅ Bon de commande supprimé');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const getStatutStyle = (statut) => {
    const styles = {
      brouillon: { bg: '#e2e8f0', color: '#475569', label: 'Brouillon' },
      envoye: { bg: '#dbeafe', color: '#1e40af', label: 'Envoyé' },
      recu_partiel: { bg: '#fef3c7', color: '#92400e', label: 'Reçu partiel' },
      recu_total: { bg: '#d1fae5', color: '#065f46', label: 'Reçu total' },
      annule: { bg: '#fee2e2', color: '#991b1b', label: 'Annulé' }
    };
    return styles[statut] || styles.brouillon;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📦 Gestion des Achats</h2>
        <div>
          <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>← Retour</button>
          {peutCreer && (
            <button style={styles.addBtn} onClick={() => setShowForm(!showForm)}>
              {showForm ? '✕ Fermer' : '+ Nouveau bon de commande'}
            </button>
          )}
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      {/* Formulaire */}
      {showForm && (
        <form onSubmit={handleSubmit} style={styles.formCard}>
          <h3>Nouveau bon de commande</h3>
          <div style={styles.formGrid}>
            <select
              style={styles.input}
              value={form.fournisseur_id}
              onChange={(e) => setForm({ ...form, fournisseur_id: e.target.value })}
              required
              disabled={loading}
            >
              <option value="">-- Choisir un fournisseur --</option>
              {fournisseurs.map(f => (
                <option key={f.id} value={f.id}>{f.nom}</option>
              ))}
            </select>
            <input
              style={styles.input}
              type="date"
              placeholder="Date livraison prévue"
              value={form.date_livraison_prevue}
              onChange={(e) => setForm({ ...form, date_livraison_prevue: e.target.value })}
              disabled={loading}
            />
          </div>

          <div style={styles.lignesContainer}>
            <h4>Produits</h4>
            {form.lignes.map((ligne, i) => (
              <div key={i} style={styles.ligneRow}>
                <select
                  style={{ ...styles.input, minWidth: '200px' }}
                  value={ligne.produit_id}
                  onChange={(e) => handleLigneChange(i, 'produit_id', e.target.value)}
                  required
                  disabled={loading}
                >
                  <option value="">-- Produit --</option>
                  {produits.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nom} ({p.prix} DT) - Stock: {p.quantite_stock}
                    </option>
                  ))}
                </select>
                <input
                  style={{ ...styles.input, width: '80px' }}
                  type="number"
                  min="1"
                  placeholder="Qté"
                  value={ligne.quantite}
                  onChange={(e) => handleLigneChange(i, 'quantite', e.target.value)}
                  required
                  disabled={loading}
                />
                <input
                  style={{ ...styles.input, width: '120px' }}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Prix unitaire"
                  value={ligne.prix_unitaire}
                  onChange={(e) => handleLigneChange(i, 'prix_unitaire', e.target.value)}
                  required
                  disabled={loading}
                />
                {form.lignes.length > 1 && (
                  <button type="button" style={styles.removeBtn} onClick={() => removeLigne(i)}>✕</button>
                )}
              </div>
            ))}
            <button type="button" style={styles.addLigneBtn} onClick={addLigne}>+ Ajouter un produit</button>
          </div>

          <textarea
            style={styles.textarea}
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            disabled={loading}
          />

          <button style={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? 'Création...' : 'Créer le bon de commande'}
          </button>
        </form>
      )}

      {/* Liste des achats */}
      <div style={styles.tableCard}>
        {loading && !showForm ? (
          <p style={styles.loading}>Chargement...</p>
        ) : achats.length === 0 ? (
          <p style={styles.empty}>Aucun bon de commande</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th>N°</th>
                <th>Fournisseur</th>
                <th>Date</th>
                <th>Livraison prévue</th>
                <th>Total</th>
                <th>Statut</th>
                {(peutModifier || peutSupprimer) && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {achats.map((a) => {
                const statut = getStatutStyle(a.statut);
                return (
                  <tr key={a.id}>
                    <td><strong>{a.numero_bc}</strong></td>
                    <td>{a.fournisseur_nom}</td>
                    <td>{new Date(a.date_commande).toLocaleDateString('fr-FR')}</td>
                    <td>{a.date_livraison_prevue ? new Date(a.date_livraison_prevue).toLocaleDateString('fr-FR') : '—'}</td>
                    <td>{a.total_ttc} DT</td>
                    <td>
                      <span style={{ ...styles.badge, backgroundColor: statut.bg, color: statut.color }}>
                        {statut.label}
                      </span>
                    </td>
                    {(peutModifier || peutSupprimer) && (
                      <td>
                        {a.statut !== 'recu_total' && a.statut !== 'annule' && (
                          <button
                            style={styles.receiveBtn}
                            onClick={() => handleRecevoir(a.id)}
                            disabled={receivingId === a.id}
                          >
                            {receivingId === a.id ? '...' : '📥 Réceptionner'}
                          </button>
                        )}
                        {peutSupprimer && a.statut === 'brouillon' && (
                          <button style={styles.deleteBtn} onClick={() => handleDelete(a.id)}>🗑️</button>
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
  lignesContainer: { backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '16px' },
  ligneRow: { display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' },
  removeBtn: { padding: '6px 12px', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  addLigneBtn: { padding: '6px 14px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  textarea: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', minHeight: '60px', boxSizing: 'border-box', marginBottom: '16px' },
  submitBtn: { padding: '12px 24px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '600' },
  tableCard: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  badge: { padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
  receiveBtn: { padding: '4px 10px', backgroundColor: '#dbeafe', color: '#1e40af', border: 'none', borderRadius: '6px', cursor: 'pointer', marginRight: '4px', fontSize: '12px' },
  deleteBtn: { padding: '4px 10px', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
  loading: { textAlign: 'center', color: '#64748b', padding: '20px' },
  empty: { textAlign: 'center', color: '#94a3b8', padding: '40px' }
};