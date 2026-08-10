// frontend/src/components/Header.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from './common/LanguageSwitcher';
import AccountLockButton from './AccountLockButton';
import GlobalSearchBar from '../components/common/GlobalSearchBar';

export default function Header() {
  const { user, logout, hasPermission } = useAuth();
  const { t, dir } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  if (!user) return null;

  const roleLabel = user.is_super_admin
    ? 'SuperAdmin'
    : user.is_external
      ? 'Client'
      : (user.role || 'Utilisateur');

  const NavButton = ({ to, label, active, onClick }) => (
    <button
      style={{
        padding: isMobile ? '6px 10px' : '6px 14px',
        borderRadius: '8px',
        backgroundColor: active ? '#F0F9FF' : 'transparent',
        color: active ? '#0EA5E9' : '#64748B',
        border: 'none',
        cursor: 'pointer',
        fontSize: isMobile ? '12px' : '13px',
        fontWeight: active ? 600 : 500,
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
      }}
      onClick={onClick}
    >
      {label}
    </button>
  );

  const renderNavButtons = () => {
    // ============================================================
    // SUPER ADMIN
    // ============================================================
    if (user.is_super_admin) {
      return (
        <>
          <NavButton
            to="/superadmin/dashboard"
            label={t('dashboard')}
            active={isActive('/superadmin/dashboard')}
            onClick={() => navigate('/superadmin/dashboard')}
          />
          <NavButton
            to="/superadmin/taux-reference"
            label="Taux référence"
            active={isActive('/superadmin/taux-reference')}
            onClick={() => navigate('/superadmin/taux-reference')}
          />
          <NavButton
            to="/superadmin/sessions"
            label="Sessions"
            active={isActive('/superadmin/sessions')}
            onClick={() => navigate('/superadmin/sessions')}
          />
          <NavButton
            to="/superadmin/audit"
            label="Audit"
            active={isActive('/superadmin/audit')}
            onClick={() => navigate('/superadmin/audit')}
          />
          <NavButton
            to="/superadmin/abonnements"
            label="Abonnements"
            active={isActive('/superadmin/abonnements')}
            onClick={() => navigate('/superadmin/abonnements')}
          />
          <NavButton
            to="/superadmin/backup"
            label="Backup"
            active={isActive('/superadmin/backup')}
            onClick={() => navigate('/superadmin/backup')}
          />
          {/* AJOUTER LE LIEN DE TEST POUR SUPER ADMIN */}
          <NavButton
            to="/test-documentation"
            label="📄 Test Docs"
            active={isActive('/test-documentation')}
            onClick={() => navigate('/test-documentation')}
          />
        </>
      );
    }

    // ============================================================
    // CLIENT EXTERNE
    // ============================================================
    if (user.is_external) {
      return [
        { path: '/client/dashboard', label: t('dashboard') },
        { path: '/client/commandes', label: t('commandes') },
        { path: '/client/produits', label: t('produits') },
        { path: '/client/factures', label: t('factures') },
        { path: '/client/profil', label: t('profil') },
        // AJOUTER LE LIEN DE TEST POUR CLIENT
        { path: '/test-documentation', label: '📄 Test Docs' },
      ].map((route) => (
        <NavButton
          key={route.path}
          to={route.path}
          label={route.label}
          active={isActive(route.path)}
          onClick={() => navigate(route.path)}
        />
      ));
    }

    // ============================================================
    // UTILISATEUR INTERNE - Routes avec permissions
    // ============================================================
    const internalRoutes = [];

    // Dashboard - toujours visible
    internalRoutes.push({ path: '/dashboard', label: t('dashboard') });

    // Mon Profil
    internalRoutes.push({ path: '/profil', label: 'Mon Profil' });

    // AJOUTER LE LIEN DE TEST POUR TOUS LES UTILISATEURS
    internalRoutes.push({ path: '/test-documentation', label: '📄 Test Docs' });

    // Ventes
    if (hasPermission('Ventes', 'consultation')) {
      internalRoutes.push({ path: '/clients', label: t('clients') });
      internalRoutes.push({ path: '/devis', label: t('devis') });
      internalRoutes.push({ path: '/commandes', label: t('commandes') });
      internalRoutes.push({ path: '/promotions', label: 'Promotions' });
    }

    // Achats
    if (hasPermission('Achats', 'consultation')) {
      internalRoutes.push({ path: '/fournisseurs', label: t('fournisseurs') });
      internalRoutes.push({ path: '/achats', label: t('achats') });
    }

    // Finance
    if (hasPermission('Finance', 'consultation')) {
      internalRoutes.push({ path: '/finance', label: t('finance') });
    }

    // Stock
    if (hasPermission('Stock', 'consultation')) {
      internalRoutes.push({ path: '/produits', label: t('produits') });
      internalRoutes.push({ path: '/mouvements-stock', label: t('mouvements_stock') });
      internalRoutes.push({ path: '/alertes-stock', label: t('alerte_rupture') });
      internalRoutes.push({ path: '/entrepots', label: 'Entrepots' });
      internalRoutes.push({ path: '/inventaires', label: t('inventaire') });
    }

    // Utilisateurs
    if (hasPermission('Utilisateurs', 'consultation')) {
      internalRoutes.push({ path: '/utilisateurs', label: t('utilisateurs') });
    }

    // Documents
    if (hasPermission('Documents', 'consultation')) {
      internalRoutes.push({ path: '/documents', label: t('documents') });
      internalRoutes.push({ path: '/documents/generation', label: 'Generer un document' });
      internalRoutes.push({ path: '/documents/numerisation', label: 'Numeriser (OCR)' });
      internalRoutes.push({ path: '/archives', label: t('archives') });
    }

    return internalRoutes.map((route) => (
      <NavButton
        key={route.path}
        to={route.path}
        label={route.label}
        active={isActive(route.path)}
        onClick={() => navigate(route.path)}
      />
    ));
  };

  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: isMobile ? '10px 16px' : '10px 24px',
        backgroundColor: '#FFFFFF',
        color: '#1A1A2E',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        borderBottom: '1px solid #E2E8F0',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        flexWrap: 'wrap',
        gap: '8px',
        minHeight: isMobile ? '56px' : 'auto',
        direction: dir,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '8px' : '16px',
          flexWrap: 'wrap',
          flex: 1,
        }}
      >
        <span
          style={{
            fontSize: isMobile ? '16px' : '18px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #0EA5E9 0%, #7C3AED 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            cursor: 'pointer',
            letterSpacing: '0.5px',
          }}
          onClick={() =>
            navigate(
              user.is_super_admin
                ? '/superadmin/dashboard'
                : user.is_external
                ? '/client/dashboard'
                : '/dashboard'
            )
          }
        >
          ERP
        </span>

        {!isMobile && !user.is_super_admin && !user.is_external && (
          <GlobalSearchBar isMobile={false} />
        )}

        <nav
          style={{
            display: 'flex',
            gap: '4px',
            flexWrap: 'wrap',
            alignItems: 'center',
            overflow: 'hidden',
          }}
        >
          {isMobile ? (
            <>
              {renderNavButtons().slice(0, 2)}
              {renderNavButtons().length > 2 && (
                <button
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    backgroundColor: menuOpen ? '#F0F9FF' : 'transparent',
                    color: menuOpen ? '#0EA5E9' : '#64748B',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                  onClick={() => setMenuOpen(!menuOpen)}
                >
                  ...
                </button>
              )}
            </>
          ) : (
            renderNavButtons()
          )}
        </nav>

        {isMobile && menuOpen && (
          <div
            style={{
              position: 'absolute',
              top: '56px',
              left: '0',
              right: '0',
              backgroundColor: '#FFFFFF',
              borderBottom: '1px solid #E2E8F0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              padding: '12px 16px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px',
              zIndex: 999,
            }}
          >
            {renderNavButtons().slice(2).map((btn, idx) => (
              <React.Fragment key={idx}>{btn}</React.Fragment>
            ))}
            <GlobalSearchBar isMobile={true} />
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '6px' : '10px',
          flexWrap: 'wrap',
        }}
      >
        <LanguageSwitcher variant={isMobile ? 'default' : 'default'} />

        {!isMobile && (
          <>
            <span
              style={{
                fontSize: '13px',
                color: '#64748B',
                cursor: 'pointer',
                transition: 'color 0.2s ease',
                textDecoration: 'underline',
                textDecorationColor: 'transparent',
                fontWeight: 500,
              }}
              onClick={() => {
                if (user.is_super_admin) {
                  navigate('/superadmin/dashboard');
                } else if (user.is_external) {
                  navigate('/client/profil');
                } else {
                  navigate('/profil');
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#0EA5E9';
                e.currentTarget.style.textDecorationColor = '#0EA5E9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#64748B';
                e.currentTarget.style.textDecorationColor = 'transparent';
              }}
            >
              {user.prenom} {user.nom}
            </span>

            <span
              style={{
                padding: '3px 12px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: '#F0F9FF',
                color: '#0EA5E9',
              }}
            >
              {roleLabel}
            </span>
            {user.entreprise && !user.is_super_admin && (
              <span
                style={{
                  padding: '3px 12px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: '#F1F5F9',
                  color: '#64748B',
                }}
              >
                {user.entreprise}
              </span>
            )}
          </>
        )}

        <AccountLockButton />

        <button
          style={{
            padding: isMobile ? '6px 10px' : '8px 12px',
            backgroundColor: location.pathname === '/notifications' ? '#F0F9FF' : 'transparent',
            color: '#0EA5E9',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: isMobile ? '16px' : '18px',
            transition: 'all 0.2s ease',
            position: 'relative',
          }}
          onClick={() => navigate('/notifications')}
          title={t('notifications')}
        >
          🔔
          <span
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              fontSize: '9px',
              fontWeight: 'bold',
              borderRadius: '50%',
              width: '16px',
              height: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            0
          </span>
        </button>

        <button
          style={{
            padding: isMobile ? '6px 12px' : '6px 16px',
            background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: isMobile ? '12px' : '13px',
            fontWeight: 500,
            transition: 'all 0.2s ease',
          }}
          onClick={handleLogout}
        >
          {t('deconnexion')}
        </button>
      </div>
    </header>
  );
}