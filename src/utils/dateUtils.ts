/**
 * Date and relative time formatting utilities for JobPilot AI
 */

/**
 * Formats a date string (ISO 8601 or timestamp) into a human-friendly relative duration.
 * e.g., "Just now", "25m ago", "4h ago", "Yesterday", "3d ago", "2w ago", "1mo ago"
 */
export function formatTimeAgo(dateString?: string | null): string {
  if (!dateString) return 'Recently';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Recently';

  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();

  // Handle small clock skew or future dates gracefully
  if (diffInMs < 0 && diffInMs > -120000) {
    return 'Just now';
  }
  if (diffInMs < 0) {
    return 'Recently';
  }

  const diffInSecs = Math.floor(diffInMs / 1000);
  const diffInMins = Math.floor(diffInSecs / 60);
  const diffInHours = Math.floor(diffInMins / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMins < 1) {
    return 'Just now';
  }
  if (diffInMins < 60) {
    return `${diffInMins}m ago`;
  }
  if (diffInHours === 1) {
    return '1h ago';
  }
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  if (diffInDays === 1) {
    return 'Yesterday';
  }
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }
  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks}w ago`;
  }
  const months = Math.floor(diffInDays / 30);
  if (months === 1) {
    return '1mo ago';
  }
  if (months < 12) {
    return `${months}mo ago`;
  }
  const years = Math.floor(diffInDays / 365);
  return `${years}y ago`;
}

/**
 * Formats a date string into a clean localized short date.
 * e.g., "Sep 23, 2026"
 */
export function formatShortDate(dateString?: string | null): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
