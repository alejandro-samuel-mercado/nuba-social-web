import axios from 'axios';

export const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'
).replace(/\/+$/, '');

export function resolveMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${API_BASE}${url}`;
  return `${API_BASE}/${url}`;
}

export const api = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('nuba_club_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const msg = err.response?.data?.error || err.message || 'Error de conexión';
    return Promise.reject(new Error(msg));
  }
);

export async function uploadImageWeb(
  file: File,
  folder: 'posts' | 'teams' | 'chat' | 'avatars' | 'giveaways' | 'general' = 'general'
): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post(`/upload/single?folder=${folder}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.url as string;
}
