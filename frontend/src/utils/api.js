import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const API = axios.create({ baseURL: BASE_URL, withCredentials: true });

let csrfToken = null;
let csrfPromise = null;

const getCsrfToken = async () => {
  if (csrfToken) return csrfToken;
  if (!csrfPromise) {
    csrfPromise = axios
      .get(`${BASE_URL}/csrf/token`, { withCredentials: true })   // plus d'URL localhost en dur
      .then((r) => { csrfToken = r.data.csrfToken; return csrfToken; })
      .catch((err) => { console.error('Erreur récupération CSRF token:', err); return null; })
      .finally(() => { csrfPromise = null; });
  }
  return csrfPromise;
};

API.interceptors.request.use(async (req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  if (!['GET', 'HEAD', 'OPTIONS'].includes((req.method || 'get').toUpperCase())) {
    const csrf = await getCsrfToken();
    if (csrf) req.headers['X-CSRF-Token'] = csrf;
  }
  return req;
});

// Appels d'auth : un 401 est une réponse NORMALE (mauvais mot de passe), pas une session expirée
const URL_AUTH = /\/auth\/(login|register-entreprise|mfa)|\/reset\//;

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    if (error.response?.status === 401 && !URL_AUTH.test(url)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
      return Promise.reject(error);
    }
    if (error.response?.status === 403 && /csrf/i.test(error.response?.data?.message || '')) {
      csrfToken = null;   // forcera un nouveau token au prochain appel
    }
    return Promise.reject(error);
  }
);

export default API;