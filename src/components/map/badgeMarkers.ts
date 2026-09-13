import { Business } from '../../types';
import { escapeHtml } from './mapTypes';

export interface CategoryBadgeConfig {
  bg: string;
  borderColor: string;
  iconSvg: string;
}

/**
 * Lightweight, high-performance category logo badges:
 * Simple vector paths, zero SVG defs, zero filters, zero lag.
 */
export function getCategoryBadgeConfig(category: string = ''): CategoryBadgeConfig {
  const cat = (category || '').toLowerCase();

  // 1. Food & Cafes (Amber)
  if (
    cat.includes('مطاعم') ||
    cat.includes('مطعم') ||
    cat.includes('كافيه') ||
    cat.includes('مقهى') ||
    cat.includes('أكل') ||
    cat.includes('مأكولات') ||
    cat.includes('حلويات') ||
    cat.includes('مخبز') ||
    cat.includes('مشويات') ||
    cat.includes('عصائر')
  ) {
    return {
      bg: '#f59e0b',
      borderColor: '#fbbf24',
      iconSvg:
        '<path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2M15 2v19M5 2v4a3 3 0 0 0 3 3v0a3 3 0 0 0 3-3V2M8 9v12"/>',
    };
  }

  // 2. Supermarkets & Groceries (Emerald)
  if (
    cat.includes('سوبر') ||
    cat.includes('ماركت') ||
    cat.includes('بقالة') ||
    cat.includes('تموين') ||
    cat.includes('هايبر') ||
    cat.includes('خضروات') ||
    cat.includes('لحوم') ||
    cat.includes('جزارة') ||
    cat.includes('فواكه')
  ) {
    return {
      bg: '#10b981',
      borderColor: '#34d399',
      iconSvg:
        '<circle cx="8" cy="21" r="1.5" fill="#ffffff"/><circle cx="19" cy="21" r="1.5" fill="#ffffff"/><path d="M2.5 2.5h2.5l2.4 12a2 2 0 0 0 2 1.6h9.6a2 2 0 0 0 1.9-1.5l1.6-7.5H5.4"/>',
    };
  }

  // 3. Health, Clinics & Pharmacies (Sky Blue)
  if (
    cat.includes('صيدل') ||
    cat.includes('طبي') ||
    cat.includes('عياد') ||
    cat.includes('مستشفى') ||
    cat.includes('علاج') ||
    cat.includes('أسنان') ||
    cat.includes('صحة') ||
    cat.includes('تحاليل') ||
    cat.includes('أشعة')
  ) {
    return {
      bg: '#0284c7',
      borderColor: '#38bdf8',
      iconSvg:
        '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7ZM8.5 8.5l7 7"/>',
    };
  }

  // 4. Fashion & Clothing (Purple)
  if (
    cat.includes('ملابس') ||
    cat.includes('أزياء') ||
    cat.includes('فاشون') ||
    cat.includes('أحذية') ||
    cat.includes('موضة') ||
    cat.includes('عبايات') ||
    cat.includes('بدل')
  ) {
    return {
      bg: '#8b5cf6',
      borderColor: '#a78bfa',
      iconSvg:
        '<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>',
    };
  }

  // 5. Automotive & Maintenance (Rose Red)
  if (
    cat.includes('سيار') ||
    cat.includes('صيانة') ||
    cat.includes('مركبات') ||
    cat.includes('أوتو') ||
    cat.includes('كاوتش') ||
    cat.includes('ميكانيك') ||
    cat.includes('زيوت')
  ) {
    return {
      bg: '#f43f5e',
      borderColor: '#fb7185',
      iconSvg:
        '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="1.8" fill="#ffffff"/><path d="M9 17h6"/><circle cx="17" cy="17" r="1.8" fill="#ffffff"/>',
    };
  }

  // 6. General Commercial & Services (Indigo)
  return {
    bg: '#6366f1',
    borderColor: '#818cf8',
    iconSvg:
      '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18ZM6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2ZM18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2ZM10 6h4M10 10h4M10 14h4M10 18h4"/>',
  };
}

