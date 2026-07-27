import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  withCredentials: true
});

let csrfToken = null;
let csrfFetching = false;

const getCsrfToken = async () => {
  if (csrfToken) return csrfToken;
  
  if (csrfFetching) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return csrfToken;
  }
  
  csrfFetching = true;
  try {
    const response = await axios.get('http://localhost:5000/api/csrf/token', {
      withCredentials: true
    });
    csrfToken = response.data.csrfToken;
    return csrfToken;
  } catch (err) {
    console.error('Erreur recuperation CSRF token:', err);
    return null;
  } finally {
    csrfFetching = false;
  }
};

API.interceptors.request.use(async (req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  
  const entrepriseId = localStorage.getItem('entrepriseId');
  if (entrepriseId) {
    req.headers['X-Enterprise-Id'] = entrepriseId;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
    const csrf = await getCsrfToken();
    if (csrf) {
      req.headers['X-CSRF-Token'] = csrf;
    }
  }
  
  return req;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('entrepriseId');
      window.location.href = '/';
      return Promise.reject({
        ...error,
        message: 'Session expiree, veuillez vous reconnecter'
      });
    }
    
    if (error.response?.status === 403 && error.response?.data?.message?.includes('csrf')) {
      csrfToken = null;
      return Promise.reject({
        ...error,
        message: 'Token CSRF invalide, veuillez reessayer'
      });
    }
    
    return Promise.reject(error);
  }
);

export default API;