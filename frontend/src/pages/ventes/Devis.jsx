// src/pages/ventes/Devis.jsx
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

export default function Devis() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const [devis, setDevis] = useState([]);
  const [clients, setClients] = useState([]);
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    client_id: '',
    date_validite: '',
    remise: 0,
    notes: '',
    lignes: [{ produit_id: '', quantite: 1, remise_ligne: 0 }]
  });
  const [formLoading, setFormLoading] = useState(false);

  const peutCreer = hasPermission('Ventes', 'creation');
  const peutValider = hasPermission('Ventes', 'validation');
  const peutSupprimer = hasPermission('Ventes', 'suppression');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [devisRes, clientsRes, produitsRes] = await Promise.all([
        API.get('/devis'),
        API.get('/clients'),
        API.get('/produits')
      ]);
      setDevis(devisRes.data.devis || []);
      setClients(clientsRes.data.clients || []);
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
    setForm({ ...form, lignes: newLignes });
  };

  const addLigne = () => {
    setForm({ ...form, lignes: [...form.lignes, { produit_id: '', quantite: 1, remise_ligne: 0 }] });
  };

  const removeLigne = (index) => {
    setForm({ ...form, lignes: form.lignes.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFormLoading(true);

    try {
      await API.post('/devis', form);
      setSuccess(' Devis créé avec succès');
      setShowForm(false);
      setForm({
        client_id: '',
        date_validite: '',
        remise: 0,
        notes: '',
        lignes: [{ produit_id: '', quantite: 1, remise_ligne: 0 }]
      });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatutChange = async (id, statut) => {
    try {
      await API.put(`/devis/${id}/statut`, { statut });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const handleConvertToCommande = async (id) => {
    if (!window.confirm('Convertir ce devis en commande ?')) return;
    try {
      await API.post(`/devis/${id}/convertir-commande`);
      setSuccess(' Devis converti en commande');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce devis ?')) return;
    try {
      await API.delete(`/devis/${id}`);
      setSuccess(' Devis supprimé');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const getStatutBadge = (statut) => {
    const statuts = {
      brouillon: { label: 'Brouillon', variant: 'outline' },
      envoye: { label: 'Envoyé', variant: 'primary' },
      accepte: { label: 'Accepté', variant: 'success' },
      refuse: { label: 'Refusé', variant: 'danger' },
      expire: { label: 'Expiré', variant: 'warning' }
    };
    return statuts[statut] || statuts.brouillon;
  };

  const columns = [
    { key: 'numero_devis', label: 'N°' },
    { key: 'client_nom', label: 'Client' },
    {
      key: 'date_devis',
      label: 'Date',
      render: (row) => new Date(row.date_devis).toLocaleDateString('fr-FR')
    },
    {
      key: 'date_validite',
      label: 'Validité',
      render: (row) => new Date(row.date_validite).toLocaleDateString('fr-FR')
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
  if (peutValider) {
    actions.push({
      label: 'Changer statut',
      variant: 'primary',
      onClick: (row) => {
        const statuts = ['brouillon', 'envoye', 'accepte', 'refuse', 'expire'];
        const idx = statuts.indexOf(row.statut);
        handleStatutChange(row.id, statuts[(idx + 1) % statuts.length]);
      }
    });
  }
  if (peutCreer) {
    actions.push({
      label: '➜ Commande',
      variant: 'success',
      onClick: (row) => handleConvertToCommande(row.id),
      disabled: (row) => row.statut !== 'accepte'
    });
  }
  if (peutSupprimer) {
    actions.push({
      label: ' Supprimer',
      variant: 'danger',
      onClick: (row) => handleDelete(row.id),
      disabled: (row) => row.statut !== 'brouillon'
    });
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}> Gestion des Devis</h1>
          <p style={styles.subtitle}>Gérez tous vos devis</p>
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
              {showForm ? 'Fermer' : 'Nouveau devis'}
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
          <span>done</span>
          <span style={styles.successText}>{success}</span>
        </div>
      )}

      {showForm && (
        <Card title=" Nouveau devis" variant="primary" style={{ marginBottom: '24px' }}>
          <form onSubmit={handleSubmit}>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Client *</label>
                <select
                  style={styles.select}
                  value={form.client_id}
                  onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                  required
                  disabled={formLoading}
                >
                  <option value="">-- Choisir un client --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Date de validité *</label>
                <input
                  style={styles.input}
                  type="date"
                  value={form.date_validite}
                  onChange={(e) => setForm({ ...form, date_validite: e.target.value })}
                  required
                  disabled={formLoading}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Remise (%)</label>
                <input
                  style={styles.input}
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={form.remise}
                  onChange={(e) => setForm({ ...form, remise: e.target.value })}
                  disabled={formLoading}
                />
              </div>
            </div>

            <div style={styles.lignesContainer}>
              <div style={styles.lignesHeader}>
                <span style={styles.lignesTitle}>Produits</span>
                <Button type="button" variant="outline" size="sm" onClick={addLigne} icon="+">
                  Ajouter un produit
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
                        {p.nom} ({p.prix} DT)
                      </option>
                    ))}
                  </select>
                  <input
                    style={{ ...styles.input, width: '80px' }}
                    type="number"
                    min="1"
                    placeholder="Qté"
                    value={ligne.quantite}
                    onChange={(e) => handleLigneChange(index, 'quantite', e.target.value)}
                    required
                    disabled={formLoading}
                  />
                  <input
                    style={{ ...styles.input, width: '80px' }}
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Remise %"
                    value={ligne.remise_ligne}
                    onChange={(e) => handleLigneChange(index, 'remise_ligne', e.target.value)}
                    disabled={formLoading}
                  />
                  {form.lignes.length > 1 && (
                    <Button type="button" variant="danger" size="sm" onClick={() => removeLigne(index)}>
                      ✕
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Notes</label>
              <textarea
                style={styles.textarea}
                placeholder="Notes supplémentaires"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                disabled={formLoading}
              />
            </div>

            <Button type="submit" variant="primary" loading={formLoading} fullWidth>
              Créer le devis
            </Button>
          </form>
        </Card>
      )}

      <Card title=" Liste des devis" variant="primary">
        <Table columns={columns} data={devis} loading={loading} actions={actions} />
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
    ':focus': {
      borderColor: '#0EA5E9',
      boxShadow: '0 0 0 3px rgba(14, 165, 233, 0.15)',
    },
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
};