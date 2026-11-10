/**
 * Safely format and normalize job application URLs to guarantee they never route
 * internally within the SPA or fail due to missing protocol.
 */
export function normalizeJobUrl(url?: string, company?: string, title?: string): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    const query = encodeURIComponent(`${company || 'Technology'} ${title || 'Developer'} careers application`);
    return `https://www.google.com/search?q=${query}`;
  }

  let clean = url.trim();

  // If protocol missing (e.g. "boards.greenhouse.io/xyz" or "jobs.lever.co/xyz")
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `https://${clean}`;
  }

  return clean;
}

/**
 * Generate an authentic direct Google Careers / company search fallback
 */
export function getCompanyCareersSearchUrl(company: string, title?: string): string {
  const query = encodeURIComponent(`${company} ${title || ''} official careers jobs apply`);
  return `https://www.google.com/search?q=${query}`;
}

/**
 * Extract clean display host (e.g. "greenhouse.io", "lever.co", "remotive.com")
 */
export function extractHostname(url?: string): string {
  if (!url) return 'official portal';
  try {
    const parsed = new URL(normalizeJobUrl(url));
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return 'portal';
  }
}

/**
 * Safely open application link in new browser tab without SPA interference
 */
export function openExternalJobApplication(url?: string, company?: string, title?: string): void {
  const finalUrl = normalizeJobUrl(url, company, title);
  window.open(finalUrl, '_blank', 'noopener,noreferrer');
}
