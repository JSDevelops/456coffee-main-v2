// Hydrate runtime system settings (font, theme, ...) on every app boot.
// Static font @fontsource/sarabun is already bundled in main.tsx.
// This file now only applies theme/colour settings; font is locked to Sarabun.

const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api`;

const SARABUN_STACK = `'Sarabun', 'Noto Sans Thai', system-ui, -apple-system, sans-serif`;

/** Ensure --app-font is always set to the bundled Sarabun. */
export function applyFontSarabun() {
  document.documentElement.style.setProperty('--app-font', SARABUN_STACK);
}

/** Apply a settings map to the DOM (font locked, colour/theme support ready). */
export function applySettings(_settings: Record<string, string>) {
  // Font is static Sarabun — never override from server settings.
  applyFontSarabun();
}

/** Fetch settings from API and apply. Failures gracefully ignored. */
export async function bootstrapSettings(): Promise<Record<string, string>> {
  // Apply Sarabun immediately on first paint.
  applyFontSarabun();

  try {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const settings = (await res.json()) as Record<string, string>;
    applySettings(settings);
    return settings;
  } catch {
    return {};
  }
}

// Keep loadGoogleFont exported for backwards-compat but no-op it.
export function loadGoogleFont(_family: string) {
  applyFontSarabun();
}
