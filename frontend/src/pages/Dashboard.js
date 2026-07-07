import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';

export default function Dashboard() {
  const { user, logout, hasPermission, permissionsLoaded } = useAuth();
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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Redirections
  if (user?.is_external) {
    navigate('/client/dashboard');
    return null;
  }
  if (user?.is_super_admin) {
    navigate('/superadmin/dashboard');
    return null;
  }

  if (!permissionsLoaded || loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Chargement de votre espace...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* ============================================================
          EN-TÊTE
          ============================================================ */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Tableau de bord</h1>
          <p style={styles.subtitle}>
            Bonjour {user?.prenom} {user?.nom} · {user?.role || 'Utilisateur'}
            {user?.entreprise && ` · ${user.entreprise}`}
          </p>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.btnRefresh} onClick={loadStats}>
            ⟳ Actualiser
          </button>
          <button style={styles.btnLogout} onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
      </div>

      {/* ============================================================
          CARTES STATISTIQUES
          ============================================================ */}
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
              <span style={styles.statBadge}>{stats.commandesEnAttente} en attente</span>
            )}
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.devis}</div>
          <div style={styles.statLabel}>
            Devis
            {stats.devisEnAttente > 0 && (
              <span style={styles.statBadge}>{stats.devisEnAttente} en attente</span>
            )}
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.promotionsActives}</div>
          <div style={styles.statLabel}>Promotions actives</div>
        </div>
        <div style={{ ...styles.statCard, ...(stats.alertesStock > 0 ? styles.statCardAlert : {}) }}>
          <div style={{ ...styles.statNumber, color: stats.alertesStock > 0 ? '#dc2626' : '#0f172a' }}>
            {stats.alertesStock}
          </div>
          <div style={styles.statLabel}>
            Alertes stock
            {stats.alertesStock > 0 && (
              <span style={styles.statBadgeDanger}>rupture</span>
            )}
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.achatsEnCours}</div>
          <div style={styles.statLabel}>Achats en cours</div>
        </div>
      </div>

      {/* ============================================================
          SECTIONS
          ============================================================ */}
      <div style={styles.sectionsContainer}>
        {/* --- Commercial --- */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Commercial</h2>
            <span style={styles.sectionBadge}>{stats.commandes + stats.devis} opérations</span>
          </div>
          <div style={styles.menuGrid}>
            {hasPermission('Ventes', 'consultation') && (
              <div style={styles.menuCard} onClick={() => navigate('/clients')}>
                
                <div style={styles.menuContent}>
                  <div style={styles.menuTitle}>Clients</div>
                  <div style={styles.menuDesc}>{stats.clients} enregistrés</div>
                </div>
              </div>
            )}
            {hasPermission('Ventes', 'consultation') && (
              <div style={styles.menuCard} onClick={() => navigate('/devis')}>
                
                <div style={styles.menuContent}>
                  <div style={styles.menuTitle}>Devis</div>
                  <div style={styles.menuDesc}>{stats.devis} total · {stats.devisEnAttente} en attente</div>
                </div>
              </div>
            )}
            {hasPermission('Ventes', 'consultation') && (
              <div style={styles.menuCard} onClick={() => navigate('/commandes')}>
                
                <div style={styles.menuContent}>
                  <div style={styles.menuTitle}>Commandes</div>
                  <div style={styles.menuDesc}>{stats.commandes} total · {stats.commandesEnAttente} en attente</div>
                </div>
              </div>
            )}
            {hasPermission('Ventes', 'consultation') && (
              <div style={styles.menuCard} onClick={() => navigate('/promotions')}>
               
                <div style={styles.menuContent}>
                  <div style={styles.menuTitle}>Promotions</div>
                  <div style={styles.menuDesc}>{stats.promotionsActives} actives</div>
                </div>
              </div>
            )}
            {hasPermission('Achats', 'consultation') && (
              <div style={styles.menuCard} onClick={() => navigate('/fournisseurs')}>
                
                <div style={styles.menuContent}>
                  <div style={styles.menuTitle}>Fournisseurs</div>
                  <div style={styles.menuDesc}>{stats.fournisseurs} enregistrés</div>
                </div>
              </div>
            )}
            {hasPermission('Achats', 'consultation') && (
              <div style={styles.menuCard} onClick={() => navigate('/achats')}>
                
                <div style={styles.menuContent}>
                  <div style={styles.menuTitle}>Achats</div>
                  <div style={styles.menuDesc}>{stats.achatsEnCours} en cours</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- Stock --- */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Stock</h2>
            <span style={styles.sectionBadge}>{stats.produits} références</span>
          </div>
          <div style={styles.menuGrid}>
            {hasPermission('Stock', 'consultation') && (
              <div style={styles.menuCard} onClick={() => navigate('/produits')}>
                <div style={styles.menuIcon}>achat</div>
                <div style={styles.menuContent}>
                  <div style={styles.menuTitle}>Produits</div>
                  <div style={styles.menuDesc}>{stats.produits} références</div>
                </div>
              </div>
            )}
            {hasPermission('Stock', 'consultation') && (
              <div style={styles.menuCard} onClick={() => navigate('/mouvements-stock')}>
                <div style={styles.menuIcon}> refreshing</div>
                <div style={styles.menuContent}>
                  <div style={styles.menuTitle}>Mouvements</div>
                  <div style={styles.menuDesc}>Historique des stocks</div>
                </div>
              </div>
            )}
            {hasPermission('Stock', 'consultation') && (
              <div style={{ ...styles.menuCard, ...(stats.alertesStock > 0 ? styles.menuCardAlert : {}) }} onClick={() => navigate('/alertes-stock')}>
                <div style={styles.menuIcon}>⚠️</div>
                <div style={styles.menuContent}>
                  <div style={{ ...styles.menuTitle, color: stats.alertesStock > 0 ? '#dc2626' : '#0f172a' }}>
                    Alertes rupture
                  </div>
                  <div style={{ ...styles.menuDesc, color: stats.alertesStock > 0 ? '#dc2626' : '#94a3b8' }}>
                    {stats.alertesStock > 0 ? `${stats.alertesStock} produit(s) critique(s)` : 'Aucune alerte'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- Administration --- */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Administration</h2>
          </div>
          <div style={styles.menuGrid}>
            {hasPermission('Utilisateurs', 'consultation') && (
              <div style={styles.menuCard} onClick={() => navigate('/utilisateurs')}>
                <div style={styles.menuIcon}>🔐</div>
                <div style={styles.menuContent}>
                  <div style={styles.menuTitle}>Utilisateurs</div>
                  <div style={styles.menuDesc}>Gestion des accès</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================
const styles = {
  container: {
    padding: '32px',
    backgroundColor: '#f1f5f9',
    minHeight: '100vh',
    maxWidth: '1400px',
    margin: '0 auto'
  },

  // Loading
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#f1f5f9',
    gap: '16px'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    color: '#64748b',
    fontSize: '14px',
    margin: 0
  },

  // Header
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '28px',
    flexWrap: 'wrap',
    gap: '12px'
  },
  title: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: '4px 0 0'
  },
  headerActions: {
    display: 'flex',
    gap: '8px'
  },
  btnRefresh: {
    padding: '8px 16px',
    backgroundColor: 'white',
    color: '#334155',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.2s'
  },
  btnLogout: {
    padding: '8px 18px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.2s'
  },

  // Statistiques
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '12px',
    marginBottom: '32px'
  },
  statCard: {
    backgroundColor: 'white',
    padding: '18px 20px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid #f1f5f9'
  },
  statCardAlert: {
    border: '1px solid #fecaca',
    backgroundColor: '#fef2f2'
  },
  statNumber: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#0f172a'
  },
  statLabel: {
    fontSize: '13px',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap'
  },
  statBadge: {
    fontSize: '10px',
    fontWeight: '600',
    padding: '2px 10px',
    borderRadius: '12px',
    backgroundColor: '#fef3c7',
    color: '#92400e'
  },
  statBadgeDanger: {
    fontSize: '10px',
    fontWeight: '600',
    padding: '2px 10px',
    borderRadius: '12px',
    backgroundColor: '#fee2e2',
    color: '#991b1b'
  },

  // Sections
  sectionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '28px'
  },
  section: {
    backgroundColor: 'white',
    borderRadius: '14px',
    padding: '24px 28px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid #f1f5f9'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '18px'
  },
  sectionTitle: {
    fontSize: '17px',
    fontWeight: '600',
    color: '#0f172a',
    margin: 0
  },
  sectionBadge: {
    fontSize: '12px',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    padding: '4px 14px',
    borderRadius: '20px'
  },

  // Menu Grid
  menuGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '12px'
  },

  // Menu Card
  menuCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px 18px',
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: '1px solid transparent'
  },
  menuCardAlert: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca'
  },
  menuIcon: {
    fontSize: '24px',
    flexShrink: 0
  },
  menuContent: {
    flex: 1
  },
  menuTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#0f172a'
  },
  menuDesc: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '2px'
  }
};

// Injection des keyframes pour l'animation du spinner
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .menu-card:hover {
    background-color: #f1f5f9;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  }
  
  .btn-refresh:hover {
    background-color: #f1f5f9;
  }
  
  .btn-logout:hover {
    background-color: #dc2626;
  }
`;
document.head.appendChild(styleSheet);