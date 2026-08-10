import API from '../utils/api';

const BASE = '/documents-actions';

const documentActionsApi = {
  telechargerPDF: (type, id) => API.post(`${BASE}/${type}/${id}/pdf`, {}, { responseType: 'blob' }),
  telechargerWord: (type, id) => API.post(`${BASE}/${type}/${id}/word`, {}, { responseType: 'blob' }),
  telechargerExcel: (type, id) => API.post(`${BASE}/${type}/${id}/excel`, {}, { responseType: 'blob' }),
  genererEtiquette: (type, id) => API.post(`${BASE}/${type}/${id}/etiquette`),
  envoyerEmail: (type, id, email) => API.post(`${BASE}/${type}/${id}/email`, { email }),
  partagerWhatsapp: (type, id, telephone) => API.post(`${BASE}/${type}/${id}/whatsapp`, { telephone }),
  signer: (type, id) => API.post(`${BASE}/${type}/${id}/sign`),
  archiver: (type, id, motif) => API.post(`${BASE}/${type}/${id}/archive`, { motif }),
  historique: (type, id) => API.post(`${BASE}/${type}/${id}/history`),
  convertirFacture: (id, type_cible) => API.post(`/factures/${id}/convertir`, { type_cible })
};

export default documentActionsApi;