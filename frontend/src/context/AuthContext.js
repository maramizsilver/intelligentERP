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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Appelé après un login réussi : (user, token) viennent de la réponse /auth/login
  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setPermissionsLoaded(false);
    loadPermissions();
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setPermissions([]);
    setPermissionsLoaded(true);
  };

  // hasPermission('Ventes', 'creation') -> true/false
  // Le SuperAdmin n'a jamais de permissions métier ; les externes suivent une logique séparée (portail).
  const hasPermission = (moduleNom, action) => {
    if (!user || user.is_super_admin || user.is_external) return false;
    const mod = permissions.find(p => p.module_nom === moduleNom);
    return !!(mod && mod[action]);
  };

  return (
    <AuthContext.Provider value={{
      user, login, logout, permissions, permissionsLoaded, hasPermission,
      loading: !permissionsLoaded // alias pour compatibilité avec l'ancien code (PrivateRoute)
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
