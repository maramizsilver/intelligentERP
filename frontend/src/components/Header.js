// frontend/src/components/Header.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from './common/LanguageSwitcher';
import AccountLockButton from './AccountLockButton';
import GlobalSearchBar from '../components/common/GlobalSearchBar';

export default function Header() {
  const { user, logout } = useAuth();
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

  if (!user) return null;

  const roleLabel = user.is_super_admin
    ? 'SuperAdmin'
    : user.is_external
      ? t('client') || 'Client'
      : (user.role || t('utilisateur') || 'Utilisateur');


  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: isMobile ? '0 16px' : '0 24px',
        height: '60px',
        backgroundColor: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        color: '#1A1A2E',
        boxShadow: '0 1px 0 rgba(15,23,42,0.06), 0 8px 24px rgba(15,23,42,0.04)',
        borderBottom: '1px solid #E2E8F0',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        gap: '12px',
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

        {/* La navigation complète vit dans la Sidebar — le header ne la
            duplique plus (c'est ce qui le faisait passer à 300px de haut).
            On garde juste un accès rapide "Rechercher" sur mobile. */}
        {isMobile && !user.is_super_admin && !user.is_external && (
          <button
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              backgroundColor: menuOpen ? '#F0F9FF' : 'transparent',
              color: menuOpen ? '#0EA5E9' : '#64748B',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
            }}
            onClick={() => setMenuOpen(!menuOpen)}
            title={t('rechercher') || 'Rechercher'}
          >
            🔍
          </button>
        )}

        {isMobile && menuOpen && (
          <div
            style={{
              position: 'absolute',
              top: '52px',
              left: '0',
              right: '0',
              backgroundColor: '#FFFFFF',
              borderBottom: '1px solid #E2E8F0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              padding: '12px 16px',
              zIndex: 999,
            }}
          >
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
                padding: '4px 14px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.3px',
                background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
                color: '#FFFFFF',
                boxShadow: '0 2px 8px rgba(14,165,233,0.35)',
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
            padding: isMobile ? '6px 12px' : '6px 14px',
            background: 'transparent',
            color: '#EF4444',
            border: '1px solid #FCA5A5',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: isMobile ? '12px' : '13px',
            fontWeight: 500,
            transition: 'all 0.2s ease',
          }}
          onClick={handleLogout}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#FEF2F2';
            e.currentTarget.style.borderColor = '#EF4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = '#FCA5A5';
          }}
        >
          {t('deconnexion')}
        </button>
      </div>
    </header>
  );
}