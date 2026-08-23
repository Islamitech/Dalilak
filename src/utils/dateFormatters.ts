import { Business } from '../types';

/**
 * Format activity creation date and time in a clear Arabic format
 * e.g. "23 أغسطس 2026 • 09:30 م" or "2026-08-23"
 */
export function formatActivityDateTime(dateStr?: string): string {
  if (!dateStr) return 'غير محدد';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    // Check if timestamp contains time component
    const hasTime = dateStr.includes('T') || (dateStr.includes(':') && dateStr.length > 10);

    const dateOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };

    const formattedDate = d.toLocaleDateString('ar-EG', dateOptions);

    if (!hasTime) {
      return formattedDate;
    }

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };

    const formattedTime = d.toLocaleTimeString('ar-EG', timeOptions);

    return `${formattedDate} • ${formattedTime}`;
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
