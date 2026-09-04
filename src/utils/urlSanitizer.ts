/**
 * 🛡️ Security Utility: URL Sanitizer
 * Prevents Cross-Site Scripting (XSS) via `javascript:`, `data:`, `vbscript:`, etc.
 * Ensures only trusted web protocols (http, https, tel, mailto) are rendered in anchor hrefs.
 */

export function sanitizeExternalUrl(url?: string | null, fallback = '#'): string {
  if (!url || typeof url !== 'string') return fallback;

  const trimmed = url.trim();
  if (!trimmed) return fallback;

  // Reject explicit dangerous schemes
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return fallback;
  }

  // Allowed safe protocols
  if (
    lower.startsWith('https://') ||
    lower.startsWith('http://') ||
    lower.startsWith('tel:') ||
    lower.startsWith('mailto:')
  ) {
    return trimmed;
  }

  // If it starts with // (protocol-relative), prepend https:
  if (lower.startsWith('//')) {
    return `https:${trimmed}`;
  }

  return fallback;
}
