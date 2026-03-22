import axios from 'axios';

const api = axios.create({
  // Ustawiamy bazowy URL na '/', aby wszystkie zapytania były względne
  // i mogły być przechwycone przez proxy Vite.
  baseURL: import.meta.env.VITE_API_URL || '/',
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;