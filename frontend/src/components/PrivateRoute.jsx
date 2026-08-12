// src/components/PrivateRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LoadingSpinner from './common/LoadingSpinner';

export default function PrivateRoute({
  children,
  superAdminOnly = false,
  externalOnly = false,
  allowEssaiExpire = false,
  allowSuperAdmin = false, 
}) {
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return <LoadingSpinner size="lg" text={t('chargement_verification') || 'Chargement...'} />;
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  // Si la route est réservée aux SuperAdmin
  if (superAdminOnly && !user.is_super_admin) {
    return <Navigate to={user.is_external ? '/client/dashboard' : '/dashboard'} />;
  }

  // Si la route est réservée aux clients externes
  if (externalOnly && !user.is_external) {
    return <Navigate to={user.is_super_admin ? '/superadmin/dashboard' : '/dashboard'} />;
  }

  if (!superAdminOnly && !externalOnly) {
    if (user.is_super_admin && !allowSuperAdmin) {
      return <Navigate to="/superadmin/dashboard" />;
    }
    if (user.is_external) {
      return <Navigate to="/client/dashboard" />;
    }
    if (user.essai_expire && !allowEssaiExpire) {
      return <Navigate to="/essai-expire" />;
    }
  }

  return children;
}