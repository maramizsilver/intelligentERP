import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import API from '../../utils/api';

import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function MouvementsStock() {
  const { hasPermission } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [produits, setProduits] = useState([]);
  const [produitId, setProduitId] = useState('');
  const [mouvements, setMouvements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [showAjustement, setShowAjustement] = useState(false);
  const [formAjustement, setFormAjustement] = useState({
    produit_id: '',
    quantite: '',
    motif: ''
  });
  const [formLoading, setFormLoading] = useState(false);

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

  const mouvementsFiltres = useMemo(() => {
    if (!searchTerm.trim()) return mouvements;
    const terme = searchTerm.trim().toLowerCase();
    return mouvements.filter(m =>
      (m.produit_nom || '').toLowerCase().startsWith(terme) ||
      (m.type || '').toLowerCase().startsWith(terme) ||
      (m.motif || '').toLowerCase().startsWith(terme) ||
      String(m.quantite).startsWith(terme) ||
      String(m.ancien_stock).startsWith(terme) ||
      String(m.nouveau_stock).startsWith(terme)
    );
  }, [mouvements, searchTerm]);

  const handleAjustement = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFormLoading(true);

    try {
      await API.post('/mouvements-stock/ajuster', formAjustement);
      setSuccess(t('stock_ajuste_succes'));
      setShowAjustement(false);
      setFormAjustement({ produit_id: '', quantite: '', motif: '' });
      loadProduits();
      if (produitId) loadMouvements();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setFormLoading(false);
    }
  };

  const getTypeBadge = (type) => {
    const types = {
      entree: { label: t('entree'), variant: 'success' },
      sortie: { label: t('sortie'), variant: 'danger' },
      ajustement: { label: t('ajustement'), variant: 'warning' },
      commande_client: { label: t('commande_client_type'), variant: 'primary' },
      achat_fournisseur: { label: t('achat_fournisseur_type'), variant: 'secondary' }
    };
    return types[type] || { label: type, variant: 'outline' };
  };

  const produitSelectionne = produits.find(p => p.id === Number(produitId));

  const columns = [
    {
      key: 'created_at',
      label: t('date'),
      render: (row) => (
        <span style={{ fontSize: '12px' }}>
          {new Date(row.created_at).toLocaleDateString('fr-FR')}
          <br />
          {new Date(row.created_at).toLocaleTimeString('fr-FR')}
        </span>
      )
    },
    {
      key: 'type',
      label: t('type'),
      render: (row) => {
        const type = getTypeBadge(row.type);
        return <Badge variant={type.variant}>{type.label}</Badge>;
      }
    },
    {
      key: 'quantite',
      label: t('quantite'),
      render: (row) => (
        <span style={{ fontWeight: 'bold', color: row.quantite > 0 ? '#22C55E' : '#EF4444' }}>
          {row.quantite > 0 ? `+${row.quantite}` : row.quantite}
        </span>
      )
    },
    { key: 'ancien_stock', label: t('ancien_stock') },
    { key: 'nouveau_stock', label: t('nouveau_stock') },
    { key: 'motif', label: t('motif_ajustement').replace(' *', '') },
    {
      key: 'created_by',
      label: t('par'),
      render: (row) => (
        <span style={{ fontSize: '13px', color: '#64748B' }}>
          {row.created_by_prenom} {row.created_by_nom}
        </span>
      )
    }
  ];

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{t('mouvements_stock')}</h1>
          <p style={styles.subtitle}>{t('historique_mouvements')}</p>
        </div>
        <div style={styles.headerActions}>
          <Button variant="secondary" onClick={() => navigate('/dashboard')} icon="←">
            {t('retour')}
          </Button>
          {peutModifier && (
            <Button
              variant="warning"
              icon={showAjustement ? '✕' : '⚙️'}
              onClick={() => setShowAjustement(!showAjustement)}
            >
              {showAjustement ? t('fermer') : t('ajuster_stock')}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div style={styles.errorContainer}>
          <span>X</span>
          <span style={styles.errorText}>{error}</span>
        </div>
      )}
      {success && (
        <div style={styles.successContainer}>
          <span>✅</span>
          <span style={styles.successText}>{success}</span>
        </div>
      )}

      {showAjustement && (
        <Card title={t('ajuster_stock')} variant="warning" style={{ marginBottom: '24px' }}>
          <form onSubmit={handleAjustement}>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>{t('produits')} *</label>
                <select
                  style={styles.select}
                  value={formAjustement.produit_id}
                  onChange={(e) => setFormAjustement({ ...formAjustement, produit_id: e.target.value })}
                  required
                  disabled={formLoading}
                >
                  <option value="">{t('choisir_produit_placeholder')}</option>
                  {produits.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nom} ({t('stock')}: {p.quantite_stock})
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>{t('quantite_entree_sortie')}</label>
                <input
                  style={styles.input}
                  type="number"
                  step="1"
                  placeholder="+10 ou -5"
                  value={formAjustement.quantite}
                  onChange={(e) => setFormAjustement({ ...formAjustement, quantite: e.target.value })}
                  required
                  disabled={formLoading}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>{t('motif_ajustement')}</label>
                <input
                  style={styles.input}
                  placeholder={t('raison_ajustement')}
                  value={formAjustement.motif}
                  onChange={(e) => setFormAjustement({ ...formAjustement, motif: e.target.value })}
                  required
                  disabled={formLoading}
                />
              </div>
            </div>
            <Button type="submit" variant="primary" loading={formLoading} fullWidth>
              {t('appliquer_ajustement')}
            </Button>
          </form>
        </Card>
      )}

      <Card title={t('selectionner_produit_titre')} variant="primary" style={{ marginBottom: '24px' }}>
        <div style={styles.selectWrapper}>
          <select
            style={styles.selectLarge}
            value={produitId}
            onChange={(e) => setProduitId(e.target.value)}
          >
            <option value="">{t('choisir_produit_placeholder')}</option>
            {produits.map(p => (
              <option key={p.id} value={p.id}>
                {p.nom} ({t('stock')}: {p.quantite_stock})
              </option>
            ))}
          </select>
        </div>
      </Card>

      {produitId && (
        <Card
          title={`${t('historique_mouvements_produit')} - ${produitSelectionne?.nom || ''}`}
          subtitle={`${t('stock_actuel_label')}: ${produitSelectionne?.quantite_stock || 0}`}
          variant="primary"
        >
          {searchTerm && (
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '8px' }}>
              {mouvementsFiltres.length} résultat(s) sur {mouvements.length}
            </p>
          )}
          <Table
            columns={columns}
            data={mouvementsFiltres}
            loading={loading}
            searchable
            onSearch={setSearchTerm}
          />
        </Card>
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
  },
  selectLarge: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '2px solid #E2E8F0',
    fontSize: '14px',
    backgroundColor: '#F8FAFC',
    width: '100%',
    maxWidth: '400px',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  selectWrapper: { display: 'flex', justifyContent: 'center' },
  input: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '2px solid #E2E8F0',
    fontSize: '14px',
    backgroundColor: '#F8FAFC',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
};