import React, { useState, useEffect } from 'react';
import API from '../../utils/api';
import Table from '../../components/common/Table';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function ClientFactures() {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const columns = [
    { key: 'numero_facture', label: 'N° Facture' },
    { key: 'total_ttc', label: 'Montant (€)' },
    { key: 'statut', label: 'Statut', render: (row) => (
      <span style={{
        padding: '4px 14px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 500,
        backgroundColor: row.statut === 'payee' ? '#D1FAE5' : row.statut === 'emise' ? '#FEF3C7' : '#FEE2E2',
        color: row.statut === 'payee' ? '#065F46' : row.statut === 'emise' ? '#92400E' : '#991B1B'
      }}>
        {row.statut === 'payee' ? ' Payée' : row.statut === 'emise' ? ' Envoyée' : ' En attente'}
      </span>
    )},
    { key: 'date_facture', label: 'Date', render: (row) => new Date(row.date_facture).toLocaleDateString('fr-FR') }
  ];

  if (loading) return <LoadingSpinner size="lg" text="Chargement des factures..." />;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}> Mes factures</h1>
        <p style={styles.subtitle}>{factures.length} facture(s) au total</p>
      </div>
      <Table columns={columns} data={factures} emptyMessage="Aucune facture trouvée" />
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
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
  },
};