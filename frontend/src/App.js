import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import PrivateRoute from './components/PrivateRoute';
import SecuriteMFA from './pages/admin/SecuriteMFA';
import Notifications from './pages/Notifications';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

import Dashboard from './pages/dashboard/Dashboard';
import SuperAdminDashboard from './pages/dashboard/SuperAdminDashboard';
import EssaiExpire from './pages/dashboard/EssaiExpire';

import Clients from './pages/ventes/Clients';
import Commandes from './pages/ventes/Commandes';
import Devis from './pages/ventes/Devis';
import Promotions from './pages/ventes/Promotions';

import Fournisseurs from './pages/achats/Fournisseurs';
import Achats from './pages/achats/Achats';

import Produits from './pages/stock/Produits';
import MouvementsStock from './pages/stock/MouvementsStock';
import AlertesStock from './pages/stock/AlertesStock';
import Entrepots from './pages/stock/Entrepots';
import TransfertStock from './pages/stock/TransfertStock';
import Inventaires from './pages/stock/Inventaires';

import Utilisateurs from './pages/admin/Utilisateurs';
import Documents from './pages/admin/Documents';
import Archives from './pages/admin/Archives';
import SuperAdminSessions from './pages/admin/superadmin/SuperAdminSessions';

import TauxReference from './pages/admin/superadmin/TauxReference';

import ClientDashboard from './pages/client/ClientDashboard';
import ClientCommandes from './pages/client/ClientCommandes';
import ClientCommandeDetail from './pages/client/ClientCommandeDetail';
import ClientProduits from './pages/client/ClientProduits';
import ClientFactures from './pages/client/ClientFactures';
import ClientProfil from './pages/client/ClientProfil';

import Finance from './pages/Finance/Finance';
import Calculateur from './pages/calculateur/Calculateur';

import PaiementClient from './pages/paiement/PaiementClient';
import PaiementClientSuccess from './pages/paiement/PaiementClientSuccess';
import PaiementFournisseur from './pages/paiement/PaiementFournisseur';
import PaiementFournisseurSuccess from './pages/paiement/PaiementFournisseurSuccess';
import PaiementCancel from './pages/paiement/PaiementCancel';
import AbonnementSuccess from './pages/paiement/AbonnementSuccess';

import './styles/global.css';
import './styles/print.css';

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
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />

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

      <Route
        path="/superadmin/taux-reference"
        element={
          <PrivateRoute superAdminOnly>
            <Layout>
              <TauxReference />
            </Layout>
          </PrivateRoute>
        }
      />

      <Route
        path="/superadmin/sessions"
        element={
          <PrivateRoute superAdminOnly>
            <Layout>
              <SuperAdminSessions />
            </Layout>
          </PrivateRoute>
        }
      />

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
      <Route
        path="/notifications"
        element={
          <PrivateRoute>
            <Layout>
              <Notifications />
            </Layout>
          </PrivateRoute>
        }
      />

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

      <Route
        path="/securite/mfa"
        element={
          <PrivateRoute>
            <Layout>
              <SecuriteMFA />
            </Layout>
          </PrivateRoute>
        }
      />

      <Route
        path="/paiement/client"
        element={
          <PrivateRoute>
            <Layout>
              <PaiementClient />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/paiement/client/success"
        element={
          <PrivateRoute>
            <PaiementClientSuccess />
          </PrivateRoute>
        }
      />
      <Route
        path="/paiement/cancel"
        element={
          <PrivateRoute>
            <PaiementCancel />
          </PrivateRoute>
        }
      />
      <Route
        path="/paiement/fournisseur"
        element={
          <PrivateRoute>
            <Layout>
              <PaiementFournisseur />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/paiement/fournisseur/success"
        element={
          <PrivateRoute>
            <PaiementFournisseurSuccess />
          </PrivateRoute>
        }
      />
      <Route
        path="/paiement/fournisseur/cancel"
        element={
          <PrivateRoute>
            <PaiementCancel />
          </PrivateRoute>
        }
      />
      <Route
        path="/paiement/abonnement-success"
        element={<AbonnementSuccess />}
      />
      <Route
        path="/paiement/abonnement-cancel"
        element={<PaiementCancel />}
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;