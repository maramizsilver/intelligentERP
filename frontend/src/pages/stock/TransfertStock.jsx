import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import API from '../../utils/api';

import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

export default function TransfertStock() {
  const { hasPermission } = useAuth();
  const { t } = useLanguage();
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
      if (quantite === 0) {
        setError(t('produit_sans_stock_source'));
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

    const quantite = Number(form.quantite);
    if (quantite <= 0) {
      setError(t('quantite_superieure_zero'));
      setLoading(false);
      return;
    }
    if (quantite > stockSource) {
      setError(`${t('stock_insuffisant')}. ${t('stock_disponible')}: ${stockSource}`);
      setLoading(false);
      return;
    }

    try {
      await API.post('/entrepots/transfert', form);
      setSuccess(t('transfert_effectue'));
      setForm({ produit_id: '', entrepot_source_id: '', entrepot_destination_id: '', quantite: '' });
      setStockSource(0);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du transfert');
    } finally {
      setLoading(false);
    }
  };

  if (!peutModifier) {
    return (
      <div>
        <div style={styles.header}>
          <h1 style={styles.title}>{t('acces_refuse_titre')}</h1>
          <p style={styles.subtitle}>{t('pas_permission_transfert')}</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/dashboard')} icon="←">
          {t('retour')}
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{t('transfert_stock_titre')}</h1>
          <p style={styles.subtitle}>{t('transferer_stock_desc')}</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/dashboard')} icon="←">
          {t('retour')}
        </Button>
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

      <Card title={t('nouveau_transfert')} variant="primary">
        <form onSubmit={handleSubmit}>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>{t('produits')} *</label>
              <select
                style={styles.select}
                name="produit_id"
                value={form.produit_id}
                onChange={handleChange}
                required
                disabled={loading}
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
              <label style={styles.label}>{t('entrepot_source')}</label>
              <select
                style={styles.select}
                name="entrepot_source_id"
                value={form.entrepot_source_id}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="">{t('source_placeholder')}</option>
                {entrepots.filter(e => e.actif).map(e => (
                  <option key={e.id} value={e.id}>{e.nom}</option>
                ))}
              </select>
              {form.entrepot_source_id && form.produit_id && (
                <span style={{ ...styles.stockInfo, color: stockSource > 0 ? '#0EA5E9' : '#DC2626' }}>
                  {t('stock_disponible')}: {stockSource} {stockSource === 0 && `X ${t('aucun_stock')}`}
                </span>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>{t('entrepot_destination')}</label>
              <select
                style={styles.select}
                name="entrepot_destination_id"
                value={form.entrepot_destination_id}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="">{t('destination_placeholder')}</option>
                {entrepots
                  .filter(e => e.actif && e.id !== parseInt(form.entrepot_source_id))
                  .map(e => (
                    <option key={e.id} value={e.id}>{e.nom}</option>
                  ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>{t('quantite')} *</label>
              <input
                style={styles.input}
                type="number"
                name="quantite"
                placeholder={t('quantite')}
                value={form.quantite}
                onChange={handleChange}
                required
                min={1}
                max={stockSource || 0}
                disabled={loading || stockSource === 0}
              />
              {stockSource === 0 && (
                <span style={styles.warningText}>{t('ajoutez_stock_source')}</span>
              )}
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={stockSource === 0}
            fullWidth
          >
            {loading ? t('transfert_en_cours') : t('effectuer_transfert')}
          </Button>
        </form>
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
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' },
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
  input: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '2px solid #E2E8F0',
    fontSize: '14px',
    backgroundColor: '#F8FAFC',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  stockInfo: { display: 'block', fontSize: '12px', marginTop: '4px' },
  warningText: { display: 'block', fontSize: '12px', color: '#DC2626', marginTop: '4px' },
};