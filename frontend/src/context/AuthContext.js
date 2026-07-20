import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [permissions, setPermissions] = useState([]);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && user) {
      loadPermissions();
    } else {
      setPermissionsLoaded(true);
    }
  }, []);

  const loadPermissions = async () => {
    try {
      const res = await API.get('/auth/mes-permissions');
      setPermissions(res.data.permissions || []);
    } catch (err) {
      setPermissions([]);
    } finally {
      setPermissionsLoaded(true);
    }
  };

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    
    if (userData.entreprise_id) {
      localStorage.setItem('entrepriseId', userData.entreprise_id);
    }
    
    setUser(userData);
    setPermissionsLoaded(false);
    loadPermissions();
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('entrepriseId');
    setUser(null);
    setPermissions([]);
    setPermissionsLoaded(true);
  };

  const hasPermission = (moduleNom, action) => {
    // Les super admins ont tout
    if (user?.is_super_admin) return true;
    
    // Les externes n'ont pas de permissions métier
    if (user?.is_external) return false;
    
    // Vérification des permissions
    const mod = permissions.find(p => p.module_nom === moduleNom);
    return !!(mod && mod[action]);
  };

  return (
    <AuthContext.Provider value={{
      user, login, logout, permissions, permissionsLoaded, hasPermission,
      loading: !permissionsLoaded
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);