// Lightweight stale-while-revalidate cache for read-only API endpoints.
//
//   - getCached<T>(key)        — sync read of last-known value, or undefined
//   - cachedFetch<T>(url, opts) — async; returns cached if fresh, else fetches
//   - swr<T>(url, cb, opts)    — fires cb(cache) immediately if available,
//                                then refetches and fires cb(fresh) when newer.
//                                Returns a cancel function.
//   - useSWR<T>(url, opts)     — hook variant, returns { data, loading, refresh }
//
// Two-tier persistence:
//   - Memory map (instant, in-process)
//   - localStorage (survives full reload / app restart) — so cold-start paint
//     is instant when the user re-enters within an hour or two.
//
// The cache de-duplicates inflight requests for the same URL and falls back
// to the previous value when revalidation fails (offline, server hiccup).

import { useEffect, useRef, useState } from 'react';

type Entry<T> = { data: T; ts: number };

const STORAGE_KEY = '456c.cache.v2';
// Anything older than MAX_AGE_MS is dropped at boot — keeps localStorage tight.
const MAX_AGE_MS = 24 * 60 * 60 * 1000;   // 24 hours

const memCache = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

let storageHydrated = false;
function hydrate() {
  if (storageHydrated) return;
  storageHydrated = true;
  try {
    // Prefer localStorage so cold restarts paint instantly. Fall back to
    // sessionStorage if local is unavailable (private mode / quota).
    const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const obj = JSON.parse(raw) as Record<string, Entry<unknown>>;
    const now = Date.now();
    for (const [k, v] of Object.entries(obj)) {
      if (!v || typeof v !== 'object' || !('data' in v) || !('ts' in v)) continue;
      if (now - v.ts > MAX_AGE_MS) continue;
      memCache.set(k, v);
    }
  } catch { /* ignore */ }
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;
function persist() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try {
      const obj: Record<string, Entry<unknown>> = {};
      for (const [k, v] of memCache) obj[k] = v;
      const json = JSON.stringify(obj);
      try { localStorage.setItem(STORAGE_KEY, json); }
      catch { sessionStorage.setItem(STORAGE_KEY, json); }
    } catch { /* quota / private mode */ }
  }, 200);
}

export function getCached<T>(key: string): T | undefined {
  hydrate();
  return memCache.get(key)?.data as T | undefined;
}

/** Returns the cache entry's age in ms, or Infinity if not present. */
export function cacheAge(key: string): number {
  hydrate();
  const e = memCache.get(key);
  return e ? Date.now() - e.ts : Infinity;
}

export function setCached<T>(key: string, data: T) {
  memCache.set(key, { data, ts: Date.now() });
  persist();
}

export function invalidate(prefix?: string) {
  if (!prefix) { memCache.clear(); persist(); return; }
  for (const k of [...memCache.keys()]) if (k.startsWith(prefix)) memCache.delete(k);
  persist();
}

async function doFetch<T>(url: string): Promise<T> {
  const existing = inflight.get(url);
  if (existing) return existing as Promise<T>;

  const p = fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error(`fetch ${url} failed (${r.status})`);
      return r.json() as Promise<T>;
    })
    .then((data) => {
      setCached(url, data);
      inflight.delete(url);
      return data;
    })
    .catch((e) => {
      inflight.delete(url);
      throw e;
    });

  inflight.set(url, p as Promise<unknown>);
  return p;
}

export interface CachedFetchOpts {
  /** Time-to-live in ms before we consider cached data stale. Default 60s. */
  ttl?: number;
  /** Force a network request even if cache is fresh. */
  force?: boolean;
}

export async function cachedFetch<T>(url: string, opts?: CachedFetchOpts): Promise<T> {
  hydrate();
  const ttl = opts?.ttl ?? 60_000;
  const entry = memCache.get(url) as Entry<T> | undefined;
  if (entry && !opts?.force && Date.now() - entry.ts < ttl) return entry.data;
  try {
    return await doFetch<T>(url);
  } catch (err) {
    // If we have *any* cache, prefer it over throwing — keeps the UI alive
    // when the network momentarily drops.
    if (entry) return entry.data;
    throw err;
  }
}

/** Stale-while-revalidate: fires cb with cache immediately (if any) then with fresh. */
export function swr<T>(
  url: string,
  cb: (data: T, source: 'cache' | 'fresh') => void,
  opts?: CachedFetchOpts,
): () => void {
  hydrate();
  const ttl = opts?.ttl ?? 60_000;
  const entry = memCache.get(url) as Entry<T> | undefined;
  let cancelled = false;

  if (entry) cb(entry.data, 'cache');

  const stale = !entry || Date.now() - entry.ts > ttl || !!opts?.force;
  if (stale) {
    doFetch<T>(url)
      .then((data) => { if (!cancelled) cb(data, 'fresh'); })
      .catch(() => { /* swallow — UI keeps the stale value */ });
  }

  return () => { cancelled = true; };
}

/** Hook: returns { data, loading, refresh } with SWR semantics. */
export function useSWR<T>(url: string | null, opts?: CachedFetchOpts) {
  const [data, setData] = useState<T | undefined>(() =>
    url ? getCached<T>(url) : undefined,
  );
  const [loading, setLoading] = useState<boolean>(() =>
    !url ? false : !getCached<T>(url),
  );
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    if (!url) { setData(undefined); setLoading(false); return; }
    setLoading(!getCached<T>(url));
    return swr<T>(url, (d) => {
      setData(d);
      setLoading(false);
    }, optsRef.current);
  }, [url]);

  const refresh = () => {
    if (!url) return;
    setLoading(true);
    return swr<T>(url, (d) => { setData(d); setLoading(false); }, { ...optsRef.current, force: true });
  };

  return { data, loading, refresh };
}

/**
 * Eagerly resolve a list of URLs in parallel and seed the cache. Use this on
 * app boot to warm critical data before any page mounts.
 */
export function prefetchMany(urls: string[], ttl = 60_000) {
  for (const url of urls) cachedFetch(url, { ttl }).catch(() => {});
}

/**
 * Preload images so they paint instantly when a page later renders them.
 * Uses <link rel="preload" as="image"> when supported.
 */
export function preloadImages(urls: (string | undefined | null)[]) {
  if (typeof document === 'undefined') return;
  const seen = new Set<string>();
  for (const u of urls) {
    if (!u) continue;
    if (seen.has(u)) continue;
    seen.add(u);
    // Skip if already preloaded
    if (document.querySelector(`link[rel="preload"][href="${CSS.escape(u)}"]`)) continue;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = u;
    // Use lower fetch priority — these are warm-ups, not critical-path.
    (link as any).fetchPriority = 'low';
    document.head.appendChild(link);
  }
}
