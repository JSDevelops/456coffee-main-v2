// Hydrate runtime system settings (font, theme, ...) on every app boot.
// Static font @fontsource/sarabun is already bundled in main.tsx.
// Font is locked to Sarabun — no CDN fetch.

import { cachedFetch, getCached } from './cache';

const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api`;
const SETTINGS_KEY = `${API_BASE}/settings`;

const SARABUN_STACK = `'Sarabun', 'Noto Sans Thai', system-ui, -apple-system, sans-serif`;

/** Ensure --app-font is always set to the bundled Sarabun. */
export function applyFontSarabun() {
  document.documentElement.style.setProperty('--app-font', SARABUN_STACK);
}

/** Apply a settings map to the DOM (font locked to Sarabun). */
export function applySettings(_settings: Record<string, string>) {
  applyFontSarabun();
}

/** Fetch settings from API and apply. Uses SWR cache for fast return visits. */
export async function bootstrapSettings(): Promise<Record<string, string>> {
  // Apply Sarabun immediately on first paint.
  applyFontSarabun();

  // Revalidate settings in background (5-minute TTL).
  try {
    const cached = getCached<Record<string, string>>(SETTINGS_KEY);
    if (cached) applySettings(cached);

    const settings = await cachedFetch<Record<string, string>>(SETTINGS_KEY, { ttl: 5 * 60_000 });
    applySettings(settings);
    return settings;
  } catch {
    return {};
  }
}

// Keep loadGoogleFont exported for backwards-compat — no-op.
export function loadGoogleFont(_family: string) {
  applyFontSarabun();
}
