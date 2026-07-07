import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';

// Pages d'authentification
import Login from './pages/Login';
import Register from './pages/Register';

// Pages principales
import Dashboard from './pages/Dashboard';
import EssaiExpire from './pages/EssaiExpire';
import EssaiBanner from './components/EssaiBanner';

// Pages SuperAdmin
import SuperAdminDashboard from './pages/SuperAdminDashboard';

// Pages internes (staff entreprise)
import Clients from './pages/Clients';
import Fournisseurs from './pages/Fournisseurs';
import Produits from './pages/Produits';
import Commandes from './pages/Commandes';
import Utilisateurs from './pages/Utilisateurs';

// Pages client (portail externe)
import ClientDashboard from './pages/clientDashboard';
import ClientCommandes from './pages/clientCommandes';
import ClientCommandeDetail from './pages/clientCommandeDetail';
import ClientProduits from './pages/clientProduits';
import ClientFactures from './pages/clientFactures';
import ClientProfil from './pages/clientProfil';
// Ajouter les imports
import Entrepots from './pages/stock/Entrepots';
import TransfertStock from './pages/stock/TransfertStock';
import Inventaires from './pages/stock/Inventaires';
import Documents from './pages/administratif/Documents';
import Archives from './pages/administratif/Archives';


// ============================================================
// NOUVEAUX COMPOSANTS - MODULE COMMERCIAL
// ============================================================
import Devis from './pages/Devis';
import Promotions from './pages/Promotions';
import Achats from './pages/Achats';
import MouvementsStock from './pages/MouvementsStock';
import AlertesStock from './pages/AlertesStock';

// ============================================================
// PrivateRoute — Vérification par TYPE de compte
// ============================================================
const PrivateRoute = ({ 
  children, 
  superAdminOnly = false, 
  externalOnly = false, 
  allowEssaiExpire = false 
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center', 
        fontSize: '18px', 
        color: '#64748b' 
      }}>
        ⏳ Chargement...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  // Route réservée au SuperAdmin plateforme
  if (superAdminOnly && !user.is_super_admin) {
    return <Navigate to={user.is_external ? '/client/dashboard' : '/dashboard'} />;
  }

  // Route réservée au portail externe (client)
  if (externalOnly && !user.is_external) {
    return <Navigate to={user.is_super_admin ? '/superadmin/dashboard' : '/dashboard'} />;
  }

  // Route "interne" (ni superAdminOnly ni externalOnly)
  if (!superAdminOnly && !externalOnly) {
    if (user.is_super_admin) return <Navigate to="/superadmin/dashboard" />;
    if (user.is_external) return <Navigate to="/client/dashboard" />;
    // Essai gratuit épuisé : on bloque toutes les pages internes sauf /essai-expire
    if (user.essai_expire && !allowEssaiExpire) return <Navigate to="/essai-expire" />;
  }

  return children;
};

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <MainApp />
      </BrowserRouter>
    </AuthProvider>
  );
}

function MainApp() {
  const { user } = useAuth();

  return (
    <>
      {/* Header et bannière d'essai */}
      {user && <Header />}
      {user && <EssaiBanner />}

      <Routes>
        {/* ============================================================
            ROUTES PUBLIQUES
            ============================================================ */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ============================================================
            PAGE ESSAI EXPIRE
            ============================================================ */}
        <Route 
          path="/essai-expire" 
          element={
            <PrivateRoute allowEssaiExpire>
              <EssaiExpire />
            </PrivateRoute>
          } 
        />

        {/* ============================================================
            ESPACE SUPERADMIN
            ============================================================ */}
        <Route 
          path="/superadmin/dashboard" 
          element={
            <PrivateRoute superAdminOnly>
              <SuperAdminDashboard />
            </PrivateRoute>
          } 
        />

        {/* ============================================================
            ESPACE CLIENT (PORTAL EXTERNE)
            ============================================================ */}
        <Route 
          path="/client/dashboard" 
          element={
            <PrivateRoute externalOnly>
              <ClientDashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/client/commandes" 
          element={
            <PrivateRoute externalOnly>
              <ClientCommandes />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/client/commande/:id" 
          element={
            <PrivateRoute externalOnly>
              <ClientCommandeDetail />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/client/produits" 
          element={
            <PrivateRoute externalOnly>
              <ClientProduits />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/client/factures" 
          element={
            <PrivateRoute externalOnly>
              <ClientFactures />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/client/profil" 
          element={
            <PrivateRoute externalOnly>
              <ClientProfil />
            </PrivateRoute>
          } 
        />

        {/* ============================================================
            ESPACE INTERNE (STAFF DE L'ENTREPRISE)
            ============================================================ */}

        {/* Dashboard principal */}
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />

        {/* Module Commercial - Clients */}
        <Route 
          path="/clients" 
          element={
            <PrivateRoute>
              <Clients />
            </PrivateRoute>
          } 
        />

        {/* Module Commercial - Fournisseurs */}
        <Route 
          path="/fournisseurs" 
          element={
            <PrivateRoute>
              <Fournisseurs />
            </PrivateRoute>
          } 
        />

        {/* Module Commercial - Produits */}
        <Route 
          path="/produits" 
          element={
            <PrivateRoute>
              <Produits />
            </PrivateRoute>
          } 
        />

        {/* Module Commercial - Commandes */}
        <Route 
          path="/commandes" 
          element={
            <PrivateRoute>
              <Commandes />
            </PrivateRoute>
          } 
        />

        {/* ============================================================
            NOUVEAUX - MODULE COMMERCIAL COMPLET
            ============================================================ */}

        {/* Module Commercial - Devis */}
        <Route 
          path="/devis" 
          element={
            <PrivateRoute>
              <Devis />
            </PrivateRoute>
          } 
        />

        {/* Module Commercial - Promotions */}
        <Route 
          path="/promotions" 
          element={
            <PrivateRoute>
              <Promotions />
            </PrivateRoute>
          } 
        />

        {/* Module Commercial - Achats (Bons de commande fournisseurs) */}
        <Route 
          path="/achats" 
          element={
            <PrivateRoute>
              <Achats />
            </PrivateRoute>
          } 
        />

        {/* Module Stock - Mouvements de stock */}
        <Route 
          path="/mouvements-stock" 
          element={
            <PrivateRoute>
              <MouvementsStock />
            </PrivateRoute>
          } 
        />

        {/* Module Stock - Alertes de rupture */}
        <Route 
          path="/alertes-stock" 
          element={
            <PrivateRoute>
              <AlertesStock />
            </PrivateRoute>
          } 
        />

        {/* Module Administratif - Utilisateurs et Rôles */}
        <Route 
          path="/utilisateurs" 
          element={
            <PrivateRoute>
              <Utilisateurs />
            </PrivateRoute>
          } 
        />

        {/* ============================================================
            REDIRECTION PAR DÉFAUT
            ============================================================ */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      // Ajouter les routes
<Route path="/entrepots" element={<PrivateRoute><Entrepots /></PrivateRoute>} />
<Route path="/transfert-stock" element={<PrivateRoute><TransfertStock /></PrivateRoute>} />
<Route path="/inventaires" element={<PrivateRoute><Inventaires /></PrivateRoute>} />
<Route path="/documents" element={<PrivateRoute><Documents /></PrivateRoute>} />
<Route path="/archives" element={<PrivateRoute><Archives /></PrivateRoute>} />
    </>
  );
}

export default App;