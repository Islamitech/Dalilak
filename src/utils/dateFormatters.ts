import { Business } from '../types';

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

/**
 * Format activity creation date and time with clear English digits (0-9)
 * e.g. "23 أغسطس 2026 • 10:58 م" or "23 أغسطس 2026"
 */
export function formatActivityDateTime(dateStr?: string): string {
  if (!dateStr) return 'غير محدد';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const day = d.getDate();
    const month = ARABIC_MONTHS[d.getMonth()];
    const year = d.getFullYear();

    const hasTime = dateStr.includes('T') || (dateStr.includes(':') && dateStr.length > 10);

    if (!hasTime) {
      return `${day} ${month} ${year}`;
    }

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const period = hours >= 12 ? 'م' : 'ص';
    hours = hours % 12 || 12;

    return `${day} ${month} ${year} • ${hours}:${minutes} ${period}`;
  } catch {
    return dateStr;
  }
}

/**
 * Sort businesses in descending order based on creation date/time (Newest on top, Oldest at the bottom)
 */
export function sortBusinessesNewestFirst(list: Business[]): Business[] {
  return [...list].sort((a, b) => {
    const timeA = a.createdDate
      ? new Date(a.createdDate).getTime()
      : a.invoiceDate
      ? new Date(a.invoiceDate).getTime()
      : 0;
    const timeB = b.createdDate
      ? new Date(b.createdDate).getTime()
      : b.invoiceDate
      ? new Date(b.invoiceDate).getTime()
      : 0;

    if (timeB !== timeA) {
      return timeB - timeA; // Newest first
    }

    // Fallback tie-breaker: compare ID descending
    return (b.id || '').localeCompare(a.id || '');
  });
}
