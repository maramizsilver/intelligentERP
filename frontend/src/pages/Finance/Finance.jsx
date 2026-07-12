// src/pages/finance/Finance.jsx
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
import EmptyState from '../../components/common/EmptyState';

const CATEGORIES_DEPENSE = [
  { value: 'fournisseur', label: 'Fournisseur' },
  { value: 'salaire', label: 'Salaire' },
  { value: 'loyer', label: 'Loyer' },
  { value: 'electricite', label: 'Électricité' },
  { value: 'transport', label: 'Transport' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'impot', label: 'Impôt' },
  { value: 'autre', label: 'Autre' }
];

const MODES_PAIEMENT = [
  { value: 'especes', label: 'Espèces' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'virement', label: 'Virement' },
  { value: 'carte', label: 'Carte bancaire' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'flouci', label: 'Flouci' },
  { value: 'konnect', label: 'Konnect' }
];

export default function Finance() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const [onglet, setOnglet] = useState('rapport');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Rapport
  const [rapport, setRapport] = useState(null);
  const [periode, setPeriode] = useState({ date_debut: '', date_fin: '' });

  // Dépenses
  const [depenses, setDepenses] = useState([]);
  const [showFormDepense, setShowFormDepense] = useState(false);
  const [formDepense, setFormDepense] = useState({
    categorie: 'autre', montant: '', description: '', date_depense: '', mode_paiement: ''
  });

  // Recettes
  const [recettes, setRecettes] = useState([]);
  const [showFormRecette, setShowFormRecette] = useState(false);
  const [formRecette, setFormRecette] = useState({
    source: '', montant: '', description: '', date_recette: '', mode_paiement: ''
  });

  // Paiements
  const [paiements, setPaiements] = useState([]);
  const [showFormPaiement, setShowFormPaiement] = useState(false);
  const [formPaiement, setFormPaiement] = useState({
    reference_type: 'commande', reference_id: '', montant: '', mode_paiement: 'virement'
  });

  const [formLoading, setFormLoading] = useState(false);

  const peutCreer = hasPermission('Finance', 'creation');
  const peutModifier = hasPermission('Finance', 'modification');
  const peutSupprimer = hasPermission('Finance', 'suppression');
  const peutValider = hasPermission('Finance', 'validation');

  useEffect(() => {
    if (onglet === 'rapport') loadRapport();
    if (onglet === 'depenses') loadDepenses();
    if (onglet === 'recettes') loadRecettes();
    if (onglet === 'paiements') loadPaiements();
  }, [onglet]);

  const flashSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3500); };
  const flashError = (msg) => { setError(msg); setTimeout(() => setError(''), 4500); };

  const loadRapport = async () => {
    try {
      setLoading(true);
      const params = {};
      if (periode.date_debut) params.date_debut = periode.date_debut;
      if (periode.date_fin) params.date_fin = periode.date_fin;
      const res = await API.get('/finance/rapport', { params });
      setRapport(res.data);
    } catch (err) {
      flashError('Impossible de charger le rapport financier');
    } finally {
      setLoading(false);
    }
  };

  const loadDepenses = async () => {
    try {
      setLoading(true);
      const res = await API.get('/finance/depenses');
      setDepenses(res.data.depenses || []);
    } catch (err) {
      flashError('Impossible de charger les dépenses');
    } finally {
      setLoading(false);
    }
  };

  const loadRecettes = async () => {
    try {
      setLoading(true);
      const res = await API.get('/finance/recettes');
      setRecettes(res.data.recettes || []);
    } catch (err) {
      flashError('Impossible de charger les recettes');
    } finally {
      setLoading(false);
    }
  };

  const loadPaiements = async () => {
    try {
      setLoading(true);
      const res = await API.get('/finance/paiements');
      setPaiements(res.data.paiements || []);
    } catch (err) {
      flashError('Impossible de charger les paiements');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDepense = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await API.post('/finance/depenses', formDepense);
      flashSuccess('Dépense enregistrée avec succès');
      setShowFormDepense(false);
      setFormDepense({ categorie: 'autre', montant: '', description: '', date_depense: '', mode_paiement: '' });
      loadDepenses();
    } catch (err) {
      flashError(err.response?.data?.message || 'Erreur');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteDepense = async (id) => {
    if (!window.confirm('Supprimer cette dépense ?')) return;
    try {
      await API.delete(`/finance/depenses/${id}`);
      flashSuccess('Dépense supprimée');
      loadDepenses();
    } catch (err) {
      flashError(err.response?.data?.message || 'Erreur');
    }
  };

  const handleSubmitRecette = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await API.post('/finance/recettes', formRecette);
      flashSuccess('Recette enregistrée avec succès');
      setShowFormRecette(false);
      setFormRecette({ source: '', montant: '', description: '', date_recette: '', mode_paiement: '' });
      loadRecettes();
    } catch (err) {
      flashError(err.response?.data?.message || 'Erreur');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteRecette = async (id) => {
    if (!window.confirm('Supprimer cette recette ?')) return;
    try {
      await API.delete(`/finance/recettes/${id}`);
      flashSuccess('Recette supprimée');
      loadRecettes();
    } catch (err) {
      flashError(err.response?.data?.message || 'Erreur');
    }
  };

  const handleSubmitPaiement = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const res = await API.post('/finance/paiements', formPaiement);
      flashSuccess(res.data.message || 'Paiement enregistré');
      setShowFormPaiement(false);
      setFormPaiement({ reference_type: 'commande', reference_id: '', montant: '', mode_paiement: 'virement' });
      loadPaiements();
    } catch (err) {
      flashError(err.response?.data?.message || 'Erreur');
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmerPaiement = async (id, statut) => {
    try {
      await API.put(`/finance/paiements/${id}/statut`, { statut });
      flashSuccess('Statut du paiement mis à jour');
      loadPaiements();
    } catch (err) {
      flashError(err.response?.data?.message || 'Erreur');
    }
  };

  const getStatutPaiementBadge = (statut) => {
    const statuts = {
      en_attente: { label: 'En attente', variant: 'warning' },
      valide: { label: 'Validé', variant: 'success' },
      echoue: { label: 'Échoué', variant: 'danger' },
      rembourse: { label: 'Remboursé', variant: 'outline' }
    };
    return statuts[statut] || { label: statut, variant: 'outline' };
  };

  const getModeLabel = (mode) => MODES_PAIEMENT.find(m => m.value === mode)?.label || mode || '—';
  const getCategorieLabel = (cat) => CATEGORIES_DEPENSE.find(c => c.value === cat)?.label || cat;

  const columnsDepenses = [
    { key: 'categorie', label: 'Catégorie', render: (row) => getCategorieLabel(row.categorie) },
    { key: 'description', label: 'Description' },
    { key: 'fournisseur_nom', label: 'Fournisseur', render: (row) => row.fournisseur_nom || '—' },
    { key: 'montant', label: 'Montant', render: (row) => `${row.montant} DT` },
    { key: 'mode_paiement', label: 'Mode', render: (row) => getModeLabel(row.mode_paiement) },
    { key: 'date_depense', label: 'Date', render: (row) => new Date(row.date_depense).toLocaleDateString('fr-FR') }
  ];

  const columnsRecettes = [
    { key: 'source', label: 'Source' },
    { key: 'client_nom', label: 'Client', render: (row) => row.client_nom || '—' },
    { key: 'montant', label: 'Montant', render: (row) => `${row.montant} DT` },
    { key: 'mode_paiement', label: 'Mode', render: (row) => getModeLabel(row.mode_paiement) },
    { key: 'date_recette', label: 'Date', render: (row) => new Date(row.date_recette).toLocaleDateString('fr-FR') }
  ];

  const columnsPaiements = [
    { key: 'numero_transaction', label: 'N° Transaction' },
    { key: 'reference_type', label: 'Type', render: (row) => row.reference_type === 'commande' ? 'Commande' : 'Achat' },
    { key: 'reference_id', label: 'Réf.', render: (row) => `#${row.reference_id}` },
    { key: 'montant', label: 'Montant', render: (row) => `${row.montant} DT` },
    { key: 'mode_paiement', label: 'Mode', render: (row) => getModeLabel(row.mode_paiement) },
    {
      key: 'statut',
      label: 'Statut',
      render: (row) => {
        const s = getStatutPaiementBadge(row.statut);
        return <Badge variant={s.variant}>{s.label}</Badge>;
      }
    }
  ];

  const actionsDepenses = [];
  if (peutSupprimer) actionsDepenses.push({ label: 'Supprimer', variant: 'danger', onClick: (r) => handleDeleteDepense(r.id) });

  const actionsRecettes = [];
  if (peutSupprimer) actionsRecettes.push({ label: 'Supprimer', variant: 'danger', onClick: (r) => handleDeleteRecette(r.id) });

  const actionsPaiements = [];
  if (peutValider) {
    actionsPaiements.push({
      label: 'Valider',
      variant: 'success',
      onClick: (r) => handleConfirmerPaiement(r.id, 'valide'),
      disabled: (r) => r.statut !== 'en_attente'
    });
    actionsPaiements.push({
      label: 'Marquer échoué',
      variant: 'danger',
      onClick: (r) => handleConfirmerPaiement(r.id, 'echoue'),
      disabled: (r) => r.statut !== 'en_attente'
    });
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Module Financier</h1>
          <p style={styles.subtitle}>Comptabilité, paiements, dépenses et recettes</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/dashboard')} icon="←">
          Retour
        </Button>
      </div>

      {success && (
        <div style={styles.successContainer}>
          <span>✅</span>
          <span style={styles.successText}>{success}</span>
        </div>
      )}
      {error && (
        <div style={styles.errorContainer}>
          <span>❌</span>
          <span style={styles.errorText}>{error}</span>
        </div>
      )}

      <div style={styles.segmentedControl}>
        {[
          { key: 'rapport', label: 'Rapport' },
          { key: 'depenses', label: 'Dépenses' },
          { key: 'recettes', label: 'Recettes' },
          { key: 'paiements', label: 'Paiements' }
        ].map(t => (
          <button
            key={t.key}
            style={{ ...styles.segment, ...(onglet === t.key ? styles.segmentActive : {}) }}
            onClick={() => setOnglet(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ============ RAPPORT ============ */}
      {onglet === 'rapport' && (
        <>
          <Card title="Filtrer par période" variant="primary" style={{ marginBottom: '20px' }}>
            <div style={styles.formGrid}>
              <Input
                label="Date début"
                type="date"
                value={periode.date_debut}
                onChange={(e) => setPeriode({ ...periode, date_debut: e.target.value })}
              />
              <Input
                label="Date fin"
                type="date"
                value={periode.date_fin}
                onChange={(e) => setPeriode({ ...periode, date_fin: e.target.value })}
              />
              <Button variant="primary" onClick={loadRapport} loading={loading}>
                Appliquer
              </Button>
            </div>
          </Card>

          {loading ? (
            <LoadingSpinner size="lg" text="Chargement du rapport..." />
          ) : rapport ? (
            <>
              <div style={styles.statsGrid}>
                <div style={{ ...styles.statCard, borderLeft: '4px solid #22C55E' }}>
                  <span style={styles.statNumber}>{rapport.recettes.total.toFixed(2)} DT</span>
                  <span style={styles.statLabel}>Total recettes</span>
                </div>
                <div style={{ ...styles.statCard, borderLeft: '4px solid #EF4444' }}>
                  <span style={styles.statNumber}>{rapport.depenses.total.toFixed(2)} DT</span>
                  <span style={styles.statLabel}>Total dépenses</span>
                </div>
                <div style={{ ...styles.statCard, borderLeft: `4px solid ${rapport.resultat_net >= 0 ? '#0EA5E9' : '#EF4444'}` }}>
                  <span style={{ ...styles.statNumber, color: rapport.resultat_net >= 0 ? '#0F172A' : '#EF4444' }}>
                    {rapport.resultat_net.toFixed(2)} DT
                  </span>
                  <span style={styles.statLabel}>Résultat net</span>
                </div>
              </div>

              <Card title="Détail des recettes" variant="success" style={{ marginBottom: '20px' }}>
                <div style={styles.detailRow}>
                  <span>Commandes livrées</span>
                  <strong>{rapport.recettes.commandes_livrees.toFixed(2)} DT</strong>
                </div>
                <div style={styles.detailRow}>
                  <span>Recettes manuelles</span>
                  <strong>{rapport.recettes.recettes_manuelles.toFixed(2)} DT</strong>
                </div>
              </Card>

              <Card title="Dépenses par catégorie" variant="danger">
                {rapport.depenses.par_categorie.length === 0 ? (
                  <EmptyState title="Aucune dépense" description="Aucune dépense enregistrée sur cette période." />
                ) : (
                  rapport.depenses.par_categorie.map((c, i) => (
                    <div key={i} style={styles.detailRow}>
                      <span>{getCategorieLabel(c.categorie)}</span>
                      <strong>{Number(c.total).toFixed(2)} DT</strong>
                    </div>
                  ))
                )}
              </Card>
            </>
          ) : null}
        </>
      )}

      {/* ============ DÉPENSES ============ */}
      {onglet === 'depenses' && (
        <>
          <div style={styles.actionBar}>
            {peutCreer && (
              <Button variant="primary" icon={showFormDepense ? '✕' : '+'} onClick={() => setShowFormDepense(!showFormDepense)}>
                {showFormDepense ? 'Fermer' : 'Nouvelle dépense'}
              </Button>
            )}
          </div>

          {showFormDepense && (
            <Card title="Nouvelle dépense" variant="primary" style={{ marginBottom: '24px' }}>
              <form onSubmit={handleSubmitDepense}>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Catégorie *</label>
                    <select
                      style={styles.select}
                      value={formDepense.categorie}
                      onChange={(e) => setFormDepense({ ...formDepense, categorie: e.target.value })}
                      disabled={formLoading}
                    >
                      {CATEGORIES_DEPENSE.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <Input
                    label="Montant (DT) *"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formDepense.montant}
                    onChange={(e) => setFormDepense({ ...formDepense, montant: e.target.value })}
                    required
                    disabled={formLoading}
                  />
                  <Input
                    label="Date *"
                    type="date"
                    value={formDepense.date_depense}
                    onChange={(e) => setFormDepense({ ...formDepense, date_depense: e.target.value })}
                    required
                    disabled={formLoading}
                  />
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Mode de paiement</label>
                    <select
                      style={styles.select}
                      value={formDepense.mode_paiement}
                      onChange={(e) => setFormDepense({ ...formDepense, mode_paiement: e.target.value })}
                      disabled={formLoading}
                    >
                      <option value="">-- Non spécifié --</option>
                      {MODES_PAIEMENT.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Description</label>
                  <textarea
                    style={styles.textarea}
                    value={formDepense.description}
                    onChange={(e) => setFormDepense({ ...formDepense, description: e.target.value })}
                    disabled={formLoading}
                  />
                </div>
                <Button type="submit" variant="primary" loading={formLoading} fullWidth>
                  Enregistrer la dépense
                </Button>
              </form>
            </Card>
          )}

          <Card title="Liste des dépenses" variant="primary">
            <Table columns={columnsDepenses} data={depenses} loading={loading} actions={actionsDepenses} />
          </Card>
        </>
      )}

      {/* ============ RECETTES ============ */}
      {onglet === 'recettes' && (
        <>
          <div style={styles.actionBar}>
            {peutCreer && (
              <Button variant="primary" icon={showFormRecette ? '✕' : '+'} onClick={() => setShowFormRecette(!showFormRecette)}>
                {showFormRecette ? 'Fermer' : 'Nouvelle recette'}
              </Button>
            )}
          </div>

          {showFormRecette && (
            <Card title="Nouvelle recette" variant="primary" style={{ marginBottom: '24px' }}>
              <form onSubmit={handleSubmitRecette}>
                <div style={styles.formGrid}>
                  <Input
                    label="Source *"
                    placeholder="Ex: Subvention, Remboursement..."
                    value={formRecette.source}
                    onChange={(e) => setFormRecette({ ...formRecette, source: e.target.value })}
                    required
                    disabled={formLoading}
                  />
                  <Input
                    label="Montant (DT) *"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formRecette.montant}
                    onChange={(e) => setFormRecette({ ...formRecette, montant: e.target.value })}
                    required
                    disabled={formLoading}
                  />
                  <Input
                    label="Date *"
                    type="date"
                    value={formRecette.date_recette}
                    onChange={(e) => setFormRecette({ ...formRecette, date_recette: e.target.value })}
                    required
                    disabled={formLoading}
                  />
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Mode de paiement</label>
                    <select
                      style={styles.select}
                      value={formRecette.mode_paiement}
                      onChange={(e) => setFormRecette({ ...formRecette, mode_paiement: e.target.value })}
                      disabled={formLoading}
                    >
                      <option value="">-- Non spécifié --</option>
                      {MODES_PAIEMENT.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Description</label>
                  <textarea
                    style={styles.textarea}
                    value={formRecette.description}
                    onChange={(e) => setFormRecette({ ...formRecette, description: e.target.value })}
                    disabled={formLoading}
                  />
                </div>
                <Button type="submit" variant="primary" loading={formLoading} fullWidth>
                  Enregistrer la recette
                </Button>
              </form>
            </Card>
          )}

          <Card title="Liste des recettes" variant="primary">
            <Table columns={columnsRecettes} data={recettes} loading={loading} actions={actionsRecettes} />
          </Card>
        </>
      )}

      {/* ============ PAIEMENTS ============ */}
      {onglet === 'paiements' && (
        <>
          <div style={styles.actionBar}>
            {peutCreer && (
              <Button variant="primary" icon={showFormPaiement ? '✕' : '+'} onClick={() => setShowFormPaiement(!showFormPaiement)}>
                {showFormPaiement ? 'Fermer' : 'Enregistrer un paiement'}
              </Button>
            )}
          </div>

          {showFormPaiement && (
            <Card title="Nouveau paiement" variant="primary" style={{ marginBottom: '24px' }}>
              <form onSubmit={handleSubmitPaiement}>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Type de référence *</label>
                    <select
                      style={styles.select}
                      value={formPaiement.reference_type}
                      onChange={(e) => setFormPaiement({ ...formPaiement, reference_type: e.target.value })}
                      disabled={formLoading}
                    >
                      <option value="commande">Commande client</option>
                      <option value="achat">Achat fournisseur</option>
                    </select>
                  </div>
                  <Input
                    label="ID de référence *"
                    type="number"
                    min="1"
                    value={formPaiement.reference_id}
                    onChange={(e) => setFormPaiement({ ...formPaiement, reference_id: e.target.value })}
                    required
                    disabled={formLoading}
                  />
                  <Input
                    label="Montant (DT) *"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formPaiement.montant}
                    onChange={(e) => setFormPaiement({ ...formPaiement, montant: e.target.value })}
                    required
                    disabled={formLoading}
                  />
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Mode de paiement *</label>
                    <select
                      style={styles.select}
                      value={formPaiement.mode_paiement}
                      onChange={(e) => setFormPaiement({ ...formPaiement, mode_paiement: e.target.value })}
                      disabled={formLoading}
                    >
                      {MODES_PAIEMENT.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                </div>
                <p style={styles.hintText}>
                  Les modes Stripe, PayPal, Flouci et Konnect créent un paiement "en attente" jusqu'à confirmation du fournisseur de paiement.
                </p>
                <Button type="submit" variant="primary" loading={formLoading} fullWidth>
                  Enregistrer le paiement
                </Button>
              </form>
            </Card>
          )}

          <Card title="Liste des paiements" variant="primary">
            <Table columns={columnsPaiements} data={paiements} loading={loading} actions={actionsPaiements} />
          </Card>
        </>
      )}
    </div>
  );
}

const styles = {
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: '24px', flexWrap: 'wrap', gap: '12px',
  },
  title: { fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: 0 },
  subtitle: { fontSize: '14px', color: '#64748B', margin: '4px 0 0' },
  actionBar: { display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' },
  errorContainer: {
    display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#FEF2F2',
    border: '1px solid #FECACA', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px',
  },
  errorText: { color: '#991B1B', fontSize: '13px', fontWeight: 500 },
  successContainer: {
    display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#F0FDF4',
    border: '1px solid #86EFAC', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px',
  },
  successText: { color: '#065F46', fontSize: '13px', fontWeight: 500 },
  segmentedControl: {
    display: 'inline-flex', backgroundColor: '#E2E8F0', borderRadius: '10px',
    padding: '4px', marginBottom: '20px', gap: '4px', flexWrap: 'wrap',
  },
  segment: {
    padding: '8px 16px', border: 'none', backgroundColor: 'transparent', borderRadius: '8px',
    cursor: 'pointer', fontSize: '13px', color: '#475569', fontWeight: 600, transition: 'all 0.2s ease',
  },
  segmentActive: { backgroundColor: '#FFFFFF', color: '#0F172A', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  formGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px', marginBottom: '16px', alignItems: 'end',
  },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' },
  label: { fontSize: '13px', fontWeight: 600, color: '#334155' },
  select: {
    padding: '10px 14px', borderRadius: '8px', border: '2px solid #E2E8F0', fontSize: '14px',
    backgroundColor: '#F8FAFC', width: '100%', boxSizing: 'border-box', outline: 'none',
  },
  textarea: {
    width: '100%', padding: '10px 14px', borderRadius: '8px', border: '2px solid #E2E8F0',
    fontSize: '14px', backgroundColor: '#F8FAFC', minHeight: '60px', boxSizing: 'border-box',
    outline: 'none', fontFamily: 'inherit',
  },
  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px', marginBottom: '20px',
  },
  statCard: {
    backgroundColor: '#FFFFFF', padding: '18px', borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column',
  },
  statNumber: { fontSize: '24px', fontWeight: 'bold', color: '#0F172A' },
  statLabel: { color: '#64748B', fontSize: '13px', marginTop: '4px' },
  detailRow: {
    display: 'flex', justifyContent: 'space-between', padding: '10px 0',
    borderBottom: '1px solid #F1F5F9', fontSize: '14px',
  },
  hintText: { fontSize: '12px', color: '#64748B', marginBottom: '16px', fontStyle: 'italic' },
};