// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import PrivateRoute from './components/PrivateRoute';

// ============================================================
// AUTH
// ============================================================
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// ============================================================
// DASHBOARD
// ============================================================
import Dashboard from './pages/dashboard/Dashboard';
import SuperAdminDashboard from './pages/dashboard/SuperAdminDashboard';
import EssaiExpire from './pages/dashboard/EssaiExpire';

// ============================================================
// VENTES
// ============================================================
import Clients from './pages/ventes/Clients';
import Commandes from './pages/ventes/Commandes';
import Devis from './pages/ventes/Devis';
import Promotions from './pages/ventes/Promotions';

// ============================================================
// ACHATS
// ============================================================
import Fournisseurs from './pages/achats/Fournisseurs';
import Achats from './pages/achats/Achats';

// ============================================================
// STOCK
// ============================================================
import Produits from './pages/stock/Produits';
import MouvementsStock from './pages/stock/MouvementsStock';
import AlertesStock from './pages/stock/AlertesStock';
import Entrepots from './pages/stock/Entrepots';
import TransfertStock from './pages/stock/TransfertStock';
import Inventaires from './pages/stock/Inventaires';

// ============================================================
// ADMIN
// ============================================================
import Utilisateurs from './pages/admin/Utilisateurs';
import Documents from './pages/admin/Documents';
import Archives from './pages/admin/Archives';

// ============================================================
// CLIENT (portail externe)
// ============================================================
import ClientDashboard from './pages/client/ClientDashboard';
import ClientCommandes from './pages/client/ClientCommandes';
import ClientCommandeDetail from './pages/client/ClientCommandeDetail';
import ClientProduits from './pages/client/ClientProduits';
import ClientFactures from './pages/client/ClientFactures';
import ClientProfil from './pages/client/ClientProfil';
//Finance
import Finance from './pages/Finance/Finance';
//moteur de calcul
import Calculateur from './pages/calculateur/Calculateur';

import './styles/global.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* ============================================================
          ROUTES PUBLIQUES
          ============================================================ */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ============================================================
          ESSAI EXPIRE
          ============================================================ */}
      <Route
        path="/essai-expire"
        element={
          <PrivateRoute allowEssaiExpire>
            <Layout>
              <EssaiExpire />
            </Layout>
          </PrivateRoute>
        }
      />

      {/* ============================================================
          SUPER ADMIN
          ============================================================ */}
      <Route
        path="/superadmin/dashboard"
        element={
          <PrivateRoute superAdminOnly>
            <Layout>
              <SuperAdminDashboard />
            </Layout>
          </PrivateRoute>
        }
      />
      // Route Finance avec Layout → Header + Sidebar apparaissent
<Route
  path="/finance"
  element={
    <PrivateRoute>
      <Layout>
        <Finance />
      </Layout>
    </PrivateRoute>
  }
/>
//calculateur 
<Route
  path="/calculateur"
  element={
    <PrivateRoute>
      <Layout>
        <Calculateur />
      </Layout>
    </PrivateRoute>
  }
/>

      {/* ============================================================
          CLIENT (portail externe)
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
          INTERNE - DASHBOARD
          ============================================================ */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </PrivateRoute>
        }
      />

      {/* ============================================================
          INTERNE - VENTES
          ============================================================ */}
      <Route
        path="/clients"
        element={
          <PrivateRoute>
            <Layout>
              <Clients />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/devis"
        element={
          <PrivateRoute>
            <Layout>
              <Devis />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/commandes"
        element={
          <PrivateRoute>
            <Layout>
              <Commandes />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/promotions"
        element={
          <PrivateRoute>
            <Layout>
              <Promotions />
            </Layout>
          </PrivateRoute>
        }
      />

      {/* ============================================================
          INTERNE - ACHATS
          ============================================================ */}
      <Route
        path="/fournisseurs"
        element={
          <PrivateRoute>
            <Layout>
              <Fournisseurs />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/achats"
        element={
          <PrivateRoute>
            <Layout>
              <Achats />
            </Layout>
          </PrivateRoute>
        }
      />

      {/* ============================================================
          INTERNE - STOCK
          ============================================================ */}
      <Route
        path="/produits"
        element={
          <PrivateRoute>
            <Layout>
              <Produits />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/mouvements-stock"
        element={
          <PrivateRoute>
            <Layout>
              <MouvementsStock />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/alertes-stock"
        element={
          <PrivateRoute>
            <Layout>
              <AlertesStock />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/entrepots"
        element={
          <PrivateRoute>
            <Layout>
              <Entrepots />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/transfert-stock"
        element={
          <PrivateRoute>
            <Layout>
              <TransfertStock />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/inventaires"
        element={
          <PrivateRoute>
            <Layout>
              <Inventaires />
            </Layout>
          </PrivateRoute>
        }
      />

      {/* ============================================================
          INTERNE - ADMIN
          ============================================================ */}
      <Route
        path="/utilisateurs"
        element={
          <PrivateRoute>
            <Layout>
              <Utilisateurs />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/documents"
        element={
          <PrivateRoute>
            <Layout>
              <Documents />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/archives"
        element={
          <PrivateRoute>
            <Layout>
              <Archives />
            </Layout>
          </PrivateRoute>
        }
      />

      {/* ============================================================
          REDIRECTION
          ============================================================ */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;