// frontend/src/App.js
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

// Module Commercial
import Devis from './pages/Devis';
import Promotions from './pages/Promotions';
import Achats from './pages/Achats';
import MouvementsStock from './pages/MouvementsStock';
import AlertesStock from './pages/AlertesStock';

// NOUVEAUX MODULES
import Entrepots from './pages/Entrepots';
import TransfertStock from './pages/TransfertStock';
import Inventaires from './pages/Inventaires';
import Documents from './pages/Documents';
import Archives from './pages/Archives';

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

      {/* ============================================================
          TOUTES LES ROUTES DOIVENT ÊTRE DANS <Routes>
          ============================================================ */}
      <Routes>
        {/* ROUTES PUBLIQUES */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* PAGE ESSAI EXPIRE */}
        <Route 
          path="/essai-expire" 
          element={
            <PrivateRoute allowEssaiExpire>
              <EssaiExpire />
            </PrivateRoute>
          } 
        />

        {/* ESPACE SUPERADMIN */}
        <Route 
          path="/superadmin/dashboard" 
          element={
            <PrivateRoute superAdminOnly>
              <SuperAdminDashboard />
            </PrivateRoute>
          } 
        />

        {/* ESPACE CLIENT (PORTAL EXTERNE) */}
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

        {/* ESPACE INTERNE (STAFF DE L'ENTREPRISE) */}
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />

        {/* Module Commercial */}
        <Route 
          path="/clients" 
          element={
            <PrivateRoute>
              <Clients />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/fournisseurs" 
          element={
            <PrivateRoute>
              <Fournisseurs />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/produits" 
          element={
            <PrivateRoute>
              <Produits />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/commandes" 
          element={
            <PrivateRoute>
              <Commandes />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/devis" 
          element={
            <PrivateRoute>
              <Devis />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/promotions" 
          element={
            <PrivateRoute>
              <Promotions />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/achats" 
          element={
            <PrivateRoute>
              <Achats />
            </PrivateRoute>
          } 
        />

        {/* Module Stock */}
        <Route 
          path="/mouvements-stock" 
          element={
            <PrivateRoute>
              <MouvementsStock />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/alertes-stock" 
          element={
            <PrivateRoute>
              <AlertesStock />
            </PrivateRoute>
          } 
        />

        {/* NOUVEAUX MODULES STOCK */}
        <Route 
          path="/entrepots" 
          element={
            <PrivateRoute>
              <Entrepots />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/transfert-stock" 
          element={
            <PrivateRoute>
              <TransfertStock />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/inventaires" 
          element={
            <PrivateRoute>
              <Inventaires />
            </PrivateRoute>
          } 
        />

        {/* Module Administratif */}
        <Route 
          path="/utilisateurs" 
          element={
            <PrivateRoute>
              <Utilisateurs />
            </PrivateRoute>
          } 
        />

        {/* NOUVEAUX MODULES ADMINISTRATIFS */}
        <Route 
          path="/documents" 
          element={
            <PrivateRoute>
              <Documents />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/archives" 
          element={
            <PrivateRoute>
              <Archives />
            </PrivateRoute>
          } 
        />

        {/* REDIRECTION PAR DÉFAUT */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;