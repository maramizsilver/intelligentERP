import API from '../utils/api';

const analyticsApi = {
  getAnalytics: (params) => API.get('/analytics', { params })
};

export default analyticsApi;
