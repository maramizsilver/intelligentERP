// frontend/src/pages/TransfertStock.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

export default function TransfertStock() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const [entrepots, setEntrepots] = useState([]);
  const [produits, setProduits] = useState([]);
  const [form, setForm] = useState({
    produit_id: '',
    entrepot_source_id: '',
    entrepot_destination_id: '',
    quantite: ''
  });
  const [stockSource, setStockSource] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const peutModifier = hasPermission('Stock', 'modification');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [entrepotsRes, produitsRes] = await Promise.all([
        API.get('/entrepots'),
        API.get('/produits')
      ]);
      setEntrepots(entrepotsRes.data.entrepots || []);
      setProduits(produitsRes.data.produits || []);
    } catch (err) {
      setError('Impossible de charger les données');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (name === 'entrepot_source_id' && form.produit_id) {
      checkStockSource(value, form.produit_id);
    }
    if (name === 'produit_id' && form.entrepot_source_id) {
      checkStockSource(form.entrepot_source_id, value);
    }
  };

  const checkStockSource = async (entrepotId, produitId) => {
    if (!entrepotId || !produitId) return;
    try {
      const res = await API.get(`/entrepots/${entrepotId}`);
      const stock = res.data.entrepot?.stock?.find(s => s.produit_id === parseInt(produitId));
      const quantite = stock?.quantite || 0;
      setStockSource(quantite);
      
      // Si le stock est 0, afficher un message
      if (quantite === 0) {
        setError('⚠️ Ce produit n\'a pas de stock dans l\'entrepôt source sélectionné.');
      } else {
        setError('');
      }
    } catch (err) {
      setStockSource(0);
      setError('Erreur lors de la vérification du stock');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Vérifier que la quantité est valide
    const quantite = Number(form.quantite);
    if (quantite <= 0) {
      setError('La quantité doit être supérieure à 0');
      setLoading(false);
      return;
    }
    if (quantite > stockSource) {
      setError(`Stock insuffisant. Disponible: ${stockSource}`);
      setLoading(false);
      return;
    }

    try {
      await API.post('/entrepots/transfert', form);
      setSuccess('✅ Transfert effectué avec succès');
      setForm({ produit_id: '', entrepot_source_id: '', entrepot_destination_id: '', quantite: '' });
      setStockSource(0);
      // Recharger les données
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du transfert');
    } finally {
      setLoading(false);
    }
  };

  if (!peutModifier) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>Vous n'avez pas la permission de transférer du stock.</div>
        <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>← Retour</button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🔄 Transfert de stock</h2>
        <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>← Retour</button>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      <form onSubmit={handleSubmit} style={styles.formCard}>
        <div style={styles.formGrid}>
          <div>
            <label style={styles.label}>Produit</label>
            <select
              style={styles.input}
              name="produit_id"
              value={form.produit_id}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value="">-- Choisir un produit --</option>
              {produits.map(p => (
                <option key={p.id} value={p.id}>{p.nom} (Stock total: {p.quantite_stock})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={styles.label}>Entrepôt source</label>
            <select
              style={styles.input}
              name="entrepot_source_id"
              value={form.entrepot_source_id}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value="">-- Source --</option>
              {entrepots.filter(e => e.actif).map(e => (
                <option key={e.id} value={e.id}>{e.nom}</option>
              ))}
            </select>
            {form.entrepot_source_id && form.produit_id && (
              <span style={{ ...styles.stockInfo, color: stockSource > 0 ? '#0ea5e9' : '#dc2626' }}>
                Stock disponible: {stockSource} {stockSource === 0 && '⚠️ Aucun stock'}
              </span>
            )}
          </div>

          <div>
            <label style={styles.label}>Entrepôt destination</label>
            <select
              style={styles.input}
              name="entrepot_destination_id"
              value={form.entrepot_destination_id}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value="">-- Destination --</option>
              {entrepots
                .filter(e => e.actif && e.id !== parseInt(form.entrepot_source_id))
                .map(e => (
                  <option key={e.id} value={e.id}>{e.nom}</option>
                ))}
            </select>
          </div>

          <div>
            <label style={styles.label}>Quantité</label>
            <input
              style={styles.input}
              type="number"
              name="quantite"
              placeholder="Quantité"
              value={form.quantite}
              onChange={handleChange}
              required
              min={1}
              max={stockSource || 0}
              disabled={loading || stockSource === 0}
            />
            {stockSource === 0 && (
              <span style={styles.warningText}>Ajoutez du stock dans l'entrepôt source d'abord</span>
            )}
          </div>
        </div>

        <button 
          style={{ ...styles.submitBtn, opacity: stockSource === 0 ? 0.5 : 1 }}
          type="submit" 
          disabled={loading || stockSource === 0}
        >
          {loading ? 'Transfert en cours...' : '🔄 Effectuer le transfert'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: { padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  title: { color: '#0f172a', margin: 0, fontSize: '22px' },
  backBtn: { padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  error: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '16px' },
  success: { backgroundColor: '#d1fae5', color: '#065f46', padding: '12px', borderRadius: '8px', marginBottom: '16px' },
  formCard: { backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' },
  label: { display: 'block', marginBottom: '6px', fontWeight: '600', color: '#0f172a', fontSize: '14px' },
  input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
  stockInfo: { display: 'block', fontSize: '12px', marginTop: '4px' },
  warningText: { display: 'block', fontSize: '12px', color: '#dc2626', marginTop: '4px' },
  submitBtn: { padding: '12px 24px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '600' }
};