/**
 * Creates a lightweight, high-performance circular logo badge for a business
 */
export function createLightweightBadgeHtml(
  biz: Business,
  isSelected: boolean,
  showFullPill: boolean
): { html: string; iconSize: [number, number]; iconAnchor: [number, number] } {
  const cfg = getCategoryBadgeConfig(biz.category);
  const isVerified = biz.verificationStatus === 'verified';
  const safeName = escapeHtml(biz.nameAr || 'منشأة معتمدة');

  if (showFullPill || isSelected) {
    // Zoomed in or selected: sleek compact pill with logo + title + checkmark
    const html = `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; user-select: none; width: 180px; font-family: Cairo, Tajawal, sans-serif;">
        <div style="background: #0f172a; border: 1.5px solid ${isSelected ? '#f59e0b' : cfg.borderColor}; color: #ffffff; padding: 3px 8px; border-radius: 9999px; font-weight: 800; font-size: 11px; max-width: 175px; box-shadow: 0 3px 10px rgba(0,0,0,0.35); display: flex; align-items: center; gap: 5px;">
          <div style="background: ${cfg.bg}; width: 18px; height: 18px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              ${cfg.iconSvg}
            </svg>
          </div>
          <span style="max-width: 125px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: inline-block; line-height: 1.2;">${safeName}</span>
          ${isVerified ? '<span style="color: #34d399; font-size: 10px; font-weight: 900;">✓</span>' : ''}
        </div>
        <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 5px solid #0f172a; margin-top: -1px;"></div>
        <div style="width: 5px; height: 5px; border-radius: 9999px; background: ${cfg.bg}; margin-top: -2px; border: 1px solid #ffffff;"></div>
      </div>
    `;

    return {
      html,
      iconSize: [180, 42],
      iconAnchor: [90, 42],
    };
  }

  // Standard compact view: Sleek circular logo badge with downward point
  const badgeSize = isSelected ? 36 : 30;
  const iconPixel = isSelected ? 17 : 14;
  const outlineStyle = isVerified ? 'outline: 2px solid #10b981; outline-offset: 1px;' : '';

  const html = `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; user-select: none;">
      <div style="background: ${cfg.bg}; width: ${badgeSize}px; height: ${badgeSize}px; border-radius: 9999px; border: 2px solid #ffffff; ${outlineStyle} box-shadow: 0 3px 8px rgba(0,0,0,0.32); display: flex; align-items: center; justify-content: center; transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'}; transition: transform 0.15s ease;">
        <svg width="${iconPixel}" height="${iconPixel}" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
          ${cfg.iconSvg}
        </svg>
      </div>
      <div style="width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 5px solid ${cfg.bg}; margin-top: -1px;"></div>
    </div>
  `;

  return {
    html,
    iconSize: [badgeSize + 4, badgeSize + 8],
    iconAnchor: [(badgeSize + 4) / 2, badgeSize + 5],
  };
}

/**
 * Lightweight cluster badge
 */
export function createLightweightClusterHtml(
  count: number
): { html: string; iconSize: [number, number]; iconAnchor: [number, number] } {
  const html = `
    <div style="position: relative; transform: translate(-50%, -50%); cursor: pointer;">
      <div style="background: #4f46e5; border: 2.5px solid #ffffff; color: #ffffff; width: 38px; height: 38px; border-radius: 9999px; box-shadow: 0 3px 10px rgba(79, 70, 229, 0.4); display: flex; flex-direction: column; align-items: center; justify-content: center; user-select: none; font-family: Cairo, Tajawal, sans-serif;">
        <span style="font-size: 12px; font-weight: 900; line-height: 1;">${count}</span>
        <span style="font-size: 7.5px; font-weight: 800; color: #c7d2fe; line-height: 1;">مكان</span>
      </div>
    </div>
  `;

  return {
    html,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  };
}
