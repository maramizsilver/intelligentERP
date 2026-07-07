// frontend/src/pages/stock/Inventaires.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';

export default function Inventaires() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const [inventaires, setInventaires] = useState([]);
  const [entrepots, setEntrepots] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ entrepot_id: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [detailsInventaire, setDetailsInventaire] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [comptages, setComptages] = useState({});

  const peutCreer = hasPermission('Stock', 'creation');
  const peutValider = hasPermission('Stock', 'validation');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invRes, entrepotsRes] = await Promise.all([
        API.get('/inventaires'),
        API.get('/entrepots')
      ]);
      setInventaires(invRes.data.inventaires || []);
      setEntrepots(entrepotsRes.data.entrepots || []);
    } catch (err) {
      setError('Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await API.post('/inventaires', form);
      setSuccess(' Inventaire créé avec succès');
      setShowForm(false);
      setForm({ entrepot_id: '', notes: '' });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (id) => {
    try {
      const res = await API.get(`/inventaires/${id}`);
      setDetailsInventaire(res.data.inventaire);
      const comptagesInit = {};
      (res.data.inventaire?.lignes || []).forEach(l => {
        comptagesInit[l.id] = l.quantite_comptee || l.quantite_theorique || 0;
      });
      setComptages(comptagesInit);
      setShowDetails(true);
    } catch (err) {
      setError('Erreur lors du chargement des détails');
    }
  };

  const handleComptageChange = (ligneId, value) => {
    setComptages({ ...comptages, [ligneId]: parseInt(value) || 0 });
  };

  const handleSaisirComptage = async (inventaireId) => {
    const comptagesArray = Object.entries(comptages).map(([ligne_id, quantite_comptee]) => ({
      ligne_id: parseInt(ligne_id),
      quantite_comptee
    }));

    try {
      await API.put(`/inventaires/${inventaireId}/comptage`, { comptages: comptagesArray });
      setSuccess(' Comptage enregistré avec succès');
      setShowDetails(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const handleCloturer = async (id) => {
    if (!window.confirm('Confirmer la clôture de cet inventaire ?')) return;
    try {
      await API.put(`/inventaires/${id}/cloturer`);
      setSuccess(' Inventaire clôturé avec succès');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const getStatutStyle = (statut) => {
    const styles = {
      brouillon: { bg: '#e2e8f0', color: '#475569', label: 'Brouillon' },
      en_cours: { bg: '#dbeafe', color: '#1e40af', label: 'En cours' },
      termine: { bg: '#d1fae5', color: '#065f46', label: 'Terminé' },
      annule: { bg: '#fee2e2', color: '#991b1b', label: 'Annulé' }
    };
    return styles[statut] || styles.brouillon;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}> Gestion des Inventaires</h2>
        <div>
          <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>← Retour</button>
          {peutCreer && (
            <button style={styles.addBtn} onClick={() => { setShowForm(!showForm); setForm({ entrepot_id: '', notes: '' }); }}>
              {showForm ? '✕ Fermer' : '+ Nouvel inventaire'}
            </button>
          )}
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.formCard}>
          <h3>Nouvel inventaire</h3>
          <div style={styles.formGrid}>
            <select
              style={styles.input}
              name="entrepot_id"
              value={form.entrepot_id}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="">Tous les entrepôts</option>
              {entrepots.filter(e => e.actif).map(e => (
                <option key={e.id} value={e.id}>{e.nom}</option>
              ))}
            </select>
            <input
              style={styles.input}
              name="notes"
              placeholder="Notes"
              value={form.notes}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
          <button style={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? 'Création...' : 'Créer l\'inventaire'}
          </button>
        </form>
      )}

      <div style={styles.tableCard}>
        {loading && !showForm ? (
          <p style={styles.loading}>Chargement...</p>
        ) : inventaires.length === 0 ? (
          <p style={styles.empty}>Aucun inventaire</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Entrepôt</th>
                <th>Lignes</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventaires.map((inv) => {
                const statut = getStatutStyle(inv.statut);
                return (
                  <tr key={inv.id}>
                    <td>{inv.id}</td>
                    <td>{new Date(inv.created_at).toLocaleDateString('fr-FR')}</td>
                    <td>{inv.entrepot_nom || 'Tous'}</td>
                    <td>{inv.nb_lignes || 0}</td>
                    <td>
                      <span style={{ ...styles.badge, backgroundColor: statut.bg, color: statut.color }}>
                        {statut.label}
                      </span>
                    </td>
                    <td>
                      <button style={styles.viewBtn} onClick={() => handleViewDetails(inv.id)}>voir</button>
                      {inv.statut === 'en_cours' && peutValider && (
                        <button style={styles.clotureBtn} onClick={() => handleCloturer(inv.id)}> Clôturer</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showDetails && detailsInventaire && (
        <div style={styles.modalOverlay} onClick={() => setShowDetails(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Détails de l'inventaire #{detailsInventaire.id}</h3>
            <p><strong>Entrepôt:</strong> {detailsInventaire.entrepot_nom || 'Tous'}</p>
            <p><strong>Statut:</strong> {getStatutStyle(detailsInventaire.statut).label}</p>
            <hr style={styles.modalHr} />

            <table style={styles.modalTable}>
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Théorique</th>
                  <th>Compté</th>
                  {detailsInventaire.statut === 'en_cours' && <th>Saisie</th>}
                </tr>
              </thead>
              <tbody>
                {(detailsInventaire.lignes || []).map((l) => (
                  <tr key={l.id}>
                    <td>{l.produit_nom}</td>
                    <td>{l.quantite_theorique}</td>
                    <td style={{ color: l.ecart !== 0 ? '#dc2626' : '#065f46' }}>
                      {l.quantite_comptee ?? '—'}
                      {l.ecart !== 0 && ` (${l.ecart > 0 ? '+' : ''}${l.ecart})`}
                    </td>
                    {detailsInventaire.statut === 'en_cours' && (
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={comptages[l.id] || ''}
                          onChange={(e) => handleComptageChange(l.id, e.target.value)}
                          style={styles.modalInput}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={styles.modalActions}>
              {detailsInventaire.statut === 'en_cours' && (
                <button style={styles.modalBtn} onClick={() => handleSaisirComptage(detailsInventaire.id)}>
                  Enregistrer le comptage
                </button>
              )}
              <button style={styles.modalCloseBtn} onClick={() => setShowDetails(false)}>Fermer</button>
            </div>
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
  submitBtn: { padding: '12px 24px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '600' },
  tableCard: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  badge: { padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
  viewBtn: { padding: '4px 10px', backgroundColor: '#e0f2fe', color: '#075985', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
  clotureBtn: { padding: '4px 10px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', marginLeft: '4px' },
  loading: { textAlign: 'center', color: '#64748b', padding: '20px' },
  empty: { textAlign: 'center', color: '#94a3b8', padding: '40px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', maxWidth: '800px', width: '90%', maxHeight: '90vh', overflow: 'auto' },
  modalHr: { margin: '16px 0' },
  modalTable: { width: '100%', borderCollapse: 'collapse' },
  modalInput: { width: '80px', padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0' },
  modalActions: { display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' },
  modalBtn: { padding: '10px 20px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  modalCloseBtn: { padding: '10px 20px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }
};