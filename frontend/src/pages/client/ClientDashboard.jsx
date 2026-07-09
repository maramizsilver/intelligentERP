// src/pages/client/ClientDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';

import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

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
    return <LoadingSpinner size="lg" text="Chargement de votre espace..." />;
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Bonjour, {user?.prenom || 'Client'}</h1>
          <p style={styles.subtitle}>
            Bienvenue dans votre espace client
            {user?.entreprise ? ` — ${user.entreprise}` : ''}
          </p>
        </div>
        <Badge variant="success">Client</Badge>
      </div>

      <div style={styles.statsGrid}>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #0EA5E9' }}>
          <span style={styles.statNumber}>{stats.total}</span>
          <span style={styles.statLabel}> Total commandes</span>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #F59E0B' }}>
          <span style={styles.statNumber}>{stats.en_attente}</span>
          <span style={styles.statLabel}>En attente</span>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #22C55E' }}>
          <span style={styles.statNumber}>{stats.livree}</span>
          <span style={styles.statLabel}>Livrées</span>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #EF4444' }}>
          <span style={styles.statNumber}>{stats.annulee}</span>
          <span style={styles.statLabel}>Annulées</span>
        </div>
      </div>

      <div style={styles.actionsGrid}>
        <div style={styles.actionCard} onClick={() => navigate('/client/commandes')}>
          
          <h3>Mes commandes</h3>
          <p>Voir toutes vos commandes</p>
        </div>
        <div style={styles.actionCard} onClick={() => navigate('/client/produits')}>
          
          <h3>Produits</h3>
          <p>Découvrir le catalogue</p>
        </div>
        <div style={styles.actionCard} onClick={() => navigate('/client/factures')}>
        
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
  },
  statNumber: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#0F172A',
  },
  statLabel: {
    color: '#64748B',
    fontSize: '14px',
    marginTop: '4px',
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    padding: '24px',
    borderRadius: '12px',
    textAlign: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
    },
  },
  actionIcon: {
    fontSize: '36px',
    display: 'block',
    marginBottom: '8px',
  },
};