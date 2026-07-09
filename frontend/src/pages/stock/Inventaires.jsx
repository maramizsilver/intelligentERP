// src/pages/stock/Inventaires.jsx
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

export default function Inventaires() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const [inventaires, setInventaires] = useState([]);
  const [entrepots, setEntrepots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ entrepot_id: '', notes: '' });
  const [formLoading, setFormLoading] = useState(false);

  const [detailsInventaire, setDetailsInventaire] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [comptages, setComptages] = useState({});
  const [savingComptage, setSavingComptage] = useState(false);

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
    setFormLoading(true);

    try {
      await API.post('/inventaires', form);
      setSuccess('Inventaire créé avec succès');
      setShowForm(false);
      setForm({ entrepot_id: '', notes: '' });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setFormLoading(false);
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
    setSavingComptage(true);
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
    } finally {
      setSavingComptage(false);
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

  const getStatutBadge = (statut) => {
    const statuts = {
      brouillon: { label: 'Brouillon', variant: 'outline' },
      en_cours: { label: 'En cours', variant: 'primary' },
      termine: { label: 'Terminé', variant: 'success' },
      annule: { label: 'Annulé', variant: 'danger' }
    };
    return statuts[statut] || statuts.brouillon;
  };

  const columns = [
    { key: 'id', label: '#' },
    {
      key: 'created_at',
      label: 'Date',
      render: (row) => new Date(row.created_at).toLocaleDateString('fr-FR')
    },
    { key: 'entrepot_nom', label: 'Entrepôt' },
    { key: 'nb_lignes', label: 'Lignes' },
    {
      key: 'statut',
      label: 'Statut',
      render: (row) => {
        const statut = getStatutBadge(row.statut);
        return <Badge variant={statut.variant}>{statut.label}</Badge>;
      }
    }
  ];

  const actions = [
    {
      label: ' Voir',
      variant: 'primary',
      onClick: (row) => handleViewDetails(row.id)
    }
  ];

  if (peutValider) {
    actions.push({
      label: ' Clôturer',
      variant: 'success',
      onClick: (row) => handleCloturer(row.id),
      disabled: (row) => row.statut !== 'en_cours'
    });
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}> Gestion des Inventaires</h1>
          <p style={styles.subtitle}>Gérez les inventaires et comptages de stock</p>
        </div>
        <div style={styles.headerActions}>
          <Button variant="secondary" onClick={() => navigate('/dashboard')} icon="←">
            Retour
          </Button>
          {peutCreer && (
            <Button
              variant="primary"
              icon={showForm ? '✕' : '+'}
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? 'Fermer' : 'Nouvel inventaire'}
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
        <Card title=" Nouvel inventaire" variant="primary" style={{ marginBottom: '24px' }}>
          <form onSubmit={handleSubmit}>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Entrepôt</label>
                <select
                  style={styles.select}
                  name="entrepot_id"
                  value={form.entrepot_id}
                  onChange={handleChange}
                  disabled={formLoading}
                >
                  <option value="">Tous les entrepôts</option>
                  {entrepots.filter(e => e.actif).map(e => (
                    <option key={e.id} value={e.id}>{e.nom}</option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Notes</label>
                <input
                  style={styles.input}
                  name="notes"
                  placeholder="Notes sur l'inventaire"
                  value={form.notes}
                  onChange={handleChange}
                  disabled={formLoading}
                />
              </div>
            </div>
            <Button type="submit" variant="primary" loading={formLoading} fullWidth>
              Créer l'inventaire
            </Button>
          </form>
        </Card>
      )}

      <Card title="Liste des inventaires" variant="primary">
        <Table columns={columns} data={inventaires} loading={loading} actions={actions} />
      </Card>

      {/* Modal Détails */}
      {showDetails && detailsInventaire && (
        <div style={styles.modalOverlay} onClick={() => setShowDetails(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Détails de l'inventaire #{detailsInventaire.id}</h3>
            <p><strong>Entrepôt:</strong> {detailsInventaire.entrepot_nom || 'Tous'}</p>
            <p><strong>Statut:</strong> {getStatutBadge(detailsInventaire.statut).label}</p>
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
                    <td style={{ color: l.ecart !== 0 ? '#DC2626' : '#065F46' }}>
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
                <Button
                  variant="primary"
                  onClick={() => handleSaisirComptage(detailsInventaire.id)}
                  loading={savingComptage}
                >
                  Enregistrer le comptage
                </Button>
              )}
              <Button variant="secondary" onClick={() => setShowDetails(false)}>
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
  input: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '2px solid #E2E8F0',
    fontSize: '14px',
    backgroundColor: '#F8FAFC',
    outline: 'none',
    transition: 'all 0.2s ease',
    ':focus': {
      borderColor: '#0EA5E9',
      boxShadow: '0 0 0 3px rgba(14, 165, 233, 0.15)',
    },
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
    maxWidth: '800px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalTitle: { margin: '0 0 16px', color: '#0F172A' },
  modalHr: { margin: '16px 0', border: 'none', borderTop: '1px solid #E2E8F0' },
  modalTable: {
    width: '100%',
    borderCollapse: 'collapse',
    'th, td': {
      padding: '8px 12px',
      textAlign: 'left',
      borderBottom: '1px solid #E2E8F0',
    },
    'th': {
      backgroundColor: '#F8FAFC',
      fontWeight: 600,
      color: '#334155',
    },
  },
  modalInput: {
    width: '80px',
    padding: '6px 8px',
    borderRadius: '6px',
    border: '1px solid #E2E8F0',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s ease',
    ':focus': {
      borderColor: '#0EA5E9',
      boxShadow: '0 0 0 3px rgba(14, 165, 233, 0.15)',
    },
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
};