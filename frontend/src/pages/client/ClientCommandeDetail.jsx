import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../utils/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function ClientCommandeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [commande, setCommande] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommande();
  }, [id]);

  const loadCommande = async () => {
    try {
      const res = await API.get(`/client/commandes/${id}`);
      setCommande(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" text="Chargement..." />;
  if (!commande) return <p style={{ padding: '24px' }}>Commande non trouvée</p>;

  return (
    <div style={styles.container}>
      <Button variant="secondary" onClick={() => navigate('/client/commandes')} style={{ marginBottom: '16px' }}>
        ← Retour
      </Button>

      <Card title={`Commande #${commande.reference || commande.id}`} variant="primary">
        <div style={styles.infoGrid}>
          <div><strong>Date :</strong> {new Date(commande.date_commande).toLocaleDateString('fr-FR')}</div>
          <div><strong>Statut :</strong> 
            <span style={{
              marginLeft: '8px',
              padding: '2px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: commande.statut === 'livree' ? '#D1FAE5' : '#FEF3C7',
              color: commande.statut === 'livree' ? '#065F46' : '#92400E'
            }}>
              {commande.statut === 'livree' ? ' Livrée' : commande.statut === 'confirmee' ? ' Confirmée' : ' En attente'}
            </span>
          </div>
          <div><strong>Total HT :</strong> {commande.montant_ht || commande.total} €</div>
          <div><strong>TVA :</strong> {commande.montant_tva || 0} €</div>
          <div><strong>Total TTC :</strong> {commande.total_ttc || commande.total} €</div>
        </div>

        <h3 style={styles.sectionTitle}>Produits commandés</h3>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHead}>
              <th style={styles.tableHeader}>Produit</th>
              <th style={{...styles.tableHeader, textAlign: 'right'}}>Qté</th>
              <th style={{...styles.tableHeader, textAlign: 'right'}}>Prix unitaire</th>
              <th style={{...styles.tableHeader, textAlign: 'right'}}>Total</th>
            </tr>
          </thead>
          <tbody>
            {(commande.produits || commande.lignes || []).map((item, i) => (
              <tr key={i} style={i % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd}>
                <td style={styles.tableCell}>{item.produit_nom || `Produit #${item.produit_id}`}</td>
                <td style={{...styles.tableCell, textAlign: 'right'}}>{item.quantite}</td>
                <td style={{...styles.tableCell, textAlign: 'right'}}>{item.prix_unitaire} €</td>
                <td style={{...styles.tableCell, textAlign: 'right'}}>{(item.quantite * item.prix_unitaire).toFixed(2)} €</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#0F172A',
    marginTop: '16px',
    marginBottom: '12px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  tableHead: {
    backgroundColor: '#F1F5F9',
  },
  tableHeader: {
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: 600,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tableRowEven: {
    backgroundColor: '#FFFFFF',
  },
  tableRowOdd: {
    backgroundColor: '#F8FAFC',
  },
  tableCell: {
    padding: '10px 12px',
    fontSize: '14px',
    color: '#0F172A',
    borderBottom: '1px solid #E8EDF2',
  },
};