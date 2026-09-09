/**
 * Phone Formatter & URL Encoding Utilities for WhatsApp
 * Provides robust international and Egyptian phone formatting,
 * text sanitization, and safe URL encoding.
 */

export function formatWhatsAppPhone(phone?: string): string {
  if (!phone) return '';
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';

  if (trimmed.startsWith('+')) {
    return digits;
  }
  if (digits.startsWith('20')) {
    return digits;
  }
  const intlPrefixes = ['966', '971', '965', '968', '974', '973', '962', '218', '249', '1', '44', '49', '33'];
  if (intlPrefixes.some((p) => digits.startsWith(p)) && digits.length >= 10) {
    return digits;
  }
  const localClean = digits.replace(/^0+/, '');
  return `20${localClean}`;
}

export const BIDI_CONTROL_REGEX = /[\u200E\u200F\u061C\u202A-\u202E\u2066-\u2069\uFEFF]/g;

export function cleanWhatsAppText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(BIDI_CONTROL_REGEX, '')
    .replace(/[\uFE00-\uFE0F\u200B-\u200D\uFFFD\u00A0]/g, ' ')
    .replace(/\r\n/g, '\n')
    .trim();
}

export function safeWhatsAppEncode(text: string): string {
  const cleaned = cleanWhatsAppText(text);
  return encodeURIComponent(cleaned)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
}
