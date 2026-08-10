import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import API from '../../utils/api';
import * as XLSX from 'xlsx';

import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

const CATEGORIES = ['TVA', 'INTERET', 'PENALITE', 'REMISE', 'TAXE', 'COMMISSION'];

export default function Calculateur() {
  const { hasPermission, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [onglet, setOnglet] = useState('calcul');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resultat, setResultat] = useState(null);

  const [modeCalcul, setModeCalcul] = useState('manuel');

  const [formUnique, setFormUnique] = useState({
    montant: '',
    date_debut: '',
    date_fin: '',
    taux: ''
  });

  const [formVariables, setFormVariables] = useState({
    montant: '',
    periodes: [{ date_debut: '', date_fin: '', taux: '' }]
  });

  const [formAuto, setFormAuto] = useState({
    montant: '',
    date_debut: '',
    date_fin: '',
    categorie: '',
    sous_categorie: ''
  });

  const [tauxReference, setTauxReference] = useState([]);
  const [loadingTaux, setLoadingTaux] = useState(false);

  const [historiqueUnique, setHistoriqueUnique] = useState([]);
  const [historiqueVariable, setHistoriqueVariable] = useState([]);
  const [totalUnique, setTotalUnique] = useState(0);
  const [totalVariable, setTotalVariable] = useState(0);
  const [sousOngletHistorique, setSousOngletHistorique] = useState('unique');

  const [typeRapport, setTypeRapport] = useState('detaille');

  const [loadingCalcul, setLoadingCalcul] = useState(false);

  const peutExporter = hasPermission('Finance', 'export');
  const isSuperAdmin = user?.is_super_admin;

  useEffect(() => {
    if (onglet === 'taux') loadTauxReference();
    if (onglet === 'historique') {
      loadHistoriqueUnique();
      loadHistoriqueVariable();
    }
  }, [onglet]);

  const loadTauxReference = async () => {
    try {
      setLoadingTaux(true);
      const res = await API.get('/calculateur/taux-reference');
      setTauxReference(res.data.taux || []);
    } catch (err) {
      setError(t('impossible_charger_taux') || 'Impossible de charger les taux de référence');
    } finally {
      setLoadingTaux(false);
    }
  };

  const loadHistoriqueUnique = async () => {
    try {
      const res = await API.get('/calculateur/historique/taux-unique');
      setHistoriqueUnique(res.data.historique || []);
      setTotalUnique(res.data.total || 0);
    } catch (err) {
      setError(t('impossible_charger_historique_unique') || 'Impossible de charger l\'historique des taux uniques');
    }
  };

  const loadHistoriqueVariable = async () => {
    try {
      const res = await API.get('/calculateur/historique/taux-variable');
      setHistoriqueVariable(res.data.historique || []);
      setTotalVariable(res.data.total || 0);
    } catch (err) {
      setError(t('impossible_charger_historique_variable') || 'Impossible de charger l\'historique des taux variables');
    }
  };

  const handleUniqueChange = (e) => {
    const { name, value } = e.target;
    setFormUnique({ ...formUnique, [name]: value });
    setResultat(null);
  };

  const handlePeriodeChange = (index, field, value) => {
    const newPeriodes = [...formVariables.periodes];
    newPeriodes[index][field] = value;
    setFormVariables({ ...formVariables, periodes: newPeriodes });
    setResultat(null);
  };

  const addPeriode = () => {
    setFormVariables({
      ...formVariables,
      periodes: [...formVariables.periodes, { date_debut: '', date_fin: '', taux: '' }]
    });
    setResultat(null);
  };

  const removePeriode = (index) => {
    if (formVariables.periodes.length <= 1) return;
    setFormVariables({
      ...formVariables,
      periodes: formVariables.periodes.filter((_, i) => i !== index)
    });
    setResultat(null);
  };

  const handleAutoChange = (e) => {
    const { name, value } = e.target;
    setFormAuto({ ...formAuto, [name]: value });
    setResultat(null);
  };

  const handleCalculUnique = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoadingCalcul(true);

    try {
      const res = await API.post('/calculateur/taux-unique', formUnique);
      setResultat({ ...res.data, type_calcul: 'taux_unique' });
      setSuccess(t('calcul_effectue') || 'Calcul effectué avec succès');
    } catch (err) {
      setError(err.response?.data?.message || t('erreur_calcul') || 'Erreur lors du calcul');
    } finally {
      setLoadingCalcul(false);
    }
  };

  const handleCalculVariables = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoadingCalcul(true);

    const periodesValides = formVariables.periodes.filter(
      p => p.date_debut && p.date_fin && p.taux
    );

    if (periodesValides.length === 0) {
      setError(t('ajouter_periode_complete') || 'Ajoutez au moins une période complète');
      setLoadingCalcul(false);
      return;
    }

    try {
      const res = await API.post('/calculateur/taux-variables', {
        montant: formVariables.montant,
        periodes: periodesValides
      });
      setResultat({ ...res.data, type_calcul: 'taux_variables_manuel' });
      setSuccess(t('calcul_effectue') || 'Calcul effectué avec succès');
    } catch (err) {
      setError(err.response?.data?.message || t('erreur_calcul') || 'Erreur lors du calcul');
    } finally {
      setLoadingCalcul(false);
    }
  };

  const handleCalculAuto = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoadingCalcul(true);

    try {
      const res = await API.post('/calculateur/taux-variables-auto', formAuto);
      setResultat({ ...res.data, type_calcul: 'taux_variables_auto' });
      setSuccess(t('calcul_effectue') || 'Calcul effectué avec succès');
    } catch (err) {
      setError(err.response?.data?.message || t('erreur_calcul') || 'Erreur lors du calcul');
    } finally {
      setLoadingCalcul(false);
    }
  };

  const handlePrint = () => {
    document.body.classList.add('printing');
    setTimeout(() => {
      window.print();
      document.body.classList.remove('printing');
    }, 100);
  };

  const handleExportPDF = async () => {
    if (!resultat) {
      setError(t('aucun_resultat_exporter') || 'Aucun résultat à exporter');
      return;
    }
    
    try {
      setLoadingCalcul(true);
      
      const response = await API.post('/calculateur/export/pdf', {
        data: resultat,
        type_rapport: typeRapport
      }, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `calcul-${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setSuccess(t('pdf_exporte') || 'PDF exporté avec succès');
    } catch (err) {
      console.error('Erreur export PDF:', err);
      setError(err.response?.data?.message || t('erreur_export_pdf') || 'Erreur lors de l\'export PDF');
    } finally {
      setLoadingCalcul(false);
    }
  };

  const handleExportWord = async () => {
    if (!resultat) {
      setError(t('aucun_resultat_exporter') || 'Aucun résultat à exporter');
      return;
    }
    
    try {
      setLoadingCalcul(true);
      
      const response = await API.post('/calculateur/export/word', {
        data: resultat,
        type_rapport: typeRapport
      }, { responseType: 'blob' });

      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `calcul-${new Date().toISOString().slice(0, 10)}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setSuccess(t('word_exporte') || 'Word exporté avec succès');
    } catch (err) {
      console.error('Erreur export Word:', err);
      setError(err.response?.data?.message || t('erreur_export_word') || 'Erreur lors de l\'export Word');
    } finally {
      setLoadingCalcul(false);
    }
  };

  const handleExportHistoriquePDF = async (id) => {
    try {
      const response = await API.get(`/calculateur/historique/${id}/export/pdf`, {
        params: { type_rapport: typeRapport },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `historique-${id}-${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setSuccess(t('pdf_historique_exporte') || 'PDF historique exporté avec succès');
    } catch (err) {
      console.error('Erreur export PDF historique:', err);
      setError(t('erreur_export_pdf_historique') || 'Erreur lors de l\'export PDF historique');
    }
  };

  const handleExportHistoriqueWord = async (id) => {
    try {
      const response = await API.get(`/calculateur/historique/${id}/export/word`, {
        params: { type_rapport: typeRapport },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `historique-${id}-${new Date().toISOString().slice(0, 10)}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setSuccess(t('word_historique_exporte') || 'Word historique exporté avec succès');
    } catch (err) {
      console.error('Erreur export Word historique:', err);
      setError(t('erreur_export_word_historique') || 'Erreur lors de l\'export Word historique');
    }
  };

  const handleViewHistoriqueDetail = async (id, type) => {
    try {
      setLoading(true);
      
      let url;
      if (type === 'unique') {
        url = `/calculateur/historique/taux-unique/${id}`;
      } else {
        url = `/calculateur/historique/taux-variable/${id}`;
      }
      
      const res = await API.get(url);
      setResultat(res.data);
      setOnglet('calcul');
      
      setTimeout(() => {
        handlePrint();
      }, 500);
    } catch (err) {
      setError(t('erreur_chargement_details') || 'Erreur lors du chargement des détails');
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = () => {
    if (!resultat) return;

    let data = [];
    if (resultat.cas === 'taux_unique') {
      data = [{
        'Cas': 'Taux unique',
        'Montant': resultat.montant,
        'Date debut': resultat.date_debut,
        'Date fin': resultat.date_fin,
        'Nombre de jours': resultat.nbJours,
        'Taux (%)': resultat.taux,
        'Resultat (DT)': resultat.resultat
      }];
    } else {
      data = resultat.details.map(d => ({
        'Periode': `#${d.periode}`,
        'Date debut': d.date_debut,
        'Date fin': d.date_fin,
        'Nombre de jours': d.nbJours,
        'Taux (%)': d.taux,
        'Resultat (DT)': d.resultat
      }));
      data.push({
        'Periode': 'TOTAL',
        'Date debut': '',
        'Date fin': '',
        'Nombre de jours': '',
        'Taux (%)': '',
        'Resultat (DT)': resultat.total
      });
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Calcul');
    XLSX.writeFile(wb, `calcul-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const columnsDetails = resultat?.cas !== 'taux_unique' && resultat?.details ? [
    { key: 'periode', label: t('periode') || 'Période', render: (row) => `#${row.periode}` },
    { key: 'date_debut', label: t('date_debut') || 'Date début' },
    { key: 'date_fin', label: t('date_fin') || 'Date fin' },
    { key: 'nbJours', label: t('jours') || 'Jours' },
    { key: 'taux', label: t('taux') || 'Taux', render: (row) => `${row.taux}%` },
    { key: 'resultat', label: t('resultat') || 'Résultat', render: (row) => <strong>{row.resultat} DT</strong> }
  ] : [];

  const columnsTaux = [
    { key: 'categorie', label: t('categorie') || 'Catégorie' },
    { key: 'nom', label: t('nom') || 'Nom' },
    { key: 'date_debut', label: t('date_debut') || 'Date début', render: (row) => new Date(row.date_debut).toLocaleDateString('fr-FR') },
    { key: 'date_fin', label: t('date_fin') || 'Date fin', render: (row) => new Date(row.date_fin).toLocaleDateString('fr-FR') },
    { key: 'taux', label: t('taux') || 'Taux', render: (row) => `${row.taux}%` },
    { key: 'actif', label: t('actif') || 'Actif', render: (row) => <Badge variant={row.actif ? 'success' : 'danger'}>{row.actif ? (t('oui') || 'Oui') : (t('non') || 'Non')}</Badge> }
  ];

  const columnsHistorique = [
    { key: 'id', label: '#' },
    { key: 'type_calcul', label: t('type') || 'Type', render: (row) => {
      const types = {
        'taux_unique': t('taux_unique') || 'Taux unique',
        'taux_variables_manuel': t('taux_variables_manuel') || 'Taux variables (manuel)',
        'taux_variables_auto': t('taux_variables_auto') || 'Taux variables (auto)'
      };
      return types[row.type_calcul] || row.type_calcul;
    }},
    { key: 'montant', label: t('montant') || 'Montant', render: (row) => `${row.montant} DT` },
    { key: 'resultat', label: t('resultat') || 'Résultat', render: (row) => `${row.resultat} DT` },
    { key: 'created_at', label: t('date') || 'Date', render: (row) => new Date(row.created_at).toLocaleString('fr-FR') },
    { key: 'prenom', label: t('par') || 'Par', render: (row) => `${row.prenom || ''} ${row.nom || ''}` }
  ];

  const actionsHistorique = [];
  if (peutExporter) {
    actionsHistorique.push({
      label: t('exporter_pdf') || 'PDF',
      variant: 'primary',
      onClick: (row) => handleExportHistoriquePDF(row.id)
    });
    actionsHistorique.push({
      label: t('exporter_word') || 'Word',
      variant: 'secondary',
      onClick: (row) => handleExportHistoriqueWord(row.id)
    });
    actionsHistorique.push({
      label: t('imprimer') || 'Imprimer',
      variant: 'outline',
      onClick: (row) => {
        const type = sousOngletHistorique === 'unique' ? 'unique' : 'variable';
        handleViewHistoriqueDetail(row.id, type);
      }
    });
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{t('moteur_calcul') || 'Moteur de calcul'}</h1>
          <p style={styles.subtitle}>
            {t('calcul_auto_periodes_taux') || 'Calcul automatique basé sur les périodes et les taux (%)'}
          </p>
        </div>
        <div style={styles.headerActions}>
          <Button variant="secondary" onClick={() => navigate('/dashboard')}>
            {t('retour')}
          </Button>
        </div>
      </div>

      {error && (
        <div style={styles.errorContainer}>
          <span style={styles.errorIcon}>✕</span>
          <span style={styles.errorText}>{error}</span>
        </div>
      )}
      {success && (
        <div style={styles.successContainer}>
          <span style={styles.successIcon}>✓</span>
          <span style={styles.successText}>{success}</span>
        </div>
      )}

      <div style={styles.segmentedControl}>
        <button
          style={{ ...styles.segment, ...(onglet === 'calcul' ? styles.segmentActive : {}) }}
          onClick={() => { setOnglet('calcul'); setResultat(null); }}
        >
          {t('calcul') || 'Calcul'}
        </button>
        <button
          style={{ ...styles.segment, ...(onglet === 'taux' ? styles.segmentActive : {}) }}
          onClick={() => { setOnglet('taux'); setResultat(null); }}
        >
          {t('taux_reference') || 'Taux de référence'}
        </button>
        <button
          style={{ ...styles.segment, ...(onglet === 'historique' ? styles.segmentActive : {}) }}
          onClick={() => { setOnglet('historique'); setResultat(null); }}
        >
          {t('historique') || 'Historique'}
        </button>
      </div>

      {onglet === 'calcul' && (
        <>
          <div style={styles.modeSelector}>
            <button
              style={{ ...styles.modeBtn, ...(modeCalcul === 'manuel' ? styles.modeBtnActive : {}) }}
              onClick={() => { setModeCalcul('manuel'); setResultat(null); }}
            >
              {t('mode_manuel') || 'Mode manuel'}
            </button>
            <button
              style={{ ...styles.modeBtn, ...(modeCalcul === 'auto' ? styles.modeBtnActive : {}) }}
              onClick={() => { setModeCalcul('auto'); setResultat(null); }}
            >
              {t('mode_automatique_bdd') || 'Mode automatique (BDD)'}
            </button>
          </div>

          {modeCalcul === 'manuel' && (
            <>
              <div style={styles.subSegmentedControl}>
                <button
                  style={{ ...styles.subSegment, ...(formUnique.active !== false ? styles.subSegmentActive : {}) }}
                  onClick={() => setFormUnique({ ...formUnique, active: true })}
                >
                  {t('taux_unique') || 'Taux unique'}
                </button>
                <button
                  style={{ ...styles.subSegment, ...(formUnique.active === false ? styles.subSegmentActive : {}) }}
                  onClick={() => setFormUnique({ ...formUnique, active: false })}
                >
                  {t('taux_variables') || 'Taux variables'}
                </button>
              </div>

              {formUnique.active !== false && (
                <Card title={t('saisie_donnees_taux_unique') || 'Saisie des données - Taux unique'} variant="primary">
                  <form onSubmit={handleCalculUnique}>
                    <div style={styles.formGrid}>
                      <Input
                        label={t('montant_base') || 'Montant de base (DT) *'}
                        name="montant"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder={t('exemple_montant') || 'Ex: 10000'}
                        value={formUnique.montant}
                        onChange={handleUniqueChange}
                        required
                        disabled={loadingCalcul}
                      />
                      <Input
                        label={t('date_debut') || 'Date début *'}
                        name="date_debut"
                        type="date"
                        value={formUnique.date_debut}
                        onChange={handleUniqueChange}
                        required
                        disabled={loadingCalcul}
                      />
                      <Input
                        label={t('date_fin') || 'Date fin *'}
                        name="date_fin"
                        type="date"
                        value={formUnique.date_fin}
                        onChange={handleUniqueChange}
                        required
                        disabled={loadingCalcul}
                      />
                      <Input
                        label={t('taux_pourcent') || 'Taux (%) *'}
                        name="taux"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={t('exemple_taux') || 'Ex: 10'}
                        value={formUnique.taux}
                        onChange={handleUniqueChange}
                        required
                        disabled={loadingCalcul}
                      />
                    </div>
                    <Button type="submit" variant="primary" loading={loadingCalcul} fullWidth>
                      {t('calculer') || 'Calculer'}
                    </Button>
                  </form>
                </Card>
              )}

              {formUnique.active === false && (
                <Card title={t('saisie_donnees_taux_variables') || 'Saisie des données - Taux variables'} variant="primary">
                  <form onSubmit={handleCalculVariables}>
                    <div style={styles.formGrid}>
                      <Input
                        label={t('montant_base') || 'Montant de base (DT) *'}
                        name="montant"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder={t('exemple_montant') || 'Ex: 10000'}
                        value={formVariables.montant}
                        onChange={(e) => setFormVariables({ ...formVariables, montant: e.target.value })}
                        required
                        disabled={loadingCalcul}
                      />
                    </div>

                    <div style={styles.periodesContainer}>
                      <div style={styles.periodesHeader}>
                        <span style={styles.periodesTitle}>{t('periodes_et_taux') || 'Périodes et taux'}</span>
                        <Button type="button" variant="outline" size="sm" onClick={addPeriode}>
                          + {t('ajouter_periode') || 'Ajouter une période'}
                        </Button>
                      </div>

                      {formVariables.periodes.map((periode, index) => (
                        <div key={index} style={styles.periodeRow}>
                          <span style={styles.periodeNumber}>#{index + 1}</span>
                          <input
                            style={styles.input}
                            type="date"
                            placeholder={t('date_debut') || 'Date début'}
                            value={periode.date_debut}
                            onChange={(e) => handlePeriodeChange(index, 'date_debut', e.target.value)}
                            required
                            disabled={loadingCalcul}
                          />
                          <input
                            style={styles.input}
                            type="date"
                            placeholder={t('date_fin') || 'Date fin'}
                            value={periode.date_fin}
                            onChange={(e) => handlePeriodeChange(index, 'date_fin', e.target.value)}
                            required
                            disabled={loadingCalcul}
                          />
                          <input
                            style={{ ...styles.input, width: '100px' }}
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder={t('taux_pourcent') || 'Taux %'}
                            value={periode.taux}
                            onChange={(e) => handlePeriodeChange(index, 'taux', e.target.value)}
                            required
                            disabled={loadingCalcul}
                          />
                          {formVariables.periodes.length > 1 && (
                            <Button type="button" variant="danger" size="sm" onClick={() => removePeriode(index)}>
                              ✕
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    <Button type="submit" variant="primary" loading={loadingCalcul} fullWidth>
                      {t('calculer') || 'Calculer'}
                    </Button>
                  </form>
                </Card>
              )}
            </>
          )}

          {modeCalcul === 'auto' && (
            <Card title={t('saisie_donnees_taux_bdd') || 'Saisie des données - Taux depuis BDD'} variant="primary">
              <form onSubmit={handleCalculAuto}>
                <div style={styles.formGrid}>
                  <Input
                    label={t('montant_base') || 'Montant de base (DT) *'}
                    name="montant"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder={t('exemple_montant') || 'Ex: 10000'}
                    value={formAuto.montant}
                    onChange={handleAutoChange}
                    required
                    disabled={loadingCalcul}
                  />
                  <Input
                    label={t('date_debut') || 'Date début *'}
                    name="date_debut"
                    type="date"
                    value={formAuto.date_debut}
                    onChange={handleAutoChange}
                    required
                    disabled={loadingCalcul}
                  />
                  <Input
                    label={t('date_fin') || 'Date fin *'}
                    name="date_fin"
                    type="date"
                    value={formAuto.date_fin}
                    onChange={handleAutoChange}
                    required
                    disabled={loadingCalcul}
                  />
                  <div style={styles.formGroup}>
                    <label style={styles.label}>{t('categorie') || 'Catégorie'} *</label>
                    <select
                      style={styles.select}
                      name="categorie"
                      value={formAuto.categorie}
                      onChange={handleAutoChange}
                      required
                      disabled={loadingCalcul}
                    >
                      <option value="">{t('choisir_categorie') || '-- Choisir une catégorie --'}</option>
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label={t('sous_categorie') || 'Sous-catégorie (optionnel)'}
                    name="sous_categorie"
                    placeholder={t('exemple_sous_categorie') || 'Ex: Standard, Réduite...'}
                    value={formAuto.sous_categorie}
                    onChange={handleAutoChange}
                    disabled={loadingCalcul}
                  />
                </div>
                <Button type="submit" variant="primary" loading={loadingCalcul} fullWidth>
                  {t('calculer_avec_taux_reference') || 'Calculer avec les taux de référence'}
                </Button>
              </form>
            </Card>
          )}

          {resultat && (
            <Card title={t('resultat_calcul') || 'Résultat du calcul'} variant="success" style={{ marginTop: '20px' }}>
              {peutExporter && (
                <div style={styles.exportOptions}>
                  <div style={styles.exportTypeSelector}>
                    <label style={styles.exportLabel}>{t('type_rapport') || 'Type de rapport :'}</label>
                    <select
                      style={styles.selectSmall}
                      value={typeRapport}
                      onChange={(e) => {
                        setTypeRapport(e.target.value);
                      }}
                    >
                      <option value="detaille">{t('rapport_detaille') || 'Rapport détaillé'}</option>
                      <option value="simplifie">{t('rapport_simplifie') || 'Rapport simplifié'}</option>
                    </select>
                  </div>
                  <div style={styles.exportButtons}>
                    <Button variant="secondary" size="sm" onClick={handlePrint}>
                      {t('imprimer') || 'Imprimer'}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleExportPDF}>
                      {t('exporter_pdf') || 'PDF'}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleExportWord}>
                      {t('exporter_word') || 'Word'}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={exportExcel}>
                      {t('exporter_excel') || 'Excel'}
                    </Button>
                  </div>
                </div>
              )}

              <div style={styles.resultGrid}>
                <div style={styles.resultItem}>
                  <span style={styles.resultLabel}>{t('montant') || 'Montant'}</span>
                  <span style={styles.resultValue}>{resultat.montant} DT</span>
                </div>
                <div style={styles.resultItem}>
                  <span style={styles.resultLabel}>{t('base_calcul') || 'Base de calcul'}</span>
                  <span style={styles.resultValue}>{resultat.base_jours} {t('jours') || 'jours'}</span>
                </div>
                {resultat.cas === 'taux_unique' && (
                  <>
                    <div style={styles.resultItem}>
                      <span style={styles.resultLabel}>{t('periode') || 'Période'}</span>
                      <span style={styles.resultValue}>{resultat.date_debut} → {resultat.date_fin}</span>
                    </div>
                    <div style={styles.resultItem}>
                      <span style={styles.resultLabel}>{t('nombre_jours') || 'Nombre de jours'}</span>
                      <span style={styles.resultValue}>{resultat.nbJours}</span>
                    </div>
                    <div style={styles.resultItem}>
                      <span style={styles.resultLabel}>{t('taux') || 'Taux'}</span>
                      <span style={styles.resultValue}>{resultat.taux}%</span>
                    </div>
                  </>
                )}
                {resultat.cas === 'taux_variables_auto' && (
                  <>
                    <div style={styles.resultItem}>
                      <span style={styles.resultLabel}>{t('categorie') || 'Catégorie'}</span>
                      <span style={styles.resultValue}>{resultat.categorie}</span>
                    </div>
                    {resultat.sous_categorie && (
                      <div style={styles.resultItem}>
                        <span style={styles.resultLabel}>{t('sous_categorie') || 'Sous-catégorie'}</span>
                        <span style={styles.resultValue}>{resultat.sous_categorie}</span>
                      </div>
                    )}
                  </>
                )}
                <div style={{ ...styles.resultItem, gridColumn: '1 / -1', borderTop: '2px solid #E2E8F0', paddingTop: '16px' }}>
                  <span style={{ ...styles.resultLabel, fontSize: '16px', fontWeight: 700 }}>
                    {t('resultat_final') || 'Résultat final'}
                  </span>
                  <span style={{ ...styles.resultValue, fontSize: '24px', fontWeight: 700, color: '#0EA5E9' }}>
                    {resultat.total || resultat.resultat} DT
                  </span>
                </div>
              </div>

              {resultat.details && resultat.details.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h4 style={styles.detailTitle}>{t('detail_par_periode') || 'Détail par période'}</h4>
                  <Table columns={columnsDetails} data={resultat.details} />
                </div>
              )}
            </Card>
          )}
        </>
      )}

      {onglet === 'taux' && (
        <>
          <div style={styles.actionBar}>
            {isSuperAdmin && (
              <Button
                variant="primary"
                onClick={() => navigate('/superadmin/taux-reference')}
              >
                {t('gerer_taux_admin') || 'Gérer les taux (Admin)'}
              </Button>
            )}
            {!isSuperAdmin && (
              <Badge variant="secondary" style={{ padding: '8px 16px' }}>
                {t('lecture_seule_taux') || 'Lecture seule - Les taux sont gérés par le SuperAdmin'}
              </Badge>
            )}
          </div>

          <Card title={t('taux_centralises') || 'Taux de référence centralisés'} variant="primary">
            <Table columns={columnsTaux} data={tauxReference} loading={loadingTaux} />
          </Card>
        </>
      )}

      {onglet === 'historique' && (
        <>
          <div style={styles.subSegmentedControl}>
            <button
              style={{ ...styles.subSegment, ...(sousOngletHistorique === 'unique' ? styles.subSegmentActive : {}) }}
              onClick={() => setSousOngletHistorique('unique')}
            >
              {t('taux_unique') || 'Taux unique'} ({totalUnique})
            </button>
            <button
              style={{ ...styles.subSegment, ...(sousOngletHistorique === 'variable' ? styles.subSegmentActive : {}) }}
              onClick={() => setSousOngletHistorique('variable')}
            >
              {t('taux_variables') || 'Taux variables'} ({totalVariable})
            </button>
          </div>

          {sousOngletHistorique === 'unique' ? (
            <Card title={t('historique_taux_unique') || 'Historique - Taux unique'} variant="primary">
              <div style={styles.historiqueActions}>
                <span style={styles.historiqueInfo}>
                  {totalUnique} {t('calculs_enregistres') || 'calcul(s) enregistré(s)'}
                </span>
                {peutExporter && (
                  <div style={styles.exportTypeSelectorInline}>
                    <select
                      style={styles.selectSmall}
                      value={typeRapport}
                      onChange={(e) => {
                        setTypeRapport(e.target.value);
                      }}
                    >
                      <option value="detaille">{t('rapport_detaille') || 'Rapport détaillé'}</option>
                      <option value="simplifie">{t('rapport_simplifie') || 'Rapport simplifié'}</option>
                    </select>
                  </div>
                )}
              </div>
              <Table 
                columns={columnsHistorique} 
                data={historiqueUnique} 
                loading={loading} 
                actions={actionsHistorique}
              />
            </Card>
          ) : (
            <Card title={t('historique_taux_variables') || 'Historique - Taux variables'} variant="primary">
              <div style={styles.historiqueActions}>
                <span style={styles.historiqueInfo}>
                  {totalVariable} {t('calculs_enregistres') || 'calcul(s) enregistré(s)'}
                </span>
                {peutExporter && (
                  <div style={styles.exportTypeSelectorInline}>
                    <select
                      style={styles.selectSmall}
                      value={typeRapport}
                      onChange={(e) => {
                        setTypeRapport(e.target.value);
                      }}
                    >
                      <option value="detaille">{t('rapport_detaille') || 'Rapport détaillé'}</option>
                      <option value="simplifie">{t('rapport_simplifie') || 'Rapport simplifié'}</option>
                    </select>
                  </div>
                )}
              </div>
              <Table 
                columns={columnsHistorique} 
                data={historiqueVariable} 
                loading={loading} 
                actions={actionsHistorique}
              />
            </Card>
          )}
        </>
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
  errorIcon: {
    color: '#991B1B',
    fontSize: '16px',
    fontWeight: 'bold',
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
  successIcon: {
    color: '#065F46',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  successText: {
    color: '#065F46',
    fontSize: '13px',
    fontWeight: 500,
  },
  segmentedControl: {
    display: 'inline-flex',
    backgroundColor: '#E2E8F0',
    borderRadius: '10px',
    padding: '4px',
    marginBottom: '20px',
    gap: '4px',
    flexWrap: 'wrap',
  },
  segment: {
    padding: '8px 16px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#475569',
    fontWeight: 600,
    transition: 'all 0.2s ease',
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  modeSelector: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  },
  modeBtn: {
    padding: '8px 20px',
    border: '2px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    color: '#64748B',
    transition: 'all 0.2s ease',
  },
  modeBtnActive: {
    borderColor: '#0EA5E9',
    backgroundColor: '#F0F9FF',
    color: '#0EA5E9',
  },
  subSegmentedControl: {
    display: 'inline-flex',
    backgroundColor: '#E2E8F0',
    borderRadius: '8px',
    padding: '3px',
    marginBottom: '16px',
    gap: '3px',
  },
  subSegment: {
    padding: '6px 14px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    color: '#475569',
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },
  subSegmentActive: {
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  actionBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
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
  selectSmall: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid #E2E8F0',
    fontSize: '12px',
    backgroundColor: '#F8FAFC',
    outline: 'none',
  },
  input: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '2px solid #E2E8F0',
    fontSize: '14px',
    backgroundColor: '#FFFFFF',
    outline: 'none',
    transition: 'all 0.2s ease',
    flex: 1,
    minWidth: '120px',
  },
  periodesContainer: {
    backgroundColor: '#F8FAFC',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  periodesHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  periodesTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#0F172A',
  },
  periodeRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginBottom: '8px',
    flexWrap: 'wrap',
  },
  periodeNumber: {
    fontWeight: 600,
    color: '#64748B',
    fontSize: '13px',
    width: '30px',
  },
  resultGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
  },
  resultItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  resultLabel: {
    fontSize: '12px',
    color: '#94A3B8',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  resultValue: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#0F172A',
  },
  detailTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#0F172A',
    marginBottom: '12px',
  },
  exportOptions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: '1px solid #E2E8F0',
  },
  exportTypeSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  exportTypeSelectorInline: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  exportLabel: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#334155',
  },
  exportButtons: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  historiqueActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  historiqueInfo: {
    fontSize: '14px',
    color: '#64748B',
  },
};