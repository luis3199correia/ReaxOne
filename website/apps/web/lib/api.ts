import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  withCredentials: true, // Envia cookies httpOnly automaticamente
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: redireciona para login se 401
// Não redireciona se já estiver na página de auth (evita loop)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname;
      const alreadyOnAuth = path.includes('/auth');
      if (!alreadyOnAuth) {
        const locale = path.split('/')[1] || 'pt';
        window.location.href = `/${locale}/auth`;
      }
    }
    return Promise.reject(error);
  }
);
