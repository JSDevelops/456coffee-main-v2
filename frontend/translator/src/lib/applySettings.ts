// Hydrate runtime system settings (font, theme, ...) on every app boot.
// The same file is duplicated across the 4 frontends so each can be deployed
// independently. Keep them in sync manually for now.

const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api`;

const DEFAULT_FONT = 'Prompt';
const FALLBACK_STACK = `'Noto Sans Thai', 'Tahoma', system-ui, -apple-system, sans-serif`;

/** Inject (or replace) a Google Fonts <link> for the given family. */
export function loadGoogleFont(family: string) {
  if (!family) return;

  const id = 'app-google-font';
  document.getElementById(id)?.remove();

  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    family,
  )}:wght@300;400;500;600;700;800;900&display=swap`;
  document.head.appendChild(link);

  document.documentElement.style.setProperty(
    '--app-font',
    `'${family}', ${FALLBACK_STACK}`,
  );
}

/** Apply a settings map to the DOM (font today, theme tomorrow). */
export function applySettings(settings: Record<string, string>) {
  loadGoogleFont(settings['font.family'] || DEFAULT_FONT);
}

/** Fetch settings from API and apply. Failures fall back to the default font. */
export async function bootstrapSettings(): Promise<Record<string, string>> {
  // Set the default immediately so first paint isn't unstyled.
  loadGoogleFont(DEFAULT_FONT);

  try {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const settings = (await res.json()) as Record<string, string>;
    applySettings(settings);
    return settings;
  } catch (err) {
    console.warn('[settings] failed to load, using defaults', err);
    return { 'font.family': DEFAULT_FONT };
  }
}
