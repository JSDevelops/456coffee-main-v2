// Shared fetch wrapper for admin-hq.
// Attaches Authorization: Bearer <jwt> from localStorage on every request,
// drops the token on 401, and exposes the API_BASE constant for direct use
// (sockets, file uploads, etc.) from existing pages that haven't migrated yet.

const defaultApi = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
  ? ''
  : 'http://localhost:5001';

const defaultSocket = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
  ? 'https://api.cafe-coffee.shop'
  : 'http://localhost:5001';

export const API_BASE = `${import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : defaultApi}/api`;
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || defaultSocket;

const TOKEN_KEY = 'admin.authToken';

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
  },
  isLoggedIn(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
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

// In-memory cache for fast tab-switching without network bottleneck
const memoryCache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL_MS = 15000; // 15 seconds fresh cache for instant navigation

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
  options?: { bypassCache?: boolean },
): Promise<T> {
  const isGet = method === 'GET';
  const cacheKey = `${path}`;

  // Cache hit check for GET
  if (isGet && !options?.bypassCache) {
    const cached = memoryCache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
      return cached.data as T;
    }
  }

  // Clear relevant cache on write actions
  if (!isGet) {
    memoryCache.clear();
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: buildHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    if (!path.startsWith('/auth/')) {
      const isDemo = auth.getToken() === 'demo-admin-token';
      if (!isDemo) {
        auth.clear();
        // Reload to bounce back to login screen
        window.location.reload();
      }
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${method} ${path} failed (${res.status}): ${text}`);
  }

  const text = await res.text();
  const parsedData = text ? (JSON.parse(text) as T) : (undefined as T);

  // Store in cache for GET
  if (isGet && parsedData !== undefined) {
    memoryCache.set(cacheKey, { data: parsedData, expiry: Date.now() + CACHE_TTL_MS });
  }

  return parsedData;
}

export const api = {
  get: <T>(path: string, options?: { bypassCache?: boolean }) => request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
  clearCache: () => memoryCache.clear(),
};

/**
 * Build a fetch() Authorization header for legacy code paths that still
 * use raw fetch directly. Spread into the options.headers object.
 */
export function authHeaders(): Record<string, string> {
  const token = auth.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
