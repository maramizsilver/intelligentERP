import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, borderRadius, transitions } from '../../styles/theme';

export default function Sidebar() {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setIsMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (user?.is_external) return null;

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const getMenuItems = () => {
    if (user?.is_super_admin) {
      return [
        {
          section: 'Administration',
          items: [
            {
              path: '/superadmin/dashboard',
              label: 'Entreprises',
              icon: '🏢',
              description: 'Gerer les entreprises'
            },
            {
              path: '/superadmin/taux-reference',
              label: 'Taux & Periodes',
              icon: '📊',
              description: 'Gerer les taux de reference'
            },
            {
              path: '/superadmin/sessions',
              label: 'Sessions',
              icon: '🔐',
              description: 'Supervision des sessions'
            },
            {
              path: '/notifications',
              label: 'Notifications',
              icon: '🔔',
              description: 'Voir les notifications'
            }
          ]
        }
      ];
    }

    const sections = [];

    sections.push({
      section: 'Navigation',
      items: [
        {
          path: '/dashboard',
          label: 'Tableau de bord',
          icon: '📊',
          description: 'Vue d\'ensemble'
        },
      ]
    });

    if (hasPermission('Ventes', 'consultation')) {
      sections.push({
        section: 'Ventes',
        items: [
          { path: '/clients', label: 'Clients', icon: '👥', description: 'Gestion des clients' },
          { path: '/devis', label: 'Devis', icon: '📄', description: 'Gestion des devis' },
          { path: '/commandes', label: 'Commandes', icon: '🛒', description: 'Gestion des commandes' },
          { path: '/promotions', label: 'Promotions', icon: '🏷️', description: 'Gestion des promotions' },
          {
            path: '/paiement/client',
            label: 'Paiement en ligne',
            icon: '💳',
            description: 'Payer vos commandes'
          }
        ]
      });
    }

    if (hasPermission('Achats', 'consultation')) {
      sections.push({
        section: 'Achats',
        items: [
          { path: '/fournisseurs', label: 'Fournisseurs', icon: '🏭', description: 'Gestion des fournisseurs' },
          { path: '/achats', label: 'Achats', icon: '📦', description: 'Gestion des achats' },
          {
            path: '/paiement/fournisseur',
            label: 'Paiement fournisseur',
            icon: '💳',
            description: 'Payer les factures fournisseurs'
          }
        ]
      });
    }

    if (hasPermission('Finance', 'consultation')) {
      sections.push({
        section: 'Finance',
        items: [
          {
            path: '/finance',
            label: 'Finance',
            icon: '💰',
            description: 'Gestion financiere'
          }
        ]
      });
    }

    if (hasPermission('Stock', 'consultation')) {
      const stockItems = [
        { path: '/produits', label: 'Produits', icon: '📦', description: 'Catalogue produits' },
        { path: '/mouvements-stock', label: 'Mouvements', icon: '🔄', description: 'Historique des mouvements' },
        { path: '/alertes-stock', label: 'Alertes', icon: '⚠️', description: 'Alertes de rupture' },
        { path: '/entrepots', label: 'Entrepots', icon: '🏚️', description: 'Gestion des entrepots' },
        { path: '/calculateur', label: 'Calculateur', icon: '🧮', description: 'Moteur de calcul' }
      ];
      if (hasPermission('Stock', 'modification')) {
        stockItems.push({ path: '/transfert-stock', label: 'Transfert', icon: '🔄', description: 'Transfert entre entrepots' });
      }
      stockItems.push({ path: '/inventaires', label: 'Inventaires', icon: '📋', description: 'Gestion des inventaires' });
      sections.push({ section: 'Stock', items: stockItems });
    }

    const adminItems = [];
    if (hasPermission('Utilisateurs', 'consultation')) {
      adminItems.push({ path: '/utilisateurs', label: 'Utilisateurs', icon: '👤', description: 'Gestion des acces' });
    }
    if (hasPermission('Documents', 'consultation')) {
      adminItems.push({ path: '/documents', label: 'Documents', icon: '📁', description: 'Gestion documentaire' });
      adminItems.push({ path: '/archives', label: 'Archives', icon: '🗄️', description: 'Archivage numerique' });
    }

    adminItems.push({
      path: '/securite/mfa',
      label: 'Securite MFA',
      icon: '🔐',
      description: 'Authentification a deux facteurs'
    });

    adminItems.push({
      path: '/notifications',
      label: 'Notifications',
      icon: '🔔',
      description: 'Voir les notifications'
    });

    if (adminItems.length > 0) {
      sections.push({ section: 'Administration', items: adminItems });
    }

    return sections;
  };

  const menuItems = getMenuItems();

  return (
    <>
      {isMobile && isMobileOpen && (
        <div style={styles.overlay} onClick={() => setIsMobileOpen(false)} />
      )}

      <aside
        style={{
          ...styles.sidebar,
          width: isMobile ? '280px' : collapsed ? '68px' : '240px',
          transform: isMobile ? (isMobileOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
        }}
      >
        <div style={styles.logoContainer}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>🏢</span>
            {(!collapsed || isMobile) && <span style={styles.logoText}>ERP</span>}
          </div>
          {!isMobile && (
            <button style={styles.toggleBtn} onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? '→' : '←'}
            </button>
          )}
          {isMobile && (
            <button style={styles.toggleBtn} onClick={() => setIsMobileOpen(false)}>
              ✕
            </button>
          )}
        </div>

        <nav style={styles.nav}>
          {menuItems.map((section, idx) => (
            <div key={idx} style={styles.section}>
              {(!collapsed || isMobile) && (
                <div style={styles.sectionTitle}>{section.section}</div>
              )}
              {section.items.map((item) => (
                <div
                  key={item.path}
                  style={{
                    ...styles.menuItem,
                    ...(isActive(item.path) ? styles.menuItemActive : {}),
                  }}
                  onClick={() => {
                    navigate(item.path);
                    if (isMobile) setIsMobileOpen(false);
                  }}
                >
                  <span style={styles.menuIcon}>{item.icon}</span>
                  {(!collapsed || isMobile) && (
                    <div style={styles.menuContent}>
                      <span style={styles.menuLabel}>{item.label}</span>
                      {!collapsed && !isMobile && (
                        <span style={styles.menuDescription}>{item.description}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </nav>

        {(!collapsed || isMobile) && user && (
          <div style={styles.footer}>
            <div style={styles.userInfo}>
              <div style={styles.userAvatar}>
                {user.prenom?.[0]}{user.nom?.[0]}
              </div>
              <div style={styles.userDetails}>
                <div style={styles.userName}>{user.prenom} {user.nom}</div>
                <div style={styles.userRole}>{user.role || 'Utilisateur'}</div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {isMobile && !isMobileOpen && (
        <button style={styles.hamburgerBtn} onClick={() => setIsMobileOpen(true)}>
          ☰
        </button>
      )}
    </>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(4px)',
    zIndex: 998,
  },
  sidebar: {
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    backgroundColor: '#0F172A',
    color: colors.white,
    display: 'flex',
    flexDirection: 'column',
    transition: `width ${transitions.normal}, transform ${transitions.normal}`,
    zIndex: 999,
    overflow: 'hidden',
    boxShadow: '2px 0 12px rgba(0,0,0,0.15)',
  },
  logoContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    minHeight: '64px',
    flexShrink: 0,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoIcon: {
    fontSize: '24px',
  },
  logoText: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#0EA5E9',
    letterSpacing: '0.5px',
  },
  toggleBtn: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: borderRadius.md,
    color: '#94A3B8',
    cursor: 'pointer',
    padding: '4px 8px',
    fontSize: '12px',
    transition: `all ${transitions.fast}`,
    ':hover': {
      backgroundColor: 'rgba(255,255,255,0.1)',
      color: colors.white,
    },
  },
  nav: {
    flex: 1,
    overflowY: 'auto',
    padding: spacing.sm,
  },
  section: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    padding: `${spacing.xs} ${spacing.sm}`,
    fontSize: '10px',
    fontWeight: 600,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: '1px',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.sm} ${spacing.sm}`,
    cursor: 'pointer',
    transition: `all ${transitions.fast}`,
    borderRadius: borderRadius.md,
    marginBottom: '2px',
    color: 'rgba(255,255,255,0.6)',
    ':hover': {
      backgroundColor: 'rgba(255,255,255,0.06)',
      color: colors.white,
    },
  },
  menuItemActive: {
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    color: '#0EA5E9',
    ':hover': {
      backgroundColor: 'rgba(14, 165, 233, 0.2)',
    },
  },
  menuIcon: {
    fontSize: '18px',
    width: '28px',
    textAlign: 'center',
    flexShrink: 0,
  },
  menuContent: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  menuLabel: {
    fontSize: '13px',
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
  menuDescription: {
    fontSize: '10px',
    color: 'rgba(255,255,255,0.3)',
    whiteSpace: 'nowrap',
    marginTop: '2px',
  },
  footer: {
    borderTop: '1px solid rgba(255,255,255,0.06)',
    padding: spacing.md,
    flexShrink: 0,
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  },
  userAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#0EA5E9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 600,
    color: colors.white,
    flexShrink: 0,
  },
  userDetails: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: '13px',
    fontWeight: 500,
    color: colors.white,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userRole: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.4)',
  },
  hamburgerBtn: {
    position: 'fixed',
    top: '12px',
    left: '12px',
    zIndex: 100,
    backgroundColor: '#0F172A',
    border: 'none',
    borderRadius: borderRadius.md,
    color: colors.white,
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
};