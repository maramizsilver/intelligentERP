// frontend/src/pages/calculateur/Calculateur.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import * as XLSX from 'xlsx';

import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

// ============================================================
// CONSTANTES
// ============================================================

const CATEGORIES = ['TVA', 'INTERET', 'PENALITE', 'REMISE', 'TAXE', 'COMMISSION'];

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function Calculateur() {
  const { hasPermission, user } = useAuth();
  const navigate = useNavigate();

  // ============================================================
  // ÉTATS
  // ============================================================

  const [onglet, setOnglet] = useState('calcul');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resultat, setResultat] = useState(null);

  // Mode de calcul
  const [modeCalcul, setModeCalcul] = useState('manuel');

  // Cas n°1 : Taux unique
  const [formUnique, setFormUnique] = useState({
    montant: '',
    date_debut: '',
    date_fin: '',
    taux: ''
  });

  // Cas n°2 : Taux variables (manuel)
  const [formVariables, setFormVariables] = useState({
    montant: '',
    periodes: [{ date_debut: '', date_fin: '', taux: '' }]
  });

  // Cas n°3 : Taux variables (auto)
  const [formAuto, setFormAuto] = useState({
    montant: '',
    date_debut: '',
    date_fin: '',
    categorie: '',
    sous_categorie: ''
  });

  // Taux de référence (lecture seule)
  const [tauxReference, setTauxReference] = useState([]);
  const [loadingTaux, setLoadingTaux] = useState(false);

  // Historiques séparés
  const [historiqueUnique, setHistoriqueUnique] = useState([]);
  const [historiqueVariable, setHistoriqueVariable] = useState([]);
  const [totalUnique, setTotalUnique] = useState(0);
  const [totalVariable, setTotalVariable] = useState(0);
  const [sousOngletHistorique, setSousOngletHistorique] = useState('unique');

  // Export
  const [typeRapport, setTypeRapport] = useState('detaille');

  const [loadingCalcul, setLoadingCalcul] = useState(false);

  const peutExporter = hasPermission('Finance', 'export');
  const isSuperAdmin = user?.is_super_admin;

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================

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
      setError('Impossible de charger les taux de référence');
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
      setError('Impossible de charger l\'historique des taux uniques');
    }
  };

  const loadHistoriqueVariable = async () => {
    try {
      const res = await API.get('/calculateur/historique/taux-variable');
      setHistoriqueVariable(res.data.historique || []);
      setTotalVariable(res.data.total || 0);
    } catch (err) {
      setError('Impossible de charger l\'historique des taux variables');
    }
  };

  // ============================================================
  // GESTION DES FORMULAIRES
  // ============================================================

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

  // ============================================================
  // CALCULS
  // ============================================================

  const handleCalculUnique = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoadingCalcul(true);

    try {
      const res = await API.post('/calculateur/taux-unique', formUnique);
      setResultat({ ...res.data, type_calcul: 'taux_unique' });
      setSuccess('Calcul effectué avec succès');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du calcul');
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
      setError('Ajoutez au moins une période complète');
      setLoadingCalcul(false);
      return;
    }

    try {
      const res = await API.post('/calculateur/taux-variables', {
        montant: formVariables.montant,
        periodes: periodesValides
      });
      setResultat({ ...res.data, type_calcul: 'taux_variables_manuel' });
      setSuccess('Calcul effectué avec succès');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du calcul');
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
      setSuccess('Calcul effectué avec succès');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.message || 'Erreur lors du calcul');
    } finally {
      setLoadingCalcul(false);
    }
  };

  // ============================================================
  // EXPORTS (PDF + Word + Impression)
  // ============================================================

  const handleExportPDF = async () => {
    if (!resultat) {
      setError('Aucun résultat à exporter');
      return;
    }
    
    console.log('📄 Export PDF - Type rapport:', typeRapport);
    console.log('📄 Données:', resultat);
    
    try {
      setLoadingCalcul(true);
      
      const response = await API.post('/calculateur/export/pdf', {
        data: resultat,
        type_rapport: typeRapport
      }, { responseType: 'blob' });

      console.log('✅ Réponse PDF reçue, status:', response.status);

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `calcul-${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setSuccess('✅ PDF exporté avec succès');
    } catch (err) {
      console.error('❌ Erreur export PDF:', err);
      setError(err.response?.data?.message || 'Erreur lors de l\'export PDF');
    } finally {
      setLoadingCalcul(false);
    }
  };

  const handleExportWord = async () => {
    if (!resultat) {
      setError('Aucun résultat à exporter');
      return;
    }
    
    console.log('📝 Export Word - Type rapport:', typeRapport);
    console.log('📝 Données:', resultat);
    
    try {
      setLoadingCalcul(true);
      
      const response = await API.post('/calculateur/export/word', {
        data: resultat,
        type_rapport: typeRapport
      }, { responseType: 'blob' });

      console.log('✅ Réponse Word reçue, status:', response.status);

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
      
      setSuccess('✅ Word exporté avec succès');
    } catch (err) {
      console.error('❌ Erreur export Word:', err);
      setError(err.response?.data?.message || 'Erreur lors de l\'export Word');
    } finally {
      setLoadingCalcul(false);
    }
  };

  const handleExportHistoriquePDF = async (id) => {
    console.log('📄 Export Historique PDF - ID:', id, '- Type rapport:', typeRapport);
    
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
      
      setSuccess('✅ PDF historique exporté avec succès');
    } catch (err) {
      console.error('❌ Erreur export PDF historique:', err);
      setError('Erreur lors de l\'export PDF');
    }
  };

  const handleExportHistoriqueWord = async (id) => {
    console.log('📝 Export Historique Word - ID:', id, '- Type rapport:', typeRapport);
    
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
      
      setSuccess('✅ Word historique exporté avec succès');
    } catch (err) {
      console.error('❌ Erreur export Word historique:', err);
      setError('Erreur lors de l\'export Word');
    }
  };

  const handlePrint = () => {
    document.body.classList.add('printing');
    setTimeout(() => {
      window.print();
      document.body.classList.remove('printing');
    }, 100);
  };

  // ============================================================
  // EXPORT EXCEL
  // ============================================================

  const exportExcel = () => {
    if (!resultat) return;

    let data = [];
    if (resultat.cas === 'taux_unique') {
      data = [{
        'Cas': 'Taux unique',
        'Montant': resultat.montant,
        'Date début': resultat.date_debut,
        'Date fin': resultat.date_fin,
        'Nombre de jours': resultat.nbJours,
        'Taux (%)': resultat.taux,
        'Résultat (DT)': resultat.resultat
      }];
    } else {
      data = resultat.details.map(d => ({
        'Période': `#${d.periode}`,
        'Date début': d.date_debut,
        'Date fin': d.date_fin,
        'Nombre de jours': d.nbJours,
        'Taux (%)': d.taux,
        'Résultat (DT)': d.resultat
      }));
      data.push({
        'Période': 'TOTAL',
        'Date début': '',
        'Date fin': '',
        'Nombre de jours': '',
        'Taux (%)': '',
        'Résultat (DT)': resultat.total
      });
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Calcul');
    XLSX.writeFile(wb, `calcul-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // ============================================================
  // COLONNES TABLEAUX
  // ============================================================

  const columnsDetails = resultat?.cas !== 'taux_unique' && resultat?.details ? [
    { key: 'periode', label: 'Période', render: (row) => `#${row.periode}` },
    { key: 'date_debut', label: 'Date début' },
    { key: 'date_fin', label: 'Date fin' },
    { key: 'nbJours', label: 'Jours' },
    { key: 'taux', label: 'Taux', render: (row) => `${row.taux}%` },
    { key: 'resultat', label: 'Résultat', render: (row) => <strong>{row.resultat} DT</strong> }
  ] : [];

  const columnsTaux = [
    { key: 'categorie', label: 'Catégorie' },
    { key: 'nom', label: 'Nom' },
    { key: 'date_debut', label: 'Date début', render: (row) => new Date(row.date_debut).toLocaleDateString('fr-FR') },
    { key: 'date_fin', label: 'Date fin', render: (row) => new Date(row.date_fin).toLocaleDateString('fr-FR') },
    { key: 'taux', label: 'Taux', render: (row) => `${row.taux}%` },
    { key: 'actif', label: 'Actif', render: (row) => <Badge variant={row.actif ? 'success' : 'danger'}>{row.actif ? 'Oui' : 'Non'}</Badge> }
  ];

  const columnsHistorique = [
    { key: 'id', label: '#' },
    { key: 'type_calcul', label: 'Type', render: (row) => {
      const types = {
        'taux_unique': 'Taux unique',
        'taux_variables_manuel': 'Taux variables (manuel)',
        'taux_variables_auto': 'Taux variables (auto)'
      };
      return types[row.type_calcul] || row.type_calcul;
    }},
    { key: 'montant', label: 'Montant', render: (row) => `${row.montant} DT` },
    { key: 'resultat', label: 'Résultat', render: (row) => `${row.resultat} DT` },
    { key: 'created_at', label: 'Date', render: (row) => new Date(row.created_at).toLocaleString('fr-FR') },
    { key: 'prenom', label: 'Par', render: (row) => `${row.prenom || ''} ${row.nom || ''}` }
  ];

  const actionsHistorique = [];
  if (peutExporter) {
    actionsHistorique.push({
      label: 'PDF',
      variant: 'primary',
      onClick: (row) => handleExportHistoriquePDF(row.id)
    });
    actionsHistorique.push({
      label: 'Word',
      variant: 'secondary',
      onClick: (row) => handleExportHistoriqueWord(row.id)
    });
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Moteur de calcul</h1>
          <p style={styles.subtitle}>
            Calcul automatique basé sur les périodes et les taux (%)
          </p>
        </div>
        <div style={styles.headerActions}>
          <Button variant="secondary" onClick={() => navigate('/dashboard')}>
            Retour
          </Button>
        </div>
      </div>

      {/* Messages */}
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

      {/* Onglets principaux */}
      <div style={styles.segmentedControl}>
        <button
          style={{ ...styles.segment, ...(onglet === 'calcul' ? styles.segmentActive : {}) }}
          onClick={() => { setOnglet('calcul'); setResultat(null); }}
        >
          Calcul
        </button>
        <button
          style={{ ...styles.segment, ...(onglet === 'taux' ? styles.segmentActive : {}) }}
          onClick={() => { setOnglet('taux'); setResultat(null); }}
        >
          Taux de référence
        </button>
        <button
          style={{ ...styles.segment, ...(onglet === 'historique' ? styles.segmentActive : {}) }}
          onClick={() => { setOnglet('historique'); setResultat(null); }}
        >
          Historique
        </button>
      </div>

      {/* ============================================================
          ONGLET : CALCUL
          ============================================================ */}
      {onglet === 'calcul' && (
        <>
          {/* Mode de calcul */}
          <div style={styles.modeSelector}>
            <button
              style={{ ...styles.modeBtn, ...(modeCalcul === 'manuel' ? styles.modeBtnActive : {}) }}
              onClick={() => { setModeCalcul('manuel'); setResultat(null); }}
            >
              Mode manuel
            </button>
            <button
              style={{ ...styles.modeBtn, ...(modeCalcul === 'auto' ? styles.modeBtnActive : {}) }}
              onClick={() => { setModeCalcul('auto'); setResultat(null); }}
            >
              Mode automatique (BDD)
            </button>
          </div>

          {/* ===== MODE MANUEL ===== */}
          {modeCalcul === 'manuel' && (
            <>
              <div style={styles.subSegmentedControl}>
                <button
                  style={{ ...styles.subSegment, ...(formUnique.active !== false ? styles.subSegmentActive : {}) }}
                  onClick={() => setFormUnique({ ...formUnique, active: true })}
                >
                  Taux unique
                </button>
                <button
                  style={{ ...styles.subSegment, ...(formUnique.active === false ? styles.subSegmentActive : {}) }}
                  onClick={() => setFormUnique({ ...formUnique, active: false })}
                >
                  Taux variables
                </button>
              </div>

              {/* Taux unique */}
              {formUnique.active !== false && (
                <Card title="Saisie des données - Taux unique" variant="primary">
                  <form onSubmit={handleCalculUnique}>
                    <div style={styles.formGrid}>
                      <Input
                        label="Montant de base (DT) *"
                        name="montant"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="Ex: 10000"
                        value={formUnique.montant}
                        onChange={handleUniqueChange}
                        required
                        disabled={loadingCalcul}
                      />
                      <Input
                        label="Date de début *"
                        name="date_debut"
                        type="date"
                        value={formUnique.date_debut}
                        onChange={handleUniqueChange}
                        required
                        disabled={loadingCalcul}
                      />
                      <Input
                        label="Date de fin *"
                        name="date_fin"
                        type="date"
                        value={formUnique.date_fin}
                        onChange={handleUniqueChange}
                        required
                        disabled={loadingCalcul}
                      />
                      <Input
                        label="Taux (%) *"
                        name="taux"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Ex: 10"
                        value={formUnique.taux}
                        onChange={handleUniqueChange}
                        required
                        disabled={loadingCalcul}
                      />
                    </div>
                    <Button type="submit" variant="primary" loading={loadingCalcul} fullWidth>
                      Calculer
                    </Button>
                  </form>
                </Card>
              )}

              {/* Taux variables manuel */}
              {formUnique.active === false && (
                <Card title="Saisie des données - Taux variables" variant="primary">
                  <form onSubmit={handleCalculVariables}>
                    <div style={styles.formGrid}>
                      <Input
                        label="Montant de base (DT) *"
                        name="montant"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="Ex: 10000"
                        value={formVariables.montant}
                        onChange={(e) => setFormVariables({ ...formVariables, montant: e.target.value })}
                        required
                        disabled={loadingCalcul}
                      />
                    </div>

                    <div style={styles.periodesContainer}>
                      <div style={styles.periodesHeader}>
                        <span style={styles.periodesTitle}>Périodes et taux</span>
                        <Button type="button" variant="outline" size="sm" onClick={addPeriode}>
                          + Ajouter une période
                        </Button>
                      </div>

                      {formVariables.periodes.map((periode, index) => (
                        <div key={index} style={styles.periodeRow}>
                          <span style={styles.periodeNumber}>#{index + 1}</span>
                          <input
                            style={styles.input}
                            type="date"
                            placeholder="Date début"
                            value={periode.date_debut}
                            onChange={(e) => handlePeriodeChange(index, 'date_debut', e.target.value)}
                            required
                            disabled={loadingCalcul}
                          />
                          <input
                            style={styles.input}
                            type="date"
                            placeholder="Date fin"
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
                            placeholder="Taux %"
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
                      Calculer
                    </Button>
                  </form>
                </Card>
              )}
            </>
          )}

          {/* ===== MODE AUTOMATIQUE (BDD) ===== */}
          {modeCalcul === 'auto' && (
            <Card title="Saisie des données - Taux depuis BDD" variant="primary">
              <form onSubmit={handleCalculAuto}>
                <div style={styles.formGrid}>
                  <Input
                    label="Montant de base (DT) *"
                    name="montant"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Ex: 10000"
                    value={formAuto.montant}
                    onChange={handleAutoChange}
                    required
                    disabled={loadingCalcul}
                  />
                  <Input
                    label="Date de début *"
                    name="date_debut"
                    type="date"
                    value={formAuto.date_debut}
                    onChange={handleAutoChange}
                    required
                    disabled={loadingCalcul}
                  />
                  <Input
                    label="Date de fin *"
                    name="date_fin"
                    type="date"
                    value={formAuto.date_fin}
                    onChange={handleAutoChange}
                    required
                    disabled={loadingCalcul}
                  />
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Catégorie *</label>
                    <select
                      style={styles.select}
                      name="categorie"
                      value={formAuto.categorie}
                      onChange={handleAutoChange}
                      required
                      disabled={loadingCalcul}
                    >
                      <option value="">-- Choisir une catégorie --</option>
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="Sous-catégorie (optionnel)"
                    name="sous_categorie"
                    placeholder="Ex: Standard, Réduite..."
                    value={formAuto.sous_categorie}
                    onChange={handleAutoChange}
                    disabled={loadingCalcul}
                  />
                </div>
                <Button type="submit" variant="primary" loading={loadingCalcul} fullWidth>
                  Calculer avec les taux de référence
                </Button>
              </form>
            </Card>
          )}

          {/* Résultat */}
          {resultat && (
            <Card title="Résultat du calcul" variant="success" style={{ marginTop: '20px' }}>
              {/* Options d'export */}
              {peutExporter && (
                <div style={styles.exportOptions}>
                  <div style={styles.exportTypeSelector}>
                    <label style={styles.exportLabel}>Type de rapport :</label>
                    <select
                      style={styles.selectSmall}
                      value={typeRapport}
                      onChange={(e) => {
                        console.log('🔄 Type de rapport changé:', e.target.value);
                        setTypeRapport(e.target.value);
                      }}
                    >
                      <option value="detaille">Rapport détaillé</option>
                      <option value="simplifie">Rapport simplifié</option>
                    </select>
                  </div>
                  <div style={styles.exportButtons}>
                    <Button variant="secondary" size="sm" onClick={handlePrint}>
                      Imprimer
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleExportPDF}>
                      PDF
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleExportWord}>
                      Word
                    </Button>
                    <Button variant="secondary" size="sm" onClick={exportExcel}>
                      Excel
                    </Button>
                  </div>
                </div>
              )}

              <div style={styles.resultGrid}>
                <div style={styles.resultItem}>
                  <span style={styles.resultLabel}>Montant</span>
                  <span style={styles.resultValue}>{resultat.montant} DT</span>
                </div>
                <div style={styles.resultItem}>
                  <span style={styles.resultLabel}>Base de calcul</span>
                  <span style={styles.resultValue}>{resultat.base_jours} jours</span>
                </div>
                {resultat.cas === 'taux_unique' && (
                  <>
                    <div style={styles.resultItem}>
                      <span style={styles.resultLabel}>Période</span>
                      <span style={styles.resultValue}>{resultat.date_debut} → {resultat.date_fin}</span>
                    </div>
                    <div style={styles.resultItem}>
                      <span style={styles.resultLabel}>Nombre de jours</span>
                      <span style={styles.resultValue}>{resultat.nbJours}</span>
                    </div>
                    <div style={styles.resultItem}>
                      <span style={styles.resultLabel}>Taux</span>
                      <span style={styles.resultValue}>{resultat.taux}%</span>
                    </div>
                  </>
                )}
                {resultat.cas === 'taux_variables_auto' && (
                  <>
                    <div style={styles.resultItem}>
                      <span style={styles.resultLabel}>Catégorie</span>
                      <span style={styles.resultValue}>{resultat.categorie}</span>
                    </div>
                    {resultat.sous_categorie && (
                      <div style={styles.resultItem}>
                        <span style={styles.resultLabel}>Sous-catégorie</span>
                        <span style={styles.resultValue}>{resultat.sous_categorie}</span>
                      </div>
                    )}
                  </>
                )}
                <div style={{ ...styles.resultItem, gridColumn: '1 / -1', borderTop: '2px solid #E2E8F0', paddingTop: '16px' }}>
                  <span style={{ ...styles.resultLabel, fontSize: '16px', fontWeight: 700 }}>
                    Résultat final
                  </span>
                  <span style={{ ...styles.resultValue, fontSize: '24px', fontWeight: 700, color: '#0EA5E9' }}>
                    {resultat.total || resultat.resultat} DT
                  </span>
                </div>
              </div>

              {/* Détail par période */}
              {resultat.details && resultat.details.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h4 style={styles.detailTitle}>Détail par période</h4>
                  <Table columns={columnsDetails} data={resultat.details} />
                </div>
              )}
            </Card>
          )}
        </>
      )}

      {/* ============================================================
          ONGLET : TAUX DE RÉFÉRENCE (lecture seule pour les internes)
          ============================================================ */}
      {onglet === 'taux' && (
        <>
          <div style={styles.actionBar}>
            {isSuperAdmin && (
              <Button
                variant="primary"
                onClick={() => navigate('/superadmin/taux-reference')}
              >
                Gérer les taux (Admin)
              </Button>
            )}
            {!isSuperAdmin && (
              <Badge variant="secondary" style={{ padding: '8px 16px' }}>
                Lecture seule - Les taux sont gérés par le SuperAdmin
              </Badge>
            )}
          </div>

          <Card title="Taux de référence centralisés" variant="primary">
            <Table columns={columnsTaux} data={tauxReference} loading={loadingTaux} />
          </Card>
        </>
      )}

      {/* ============================================================
          ONGLET : HISTORIQUE (séparé en deux sous-onglets)
          ============================================================ */}
      {onglet === 'historique' && (
        <>
          <div style={styles.subSegmentedControl}>
            <button
              style={{ ...styles.subSegment, ...(sousOngletHistorique === 'unique' ? styles.subSegmentActive : {}) }}
              onClick={() => setSousOngletHistorique('unique')}
            >
              Taux unique ({totalUnique})
            </button>
            <button
              style={{ ...styles.subSegment, ...(sousOngletHistorique === 'variable' ? styles.subSegmentActive : {}) }}
              onClick={() => setSousOngletHistorique('variable')}
            >
              Taux variables ({totalVariable})
            </button>
          </div>

          {sousOngletHistorique === 'unique' ? (
            <Card title="Historique - Taux unique" variant="primary">
              <div style={styles.historiqueActions}>
                <span style={styles.historiqueInfo}>
                  {totalUnique} calcul(s) enregistré(s)
                </span>
                {peutExporter && (
                  <div style={styles.exportTypeSelectorInline}>
                    <select
                      style={styles.selectSmall}
                      value={typeRapport}
                      onChange={(e) => {
                        console.log('🔄 Type de rapport (historique) changé:', e.target.value);
                        setTypeRapport(e.target.value);
                      }}
                    >
                      <option value="detaille">Rapport détaillé</option>
                      <option value="simplifie">Rapport simplifié</option>
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
            <Card title="Historique - Taux variables" variant="primary">
              <div style={styles.historiqueActions}>
                <span style={styles.historiqueInfo}>
                  {totalVariable} calcul(s) enregistré(s)
                </span>
                {peutExporter && (
                  <div style={styles.exportTypeSelectorInline}>
                    <select
                      style={styles.selectSmall}
                      value={typeRapport}
                      onChange={(e) => {
                        console.log('🔄 Type de rapport (historique) changé:', e.target.value);
                        setTypeRapport(e.target.value);
                      }}
                    >
                      <option value="detaille">Rapport détaillé</option>
                      <option value="simplifie">Rapport simplifié</option>
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

// ============================================================
// STYLES
// ============================================================
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