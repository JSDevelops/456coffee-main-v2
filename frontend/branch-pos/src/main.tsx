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

bootstrapSettings();

const settingsSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5001');
settingsSocket.on('settings-updated', (settings: Record<string, string>) => {
  applySettings(settings);
});

// Global fetch interceptor — every role view (POS/Barista/QC/Dispatch/...) uses
// raw fetch(); this attaches the staff JWT and reloads to PIN screen on 401.
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
