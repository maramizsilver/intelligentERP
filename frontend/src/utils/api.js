import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
});

// INTERCEPTOR DE REQUETE
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  
  const entrepriseId = localStorage.getItem('entrepriseId');
  if (entrepriseId) {
    req.headers['X-Enterprise-Id'] = entrepriseId;
  }
  
  return req;
});
// INTERCEPTOR DE REPONSE - GESTION DES ERREURS 401
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si le token a expire ou est invalide
    if (error.response?.status === 401) {
      // Nettoyer le localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('entrepriseId');
      
      //  vers la page de connexion
      window.location.href = '/';
      
      // Retourner une erreur personnalisee
      return Promise.reject({
        ...error,
        message: 'Session expiree, veuillez vous reconnecter'
      });
    }
    
    // Pour les autres erreurs, les propager normalement
    return Promise.reject(error);
  }
);

export default API;