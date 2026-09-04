/**
 * Unified currency and number formatting utilities for Dalilak platform.
 * Uses Intl.NumberFormat with Egyptian Pound (EGP) locale.
 */

/** Format a number as Egyptian Pounds with thousands separator — e.g. 8250 → "8,250 ج.م" */
export const formatEGP = (value: number | undefined | null, showUnit = true): string => {
  const n = typeof value === 'number' && isFinite(value) ? value : 0;
  const formatted = new Intl.NumberFormat('ar-EG', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(n);
  return showUnit ? `${formatted} ج.م` : formatted;
};

/** Format compact number e.g. 5179 → "5,179" (no currency unit) */
export const formatNumber = (value: number | undefined | null): string => {
  const n = typeof value === 'number' && isFinite(value) ? value : 0;
  return new Intl.NumberFormat('ar-EG', {
    maximumFractionDigits: 0,
  }).format(n);
};

/** Format percentage with one decimal — e.g. 66.7 → "66.7%" */
export const formatPercent = (value: number | undefined | null): string => {
  const n = typeof value === 'number' && isFinite(value) ? value : 0;
  return `${n.toFixed(1)}%`;
};
