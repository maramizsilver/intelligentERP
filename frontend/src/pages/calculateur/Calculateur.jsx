// frontend/src/pages/calculateur/Calculateur.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export default function Calculateur() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const [onglet, setOnglet] = useState('taux-unique');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resultat, setResultat] = useState(null);

  // Cas n°1 : Taux unique
  const [formUnique, setFormUnique] = useState({
    montant: '',
    date_debut: '',
    date_fin: '',
    taux: ''
  });

  // Cas n°2 : Taux variables
  const [formVariables, setFormVariables] = useState({
    montant: '',
    periodes: [
      { date_debut: '', date_fin: '', taux: '' }
    ]
  });

  const [loadingCalcul, setLoadingCalcul] = useState(false);

  const peutExporter = hasPermission('Finance', 'export') || true;

  // ============ GESTION FORMULAIRES ============
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

  // ============ CALCULS ============
  const handleCalculUnique = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoadingCalcul(true);

    try {
      const res = await API.post('/calculateur/taux-unique', formUnique);
      setResultat(res.data);
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

    // Filtrer les périodes vides
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
      setResultat(res.data);
      setSuccess('Calcul effectué avec succès');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du calcul');
    } finally {
      setLoadingCalcul(false);
    }
  };

  // ============ EXPORTS ============
  const exportPDF = () => {
    if (!resultat) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Titre
    doc.setFontSize(20);
    doc.text('Rapport de calcul - ERP', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`Date : ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 30, { align: 'center' });

    doc.setLineWidth(0.5);
    doc.line(20, 35, pageWidth - 20, 35);

    let y = 45;

    if (resultat.cas === 'taux_unique') {
      doc.setFontSize(14);
      doc.text('Cas n°1 : Taux unique', 20, y);
      y += 10;

      doc.setFontSize(11);
      doc.text(`Montant de base : ${resultat.montant} DT`, 20, y);
      y += 7;
      doc.text(`Période : ${resultat.date_debut} → ${resultat.date_fin}`, 20, y);
      y += 7;
      doc.text(`Nombre de jours : ${resultat.nbJours}`, 20, y);
      y += 7;
      doc.text(`Taux appliqué : ${resultat.taux}%`, 20, y);
      y += 7;
      doc.text(`Base de calcul : ${resultat.base_jours} jours`, 20, y);
      y += 10;

      doc.setFontSize(16);
      doc.setTextColor(14, 165, 233);
      doc.text(`Résultat : ${resultat.resultat} DT`, 20, y);
      doc.setTextColor(0, 0, 0);
      y += 10;

      doc.setFontSize(10);
      doc.text(`Formule : ${resultat.formule}`, 20, y);
    } else if (resultat.cas === 'taux_variables') {
      doc.setFontSize(14);
      doc.text('Cas n°2 : Taux variables par période', 20, y);
      y += 10;

      doc.setFontSize(11);
      doc.text(`Montant de base : ${resultat.montant} DT`, 20, y);
      y += 7;
      doc.text(`Base de calcul : ${resultat.base_jours} jours`, 20, y);
      y += 10;

      // Tableau des détails
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Période', 20, y);
      doc.text('Jours', 70, y);
      doc.text('Taux', 110, y);
      doc.text('Résultat', 150, y);
      doc.setFont(undefined, 'normal');
      y += 7;
      doc.line(20, y, pageWidth - 20, y);
      y += 5;

      resultat.details.forEach((d) => {
        doc.text(`#${d.periode} ${d.date_debut}→${d.date_fin}`, 20, y);
        doc.text(String(d.nbJours), 70, y);
        doc.text(`${d.taux}%`, 110, y);
        doc.text(`${d.resultat} DT`, 150, y);
        y += 7;
      });

      y += 5;
      doc.line(20, y, pageWidth - 20, y);
      y += 7;

      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(`Total : ${resultat.total} DT`, 20, y);
      doc.setFont(undefined, 'normal');
    }

    doc.save(`calcul-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const exportExcel = () => {
    if (!resultat) return;

    let data = [];
    let total = 0;

    if (resultat.cas === 'taux_unique') {
      data = [{
        'Cas': 'Taux unique',
        'Montant': resultat.montant,
        'Date début': resultat.date_debut,
        'Date fin': resultat.date_fin,
        'Nombre de jours': resultat.nbJours,
        'Taux (%)': resultat.taux,
        'Résultat (DT)': resultat.resultat,
        'Formule': resultat.formule
      }];
      total = resultat.resultat;
    } else if (resultat.cas === 'taux_variables') {
      data = resultat.details.map(d => ({
        'Période': `#${d.periode}`,
        'Date début': d.date_debut,
        'Date fin': d.date_fin,
        'Nombre de jours': d.nbJours,
        'Taux (%)': d.taux,
        'Calcul': d.calcul,
        'Résultat (DT)': d.resultat
      }));
      // Ajouter une ligne de total
      data.push({
        'Période': 'TOTAL',
        'Date début': '',
        'Date fin': '',
        'Nombre de jours': '',
        'Taux (%)': '',
        'Calcul': '',
        'Résultat (DT)': resultat.total
      });
      total = resultat.total;
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Ajuster la largeur des colonnes
    ws['!cols'] = [
      { wch: 12 }, { wch: 18 }, { wch: 18 },
      { wch: 15 }, { wch: 12 }, { wch: 35 }, { wch: 15 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Calcul');
    XLSX.writeFile(wb, `calcul-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // ============ COLONNES TABLEAU ============
  const columnsDetails = resultat?.cas === 'taux_variables' ? [
    { key: 'periode', label: 'Période', render: (row) => `#${row.periode}` },
    {
      key: 'date_debut',
      label: 'Date début',
      render: (row) => row.date_debut
    },
    {
      key: 'date_fin',
      label: 'Date fin',
      render: (row) => row.date_fin
    },
    { key: 'nbJours', label: 'Jours' },
    {
      key: 'taux',
      label: 'Taux',
      render: (row) => `${row.taux}%`
    },
    {
      key: 'resultat',
      label: 'Résultat',
      render: (row) => <strong>{row.resultat} DT</strong>
    }
  ] : [];

  // ============ RENDER ============
  return (
    <div>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🧮 Moteur de calcul</h1>
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

      {/* Onglets */}
      <div style={styles.segmentedControl}>
        <button
          style={{ ...styles.segment, ...(onglet === 'taux-unique' ? styles.segmentActive : {}) }}
          onClick={() => { setOnglet('taux-unique'); setResultat(null); }}
        >
          Taux unique
        </button>
        <button
          style={{ ...styles.segment, ...(onglet === 'taux-variables' ? styles.segmentActive : {}) }}
          onClick={() => { setOnglet('taux-variables'); setResultat(null); }}
        >
          Taux variables
        </button>
      </div>

      {/* ============================================================
          CAS N°1 : TAUX UNIQUE
          ============================================================ */}
      {onglet === 'taux-unique' && (
        <>
          <Card title="Saisie des données" variant="primary">
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

          {/* Résultat */}
          {resultat && resultat.cas === 'taux_unique' && (
            <>
              <Card title="Résultat du calcul" variant="success" style={{ marginTop: '20px' }}>
                <div style={styles.resultGrid}>
                  <div style={styles.resultItem}>
                    <span style={styles.resultLabel}>Montant</span>
                    <span style={styles.resultValue}>{resultat.montant} DT</span>
                  </div>
                  <div style={styles.resultItem}>
                    <span style={styles.resultLabel}>Période</span>
                    <span style={styles.resultValue}>
                      {resultat.date_debut} → {resultat.date_fin}
                    </span>
                  </div>
                  <div style={styles.resultItem}>
                    <span style={styles.resultLabel}>Nombre de jours</span>
                    <span style={styles.resultValue}>{resultat.nbJours}</span>
                  </div>
                  <div style={styles.resultItem}>
                    <span style={styles.resultLabel}>Taux</span>
                    <span style={styles.resultValue}>{resultat.taux}%</span>
                  </div>
                  <div style={styles.resultItem}>
                    <span style={styles.resultLabel}>Base de calcul</span>
                    <span style={styles.resultValue}>{resultat.base_jours} jours</span>
                  </div>
                  <div style={{ ...styles.resultItem, gridColumn: '1 / -1', borderTop: '2px solid #E2E8F0', paddingTop: '16px' }}>
                    <span style={{ ...styles.resultLabel, fontSize: '16px', fontWeight: 700 }}>
                      Résultat final
                    </span>
                    <span style={{ ...styles.resultValue, fontSize: '24px', fontWeight: 700, color: '#0EA5E9' }}>
                      {resultat.resultat} DT
                    </span>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={styles.formuleText}>Formule : {resultat.formule}</span>
                  </div>
                </div>

                {peutExporter && (
                  <div style={styles.exportActions}>
                    <Button variant="secondary" onClick={exportPDF} icon="📄">
                      Exporter PDF
                    </Button>
                    <Button variant="secondary" onClick={exportExcel} icon="📊">
                      Exporter Excel
                    </Button>
                  </div>
                )}
              </Card>
            </>
          )}
        </>
      )}

      {/* ============================================================
          CAS N°2 : TAUX VARIABLES
          ============================================================ */}
      {onglet === 'taux-variables' && (
        <>
          <Card title="Saisie des données" variant="primary">
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
                  <Button type="button" variant="outline" size="sm" onClick={addPeriode} icon="+">
                    Ajouter une période
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
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => removePeriode(index)}
                      >
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

          {/* Résultat */}
          {resultat && resultat.cas === 'taux_variables' && (
            <>
              <Card title="Résultat du calcul" variant="success" style={{ marginTop: '20px' }}>
                <div style={styles.resultGrid}>
                  <div style={styles.resultItem}>
                    <span style={styles.resultLabel}>Montant</span>
                    <span style={styles.resultValue}>{resultat.montant} DT</span>
                  </div>
                  <div style={styles.resultItem}>
                    <span style={styles.resultLabel}>Base de calcul</span>
                    <span style={styles.resultValue}>{resultat.base_jours} jours</span>
                  </div>
                  <div style={{ ...styles.resultItem, gridColumn: '1 / -1', borderTop: '2px solid #E2E8F0', paddingTop: '16px' }}>
                    <span style={{ ...styles.resultLabel, fontSize: '16px', fontWeight: 700 }}>
                      Résultat total
                    </span>
                    <span style={{ ...styles.resultValue, fontSize: '24px', fontWeight: 700, color: '#0EA5E9' }}>
                      {resultat.total} DT
                    </span>
                  </div>
                </div>

                {/* Détail par période */}
                <div style={{ marginTop: '20px' }}>
                  <h4 style={styles.detailTitle}>Détail par période</h4>
                  <Table columns={columnsDetails} data={resultat.details} />
                </div>

                {peutExporter && (
                  <div style={styles.exportActions}>
                    <Button variant="secondary" onClick={exportPDF} icon="📄">
                      Exporter PDF
                    </Button>
                    <Button variant="secondary" onClick={exportExcel} icon="📊">
                      Exporter Excel
                    </Button>
                  </div>
                )}
              </Card>
            </>
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
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '16px',
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
  formuleText: {
    fontSize: '13px',
    color: '#64748B',
    fontStyle: 'italic',
    padding: '8px 12px',
    backgroundColor: '#F1F5F9',
    borderRadius: '6px',
    display: 'inline-block',
  },
  exportActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #E2E8F0',
    flexWrap: 'wrap',
  },
  detailTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#0F172A',
    marginBottom: '12px',
  },
};