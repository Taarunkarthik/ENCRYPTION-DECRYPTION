import axios from 'axios';
import { supabase } from './supabaseClient';

const API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete (config.headers as any)['Content-Type'];
    delete (config.headers as any)['content-type'];
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (!refreshError && session?.access_token) {
        originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
        return api(originalRequest);
      }
    }
    return Promise.reject(error);
  }
);

export const textService = {
  encryptText: async (text: string, passphrase: string) => {
    const response = await api.post('/text/encrypt', { text, passphrase });
    return response.data;
  },
  decryptText: async (encryptedTextBase64: string, passphrase: string) => {
    const response = await api.post('/text/decrypt', { encryptedTextBase64, passphrase });
    return response.data;
  },
};

export default api;
