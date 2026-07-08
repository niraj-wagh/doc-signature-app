import axios from 'axios';

const API_BASE = 'https://doc-signature-app-backend.onrender.com/api';
const ROOT_BASE = 'https://doc-signature-app-backend.onrender.com';

const api = axios.create({
  baseURL: API_BASE,
});

export const getFileUrl = (path) => `${ROOT_BASE}${path}`;

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401s by attempting a token refresh once
let isRefreshing = false;
let refreshQueue = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject, originalRequest });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${ROOT_BASE}/api/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);

        refreshQueue.forEach(({ resolve, originalRequest: queuedReq }) => {
          queuedReq.headers.Authorization = `Bearer ${data.accessToken}`;
          resolve(api(queuedReq));
        });
        refreshQueue = [];

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
