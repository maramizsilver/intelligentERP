import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import API from '../../utils/api';

import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';

export default function Inventaires() {
  const { hasPermission } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [inventaires, setInventaires] = useState([]);
  const [entrepots, setEntrepots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    entrepot_id: '',
    date: '',
    statut: 'planifie'
  });
  const [formLoading, setFormLoading] = useState(false);
  const [detailsModal, setDetailsModal] = useState({ open: false, inventaire: null, ecarts: [] });
  const [ecartsLoading, setEcartsLoading] = useState(false);
  const [ecartsModif, setEcartsModif] = useState({});

  const peutModifier = hasPermission('Inventaires', 'modification');
  const peutSupprimer = hasPermission('Inventaires', 'suppression');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [inventairesRes, entrepotsRes] = await Promise.all([
        API.get('/inventaires'),
        API.get('/entrepots')
      ]);
      setInventaires(inventairesRes.data.inventaires || []);
      setEntrepots(entrepotsRes.data.entrepots || []);
    } catch (err) {
      setError('Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (inventaire = null) => {
    if (inventaire) {
      setEditId(inventaire.id);
      setFormData({
        entrepot_id: inventaire.entrepot_id,
        date: inventaire.date?.split('T')[0] || '',
        statut: inventaire.statut || 'planifie'
      });
    } else {
      setEditId(null);
      setFormData({ entrepot_id: '', date: '', statut: 'planifie' });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFormLoading(true);

    try {
      if (editId) {
        await API.put(`/inventaires/${editId}`, formData);
        setSuccess(t('inventaire_modifie'));
      } else {
        await API.post('/inventaires', formData);
        setSuccess(t('inventaire_cree'));
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirmation_suppression'))) return;
    try {
      await API.delete(`/inventaires/${id}`);
      setSuccess(t('inventaire_supprime'));
      loadData();
    } catch (err) {
      setError('Erreur');
    }
  };

  const handleViewDetails = async (inventaire) => {
    setDetailsModal({ open: true, inventaire, ecarts: [] });
    setEcartsLoading(true);
    try {
      const res = await API.get(`/inventaires/${inventaire.id}/ecarts`);
      const ecarts = res.data.ecarts || [];
      setDetailsModal(prev => ({ ...prev, ecarts }));
      const ecartsObj = {};
      ecarts.forEach(e => {
        ecartsObj[e.produit_id] = e.quantite_reelle || e.quantite_theorique || 0;
      });
      setEcartsModif(ecartsObj);
    } catch (err) {
      setError('Impossible de charger les écarts');
    } finally {
      setEcartsLoading(false);
    }
  };

  const handleUpdateEcart = (produitId, value) => {
    setEcartsModif(prev => ({ ...prev, [produitId]: parseInt(value) || 0 }));
  };

  const handleSaveEcarts = async () => {
    const inventaireId = detailsModal.inventaire?.id;
    if (!inventaireId) return;
    try {
      const ecartsToSave = detailsModal.ecarts.map(e => ({
        produit_id: e.produit_id,
        quantite_reelle: ecartsModif[e.produit_id] || e.quantite_reelle || e.quantite_theorique || 0
      }));
      await API.put(`/inventaires/${inventaireId}/ecarts`, { ecarts: ecartsToSave });
      setSuccess(t('ecart_enregistre'));
      setDetailsModal({ open: false, inventaire: null, ecarts: [] });
      loadData();
    } catch (err) {
      setError('Erreur');
    }
  };

  const handleChangeStatut = async (id, statut) => {
    try {
      await API.patch(`/inventaires/${id}`, { statut });
      setSuccess(t(`inventaire_${statut}`));
      loadData();
    } catch (err) {
      setError('Erreur');
    }
  };

  const getStatutBadge = (statut) => {
    const variants = {
      planifie: 'secondary',
      en_cours: 'warning',
      termine: 'success',
      annule: 'danger',
      valide: 'info'
    };
    const labels = {
      planifie: t('planifie_inventaire'),
      en_cours: t('en_cours_inventaire'),
      termine: t('termine_inventaire'),
      annule: t('annule_inventaire'),
      valide: t('valide')
    };
    return { variant: variants[statut] || 'secondary', label: labels[statut] || statut };
  };

  const columns = [
    {
      key: 'entrepot',
      label: t('entrepots_label'),
      render: (row) => row.entrepot_nom || row.entrepot?.nom || '-'
    },
    {
      key: 'date',
      label: t('date_inventaire'),
      render: (row) => row.date ? new Date(row.date).toLocaleDateString('fr-FR') : '-'
    },
    {
      key: 'statut',
      label: t('statut_inventaire'),
      render: (row) => {
        const { variant, label } = getStatutBadge(row.statut);
        return <Badge variant={variant}>{label}</Badge>;
      }
    }
  ];

  const actions = [
    {
      label: t('voir'),
      variant: 'primary',
      onClick: (row) => handleViewDetails(row)
    }
  ];

  // Actions de modification (si permission)
  if (peutModifier) {
    actions.push({
      label: t('modifier'),
      variant: 'secondary',
      onClick: (row) => {
        if (row.statut === 'planifie') handleOpenModal(row);
      }
    });
    
    actions.push({
      label: t('lancer_inventaire'),
      variant: 'warning',
      onClick: (row) => {
        if (row.statut === 'planifie') handleChangeStatut(row.id, 'en_cours');
      }
    });
    
    actions.push({
      label: t('valider_inventaire'),
      variant: 'success',
      onClick: (row) => {
        if (row.statut === 'en_cours') handleChangeStatut(row.id, 'valide');
      }
    });
    
    actions.push({
      label: t('annuler_inventaire'),
      variant: 'danger',
      onClick: (row) => {
        if (row.statut === 'en_cours') handleChangeStatut(row.id, 'annule');
      }
    });
  }

  // Actions de suppression (si permission)
  if (peutSupprimer) {
    actions.push({
      label: t('supprimer'),
      variant: 'danger',
      onClick: (row) => {
        if (row.statut === 'planifie') handleDelete(row.id);
      }
    });
  }

  if (loading && inventaires.length === 0) {
    return <LoadingSpinner size="lg" text={t('chargement')} />;
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{t('gestion_inventaires_titre')}</h1>
          <p style={styles.subtitle}>{t('gerer_inventaires')}</p>
        </div>
        <div style={styles.headerActions}>
          <Button variant="secondary" onClick={() => navigate('/dashboard')} icon="←">
            {t('retour')}
          </Button>
          {peutModifier && (
            <Button variant="primary" onClick={() => handleOpenModal()} icon="+">
              {t('nouvel_inventaire')}
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
          <span>✅</span>
          <span style={styles.successText}>{success}</span>
        </div>
      )}

      {inventaires.length === 0 ? (
        <EmptyState
          icon="📋"
          title={t('aucun_inventaire')}
          description={t('gerer_inventaires')}
          action={peutModifier ? {
            label: t('nouvel_inventaire'),
            onClick: () => handleOpenModal()
          } : null}
        />
      ) : (
        <Card title={t('liste_inventaires')} variant="primary">
          <Table columns={columns} data={inventaires} actions={actions} />
        </Card>
      )}

      {/* Modal Création/Modification */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? t('modifier_inventaire') : t('nouvel_inventaire')}
      >
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={styles.modalError}>
              <span style={styles.errorText}>{error}</span>
            </div>
          )}
          <div style={styles.modalGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>{t('entrepots_label')} *</label>
              <select
                style={styles.select}
                value={formData.entrepot_id}
                onChange={(e) => setFormData({ ...formData, entrepot_id: e.target.value })}
                required
                disabled={formLoading}
              >
                <option value="">-- {t('choisir')} --</option>
                {entrepots.filter(e => e.actif).map(e => (
                  <option key={e.id} value={e.id}>{e.nom}</option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>{t('date_inventaire')} *</label>
              <input
                style={styles.input}
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                disabled={formLoading}
              />
            </div>
          </div>
          <div style={styles.modalActions}>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={formLoading}>
              {t('annuler')}
            </Button>
            <Button type="submit" variant="primary" loading={formLoading}>
              {editId ? t('modifier') : t('creer')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Détails des écarts */}
      <Modal
        open={detailsModal.open}
        onClose={() => setDetailsModal({ open: false, inventaire: null, ecarts: [] })}
        title={`${t('produits_inventaires')} - ${detailsModal.inventaire?.entrepot_nom || ''}`}
        size="large"
      >
        {ecartsLoading ? (
          <LoadingSpinner size="md" text={t('chargement')} />
        ) : detailsModal.ecarts.length === 0 ? (
          <EmptyState icon="✅" title={t('aucun_ecart')} />
        ) : (
          <>
            <div style={styles.ecartsHeader}>
              <span style={styles.ecartsCol}>{t('produits')}</span>
              <span style={styles.ecartsCol}>{t('quantite_theorique')}</span>
              <span style={styles.ecartsCol}>{t('quantite_reelle')}</span>
              <span style={styles.ecartsCol}>{t('ecart_inventaire')}</span>
            </div>
            {detailsModal.ecarts.map((ecart) => {
              const reelle = ecartsModif[ecart.produit_id] || ecart.quantite_reelle || ecart.quantite_theorique || 0;
              const theorique = ecart.quantite_theorique || 0;
              const diff = reelle - theorique;
              const isSurplus = diff > 0;
              const isManque = diff < 0;
              return (
                <div key={ecart.produit_id} style={styles.ecartsRow}>
                  <span style={styles.ecartsCol}>{ecart.produit_nom || ecart.nom || '-'}</span>
                  <span style={styles.ecartsCol}>{theorique}</span>
                  <span style={styles.ecartsCol}>
                    <input
                      style={{ ...styles.ecartsInput, width: '80px' }}
                      type="number"
                      value={reelle}
                      onChange={(e) => handleUpdateEcart(ecart.produit_id, e.target.value)}
                      disabled={detailsModal.inventaire?.statut === 'valide' || detailsModal.inventaire?.statut === 'termine'}
                    />
                  </span>
                  <span style={{
                    ...styles.ecartsCol,
                    fontWeight: 'bold',
                    color: isSurplus ? '#22C55E' : isManque ? '#EF4444' : '#64748B'
                  }}>
                    {diff !== 0 && (isSurplus ? `+${diff}` : diff)}
                    {diff === 0 && '0'}
                  </span>
                </div>
              );
            })}
            {detailsModal.inventaire?.statut !== 'valide' && detailsModal.inventaire?.statut !== 'termine' && (
              <div style={styles.modalActions}>
                <Button variant="secondary" onClick={() => setDetailsModal({ open: false, inventaire: null, ecarts: [] })}>
                  {t('fermer')}
                </Button>
                <Button variant="primary" onClick={handleSaveEcarts}>
                  {t('enregistrer_ecarts')}
                </Button>
              </div>
            )}
          </>
        )}
      </Modal>
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
  modalError: {
    backgroundColor: '#FEF2F2',
    padding: '8px 12px',
    borderRadius: '6px',
    marginBottom: '12px',
  },
  modalGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '13px', fontWeight: 600, color: '#334155' },
  input: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '2px solid #E2E8F0',
    fontSize: '14px',
    backgroundColor: '#F8FAFC',
    outline: 'none',
    transition: 'all 0.2s ease',
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
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '16px',
  },
  ecartsHeader: {
    display: 'grid',
    gridTemplateColumns: '3fr 1fr 1fr 1fr',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: '#F1F5F9',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '13px',
    color: '#334155',
    marginBottom: '8px',
  },
  ecartsRow: {
    display: 'grid',
    gridTemplateColumns: '3fr 1fr 1fr 1fr',
    gap: '8px',
    padding: '8px 12px',
    borderBottom: '1px solid #F1F5F9',
    alignItems: 'center',
  },
  ecartsCol: { fontSize: '14px', color: '#0F172A' },
  ecartsInput: {
    padding: '6px 8px',
    borderRadius: '6px',
    border: '2px solid #E2E8F0',
    fontSize: '13px',
    backgroundColor: '#F8FAFC',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
};