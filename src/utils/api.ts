const rawBaseUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');

export const API_BASE_URL = rawBaseUrl;

/**
 * Resolves a relative API or storage path against VITE_API_URL when frontend
 * and backend are hosted on separate origins (e.g. Render Static Site + Render Web Service).
 */
export function apiUrl(path: string): string {
  if (!path) return API_BASE_URL || '/';
  if (/^https?:\/\//i.test(path)) return path;

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
}

/**
 * Wrapper around fetch that automatically prefixes relative API paths with VITE_API_URL.
 */
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), init);
}

