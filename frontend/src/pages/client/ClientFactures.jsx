import React, { useState, useEffect, useMemo } from 'react';
import API from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

const STATUTS = {
  payee: { label: 'Payée', bg: '#D1FAE5', color: '#065F46', icon: '✅' },
  emise: { label: 'À payer', bg: '#FEF3C7', color: '#92400E', icon: '⏳' },
  brouillon: { label: 'Brouillon', bg: '#F1F5F9', color: '#475569', icon: '📝' },
  annulee: { label: 'Annulée', bg: '#FEE2E2', color: '#991B1B', icon: '✕' },
};

export default function ClientFactures() {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtre, setFiltre] = useState('toutes');

  useEffect(() => {
    loadFactures();
  }, []);

  const loadFactures = async () => {
    try {
      const res = await API.get('/client/factures');
      setFactures(res.data.factures || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = factures.reduce((s, f) => s + Number(f.total_ttc || 0), 0);
    const impayees = factures.filter((f) => f.statut === 'emise');
    const montantDu = impayees.reduce((s, f) => s + Number(f.total_ttc || 0), 0);
    return { total, nbImpayees: impayees.length, montantDu };
  }, [factures]);

  const filtered = useMemo(() => {
    return factures.filter((f) => {
      const matchFiltre = filtre === 'toutes' || f.statut === filtre;
      const terme = search.trim().toLowerCase();
      const matchSearch = !terme || (f.numero_facture || '').toLowerCase().includes(terme);
      return matchFiltre && matchSearch;
    });
  }, [factures, search, filtre]);

  if (loading) return <LoadingSpinner size="lg" text="Chargement des factures..." />;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Mes factures</h1>
        <p style={styles.subtitle}>{factures.length} facture(s) au total</p>
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{stats.total.toFixed(2)} €</span>
          <span style={styles.statLabel}>Montant total facturé</span>
        </div>
        <div style={{ ...styles.statCard, borderColor: stats.nbImpayees > 0 ? '#FCA5A5' : '#E8EDF2' }}>
          <span style={{ ...styles.statValue, color: stats.nbImpayees > 0 ? '#DC2626' : '#0F172A' }}>
            {stats.montantDu.toFixed(2)} €
          </span>
          <span style={styles.statLabel}>{stats.nbImpayees} facture(s) en attente de paiement</span>
        </div>
      </div>

      <div style={styles.toolbar}>
        <div style={styles.searchWrapper}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Rechercher par numéro de facture..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <select value={filtre} onChange={(e) => setFiltre(e.target.value)} style={styles.select}>
          <option value="toutes">Toutes</option>
          <option value="emise">À payer</option>
          <option value="payee">Payées</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Aucune facture trouvée" description="Vos factures apparaîtront ici." />
      ) : (
        <div style={styles.list}>
          {filtered.map((f) => {
            const info = STATUTS[f.statut] || STATUTS.brouillon;
            return (
              <div key={f.id} style={styles.row}>
                <div style={styles.rowIcon}>{info.icon}</div>
                <div style={styles.rowInfo}>
                  <div style={styles.rowNum}>Facture {f.numero_facture}</div>
                  <div style={styles.rowDate}>
                    {new Date(f.date_facture).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </div>
                </div>
                <span style={{ ...styles.statutPill, backgroundColor: info.bg, color: info.color }}>
                  {info.label}
                </span>
                <span style={styles.rowMontant}>{f.total_ttc} €</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '24px', maxWidth: '900px', margin: '0 auto' },
  header: { marginBottom: '18px' },
  title: { fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: 0 },
  subtitle: { fontSize: '13px', color: '#64748B', marginTop: '4px' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' },
  statCard: {
    backgroundColor: '#FFFFFF', padding: '18px 20px', borderRadius: '14px',
    border: '1px solid #E8EDF2', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  statValue: { display: 'block', fontSize: '24px', fontWeight: 700, color: '#0F172A' },
  statLabel: { fontSize: '12px', color: '#64748B', marginTop: '4px', display: 'block' },
  toolbar: { display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '18px' },
  searchWrapper: {
    flex: '1 1 260px', display: 'flex', alignItems: 'center',
    backgroundColor: '#FFFFFF', border: '2px solid #E2E8F0', borderRadius: '10px', padding: '2px 14px',
  },
  searchIcon: { fontSize: '14px', marginRight: '8px' },
  searchInput: { flex: 1, border: 'none', outline: 'none', padding: '10px 0', fontSize: '14px' },
  select: {
    padding: '10px 14px', borderRadius: '10px', border: '2px solid #E2E8F0',
    fontSize: '13px', backgroundColor: '#FFFFFF', outline: 'none', cursor: 'pointer',
  },
  list: { display: 'flex', flexDirection: 'column', gap: '10px' },
  row: {
    display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px',
    backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E8EDF2',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  },
  rowIcon: { fontSize: '22px', width: '36px', textAlign: 'center' },
  rowInfo: { flex: 1 },
  rowNum: { fontWeight: 600, color: '#0F172A', fontSize: '14px' },
  rowDate: { fontSize: '12px', color: '#94A3B8', marginTop: '2px' },
  statutPill: { fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '20px' },
  rowMontant: { fontWeight: 700, color: '#0F172A', fontSize: '15px', minWidth: '80px', textAlign: 'right' },
};