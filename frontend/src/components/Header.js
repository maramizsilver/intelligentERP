// frontend/src/components/Header.js
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

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

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 24px',
      backgroundColor: '#0f172a',
      color: 'white',
      boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      flexWrap: 'wrap',
      gap: '8px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <span
          style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', cursor: 'pointer' }}
          onClick={() => navigate(
            user.is_super_admin ? '/superadmin/dashboard' : 
            user.is_external ? '/client/dashboard' : 
            '/dashboard'
          )}
        >
          ERP
        </span>

        <nav style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {user.is_super_admin ? (
            <button
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                backgroundColor: isActive('/superadmin/dashboard') ? '#1e293b' : 'transparent',
                color: isActive('/superadmin/dashboard') ? '#60a5fa' : '#94a3b8',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px'
              }}
              onClick={() => navigate('/superadmin/dashboard')}
            >
              Entreprises
            </button>
          ) : user.is_external ? (
            <>
              <button style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: isActive('/client/dashboard') ? '#1e293b' : 'transparent', color: isActive('/client/dashboard') ? '#60a5fa' : '#94a3b8', border: 'none', cursor: 'pointer', fontSize: '13px' }} onClick={() => navigate('/client/dashboard')}>Dashboard</button>
              <button style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: isActive('/client/commandes') ? '#1e293b' : 'transparent', color: isActive('/client/commandes') ? '#60a5fa' : '#94a3b8', border: 'none', cursor: 'pointer', fontSize: '13px' }} onClick={() => navigate('/client/commandes')}>Commandes</button>
              <button style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: isActive('/client/produits') ? '#1e293b' : 'transparent', color: isActive('/client/produits') ? '#60a5fa' : '#94a3b8', border: 'none', cursor: 'pointer', fontSize: '13px' }} onClick={() => navigate('/client/produits')}>Produits</button>
              <button style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: isActive('/client/factures') ? '#1e293b' : 'transparent', color: isActive('/client/factures') ? '#60a5fa' : '#94a3b8', border: 'none', cursor: 'pointer', fontSize: '13px' }} onClick={() => navigate('/client/factures')}>Factures</button>
              <button style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: isActive('/client/profil') ? '#1e293b' : 'transparent', color: isActive('/client/profil') ? '#60a5fa' : '#94a3b8', border: 'none', cursor: 'pointer', fontSize: '13px' }} onClick={() => navigate('/client/profil')}>Profil</button>
            </>
          ) : (
            <>
              {/* ============================================================
                  DASHBOARD
                  ============================================================ */}
              <button style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: isActive('/dashboard') ? '#1e293b' : 'transparent', color: isActive('/dashboard') ? '#60a5fa' : '#94a3b8', border: 'none', cursor: 'pointer', fontSize: '13px' }} onClick={() => navigate('/dashboard')}>Dashboard</button>

              {/* ============================================================
                  MODULE VENTES
                  ============================================================ */}
              {hasPermission('Ventes', 'consultation') && (
                <>
                  <button style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: isActive('/clients') ? '#1e293b' : 'transparent', color: isActive('/clients') ? '#60a5fa' : '#94a3b8', border: 'none', cursor: 'pointer', fontSize: '13px' }} onClick={() => navigate('/clients')}>Clients</button>
                  <button style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: isActive('/devis') ? '#1e293b' : 'transparent', color: isActive('/devis') ? '#60a5fa' : '#94a3b8', border: 'none', cursor: 'pointer', fontSize: '13px' }} onClick={() => navigate('/devis')}>Devis</button>
                  <button style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: isActive('/commandes') ? '#1e293b' : 'transparent', color: isActive('/commandes') ? '#60a5fa' : '#94a3b8', border: 'none', cursor: 'pointer', fontSize: '13px' }} onClick={() => navigate('/commandes')}>Commandes</button>
                  <button style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: isActive('/promotions') ? '#1e293b' : 'transparent', color: isActive('/promotions') ? '#60a5fa' : '#94a3b8', border: 'none', cursor: 'pointer', fontSize: '13px' }} onClick={() => navigate('/promotions')}>Promotions</button>
                </>
              )}

              {/* ============================================================
                  MODULE ACHATS
                  ============================================================ */}
              {hasPermission('Achats', 'consultation') && (
                <>
                  <button style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: isActive('/fournisseurs') ? '#1e293b' : 'transparent', color: isActive('/fournisseurs') ? '#60a5fa' : '#94a3b8', border: 'none', cursor: 'pointer', fontSize: '13px' }} onClick={() => navigate('/fournisseurs')}>Fournisseurs</button>
                  <button style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: isActive('/achats') ? '#1e293b' : 'transparent', color: isActive('/achats') ? '#60a5fa' : '#94a3b8', border: 'none', cursor: 'pointer', fontSize: '13px' }} onClick={() => navigate('/achats')}>Achats</button>
                </>
              )}

              {/* ============================================================
                  MODULE STOCK (avec nouveaux modules)
                  ============================================================ */}
              {hasPermission('Stock', 'consultation') && (
                <>
                  <button style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: isActive('/produits') ? '#1e293b' : 'transparent', color: isActive('/produits') ? '#60a5fa' : '#94a3b8', border: 'none', cursor: 'pointer', fontSize: '13px' }} onClick={() => navigate('/produits')}>Produits</button>
                  <button style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: isActive('/mouvements-stock') ? '#1e293b' : 'transparent', color: isActive('/mouvements-stock') ? '#60a5fa' : '#94a3b8', border: 'none', cursor: 'pointer', fontSize: '13px' }} onClick={() => navigate('/mouvements-stock')}>Mouvements</button>
                  <button style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: isActive('/alertes-stock') ? '#1e293b' : 'transparent', color: isActive('/alertes-stock') ? '#60a5fa' : '#94a3b8', border: 'none', cursor: 'pointer', fontSize: '13px' }} onClick={() => navigate('/alertes-stock')}>Alertes</button>
                  {/* NOUVEAUX MODULES STOCK */}
                  <button style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: isActive('/entrepots') ? '#1e293b' : 'transparent', color: isActive('/entrepots') ? '#60a5fa' : '#94a3b8', border: 'none', cursor: 'pointer', fontSize: '13px' }} onClick={() => navigate('/entrepots')}>Entrepôts</button>
                  {hasPermission('Stock', 'modification') && (
                    <button style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: isActive('/transfert-stock') ? '#1e293b' : 'transparent', color: isActive('/transfert-stock') ? '#60a5fa' : '#94a3b8', border: 'none', cursor: 'pointer', fontSize: '13px' }} onClick={() => navigate('/transfert-stock')}>Transfert</button>
                  )}
                  <button style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: isActive('/inventaires') ? '#1e293b' : 'transparent', color: isActive('/inventaires') ? '#60a5fa' : '#94a3b8', border: 'none', cursor: 'pointer', fontSize: '13px' }} onClick={() => navigate('/inventaires')}>Inventaires</button>
                </>
              )}

              {/* ============================================================
                  MODULE ADMINISTRATION (Utilisateurs + Documents + Archives)
                  ============================================================ */}
              {hasPermission('Utilisateurs', 'consultation') && (
                <button style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: isActive('/utilisateurs') ? '#1e293b' : 'transparent', color: isActive('/utilisateurs') ? '#60a5fa' : '#94a3b8', border: 'none', cursor: 'pointer', fontSize: '13px' }} onClick={() => navigate('/utilisateurs')}>Utilisateurs</button>
              )}

              {/* NOUVEAUX MODULES ADMINISTRATIFS */}
              {hasPermission('Documents', 'consultation') && (
                <button style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: isActive('/documents') ? '#1e293b' : 'transparent', color: isActive('/documents') ? '#60a5fa' : '#94a3b8', border: 'none', cursor: 'pointer', fontSize: '13px' }} onClick={() => navigate('/documents')}>Documents</button>
              )}
              {hasPermission('Documents', 'consultation') && (
                <button style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: isActive('/archives') ? '#1e293b' : 'transparent', color: isActive('/archives') ? '#60a5fa' : '#94a3b8', border: 'none', cursor: 'pointer', fontSize: '13px' }} onClick={() => navigate('/archives')}>Archives</button>
              )}
            </>
          )}
        </nav>

        <button
          style={{
            display: 'none',
            padding: '6px 12px',
            backgroundColor: 'transparent',
            color: 'white',
            border: '1px solid #334155',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '18px'
          }}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '13px', color: '#e2e8f0' }}>{user.prenom} {user.nom}</span>
        <span style={{ padding: '3px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', backgroundColor: '#3b82f6', color: 'white' }}>
          {roleLabel}
        </span>
        {user.entreprise && !user.is_super_admin && (
          <span style={{ padding: '3px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', backgroundColor: '#10b981', color: 'white' }}>
            {user.entreprise}
          </span>
        )}
        <button style={{ padding: '6px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }} onClick={handleLogout}>
          Déconnexion
        </button>
      </div>
    </header>
  );
}