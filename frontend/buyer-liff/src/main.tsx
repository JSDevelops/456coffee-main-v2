import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { io } from 'socket.io-client'
import '@fontsource/sarabun/300.css'
import '@fontsource/sarabun/400.css'
import '@fontsource/sarabun/500.css'
import '@fontsource/sarabun/600.css'
import '@fontsource/sarabun/700.css'
import '@fontsource/sarabun/800.css'
import './index.css'
import App from './App.tsx'
import { API_BASE, auth } from './api'
import { bootstrapSettings, applySettings } from './lib/applySettings'
import { setCached, preloadImages } from './lib/cache'

bootstrapSettings();

// Kick off menu data + image warmup before React even mounts. The fetch races
// in parallel with the JS chunk parse and is usually done by the time any
// page mounts.
const defaultApi = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
  ? 'https://api.cafe-coffee.shop'
  : 'http://localhost:5001';

const API = `${import.meta.env.VITE_API_URL || defaultApi}/api`;
fetch(`${API}/menu`)
  .then((r) => r.ok ? r.json() : null)
  .then((data) => {
    if (Array.isArray(data)) {
      setCached(`${API}/menu`, data);
      preloadImages(data.slice(0, 8).map((m: any) => m?.imageUrl).filter(Boolean));
    }
  })
  .catch(() => {});
fetch(`${API}/branches`)
  .then((r) => r.ok ? r.json() : null)
  .then((data) => { if (Array.isArray(data)) setCached(`${API}/branches`, data); })
  .catch(() => {});
fetch(`${API}/categories`)
  .then((r) => r.ok ? r.json() : null)
  .then((data) => { if (Array.isArray(data)) setCached(`${API}/categories`, data); })
  .catch(() => {});

const settingsSocket = io(import.meta.env.VITE_API_URL || defaultApi);
settingsSocket.on('settings-updated', (settings: Record<string, string>) => {
  applySettings(settings);
  setCached(`${API}/settings`, settings);
});

// Global fetch interceptor — automatically attaches the customer JWT to every
// API request and clears it on 401 so existing pages keep working without
// modification.
const originalFetch = window.fetch.bind(window);
window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
  const url =
    typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

  if (url.startsWith(API_BASE)) {
    const token = auth.getToken();
    if (token) {
      const headers = new Headers(init.headers || {});
      if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
      init = { ...init, headers };
    }
  }

  const res = await originalFetch(input, init);

  if (res.status === 401 && url.startsWith(API_BASE) && !url.includes('/auth/')) {
    // Don't reload — buyer-liff has anonymous browsing. Just drop the token
    // so the next protected action triggers AuthModal.
    auth.clear();
  }

  return res;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
