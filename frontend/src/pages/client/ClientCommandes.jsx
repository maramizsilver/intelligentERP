import React, { useState, useEffect } from 'react';
import API from '../../utils/api';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

export default function ClientCommandes() {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadCommandes();
  }, []);

  const loadCommandes = async () => {
    try {
      const res = await API.get('/client/commandes');
      setCommandes(res.data.commandes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'reference', label: 'Référence' },
    { key: 'date_commande', label: 'Date', render: (row) => new Date(row.date_commande).toLocaleDateString('fr-FR') },
    { key: 'total_ttc', label: 'Total (€)' },
    { key: 'statut', label: 'Statut', render: (row) => (
      <span style={{
        padding: '4px 14px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 500,
        backgroundColor: row.statut === 'livree' ? '#D1FAE5' : row.statut === 'confirmee' ? '#DBEAFE' : '#FEF3C7',
        color: row.statut === 'livree' ? '#065F46' : row.statut === 'confirmee' ? '#1E40AF' : '#92400E'
      }}>
        {row.statut === 'livree' ? '✅ Livrée' : row.statut === 'confirmee' ? ' Confirmée' : ' En attente'}
      </span>
    )}
  ];

  const actions = [
    { label: 'Voir détails', variant: 'secondary', onClick: (row) => navigate(`/client/commande/${row.id}`) }
  ];

  if (loading) return <LoadingSpinner size="lg" text="Chargement de vos commandes..." />;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Mes commandes</h1>
        <Button variant="primary" onClick={() => navigate('/client/commandes')}>+ Nouvelle commande</Button>
      </div>
      <Table columns={columns} data={commandes} actions={actions} emptyMessage="Aucune commande trouvée" />
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
};