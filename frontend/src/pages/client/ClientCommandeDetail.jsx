import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../utils/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

const ETAPES = [
  { key: 'en_attente', label: 'Commande reçue' },
  { key: 'confirmee', label: 'Confirmée' },
  { key: 'livree', label: 'Livrée' },
];

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
      setLoading(true);
      const res = await API.get(`/client/commandes/${id}`);
      setCommande(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" text="Chargement de votre commande..." />;

  if (!commande) {
    return (
      <div style={styles.container}>
        <EmptyState

          title="Commande introuvable"
          description="Cette commande n'existe pas ou vous n'y avez pas accès."
          action={<Button variant="primary" onClick={() => navigate('/client/commandes')}>Retour à mes commandes</Button>}
        />
      </div>
    );
  }

  const etapeActuelleIndex = commande.statut === 'annulee'
    ? -1
    : ETAPES.findIndex((e) => e.key === commande.statut);

  const lignes = commande.produits || commande.lignes || [];
  const totalHT = lignes.reduce((sum, l) => sum + (l.quantite * l.prix_unitaire || 0), 0);

  return (
    <div style={styles.container}>
      <div style={styles.headerBar}>
        <Button variant="secondary" onClick={() => navigate('/client/commandes')}>
          ← Retour
        </Button>
        <Button variant="outline" onClick={() => window.print()}>🖨 Imprimer</Button>
      </div>

      <Card variant="primary" style={{ marginBottom: '16px' }}>
        <div style={styles.topRow}>
          <div>
            <h1 style={styles.title}>Commande #{commande.reference || commande.id}</h1>
            <p style={styles.date}>
              Passée le {new Date(commande.date_commande).toLocaleDateString('fr-FR', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
          <div style={styles.totalBadge}>
            <span style={styles.totalLabel}>Total TTC</span>
            <span style={styles.totalValue}>{commande.total_ttc || commande.total} €</span>
          </div>
        </div>

        {/* Timeline de statut */}
        {commande.statut === 'annulee' ? (
          <div style={styles.cancelledBanner}>✕ Cette commande a été annulée</div>
        ) : (
          <div style={styles.timeline}>
            {ETAPES.map((etape, idx) => {
              const done = idx <= etapeActuelleIndex;
              const isLast = idx === ETAPES.length - 1;
              return (
                <div key={etape.key} style={styles.timelineStep}>
                  <div style={styles.timelineStepCol}>
                    <div style={{ ...styles.timelineDot, ...(done ? styles.timelineDotDone : {}) }}>
                      {done ? '✓' : etape.icon}
                    </div>
                    {!isLast && (
                      <div style={{ ...styles.timelineLine, ...(idx < etapeActuelleIndex ? styles.timelineLineDone : {}) }} />
                    )}
                  </div>
                  <span style={{ ...styles.timelineLabel, ...(done ? styles.timelineLabelDone : {}) }}>
                    {etape.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card title="Produits commandés" variant="primary">
        {lignes.length === 0 ? (
          <p style={{ color: '#94A3B8', fontSize: '14px' }}>Aucun produit trouvé.</p>
        ) : (
          <>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Produit</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Qté</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Prix unitaire</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((item, i) => (
                  <tr key={i}>
                    <td style={styles.td}>{item.produit_nom || `Produit #${item.produit_id}`}</td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>{item.quantite}</td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>{item.prix_unitaire} €</td>
                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: 600 }}>
                      {(item.quantite * item.prix_unitaire).toFixed(2)} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={styles.summaryBox}>
              <div style={styles.summaryRow}>
                <span>Sous-total HT</span>
                <span>{(commande.montant_ht || totalHT).toFixed(2)} €</span>
              </div>
              <div style={styles.summaryRow}>
                <span>TVA</span>
                <span>{(commande.montant_tva || 0).toFixed(2)} €</span>
              </div>
              <div style={{ ...styles.summaryRow, ...styles.summaryTotal }}>
                <span>Total TTC</span>
                <span>{commande.total_ttc || commande.total} €</span>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

const styles = {
  container: { padding: '24px', maxWidth: '800px', margin: '0 auto' },
  headerBar: { display: 'flex', justifyContent: 'space-between', marginBottom: '16px' },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' },
  title: { fontSize: '20px', fontWeight: 700, color: '#0F172A', margin: 0 },
  date: { fontSize: '13px', color: '#64748B', marginTop: '4px' },
  totalBadge: { textAlign: 'right' },
  totalLabel: { display: 'block', fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' },
  totalValue: { fontSize: '22px', fontWeight: 700, color: '#0EA5E9' },
  cancelledBanner: {
    backgroundColor: '#FEF2F2', color: '#991B1B', padding: '12px 16px',
    borderRadius: '8px', fontWeight: 600, fontSize: '14px',
  },
  timeline: { display: 'flex', alignItems: 'flex-start' },
  timelineStep: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' },
  timelineStepCol: { display: 'flex', alignItems: 'center', width: '100%' },
  timelineDot: {
    width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#F1F5F9',
    color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '15px', fontWeight: 700, flexShrink: 0, margin: '0 auto',
    border: '2px solid #E2E8F0', transition: 'all 0.3s ease',
  },
  timelineDotDone: { backgroundColor: '#22C55E', color: '#FFFFFF', borderColor: '#22C55E' },
  timelineLine: { flex: 1, height: '3px', backgroundColor: '#E2E8F0', marginTop: '17px' },
  timelineLineDone: { backgroundColor: '#22C55E' },
  timelineLabel: { fontSize: '12px', color: '#94A3B8', marginTop: '8px', textAlign: 'center', fontWeight: 500 },
  timelineLabelDone: { color: '#0F172A', fontWeight: 600 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700,
    color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px',
    borderBottom: '2px solid #E2E8F0',
  },
  td: { padding: '12px', fontSize: '14px', color: '#0F172A', borderBottom: '1px solid #F1F5F9' },
  summaryBox: { marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E2E8F0', maxWidth: '280px', marginLeft: 'auto' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B', padding: '4px 0' },
  summaryTotal: { fontSize: '16px', fontWeight: 700, color: '#0F172A', borderTop: '1px solid #E2E8F0', paddingTop: '8px', marginTop: '4px' },
};