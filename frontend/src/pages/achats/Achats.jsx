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

export default function Achats() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const [achats, setAchats] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [receivingId, setReceivingId] = useState(null);

  const [showReceptionModal, setShowReceptionModal] = useState(false);
  const [receptionData, setReceptionData] = useState({
    achatId: null,
    lignes: [],
    quantites: {}
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    fournisseur_id: '',
    date_livraison_prevue: '',
    notes: '',
    lignes: [{ produit_id: '', quantite: 1, prix_unitaire: '' }]
  });
  const [formLoading, setFormLoading] = useState(false);

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

      const achatsWithLignes = await Promise.all(
        (achatsRes.data.achats || []).map(async (achat) => {
          try {
            const lignesRes = await API.get(`/achats/${achat.id}`);
            return { ...achat, lignes: lignesRes.data.achat?.lignes || [] };
          } catch {
            return { ...achat, lignes: [] };
          }
        })
      );

      setAchats(achatsWithLignes);
      setFournisseurs(fournisseursRes.data.fournisseurs || []);
      setProduits(produitsRes.data.produits || []);
    } catch (err) {
      setError('Impossible de charger les donnees');
    } finally {
      setLoading(false);
    }
  };

  const handleLigneChange = (index, field, value) => {
    const newLignes = [...form.lignes];
    newLignes[index][field] = value;
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
    setFormLoading(true);

    try {
      const data = {
        ...form,
        lignes: form.lignes.filter(l => l.produit_id && l.quantite > 0)
      };

      if (data.lignes.length === 0) {
        setError('Ajoutez au moins un produit');
        setFormLoading(false);
        return;
      }

      await API.post('/achats', data);
      setSuccess('Bon de commande cree avec succes');
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
      setFormLoading(false);
    }
  };

  const handleRecevoir = (achat) => {
    const lignes = achat.lignes || [];
    const quantites = {};
    lignes.forEach(l => {
      quantites[l.produit_id] = l.quantite_recue || 0;
    });

    setReceptionData({
      achatId: achat.id,
      lignes: lignes,
      quantites: quantites
    });
    setShowReceptionModal(true);
  };

  const handleReceptionChange = (produitId, value) => {
    const qte = parseInt(value) || 0;
    setReceptionData({
      ...receptionData,
      quantites: {
        ...receptionData.quantites,
        [produitId]: qte
      }
    });
  };

  const handleConfirmReception = async () => {
    const { achatId, quantites } = receptionData;

    const quantitesRecues = {};
    Object.keys(quantites).forEach(key => {
      if (quantites[key] > 0) {
        quantitesRecues[key] = quantites[key];
      }
    });

    if (Object.keys(quantitesRecues).length === 0) {
      setError('Veuillez saisir au moins une quantite');
      return;
    }

    try {
      setReceivingId(achatId);
      await API.put(`/achats/${achatId}/recevoir`, {
        quantites_recues: quantitesRecues
      });
      setSuccess('Reception enregistree, stock mis a jour');
      setShowReceptionModal(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la reception');
    } finally {
      setReceivingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce bon de commande ?')) return;
    try {
      await API.delete(`/achats/${id}`);
      setSuccess('Bon de commande supprime');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const getStatutBadge = (statut) => {
    const statuts = {
      brouillon: { label: 'Brouillon', variant: 'outline' },
      envoye: { label: 'Envoye', variant: 'primary' },
      recu_partiel: { label: 'Recu partiel', variant: 'warning' },
      recu_total: { label: 'Recu total', variant: 'success' },
      annule: { label: 'Annule', variant: 'danger' }
    };
    return statuts[statut] || statuts.brouillon;
  };

  const columns = [
    { key: 'id', label: 'N°', width: '60px' },
    { key: 'numero_bc', label: 'Numero BC' },
    { key: 'fournisseur_nom', label: 'Fournisseur' },
    {
      key: 'date_commande',
      label: 'Date',
      render: (row) => new Date(row.date_commande).toLocaleDateString('fr-FR')
    },
    {
      key: 'date_livraison_prevue',
      label: 'Livraison prevue',
      render: (row) => row.date_livraison_prevue ? new Date(row.date_livraison_prevue).toLocaleDateString('fr-FR') : '—'
    },
    {
      key: 'total_ttc',
      label: 'Total',
      render: (row) => `${row.total_ttc} DT`
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (row) => {
        const statut = getStatutBadge(row.statut);
        return <Badge variant={statut.variant}>{statut.label}</Badge>;
      }
    }
  ];

  const actions = [];
  if (peutModifier) {
    actions.push({
      label: 'Receptionner',
      variant: 'primary',
      onClick: (row) => handleRecevoir(row),
      disabled: (row) => row.statut === 'recu_total' || row.statut === 'annule' || receivingId === row.id
    });
  }
  if (peutSupprimer) {
    actions.push({
      label: 'Supprimer',
      variant: 'danger',
      onClick: (row) => handleDelete(row.id),
      disabled: (row) => row.statut !== 'brouillon'
    });
  }

  actions.push({
    label: 'Payer fournisseur',
    variant: 'success',
    onClick: (row) => navigate(`/paiement/fournisseur?achat_id=${row.id}&montant=${row.total_ttc}`),
    disabled: (row) => row.statut !== 'recu_total' && row.statut !== 'paye'
  });

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Gestion des Achats</h1>
          <p style={styles.subtitle}>Gerez vos bons de commande fournisseurs</p>
        </div>
        <div style={styles.headerActions}>
          <Button variant="secondary" onClick={() => navigate('/dashboard')}>
            Retour
          </Button>
          {peutCreer && (
            <Button
              variant="primary"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? 'Fermer' : 'Nouveau bon de commande'}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div style={styles.errorContainer}>
          <span style={styles.errorIcon}>X</span>
          <span style={styles.errorText}>{error}</span>
        </div>
      )}
      {success && (
        <div style={styles.successContainer}>
          <span style={styles.successIcon}>V</span>
          <span style={styles.successText}>{success}</span>
        </div>
      )}

      {showForm && (
        <Card title="Nouveau bon de commande" variant="primary" style={{ marginBottom: '24px' }}>
          <form onSubmit={handleSubmit}>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Fournisseur *</label>
                <select
                  style={styles.select}
                  value={form.fournisseur_id}
                  onChange={(e) => setForm({ ...form, fournisseur_id: e.target.value })}
                  required
                  disabled={formLoading}
                >
                  <option value="">-- Choisir un fournisseur --</option>
                  {fournisseurs.map(f => (
                    <option key={f.id} value={f.id}>{f.nom}</option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Date livraison prevue</label>
                <input
                  style={styles.input}
                  type="date"
                  value={form.date_livraison_prevue}
                  onChange={(e) => setForm({ ...form, date_livraison_prevue: e.target.value })}
                  disabled={formLoading}
                />
              </div>
            </div>

            <div style={styles.lignesContainer}>
              <div style={styles.lignesHeader}>
                <span style={styles.lignesTitle}>Produits</span>
                <Button type="button" variant="outline" size="sm" onClick={addLigne}>
                  + Ajouter un produit
                </Button>
              </div>

              {form.lignes.map((ligne, index) => (
                <div key={index} style={styles.ligneRow}>
                  <select
                    style={{ ...styles.select, flex: 2 }}
                    value={ligne.produit_id}
                    onChange={(e) => handleLigneChange(index, 'produit_id', e.target.value)}
                    required
                    disabled={formLoading}
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
                    placeholder="Qte"
                    value={ligne.quantite}
                    onChange={(e) => handleLigneChange(index, 'quantite', e.target.value)}
                    required
                    disabled={formLoading}
                  />
                  <input
                    style={{ ...styles.input, width: '120px' }}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Prix unitaire"
                    value={ligne.prix_unitaire}
                    onChange={(e) => handleLigneChange(index, 'prix_unitaire', e.target.value)}
                    required
                    disabled={formLoading}
                  />
                  {form.lignes.length > 1 && (
                    <Button type="button" variant="danger" size="sm" onClick={() => removeLigne(index)}>
                      X
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Notes</label>
              <textarea
                style={styles.textarea}
                placeholder="Notes supplementaires"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                disabled={formLoading}
              />
            </div>

            <Button type="submit" variant="primary" loading={formLoading} fullWidth>
              Creer le bon de commande
            </Button>
          </form>
        </Card>
      )}

      <Card title="Liste des bons de commande" variant="primary">
        <Table columns={columns} data={achats} loading={loading} actions={actions} />
      </Card>

      {showReceptionModal && (
        <div style={styles.modalOverlay} onClick={() => setShowReceptionModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Receptionner la commande</h3>
            <p style={styles.modalSubtitle}>Saisissez les quantites recues</p>

            {receptionData.lignes.length === 0 ? (
              <p style={styles.emptyMessage}>Aucun produit dans cette commande</p>
            ) : (
              <table style={styles.modalTable}>
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Commande</th>
                    <th>Deja recu</th>
                    <th>Reste</th>
                    <th>Quantite recue</th>
                  </tr>
                </thead>
                <tbody>
                  {receptionData.lignes.map((ligne) => {
                    const reste = ligne.quantite - (ligne.quantite_recue || 0);
                    return (
                      <tr key={ligne.produit_id}>
                        <td>{ligne.produit_nom || `Produit #${ligne.produit_id}`}</td>
                        <td>{ligne.quantite}</td>
                        <td>{ligne.quantite_recue || 0}</td>
                        <td><strong>{reste}</strong></td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max={reste}
                            value={receptionData.quantites[ligne.produit_id] || ''}
                            onChange={(e) => handleReceptionChange(ligne.produit_id, e.target.value)}
                            style={styles.modalInput}
                            disabled={receivingId === receptionData.achatId}
                            placeholder="0"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            <div style={styles.modalActions}>
              <Button variant="secondary" onClick={() => setShowReceptionModal(false)}>
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmReception}
                loading={receivingId === receptionData.achatId}
                disabled={receptionData.lignes.length === 0}
              >
                Valider la reception
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
  errorIcon: { color: '#991B1B', fontSize: '16px', fontWeight: 'bold' },
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
  successIcon: { color: '#065F46', fontSize: '16px', fontWeight: 'bold' },
  successText: { color: '#065F46', fontSize: '13px', fontWeight: 500 },

  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '16px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: '16px'
  },
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
  },
  input: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '2px solid #E2E8F0',
    fontSize: '14px',
    backgroundColor: '#F8FAFC',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  textarea: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '2px solid #E2E8F0',
    fontSize: '14px',
    backgroundColor: '#F8FAFC',
    minHeight: '60px',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },

  lignesContainer: {
    backgroundColor: '#F8FAFC',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  lignesHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  lignesTitle: { fontSize: '14px', fontWeight: 600, color: '#0F172A' },
  ligneRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginBottom: '8px',
    flexWrap: 'wrap',
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
  modalTitle: { margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: '#0F172A' },
  modalSubtitle: { margin: '0 0 16px', fontSize: '14px', color: '#64748B' },
  modalTable: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '20px',
  },
  modalInput: {
    width: '80px',
    padding: '6px 8px',
    borderRadius: '6px',
    border: '1px solid #E2E8F0',
    fontSize: '14px',
    outline: 'none',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
  emptyMessage: {
    textAlign: 'center',
    padding: '20px',
    color: '#94A3B8',
    fontSize: '14px',
  },
};