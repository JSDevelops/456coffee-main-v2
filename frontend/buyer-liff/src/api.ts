// Tiny fetch wrapper that automatically attaches the JWT bearer token
// (if present in localStorage) and parses JSON responses.
//
// Usage:
//   import { api } from './api';
//   const branches = await api.get<Branch[]>('/branches');
//   const created  = await api.post<Order>('/orders', payload);

const defaultApi = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
  ? 'https://api.cafe-coffee.shop'
  : 'http://localhost:5001';

export const API_BASE = `${import.meta.env.VITE_API_URL || defaultApi}/api`;

const TOKEN_KEY = 'authToken';

export const auth = {
  setToken(token: string | null) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  },
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('memberId');
  },
};

function buildHeaders(extra?: HeadersInit): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extra as Record<string, string> | undefined),
  };
  const token = auth.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: buildHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    // Token rejected — drop it so the user re-authenticates next time.
    auth.clear();
  }
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${method} ${path} failed (${res.status}): ${text}`);
  }
  // Some endpoints return empty body on 200/204
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
