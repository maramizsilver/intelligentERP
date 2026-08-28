// frontend/src/components/layout/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { colors, spacing, borderRadius, transitions } from '../../styles/theme';

export default function Sidebar() {
  const { user, hasPermission } = useAuth();
  const { t, dir } = useLanguage();
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
          section: t('administration') || 'Administration',
          items: [
            { path: '/superadmin/dashboard', label: t('dashboard'), icon: '🏢' },
            { path: '/superadmin/taux-reference', label: t('taux_periodes') || 'Taux & Périodes', icon: '📊' },
            { path: '/superadmin/sessions', label: t('sessions') || 'Sessions', icon: '🔐' },
            { path: '/superadmin/audit', label: t('audit') || 'Audit', icon: '📋' },
            { path: '/superadmin/abonnements', label: t('abonnements') || 'Abonnements', icon: '💳' },
            { path: '/superadmin/backup', label: t('backup') || 'Backup', icon: '💾' },
            { path: '/profil', label: t('mon_profil') || 'Mon profil', icon: '🙍' }
          ]
        }
      ];
    }

    const sections = [];

    sections.push({
      section: t('navigation') || 'Navigation',
      items: [
        { path: '/dashboard', label: t('dashboard'), icon: '📊' },
        { path: '/statistiques', label: 'Statistiques', icon: '📈' }
      ]
    });

    if (hasPermission('Ventes', 'consultation')) {
      sections.push({
        section: t('ventes') || 'Ventes',
        items: [
          { path: '/clients', label: t('clients'), icon: '👥' },
          { path: '/devis', label: t('devis'), icon: '📄' },
          { path: '/commandes', label: t('commandes'), icon: '🛒' },
          { path: '/promotions', label: t('promotions') || 'Promotions', icon: '🏷️' },
          { path: '/paiement/client', label: t('paiement_en_ligne') || 'Paiement en ligne', icon: '💳' }
        ]
      });
    }

    if (hasPermission('Achats', 'consultation')) {
      sections.push({
        section: t('achats') || 'Achats',
        items: [
          { path: '/fournisseurs', label: t('fournisseurs'), icon: '🏭' },
          { path: '/achats', label: t('achats'), icon: '📦' },
          { path: '/paiement/fournisseur', label: t('paiement_fournisseur') || 'Paiement fournisseur', icon: '💳' }
        ]
      });
    }

    if (hasPermission('Finance', 'consultation')) {
      sections.push({
        section: t('finance') || 'Finance',
        items: [
          { path: '/finance', label: t('finance'), icon: '💰' }
        ]
      });
    }

    if (hasPermission('Stock', 'consultation')) {
      const stockItems = [
        { path: '/produits', label: t('produits'), icon: '📦' },
        { path: '/mouvements-stock', label: t('mouvements_stock'), icon: '🔄' },
        { path: '/alertes-stock', label: t('alerte_rupture'), icon: '⚠️' },
        { path: '/entrepots', label: t('entrepots') || 'Entrepôts', icon: '🏚️' },
        { path: '/calculateur', label: t('calculateur') || 'Calculateur', icon: '🧮' }
        
      ];
      if (hasPermission('Stock', 'modification')) {
        stockItems.push({ path: '/transfert-stock', label: t('transfert_stock') || 'Transfert stock', icon: '🔄' });
      }
      stockItems.push({ path: '/inventaires', label: t('inventaire'), icon: '📋' });
      sections.push({ section: t('stock') || 'Stock', items: stockItems });
    }

    const adminItems = [];
    if (hasPermission('Utilisateurs', 'consultation')) {
      adminItems.push({ path: '/utilisateurs', label: t('utilisateurs'), icon: '👤' });
    }
    if (hasPermission('Documents', 'consultation')) {
      adminItems.push({ path: '/documents', label: t('documents'), icon: '📁' });
      adminItems.push({ path: '/documents/generation', label: t('generer_document') || 'Générer un document', icon: '📄' });
      adminItems.push({ path: '/documents/numerisation', label: t('numeriser_ocr') || 'Numériser (OCR)', icon: '📷' });
      adminItems.push({ path: '/archives', label: t('archives'), icon: '🗄️' });
    }

    adminItems.push({
      path: '/securite/mfa',
      label: t('securite_mfa') || 'Sécurité MFA',
      icon: '🔐'
    });

    adminItems.push({
      path: '/notifications',
      label: t('notifications'),
      icon: '🔔'
    });

    adminItems.push({
      path: '/profil',
      label: t('mon_profil') || 'Mon profil',
      icon: '🙍'
    });

    if (adminItems.length > 0) {
      sections.push({ section: t('administration') || 'Administration', items: adminItems });
    }

    return sections;
  };

  const menuItems = getMenuItems();

  const sidebarStyle = {
    ...styles.sidebar,
    left: dir === 'rtl' ? 'auto' : '0',
    right: dir === 'rtl' ? '0' : 'auto',
  };

  return (
    <>
      {isMobile && isMobileOpen && (
        <div style={styles.overlay} onClick={() => setIsMobileOpen(false)} />
      )}

      <aside
        style={{
          ...sidebarStyle,
          width: isMobile ? '280px' : collapsed ? '68px' : '240px',
          transform: isMobile ? (isMobileOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
          ...(dir === 'rtl' && isMobile && {
            transform: isMobileOpen ? 'translateX(0)' : 'translateX(100%)',
          }),
        }}
      >
               <div style={styles.logoContainer}>
          <div style={styles.logoGlow} />
          <div style={styles.logo}>
            <div style={styles.logoBadge}>🏢</div>
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
                <div style={styles.userRole}>{user.role || t('utilisateur') || 'Utilisateur'}</div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {isMobile && !isMobileOpen && (
        <button
          style={{
            ...styles.hamburgerBtn,
            left: dir === 'rtl' ? 'auto' : '12px',
            right: dir === 'rtl' ? '12px' : 'auto',
          }}
          onClick={() => setIsMobileOpen(true)}
        >
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
    height: '100vh',
    background: 'linear-gradient(180deg, #0B1220 0%, #0F172A 60%, #0B1220 100%)',
    color: colors.white,
    display: 'flex',
    flexDirection: 'column',
    transition: `width ${transitions.normal}, transform ${transitions.normal}`,
    zIndex: 999,
    overflow: 'hidden',
    boxShadow: '2px 0 20px rgba(0,0,0,0.25)',
    borderRight: '1px solid rgba(255,255,255,0.06)',
  },
  logoContainer: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    minHeight: '64px',
    flexShrink: 0,
  },
  logoGlow: {
    position: 'absolute',
    top: '-40px',
    left: '-20px',
    width: '160px',
    height: '160px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(14,165,233,0.25) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  logo: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoBadge: {
    width: '34px',
    height: '34px',
    borderRadius: borderRadius.md,
    background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    boxShadow: '0 4px 14px rgba(14,165,233,0.4)',
    flexShrink: 0,
  },
  logoText: {
    fontSize: '19px',
    fontWeight: 700,
    color: '#FFFFFF',
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
  },
    menuItemActive: {
      background: 'linear-gradient(90deg, rgba(14,165,233,0.18) 0%, rgba(14,165,233,0.04) 100%)',
      color: '#126d94',
      boxShadow: 'inset 3px 0 0 #0EA5E9',
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