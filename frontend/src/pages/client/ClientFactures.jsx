// src/pages/client/ClientFactures.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../utils/api';

import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export default function ClientFactures() {
  const navigate = useNavigate();

  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFactures();
  }, []);

  const loadFactures = async () => {
    try {
      const res = await API.get('/commandes');
      const mesCommandes = res.data.commandes || [];

      const facturesData = mesCommandes
        .filter(c => c.statut === 'livree' || c.statut === 'confirmee')
        .map(c => ({
          id: `F-${c.id}`,
          commande_id: c.id,
          date: c.date_commande,
          total: c.total,
          statut: c.statut === 'livree' ? 'Payée' : 'En attente'
        }));

      setFactures(facturesData);
    } catch (err) {
      setError('Impossible de charger vos factures');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Chargement de vos factures..." />;
  }

  const columns = [
    { key: 'id', label: 'Facture' },
    {
      key: 'commande_id',
      label: 'Commande',
      render: (row) => `#${row.commande_id}`
    },
    {
      key: 'date',
      label: 'Date',
      render: (row) => new Date(row.date).toLocaleDateString('fr-FR')
    },
    {
      key: 'total',
      label: 'Total',
      render: (row) => `${row.total} DT`
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (row) => (
        <Badge variant={row.statut === 'Payée' ? 'success' : 'warning'}>
          {row.statut}
        </Badge>
      )
    }
  ];

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}> Mes factures</h1>
          <p style={styles.subtitle}>Consultez vos factures</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/client/dashboard')}>
          ← Retour
        </Button>
      </div>

      {error && (
        <div style={styles.errorContainer}>
          <span style={styles.errorText}>{error}</span>
        </div>
      )}

      {factures.length === 0 ? (
        <EmptyState
          title="Vous n'avez pas encore de factures"
          description="Les factures apparaîtront après la livraison de vos commandes."
        />
      ) : (
        <Card title="Liste de mes factures" variant="primary">
          <Table columns={columns} data={factures} />
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
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#0F172A',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748B',
    marginTop: '4px',
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
};