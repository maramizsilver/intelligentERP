import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../utils/api';

import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export default function ClientCommandes() {
  const navigate = useNavigate();

  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCommandes();
  }, []);

  const loadCommandes = async () => {
    try {
      const res = await API.get('/commandes');
      setCommandes(res.data.commandes || []);
    } catch (err) {
      setError('Impossible de charger vos commandes');
    } finally {
      setLoading(false);
    }
  };

  const annulerCommande = async (id) => {
    if (!window.confirm('Annuler cette commande ?')) return;
    try {
      await API.delete(`/commandes/${id}`);
      loadCommandes();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const getStatutBadge = (statut) => {
    const statuts = {
      en_attente: { label: 'En attente', variant: 'warning' },
      confirmee: { label: 'Confirmee', variant: 'primary' },
      livree: { label: 'Livree', variant: 'success' },
      annulee: { label: 'Annulee', variant: 'danger' }
    };
    return statuts[statut] || statuts.en_attente;
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Chargement de vos commandes..." />;
  }

  const columns = [
    { key: 'id', label: 'N°', width: '60px' },
    {
      key: 'date_commande',
      label: 'Date',
      render: (row) => new Date(row.date_commande).toLocaleDateString('fr-FR')
    },
    {
      key: 'total',
      label: 'Total',
      render: (row) => `${row.total} DT`
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (row) => {
        const statut = getStatutBadge(row.statut);
        return <Badge variant={statut.variant}>{statut.label}</Badge>;
      }
    }
  ];

  const actions = [
    {
      label: 'Voir',
      variant: 'primary',
      onClick: (row) => navigate(`/client/commande/${row.id}`)
    },
    {
      label: 'Payer',
      variant: 'success',
      onClick: (row) => navigate(`/paiement/client?commande_id=${row.id}&montant=${row.total}`),
      disabled: (row) => row.statut !== 'en_attente'
    },
    {
      label: 'Annuler',
      variant: 'danger',
      onClick: (row) => annulerCommande(row.id),
      disabled: (row) => row.statut !== 'en_attente'
    }
  ];

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Mes commandes</h1>
          <p style={styles.subtitle}>Consultez l'historique de vos commandes</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/client/dashboard')}>
          ← Retour
        </Button>
      </div>

      {error && (
        <div style={styles.errorContainer}>
          <span>❌</span>
          <span style={styles.errorText}>{error}</span>
        </div>
      )}

      {commandes.length === 0 ? (
        <EmptyState
          title="Vous n'avez pas encore de commandes"
          description="Découvrez nos produits et passez votre première commande."
          action={
            <Button variant="primary" onClick={() => navigate('/client/produits')}>
              Découvrir les produits
            </Button>
          }
        />
      ) : (
        <Card title="Liste de mes commandes" variant="primary">
          <Table columns={columns} data={commandes} actions={actions} />
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