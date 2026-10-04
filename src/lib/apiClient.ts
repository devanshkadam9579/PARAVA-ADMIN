/**
 * PARAVA ADMIN CONSOLE — AUTHENTICATED API CLIENT
 * Attaches verified Firebase ID token to all administrative requests.
 */

import { getAuthInstance } from './firebase';

export const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || import.meta.env.VITE_BACKEND_URL || 'https://parava-backend-1.onrender.com';

export async function getAuthToken(): Promise<string | null> {
  try {
    const auth = getAuthInstance();
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch (err) {
    console.warn('[ApiClient] Failed to acquire ID token:', err);
    return null;
  }
}

export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, {
    ...options,
    headers
  });
}

export const apiClient = {
  get: (url: string, options?: RequestInit) => authenticatedFetch(url, { ...options, method: 'GET' }),
  post: (url: string, body?: any, options?: RequestInit) => authenticatedFetch(url, {
    ...options,
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body)
  }),
  delete: (url: string, options?: RequestInit) => authenticatedFetch(url, { ...options, method: 'DELETE' })
};
