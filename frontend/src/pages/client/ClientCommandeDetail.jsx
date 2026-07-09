// src/pages/client/ClientCommandeDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../utils/api';

import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function ClientCommandeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [commande, setCommande] = useState(null);
  const [lignes, setLignes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCommande();
  }, [id]);

  const loadCommande = async () => {
    try {
      const res = await API.get(`/commandes/${id}`);
      setCommande(res.data.commande);
      setLignes(res.data.commande.lignes || []);
    } catch (err) {
      setError('Impossible de charger la commande');
    } finally {
      setLoading(false);
    }
  };

  const getStatutBadge = (statut) => {
    const statuts = {
      en_attente: { label: 'En attente', variant: 'warning' },
      confirmee: { label: 'Confirmée', variant: 'primary' },
      livree: { label: 'Livrée', variant: 'success' },
      annulee: { label: 'Annulée', variant: 'danger' }
    };
    return statuts[statut] || statuts.en_attente;
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Chargement de la commande..." />;
  }

  if (error || !commande) {
    return (
      <div>
        <div style={styles.header}>
          <h1 style={styles.title}>❌ Erreur</h1>
          <p style={styles.subtitle}>{error || 'Commande introuvable'}</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/client/commandes')}>
          ← Retour
        </Button>
      </div>
    );
  }

  const statut = getStatutBadge(commande.statut);

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Commande #{commande.id}</h1>
          <p style={styles.subtitle}>
            Détails de votre commande du {new Date(commande.date_commande).toLocaleDateString('fr-FR')}
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/client/commandes')}>
          ← Retour
        </Button>
      </div>

      <Card title=" Informations générales" variant="primary" style={{ marginBottom: '24px' }}>
        <div style={styles.infoGrid}>
          <div>
            <span style={styles.infoLabel}>Date</span>
            <span style={styles.infoValue}>
              {new Date(commande.date_commande).toLocaleDateString('fr-FR')}
            </span>
          </div>
          <div>
            <span style={styles.infoLabel}>Total</span>
            <span style={styles.infoValue}>{commande.total} DT</span>
          </div>
          <div>
            <span style={styles.infoLabel}>Statut</span>
            <Badge variant={statut.variant}>{statut.label}</Badge>
          </div>
        </div>
      </Card>

      <Card title=" Produits commandés" variant="primary">
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Produit</th>
              <th>Quantité</th>
              <th>Prix unitaire</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l, i) => (
              <tr key={i}>
                <td>{l.produit_nom || `Produit #${l.produit_id}`}</td>
                <td>{l.quantite}</td>
                <td>{l.prix_unitaire} DT</td>
                <td>{(l.quantite * l.prix_unitaire).toFixed(2)} DT</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold' }}>Total :</td>
              <td style={{ fontWeight: 'bold' }}>{commande.total} DT</td>
            </tr>
          </tfoot>
        </table>
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
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
  },
  infoLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#94A3B8',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '4px',
  },
  infoValue: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#0F172A',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
};