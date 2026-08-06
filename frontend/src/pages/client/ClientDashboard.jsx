import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

export default function ClientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    commandes: 0,
    enCours: 0,
    factures: 0,
    impayees: 0,
    produits: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [commandesRes, facturesRes, produitsRes] = await Promise.all([
        API.get('/client/commandes'),
        API.get('/client/factures'),
        API.get('/client/produits')
      ]);

      const commandes = commandesRes.data.commandes || [];
      const factures = facturesRes.data.factures || [];
      const produits = produitsRes.data.produits || [];

      setStats({
        commandes: commandes.length,
        enCours: commandes.filter(c => c.statut === 'en_attente' || c.statut === 'confirmee').length,
        factures: factures.length,
        impayees: factures.filter(f => f.statut === 'emise' || f.statut === 'brouillon').length,
        produits: produits.length
      });

      setRecentOrders(commandes.slice(0, 5));
    } catch (err) {
      console.error('Erreur chargement dashboard client:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" text="Chargement de votre espace..." />;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>👋 Bonjour {user?.prenom} {user?.nom}</h1>
          <p style={styles.subtitle}>
            {user?.entreprise_nom || 'Espace client'}
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate('/client/commandes')}>
          Nouvelle commande
        </Button>
      </div>

      <div style={styles.statsGrid}>
        {[
          { value: stats.commandes, label: 'Commandes', color: '#0F172A', icon: '📋' },
          { value: stats.enCours, label: 'En cours', color: '#F59E0B', icon: '🔄' },
          { value: stats.factures, label: 'Factures', color: '#3B82F6', icon: '💰' },
          { value: stats.impayees, label: 'Impayées', color: '#EF4444', icon: '⚠️' },
          { value: stats.produits, label: 'Produits', color: '#22C55E', icon: '📦' }
        ].map((stat, i) => (
          <div key={i} style={{...styles.statCard, borderBottom: `3px solid ${stat.color}`}}>
            <div style={{ fontSize: '28px', marginBottom: '4px' }}>{stat.icon}</div>
            <div style={styles.statNumber}>{stat.value}</div>
            <div style={styles.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      <Card title="⚡ Actions rapides" variant="primary">
        <div style={styles.quickActions}>
          {[
            { icon: '📦', label: 'Catalogue', path: '/client/produits' },
            { icon: '📋', label: 'Mes commandes', path: '/client/commandes' },
            { icon: '💰', label: 'Mes factures', path: '/client/factures' },
            { icon: '👤', label: 'Mon profil', path: '/client/profil' }
          ].map((action, i) => (
            <div key={i} onClick={() => navigate(action.path)} style={styles.actionCard}>
              <span style={styles.actionIcon}>{action.icon}</span>
              <span style={styles.actionLabel}>{action.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {recentOrders.length > 0 && (
        <Card title=" Dernières commandes" variant="primary">
          {recentOrders.map(order => (
            <div key={order.id} style={styles.orderItem}>
              <div>
                <div style={styles.orderRef}>Commande #{order.reference || order.id}</div>
                <div style={styles.orderDate}>{new Date(order.date_commande).toLocaleDateString('fr-FR')}</div>
              </div>
              <div style={styles.orderStatus}>
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: order.statut === 'livree' ? '#D1FAE5' : '#FEF3C7',
                  color: order.statut === 'livree' ? '#065F46' : '#92400E'
                }}>
                  {order.statut === 'livree' ? ' Livrée' : ' En cours'}
                </span>
                <span style={styles.orderTotal}>{order.total} €</span>
              </div>
            </div>
          ))}
          <Button variant="secondary" onClick={() => navigate('/client/commandes')} style={{ marginTop: '12px' }}>
            Voir toutes les commandes →
          </Button>
        </Card>
      )}
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
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    }
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
  orderItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#F8FAFC',
    borderRadius: '8px',
    border: '1px solid #E8EDF2',
    marginBottom: '8px',
  },
  orderRef: {
    fontWeight: 600,
    color: '#0F172A',
  },
  orderDate: {
    fontSize: '12px',
    color: '#94A3B8',
  },
  orderStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 500,
  },
  orderTotal: {
    fontWeight: 600,
    color: '#0F172A',
  },
};