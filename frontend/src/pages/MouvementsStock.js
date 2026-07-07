import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

export default function MouvementsStock() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const [produits, setProduits] = useState([]);
  const [produitId, setProduitId] = useState('');
  const [mouvements, setMouvements] = useState([]);
  const [showAjustement, setShowAjustement] = useState(false);
  const [formAjustement, setFormAjustement] = useState({
    produit_id: '',
    quantite: '',
    motif: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const peutModifier = hasPermission('Stock', 'modification');

  useEffect(() => {
    loadProduits();
  }, []);

  const loadProduits = async () => {
    try {
      const res = await API.get('/produits');
      setProduits(res.data.produits || []);
    } catch (err) {
      setError('Impossible de charger les produits');
    }
  };

  const loadMouvements = async () => {
    if (!produitId) {
      setMouvements([]);
      return;
    }
    try {
      setLoading(true);
      const res = await API.get(`/mouvements-stock/produit/${produitId}`);
      setMouvements(res.data.mouvements || []);
    } catch (err) {
      setError('Impossible de charger les mouvements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (produitId) {
      loadMouvements();
    }
  }, [produitId]);

  const handleAjustement = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await API.post('/mouvements-stock/ajuster', formAjustement);
      setSuccess(' Stock ajusté avec succès');
      setShowAjustement(false);
      setFormAjustement({ produit_id: '', quantite: '', motif: '' });
      loadProduits();
      if (produitId) loadMouvements();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      entree: ' Entrée',
      sortie: ' Sortie',
      ajustement: ' Ajustement',
      commande_client: ' Commande client',
      achat_fournisseur: ' Achat fournisseur'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type) => {
    const colors = {
      entree: '#22c55e',
      sortie: '#ef4444',
      ajustement: '#f59e0b',
      commande_client: '#3b82f6',
      achat_fournisseur: '#8b5cf6'
    };
    return colors[type] || '#64748b';
  };

  const produitSelectionne = produits.find(p => p.id === Number(produitId));

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}> Mouvements de stock</h2>
        <div>
          <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>← Retour</button>
          {peutModifier && (
            <button style={styles.addBtn} onClick={() => setShowAjustement(!showAjustement)}>
              {showAjustement ? '✕ Fermer' : ' Ajuster le stock'}
            </button>
          )}
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      {/* Formulaire d'ajustement */}
      {showAjustement && (
        <form onSubmit={handleAjustement} style={styles.formCard}>
          <h3>⚙️ Ajuster le stock</h3>
          <div style={styles.formGrid}>
            <select
              style={styles.input}
              value={formAjustement.produit_id}
              onChange={(e) => setFormAjustement({ ...formAjustement, produit_id: e.target.value })}
              required
              disabled={loading}
            >
              <option value="">-- Choisir un produit --</option>
              {produits.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nom} (Stock: {p.quantite_stock})
                </option>
              ))}
            </select>
            <input
              style={styles.input}
              type="number"
              step="1"
              placeholder="Quantité (+ entrée, - sortie)"
              value={formAjustement.quantite}
              onChange={(e) => setFormAjustement({ ...formAjustement, quantite: e.target.value })}
              required
              disabled={loading}
            />
            <input
              style={styles.input}
              placeholder="Motif"
              value={formAjustement.motif}
              onChange={(e) => setFormAjustement({ ...formAjustement, motif: e.target.value })}
              required
              disabled={loading}
            />
          </div>
          <button style={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? 'Enregistrement...' : 'Appliquer'}
          </button>
        </form>
      )}

      {/* Sélection du produit */}
      <div style={styles.selectCard}>
        <label style={styles.label}>Choisir un produit :</label>
        <select
          style={{ ...styles.input, maxWidth: '400px' }}
          value={produitId}
          onChange={(e) => setProduitId(e.target.value)}
        >
          <option value="">-- Sélectionner un produit --</option>
          {produits.map(p => (
            <option key={p.id} value={p.id}>
              {p.nom} (Stock: {p.quantite_stock})
            </option>
          ))}
        </select>
      </div>

      {/* Liste des mouvements */}
      {produitId && (
        <div style={styles.tableCard}>
          <div style={styles.tableHeader}>
            <h4>
              Historique des mouvements - {produitSelectionne?.nom || ''}
              <span style={styles.stockInfo}>
                Stock actuel: {produitSelectionne?.quantite_stock || 0}
              </span>
            </h4>
          </div>

          {loading ? (
            <p style={styles.loading}>Chargement...</p>
          ) : mouvements.length === 0 ? (
            <p style={styles.empty}>Aucun mouvement pour ce produit</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Quantité</th>
                  <th>Ancien stock</th>
                  <th>Nouveau stock</th>
                  <th>Motif</th>
                  <th>Par</th>
                </tr>
              </thead>
              <tbody>
                {mouvements.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontSize: '12px' }}>
                      {new Date(m.created_at).toLocaleDateString('fr-FR')}
                      <br />
                      {new Date(m.created_at).toLocaleTimeString('fr-FR')}
                    </td>
                    <td>
                      <span style={{ ...styles.typeBadge, backgroundColor: getTypeColor(m.type) + '20', color: getTypeColor(m.type) }}>
                        {getTypeLabel(m.type)}
                      </span>
                    </td>
                    <td style={{ fontWeight: 'bold', color: m.quantite > 0 ? '#22c55e' : '#ef4444' }}>
                      {m.quantite > 0 ? `+${m.quantite}` : m.quantite}
                    </td>
                    <td>{m.ancien_stock}</td>
                    <td style={{ fontWeight: 'bold' }}>{m.nouveau_stock}</td>
                    <td style={{ fontSize: '13px' }}>{m.motif || '—'}</td>
                    <td style={{ fontSize: '13px', color: '#64748b' }}>
                      {m.created_by_prenom} {m.created_by_nom}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
  addBtn: { padding: '8px 20px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  error: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '16px' },
  success: { backgroundColor: '#d1fae5', color: '#065f46', padding: '12px', borderRadius: '8px', marginBottom: '16px' },
  formCard: { backgroundColor: 'white', padding: '24px', borderRadius: '12px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' },
  input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
  submitBtn: { padding: '12px 24px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '600' },
  selectCard: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  label: { display: 'block', marginBottom: '8px', fontWeight: '600', color: '#0f172a' },
  tableCard: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'auto' },
  tableHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' },
  stockInfo: { fontSize: '14px', color: '#0ea5e9', fontWeight: '600', marginLeft: '16px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  typeBadge: { padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
  loading: { textAlign: 'center', color: '#64748b', padding: '20px' },
  empty: { textAlign: 'center', color: '#94a3b8', padding: '40px' }
};