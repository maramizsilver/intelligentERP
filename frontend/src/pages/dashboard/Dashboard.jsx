import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function Dashboard() {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    clients: 0,
    fournisseurs: 0,
    produits: 0,
    commandes: 0,
    commandesEnAttente: 0,
    devis: 0,
    devisEnAttente: 0,
    promotionsActives: 0,
    alertesStock: 0,
    achatsEnCours: 0
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [
        clientsRes,
        fournisseursRes,
        produitsRes,
        commandesRes,
        devisRes,
        promotionsRes,
        alertesRes,
        achatsRes
      ] = await Promise.all([
        API.get('/clients').catch(() => ({ data: { clients: [] } })),
        API.get('/fournisseurs').catch(() => ({ data: { fournisseurs: [] } })),
        API.get('/produits').catch(() => ({ data: { produits: [] } })),
        API.get('/commandes').catch(() => ({ data: { commandes: [] } })),
        API.get('/devis').catch(() => ({ data: { devis: [] } })),
        API.get('/promotions').catch(() => ({ data: { promotions: [] } })),
        API.get('/mouvements-stock/alertes/rupture').catch(() => ({ data: { alertes: [] } })),
        API.get('/achats').catch(() => ({ data: { achats: [] } }))
      ]);

      const commandes = commandesRes.data.commandes || [];
      const devisList = devisRes.data.devis || [];
      const promotions = promotionsRes.data.promotions || [];
      const achats = achatsRes.data.achats || [];

      setStats({
        clients: clientsRes.data.clients?.length || 0,
        fournisseurs: fournisseursRes.data.fournisseurs?.length || 0,
        produits: produitsRes.data.produits?.length || 0,
        commandes: commandes.length,
        commandesEnAttente: commandes.filter(c => c.statut === 'en_attente').length,
        devis: devisList.length,
        devisEnAttente: devisList.filter(d => d.statut === 'envoye' || d.statut === 'brouillon').length,
        promotionsActives: promotions.filter(p => p.actif && new Date(p.date_fin) > new Date()).length,
        alertesStock: alertesRes.data.alertes?.length || 0,
        achatsEnCours: achats.filter(a => a.statut === 'brouillon' || a.statut === 'envoye' || a.statut === 'recu_partiel').length
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // EXPORT DES DONNEES
  // ============================================================
  const exporterDonnees = async () => {
    setExporting(true);
    setError('');
    setSuccess('');
    try {
      const res = await API.get('/export/mes-donnees', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `export-donnees-erp-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccess('Donnees exportees avec succes');
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError('Erreur lors de l\'export');
      setTimeout(() => setError(''), 5000);
    } finally {
      setExporting(false);
    }
  };

  if (user?.is_external) {
    navigate('/client/dashboard');
    return null;
  }
  if (user?.is_super_admin) {
    navigate('/superadmin/dashboard');
    return null;
  }

  if (loading) {
    return <LoadingSpinner size="lg" text="Chargement de votre espace..." />;
  }

  const menuItems = [];

  if (hasPermission('Ventes', 'consultation')) {
    menuItems.push(
      { path: '/clients', label: 'Clients', desc: `${stats.clients} enregistres` },
      { path: '/devis', label: 'Devis', desc: `${stats.devis} total · ${stats.devisEnAttente} en attente` },
      { path: '/commandes', label: 'Commandes', desc: `${stats.commandes} total · ${stats.commandesEnAttente} en attente` },
      { path: '/promotions', label: 'Promotions', desc: `${stats.promotionsActives} actives` }
    );
  }

  if (hasPermission('Achats', 'consultation')) {
    menuItems.push(
      { path: '/fournisseurs', label: 'Fournisseurs', desc: `${stats.fournisseurs} enregistres` },
      { path: '/achats', label: 'Achats', desc: `${stats.achatsEnCours} en cours` }
    );
  }

  if (hasPermission('Stock', 'consultation')) {
    menuItems.push(
      { path: '/produits', label: 'Produits', desc: `${stats.produits} references` },
      { path: '/mouvements-stock', label: 'Mouvements', desc: 'Historique des stocks' },
      { 
        path: '/alertes-stock', 
        label: 'Alertes', 
        desc: stats.alertesStock > 0 ? `${stats.alertesStock} produit(s) critique(s)` : 'Aucune alerte',
        danger: stats.alertesStock > 0
      },
      { path: '/entrepots', label: 'Entrepots', desc: 'Gestion des entrepots' },
      { path: '/calculateur', label: 'Calculateur', desc: 'Moteur de calcul' },
      { path: '/inventaires', label: 'Inventaires', desc: 'Gestion des inventaires' }
    );
  }

  if (hasPermission('Utilisateurs', 'consultation')) {
    menuItems.push(
      { path: '/utilisateurs', label: 'Utilisateurs', desc: 'Gestion des acces' }
    );
  }
  if (hasPermission('Documents', 'consultation')) {
    menuItems.push(
      { path: '/documents', label: 'Documents', desc: 'Gestion documentaire' },
      { path: '/archives', label: 'Archives', desc: 'Archivage numerique' }
    );
  }

  return (
    <div>
      {error && (
        <div style={styles.errorContainer}>
          <span style={styles.errorIcon}>X</span>
          <span style={styles.errorText}>{error}</span>
        </div>
      )}
      {success && (
        <div style={styles.successContainer}>
          <span style={styles.successIcon}>✓</span>
          <span style={styles.successText}>{success}</span>
        </div>
      )}

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Tableau de bord</h1>
          <p style={styles.subtitle}>
            Bonjour {user?.prenom} {user?.nom} · {user?.role || 'Utilisateur'}
            {user?.entreprise && ` · ${user.entreprise}`}
          </p>
        </div>
        <div style={styles.headerActions}>
          <Button 
            variant="outline" 
            onClick={exporterDonnees} 
            loading={exporting}
            size="sm"
          >
            Exporter mes donnees
          </Button>
          <Button variant="secondary" onClick={loadStats} size="sm">
            Actualiser
          </Button>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.clients}</div>
          <div style={styles.statLabel}>Clients</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.fournisseurs}</div>
          <div style={styles.statLabel}>Fournisseurs</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.produits}</div>
          <div style={styles.statLabel}>Produits</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.commandes}</div>
          <div style={styles.statLabel}>
            Commandes
            {stats.commandesEnAttente > 0 && (
              <Badge variant="warning" style={{ marginLeft: '6px' }}>
                {stats.commandesEnAttente} en attente
              </Badge>
            )}
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.devis}</div>
          <div style={styles.statLabel}>
            Devis
            {stats.devisEnAttente > 0 && (
              <Badge variant="warning" style={{ marginLeft: '6px' }}>
                {stats.devisEnAttente} en attente
              </Badge>
            )}
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.promotionsActives}</div>
          <div style={styles.statLabel}>Promotions actives</div>
        </div>
        <div style={{ ...styles.statCard, ...(stats.alertesStock > 0 ? styles.statCardDanger : {}) }}>
          <div style={{ ...styles.statNumber, color: stats.alertesStock > 0 ? '#DC2626' : '#0F172A' }}>
            {stats.alertesStock}
          </div>
          <div style={styles.statLabel}>
            Alertes stock
            {stats.alertesStock > 0 && (
              <Badge variant="danger" style={{ marginLeft: '6px' }}>rupture</Badge>
            )}
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.achatsEnCours}</div>
          <div style={styles.statLabel}>Achats en cours</div>
        </div>
      </div>

      <Card title="Acces rapide" variant="primary">
        <div style={styles.menuGrid}>
          {menuItems.map((item, idx) => (
            <div
              key={idx}
              style={{
                ...styles.menuCard,
                ...(item.danger ? styles.menuCardDanger : {}),
              }}
              onClick={() => navigate(item.path)}
            >
              <div style={styles.menuContent}>
                <div style={styles.menuTitle}>{item.label}</div>
                <div style={styles.menuDesc}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================
const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
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
    margin: '4px 0 0',
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
  errorIcon: {
    color: '#991B1B',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#991B1B',
    fontSize: '13px',
    fontWeight: 500,
  },
  successContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#F0FDF4',
    border: '1px solid #86EFAC',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '16px',
  },
  successIcon: {
    color: '#065F46',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  successText: {
    color: '#065F46',
    fontSize: '13px',
    fontWeight: 500,
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    marginBottom: '28px',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    padding: '20px 24px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid #E8EDF2',
  },
  statCardDanger: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  statNumber: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#0F172A',
  },
  statLabel: {
    fontSize: '13px',
    color: '#64748B',
    marginTop: '4px',
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '4px',
  },
  
  menuGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '12px',
  },
  menuCard: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 20px',
    backgroundColor: '#F8FAFC',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '1px solid #E8EDF2',
  },
  menuCardDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#0F172A',
  },
  menuDesc: {
    fontSize: '12px',
    color: '#94A3B8',
    marginTop: '2px',
  },
};