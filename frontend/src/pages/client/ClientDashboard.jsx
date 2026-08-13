import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

const STATUT_INFO = {
  livree: { label: 'Livrée', bg: '#D1FAE5', color: '#065F46', icon: '✅' },
  confirmee: { label: 'Confirmée', bg: '#DBEAFE', color: '#1E40AF', icon: '📦' },
  en_attente: { label: 'En attente', bg: '#FEF3C7', color: '#92400E', icon: '⏳' },
  annulee: { label: 'Annulée', bg: '#FEE2E2', color: '#991B1B', icon: '✕' },
};

export default function ClientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    commandes: 0,
    enCours: 0,
    factures: 0,
    impayees: 0,
    produits: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError('');

      const [commandesRes, facturesRes, produitsRes] = await Promise.all([
        API.get('/client/commandes'),
        API.get('/client/factures'),
        API.get('/client/produits'),
      ]);

      const commandes = commandesRes.data.commandes || [];
      const factures = facturesRes.data.factures || [];
      const produits = produitsRes.data.produits || [];

      setStats({
        commandes: commandes.length,
        enCours: commandes.filter((c) => c.statut === 'en_attente' || c.statut === 'confirmee').length,
        factures: factures.length,
        impayees: factures.filter((f) => f.statut === 'emise' || f.statut === 'brouillon').length,
        produits: produits.length,
      });

      setRecentOrders(
        [...commandes]
          .sort((a, b) => new Date(b.date_commande) - new Date(a.date_commande))
          .slice(0, 5)
      );
    } catch (err) {
      console.error('Erreur chargement dashboard client:', err);
      setError('Impossible de charger votre tableau de bord pour le moment.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" text="Chargement de votre espace..." />;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Bonjour {user?.prenom} {user?.nom}</h1>
          <p style={styles.subtitle}>{user?.entreprise_nom || 'Espace client'}</p>
        </div>
        <div style={styles.headerActions}>
          <Button variant="secondary" onClick={() => loadData(true)} loading={refreshing}>
            ⟳ Actualiser
          </Button>
          <Button variant="primary" onClick={() => navigate('/client/produits')}>
            + Nouvelle commande
          </Button>
        </div>
      </div>

      {error && (
        <div style={styles.errorContainer}>
          <span style={styles.errorText}>{error}</span>
          <button style={styles.errorRetry} onClick={() => loadData()}>Réessayer</button>
        </div>
      )}

      <div style={styles.statsGrid}>
        {[
          { value: stats.commandes, label: 'Commandes', color: '#0F172A', path: '/client/commandes' },
          { value: stats.enCours, label: 'En cours', color: '#284566',  path: '/client/commandes' },
          { value: stats.factures, label: 'Factures', color: '#3B82F6',  path: '/client/factures' },
          { value: stats.impayees, label: 'Impayées', color: '#0827a4', path: '/client/factures' },
          { value: stats.produits, label: 'Produits', color: '#3397b3', path: '/client/produits' },
        ].map((stat, i) => (
          <button
            key={i}
            style={{ ...styles.statCard, borderBottom: `3px solid ${stat.color}` }}
            onClick={() => navigate(stat.path)}
          >
            <div style={{ fontSize: '28px', marginBottom: '4px' }}>{stat.icon}</div>
            <div style={styles.statNumber}>{stat.value}</div>
            <div style={styles.statLabel}>{stat.label}</div>
          </button>
        ))}
      </div>

      <Card title="⚡ Actions rapides" variant="primary">
        <div style={styles.quickActions}>
          {[
            { label: 'Catalogue', path: '/client/produits' },
            { label: 'Mes commandes', path: '/client/commandes' },
            { label: 'Mes factures', path: '/client/factures' },
            { label: 'Mon profil', path: '/client/profil' },
          ].map((action, i) => (
            <div key={i} onClick={() => navigate(action.path)} style={styles.actionCard}>
              <span style={styles.actionIcon}>{action.icon}</span>
              <span style={styles.actionLabel}>{action.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card
        title=" Dernières commandes"
        variant="primary"
        actions={
          recentOrders.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => navigate('/client/commandes')}>
              Voir tout
            </Button>
          )
        }
      >
        {recentOrders.length === 0 ? (
          <EmptyState
            icon="📭"
            title="Aucune commande pour le moment"
            description="Passez votre première commande depuis notre catalogue."
            action={
              <Button variant="primary" onClick={() => navigate('/client/produits')}>
                Voir le catalogue
              </Button>
            }
          />
        ) : (
          <div style={styles.orderList}>
            {recentOrders.map((order) => {
              const info = STATUT_INFO[order.statut] || STATUT_INFO.en_attente;
              return (
                <div
                  key={order.id}
                  style={styles.orderItem}
                  onClick={() => navigate(`/client/commande/${order.id}`)}
                >
                  <span style={styles.orderIcon}>{info.icon}</span>
                  <div style={styles.orderInfo}>
                    <div style={styles.orderRef}>Commande #{order.reference || order.id}</div>
                    <div style={styles.orderDate}>
                      {new Date(order.date_commande).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: 'long', year: 'numeric',
                      })}
                    </div>
                  </div>
                  <div style={styles.orderRight}>
                    <span style={{ ...styles.statusBadge, backgroundColor: info.bg, color: info.color }}>
                      {info.label}
                    </span>
                    <span style={styles.orderTotal}>{order.total_ttc || order.total} €</span>
                    <span style={styles.chevron}>›</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
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
    marginBottom: '28px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: '28px',
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
    justifyContent: 'space-between',
    gap: '12px',
    backgroundColor: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '20px',
  },
  errorText: {
    color: '#991B1B',
    fontSize: '13px',
    fontWeight: 500,
  },
  errorRetry: {
    border: 'none',
    background: 'transparent',
    color: '#991B1B',
    fontWeight: 600,
    fontSize: '13px',
    textDecoration: 'underline',
    cursor: 'pointer',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid #E8EDF2',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
  },
  statNumber: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#0F172A',
  },
  statLabel: {
    fontSize: '13px',
    color: '#64748B',
    marginTop: '2px',
  },
  quickActions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '12px',
  },
  actionCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    backgroundColor: '#F8FAFC',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '1px solid #E8EDF2',
  },
  actionIcon: {
    fontSize: '32px',
    marginBottom: '8px',
  },
  actionLabel: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#334155',
  },
  orderList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  orderItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px 16px',
    backgroundColor: '#F8FAFC',
    borderRadius: '10px',
    border: '1px solid #E8EDF2',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  orderIcon: {
    fontSize: '22px',
    width: '32px',
    textAlign: 'center',
  },
  orderInfo: {
    flex: 1,
  },
  orderRef: {
    fontWeight: 600,
    color: '#0F172A',
    fontSize: '14px',
  },
  orderDate: {
    fontSize: '12px',
    color: '#94A3B8',
    marginTop: '2px',
  },
  orderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
  },
  orderTotal: {
    fontWeight: 700,
    color: '#0F172A',
    fontSize: '14px',
    minWidth: '60px',
    textAlign: 'right',
  },
  chevron: {
    fontSize: '18px',
    color: '#CBD5E1',
  },
};