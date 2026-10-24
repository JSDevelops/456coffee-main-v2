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

// Hydrate font/theme settings as early as possible. Fire-and-forget — the
// bootstrap function paints a default font immediately and patches once
// the API responds.
bootstrapSettings();

// Live-update settings whenever an admin saves new ones.
const defaultSocketUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
  ? 'https://api.cafe-coffee.shop'
  : 'http://localhost:5001';
const settingsSocket = io(import.meta.env.VITE_API_URL || defaultSocketUrl);
settingsSocket.on('settings-updated', (settings: Record<string, string>) => {
  applySettings(settings);
});

// Global fetch interceptor: every request to our API gets the Bearer token
// from localStorage, and any 401 response auto-clears the token + reloads
// to bounce the user back to LoginPage. This means existing pages that use
// raw fetch() don't need to be touched — they get auth for free.
const originalFetch = window.fetch.bind(window);
window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

  // Only attach token for our own API calls
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
    auth.clear();
    window.location.reload();
  }

  return res;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
