import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';

import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function Commandes() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const [commandes, setCommandes] = useState([]);
  const [clients, setClients] = useState([]);
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [clientId, setClientId] = useState('');
  const [lignes, setLignes] = useState([{ produit_id: '', quantite: 1 }]);
  const [formLoading, setFormLoading] = useState(false);

  const peutCreer = hasPermission('Ventes', 'creation');
  const peutValider = hasPermission('Ventes', 'validation');
  const peutSupprimer = hasPermission('Ventes', 'suppression');

  const loadData = async () => {
    try {
      setLoading(true);
      const [resCmd, resCli, resProd] = await Promise.all([
        API.get('/commandes'),
        API.get('/clients'),
        API.get('/produits')
      ]);
      setCommandes(resCmd.data.commandes || []);
      setClients(resCli.data.clients || []);
      setProduits(resProd.data.produits || []);
    } catch (err) {
      setError('Impossible de charger les donnees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLigneChange = (index, field, value) => {
    const newLignes = [...lignes];
    newLignes[index][field] = value;
    setLignes(newLignes);
  };

  const addLigne = () => setLignes([...lignes, { produit_id: '', quantite: 1 }]);
  const removeLigne = (index) => setLignes(lignes.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFormLoading(true);

    if (!clientId) {
      setError('Veuillez choisir un client');
      setFormLoading(false);
      return;
    }

    const lignesValides = lignes.filter(l => l.produit_id && l.quantite > 0);
    if (lignesValides.length === 0) {
      setError('Ajoutez au moins un produit');
      setFormLoading(false);
      return;
    }

    try {
      await API.post('/commandes', {
        client_id: clientId,
        lignes: lignesValides
      });
      setSuccess('Commande creee avec succes');
      setShowForm(false);
      setClientId('');
      setLignes([{ produit_id: '', quantite: 1 }]);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatutChange = async (id, statut) => {
    try {
      await API.put(`/commandes/${id}/statut`, { statut });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette commande ?')) return;
    try {
      await API.delete(`/commandes/${id}`);
      setSuccess('Commande supprimee');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const getStatutBadge = (statut) => {
    const statuts = {
      en_attente: { label: 'En attente', variant: 'warning' },
      confirmee: { label: 'Confirmee', variant: 'primary' },
      livree: { label: 'Livree', variant: 'success' },
      annulee: { label: 'Annulee', variant: 'danger' }
    };
    return statuts[statut] || statuts.en_attente;
  };

  const columns = [
    {
      key: 'id',
      label: 'N°',
      width: '60px'
    },
    { key: 'client_nom', label: 'Client' },
    {
      key: 'date_commande',
      label: 'Date',
      render: (row) => new Date(row.date_commande).toLocaleDateString('fr-FR')
    },
    {
      key: 'total',
      label: 'Total',
      render: (row) => `${row.total} DT`
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
  if (peutValider) {
    actions.push({
      label: 'Changer statut',
      variant: 'primary',
      onClick: (row) => {
        const statuts = ['en_attente', 'confirmee', 'livree', 'annulee'];
        const idx = statuts.indexOf(row.statut);
        handleStatutChange(row.id, statuts[(idx + 1) % statuts.length]);
      }
    });
  }
  if (peutSupprimer) {
    actions.push({
      label: 'Supprimer',
      variant: 'danger',
      onClick: (row) => handleDelete(row.id)
    });
  }

  actions.push({
    label: 'Payer',
    variant: 'success',
    onClick: (row) => navigate(`/paiement/client?commande_id=${row.id}&montant=${row.total}`),
    disabled: (row) => row.statut !== 'en_attente'
  });

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Gestion des Commandes</h1>
          <p style={styles.subtitle}>Gerez toutes les commandes de votre entreprise</p>
        </div>
        <div style={styles.headerActions}>
          <Button variant="secondary" onClick={() => navigate('/dashboard')}>
            Retour
          </Button>
          {peutCreer && (
            <Button
              variant="primary"
              icon={showForm ? '✕' : '+'}
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? 'Fermer' : 'Nouvelle commande'}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div style={styles.errorContainer}>
          <span style={styles.errorText}>{error}</span>
        </div>
      )}
      {success && (
        <div style={styles.successContainer}>
          <span style={styles.successText}>{success}</span>
        </div>
      )}

      {showForm && (
        <Card title="Nouvelle commande" variant="primary" style={{ marginBottom: '24px' }}>
          <form onSubmit={handleSubmit}>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Client *</label>
                <select
                  style={styles.select}
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  required
                  disabled={formLoading}
                >
                  <option value="">-- Choisir un client --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={styles.lignesContainer}>
              <div style={styles.lignesHeader}>
                <span style={styles.lignesTitle}>Produits</span>
                <Button type="button" variant="outline" size="sm" onClick={addLigne}>
                  + Ajouter un produit
                </Button>
              </div>

              {lignes.map((ligne, index) => (
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
                        {p.nom} ({p.prix} DT)
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
                  {lignes.length > 1 && (
                    <Button type="button" variant="danger" size="sm" onClick={() => removeLigne(index)}>
                      ✕
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button type="submit" variant="primary" loading={formLoading} fullWidth>
              Creer la commande
            </Button>
          </form>
        </Card>
      )}

      <Card title="Liste des commandes" variant="primary">
        <Table columns={columns} data={commandes} loading={loading} actions={actions} />
      </Card>
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
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#0F172A',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748B',
    margin: '4px 0 0',
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
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
  errorText: {
    color: '#991B1B',
    fontSize: '13px',
    fontWeight: 500,
  },
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
  successText: {
    color: '#065F46',
    fontSize: '13px',
    fontWeight: 500,
  },
  formRow: {
    marginBottom: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
  },
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
  lignesTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#0F172A',
  },
  ligneRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginBottom: '8px',
    flexWrap: 'wrap',
  },
};