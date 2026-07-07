import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

export default function ClientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, en_attente: 0, livree: 0, annulee: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await API.get('/commandes');
      const commandes = res.data.commandes || [];
      setStats({
        total: commandes.length,
        en_attente: commandes.filter(c => c.statut === 'en_attente').length,
        livree: commandes.filter(c => c.statut === 'livree').length,
        annulee: commandes.filter(c => c.statut === 'annulee').length
      });
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Chargement de votre espace...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>👋 Bonjour, {user?.prenom || 'Client'}</h1>
          <p style={styles.subtitle}>Bienvenue dans votre espace client{user?.entreprise ? ` — ${user.entreprise}` : ''}</p>
        </div>
        <span style={styles.badge}>🟢 Client</span>
      </div>

      <div style={styles.statsGrid}>
        <div style={{...styles.statCard, borderLeft: '4px solid #0ea5e9'}}>
          <span style={styles.statNumber}>{stats.total}</span>
          <span style={styles.statLabel}>📦 Total</span>
        </div>
        <div style={{...styles.statCard, borderLeft: '4px solid #f59e0b'}}>
          <span style={styles.statNumber}>{stats.en_attente}</span>
          <span style={styles.statLabel}>⏳ En attente</span>
        </div>
        <div style={{...styles.statCard, borderLeft: '4px solid #22c55e'}}>
          <span style={styles.statNumber}>{stats.livree}</span>
          <span style={styles.statLabel}>✅ Livrées</span>
        </div>
        <div style={{...styles.statCard, borderLeft: '4px solid #ef4444'}}>
          <span style={styles.statNumber}>{stats.annulee}</span>
          <span style={styles.statLabel}>❌ Annulées</span>
        </div>
      </div>

      <div style={styles.actionsGrid}>
        <div style={styles.actionCard} onClick={() => navigate('/client/commandes')}>
          <span style={styles.actionIcon}>🛒</span>
          <h3>Mes commandes</h3>
          <p>Voir toutes vos commandes</p>
        </div>
        <div style={styles.actionCard} onClick={() => navigate('/client/produits')}>
          <span style={styles.actionIcon}>📦</span>
          <h3>Produits</h3>
          <p>Découvrir le catalogue</p>
        </div>
        <div style={styles.actionCard} onClick={() => navigate('/client/factures')}>
          <span style={styles.actionIcon}>🧾</span>
          <h3>Factures</h3>
          <p>Voir vos factures</p>
        </div>
        <div style={styles.actionCard} onClick={() => navigate('/client/profil')}>
          <span style={styles.actionIcon}>👤</span>
          <h3>Mon profil</h3>
          <p>Modifier vos informations</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' },
  loading: { textAlign: 'center', padding: '40px', fontSize: '18px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  title: { color: '#0f172a', margin: 0, fontSize: '24px' },
  subtitle: { color: '#64748b', marginTop: '4px', fontSize: '14px' },
  badge: { backgroundColor: '#d1fae5', color: '#065f46', padding: '6px 18px', borderRadius: '20px', fontSize: '14px', fontWeight: '600' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' },
  statCard: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column' },
  statNumber: { fontSize: '28px', fontWeight: 'bold', color: '#0f172a' },
  statLabel: { color: '#64748b', fontSize: '14px', marginTop: '4px' },
  actionsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' },
  actionCard: { backgroundColor: 'white', padding: '24px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', cursor: 'pointer' },
  actionIcon: { fontSize: '36px', display: 'block', marginBottom: '8px' }
};
