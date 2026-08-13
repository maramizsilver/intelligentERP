import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../common/LanguageSwitcher';
import API from '../../utils/api';

const NAV_ITEMS = [
  { path: '/client/dashboard', label: 'dashboard' },
  { path: '/client/commandes', label: 'commandes' },
  { path: '/client/produits', label: 'produits' },
  { path: '/client/factures', label: 'factures' },
  { path: '/client/profil', label: 'profil' },
];

export default function ClientLayout({ children }) {
  const { user, logout } = useAuth();
  const { t, dir } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [badges, setBadges] = useState({ commandesEnCours: 0, facturesImpayees: 0 });
  const [isDashboard, setIsDashboard] = useState(false);
  const [isDetailPage, setIsDetailPage] = useState(false);

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    setIsDashboard(location.pathname === '/client/dashboard');
    setIsDetailPage(location.pathname.includes('/client/commande/'));
  }, [location.pathname]);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      API.get('/client/commandes').catch(() => ({ data: { commandes: [] } })),
      API.get('/client/factures').catch(() => ({ data: { factures: [] } })),
    ]).then(([cmdRes, facRes]) => {
      if (!mounted) return;
      const commandes = cmdRes.data.commandes || [];
      const factures = facRes.data.factures || [];
      setBadges({
        commandesEnCours: commandes.filter(c => c.statut === 'en_attente' || c.statut === 'confirmee').length,
        facturesImpayees: factures.filter(f => f.statut === 'emise').length,
      });
    });
    return () => { mounted = false; };
  }, [location.pathname]);

  const isActive = (path) => {
    if (path === '/client/dashboard') {
      return location.pathname === '/client/dashboard';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getBadgeCount = (path) => {
    if (path === '/client/commandes') return badges.commandesEnCours;
    if (path === '/client/factures') return badges.facturesImpayees;
    return 0;
  };

  const getUserDisplayName = () => {
    if (user?.prenom && user?.nom) return `${user.prenom} ${user.nom}`;
    if (user?.email) return user.email.split('@')[0];
    return t('client') || 'Client';
  };

  const handleBack = () => {
    if (isDetailPage) {
      navigate('/client/commandes');
    } else {
      navigate('/client/dashboard');
    }
  };

  const handleHome = () => {
    navigate('/client/dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F1F5F9', direction: dir }}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.navActions}>
            {!isDashboard && (
              <button 
                style={styles.navActionBtn} 
                onClick={handleBack}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#E2E8F0';
                  e.currentTarget.style.borderColor = '#CBD5E1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F1F5F9';
                  e.currentTarget.style.borderColor = '#E2E8F0';
                }}
              >
                <span style={styles.navActionIcon}>←</span>
                <span style={styles.navActionText}>
                  {isDetailPage ? (t('retour_commandes') || 'Retour aux commandes') : (t('retour') || 'Retour')}
                </span>
              </button>
            )}
          </div>

          <span style={styles.logo} onClick={handleHome}>
            ERP
            <span style={styles.logoSub}>{t('espace_client') || 'Espace client'}</span>
          </span>

          {!isMobile && (
            <nav style={styles.nav}>
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.path);
                const badge = getBadgeCount(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    style={{
                      ...styles.navBtn,
                      ...(active ? styles.navBtnActive : {}),
                    }}
                  >
                    {t(item.label)}
                    {badge > 0 && (
                      <span style={styles.badge}>
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          )}
        </div>

        <div style={styles.headerRight}>
          <LanguageSwitcher />

          {!isMobile && (
            <>
              <span 
                style={styles.userName} 
                onClick={() => navigate('/client/profil')}
              >
                {getUserDisplayName()}
              </span>
              <span style={styles.userBadge}>{t('client') || 'Client'}</span>
            </>
          )}

          <button style={styles.logoutBtn} onClick={handleLogout}>
            {t('deconnexion') || 'Déconnexion'}
          </button>

          {isMobile && (
            <button 
              style={styles.hamburger} 
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          )}
        </div>
      </header>

      {isMobile && menuOpen && (
        <div style={styles.mobileMenu}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path);
            const badge = getBadgeCount(item.path);
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setMenuOpen(false);
                }}
                style={{
                  ...styles.mobileNavBtn,
                  ...(active ? styles.navBtnActive : {}),
                }}
              >
                {t(item.label)}
                {badge > 0 && (
                  <span style={{ ...styles.badge, marginLeft: 'auto' }}>
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </button>
            );
          })}

          <div style={styles.mobileDivider} />
          
          <button
            style={styles.mobileNavBtn}
            onClick={() => {
              handleBack();
              setMenuOpen(false);
            }}
          >
            ← {isDetailPage ? (t('retour_commandes') || 'Retour aux commandes') : (t('retour') || 'Retour')}
          </button>

          <div style={styles.mobileDivider} />
          
          <div style={styles.mobileUserInfo}>
            <div style={styles.mobileUserAvatar}>
              {user?.prenom?.[0] || 'C'}
            </div>
            <div style={styles.mobileUserDetails}>
              <span style={styles.mobileUserName}>{getUserDisplayName()}</span>
              <span style={styles.mobileUserRole}>{t('client') || 'Client'}</span>
            </div>
          </div>
        </div>
      )}

      <main style={styles.main}>{children}</main>
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 20px',
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E2E8F0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    flexWrap: 'wrap',
    gap: '10px',
    minHeight: '64px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
    flex: '1 1 auto',
  },
  navActions: {
    display: 'flex',
    alignItems: 'center',
  },
  navActionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#F1F5F9',
    color: '#0F172A',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  navActionIcon: {
    fontSize: '16px',
    fontWeight: 700,
  },
  navActionText: {
    fontSize: '13px',
    fontWeight: 500,
  },
  logo: {
    fontSize: '18px',
    fontWeight: 700,
    cursor: 'pointer',
    color: '#0F172A',
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px',
    padding: '4px 8px',
    borderRadius: '8px',
  },
  logoSub: {
    fontSize: '11px',
    fontWeight: 500,
    color: '#94A3B8',
    marginLeft: '4px',
  },
  nav: {
    display: 'flex',
    gap: '2px',
    flexWrap: 'wrap',
    flex: '1 1 auto',
  },
  navBtn: {
    position: 'relative',
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#64748B',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
  },
  navBtnActive: {
    backgroundColor: '#F0F9FF',
    color: '#0EA5E9',
    fontWeight: 600,
    boxShadow: 'inset 0 2px 0 #0EA5E9',
  },
  badge: {
    marginLeft: '6px',
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
    borderRadius: '9999px',
    fontSize: '10px',
    fontWeight: 700,
    padding: '1px 6px',
    minWidth: '18px',
    height: '18px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: '1',
    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    flexShrink: 0,
  },
  userName: {
    fontSize: '13px',
    color: '#334155',
    fontWeight: 500,
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '6px',
  },
  userBadge: {
    padding: '3px 12px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 600,
    backgroundColor: '#F0F9FF',
    color: '#0EA5E9',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '7px 16px',
    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    transition: 'transform 0.1s, box-shadow 0.2s',
  },
  hamburger: {
    background: 'transparent',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#0F172A',
    padding: '4px 8px',
    borderRadius: '6px',
  },
  mobileMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '12px 16px',
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E2E8F0',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
  },
  mobileNavBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 14px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#334155',
    fontSize: '15px',
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'left',
  },
  mobileDivider: {
    height: '1px',
    backgroundColor: '#E2E8F0',
    margin: '8px 0',
  },
  mobileUserInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px',
  },
  mobileUserAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#0EA5E9',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 600,
    flexShrink: 0,
  },
  mobileUserDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  mobileUserName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#0F172A',
  },
  mobileUserRole: {
    fontSize: '12px',
    color: '#94A3B8',
  },
  main: {
    padding: '24px',
    maxWidth: '1280px',
    width: '100%',
    margin: '0 auto',
    minHeight: 'calc(100vh - 64px)',
    position: 'relative',
  },
};