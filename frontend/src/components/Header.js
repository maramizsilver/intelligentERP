// frontend/src/components/Header.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout, hasPermission } = useAuth();
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
        borderRadius: '6px',
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
      onMouseEnter={(e) => {
        if (!active) {
          e.target.style.backgroundColor = '#F1F5F9';
          e.target.style.color = '#1A1A2E';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.color = '#64748B';
        }
      }}
    >
      {label}
    </button>
  );

  
  const renderNavButtons = () => {
    if (user.is_super_admin) {
      return (
        <NavButton
          to="/superadmin/dashboard"
          label="Entreprises"
          active={isActive('/superadmin/dashboard')}
          onClick={() => navigate('/superadmin/dashboard')}
        />
      );
    }

    if (user.is_external) {
      const externalRoutes = [
        { path: '/client/dashboard', label: 'Dashboard' },
        { path: '/client/commandes', label: 'Commandes' },
        { path: '/client/produits', label: 'Produits' },
        { path: '/client/factures', label: 'Factures' },
        { path: '/client/profil', label: 'Profil' },
      ];
      return externalRoutes.map((route) => (
        <NavButton
          key={route.path}
          to={route.path}
          label={route.label}
          active={isActive(route.path)}
          onClick={() => navigate(route.path)}
        />
      ));
    }

    // Utilisateur interne
    const internalRoutes = [];

    // Dashboard
    internalRoutes.push({
      path: '/dashboard',
      label: 'Dashboard',
      permission: null,
    });

    // Ventes
    if (hasPermission('Ventes', 'consultation')) {
      internalRoutes.push({ path: '/clients', label: 'Clients', permission: 'Ventes' });
      internalRoutes.push({ path: '/devis', label: 'Devis', permission: 'Ventes' });
      internalRoutes.push({ path: '/commandes', label: 'Commandes', permission: 'Ventes' });
      internalRoutes.push({ path: '/promotions', label: 'Promotions', permission: 'Ventes' });
    }

    // Achats
    if (hasPermission('Achats', 'consultation')) {
      internalRoutes.push({ path: '/fournisseurs', label: 'Fournisseurs', permission: 'Achats' });
      internalRoutes.push({ path: '/achats', label: 'Achats', permission: 'Achats' });
    }
 if (hasPermission('Finance', 'consultation')) {
      internalRoutes.push({ path: '/finance', label: 'Finance', permission: 'Finance' });
    }
    // Stock
    if (hasPermission('Stock', 'consultation')) {
      internalRoutes.push({ path: '/produits', label: 'Produits', permission: 'Stock' });
      internalRoutes.push({ path: '/mouvements-stock', label: 'Mouvements', permission: 'Stock' });
      internalRoutes.push({ path: '/alertes-stock', label: 'Alertes', permission: 'Stock' });
      internalRoutes.push({ path: '/entrepots', label: 'Entrepots', permission: 'Stock' });
      if (hasPermission('Stock', 'modification')) {
        internalRoutes.push({ path: '/transfert-stock', label: 'Transfert', permission: 'Stock' });
      }
      internalRoutes.push({ path: '/inventaires', label: 'Inventaires', permission: 'Stock' });
    }

    // Administration
    if (hasPermission('Utilisateurs', 'consultation')) {
      internalRoutes.push({ path: '/utilisateurs', label: 'Utilisateurs', permission: 'Utilisateurs' });
    }
    if (hasPermission('Documents', 'consultation')) {
      internalRoutes.push({ path: '/documents', label: 'Documents', permission: 'Documents' });
      internalRoutes.push({ path: '/archives', label: 'Archives', permission: 'Documents' });
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
      }}
    >
      {/* Gauche : Logo + Navigation */}
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
            color: '#0EA5E9',
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

        {/* Navigation - sur mobile on limite à 2 boutons + "..." */}
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
              {/* Afficher seulement les 2 premiers boutons sur mobile */}
              {renderNavButtons().slice(0, 2)}
              {renderNavButtons().length > 2 && (
                <button
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
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

        {/* Menu dropdown sur mobile pour les routes supplémentaires */}
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
          </div>
        )}
      </div>

      {/* Droite : User info + Notifications + Deconnexion */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '6px' : '10px',
          flexWrap: 'wrap',
        }}
      >
        {!isMobile && (
          <>
            <span style={{ fontSize: '13px', color: '#64748B' }}>
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

        {/* ICONE NOTIFICATION */}
        <button
          style={{
            padding: isMobile ? '6px 10px' : '8px 12px',
            backgroundColor: location.pathname === '/notifications' ? '#F0F9FF' : 'transparent',
            color: '#0EA5E9',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: isMobile ? '16px' : '18px',
            transition: 'all 0.2s ease',
            position: 'relative',
          }}
          onClick={() => navigate('/notifications')}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#F0F9FF';
          }}
          onMouseLeave={(e) => {
            if (location.pathname !== '/notifications') {
              e.target.style.backgroundColor = 'transparent';
            }
          }}
          title="Notifications"
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

        {/* Bouton de deconnexion */}
        <button
          style={{
            padding: isMobile ? '6px 12px' : '6px 16px',
            backgroundColor: '#EF4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: isMobile ? '12px' : '13px',
            fontWeight: 500,
            transition: 'all 0.2s ease',
          }}
          onClick={handleLogout}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#DC2626')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = '#EF4444')}
        >
          {isMobile ? 'Déconnexion' : 'Déconnexion'}
        </button>
      </div>
    </header>
  );
}