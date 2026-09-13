import { Business } from '../../types';
import { escapeHtml } from './mapTypes';

export interface CategoryMarkerTheme {
  id: string;
  label: string;
  gradientStart: string;
  gradientEnd: string;
  borderColor: string;
  glowColor: string;
  iconSvg: string;
}

/**
 * Category marker themes matching Image 2:
 * 1. Food & Cafes (Utensils - Amber/Orange)
 * 2. Supermarket & Groceries (ShoppingCart - Emerald/Green)
 * 3. Pharmacies & Health (Pill - Cyan/Sky)
 * 4. Fashion & Clothes (Shirt - Purple/Violet)
 * 5. Automotive Services (Car - Rose/Red)
 * 6. General Commercial & Services (Building2 - Indigo/Blue)
 */
export const getCategoryMarkerTheme = (category?: string): CategoryMarkerTheme => {
  const cat = (category || '').toLowerCase();

  // 1. Restaurants, Cafes, Bakeries, Food
  if (
    cat.includes('مطاعم') ||
    cat.includes('مطعم') ||
    cat.includes('كافيه') ||
    cat.includes('مقهى') ||
    cat.includes('حلويات') ||
    cat.includes('مخبز') ||
    cat.includes('أكل') ||
    cat.includes('مأكولات') ||
    cat.includes('مشويات') ||
    cat.includes('عصائر')
  ) {
    return {
      id: 'food',
      label: 'مطاعم وكافيهات',
      gradientStart: '#f59e0b',
      gradientEnd: '#d97706',
      borderColor: '#fef08a',
      glowColor: 'rgba(245, 158, 11, 0.45)',
      iconSvg: `
        <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M15 2v19" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M5 2v4a3 3 0 0 0 3 3h0a3 3 0 0 0 3-3V2" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8 9v12" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      `,
    };
  }

  // 2. Supermarkets, Groceries, Markets
  if (
    cat.includes('سوبر') ||
    cat.includes('ماركت') ||
    cat.includes('بقالة') ||
    cat.includes('هايبر') ||
    cat.includes('تموين') ||
    cat.includes('خضروات') ||
    cat.includes('فواكه') ||
    cat.includes('جزارة') ||
    cat.includes('عطارة')
  ) {
    return {
      id: 'supermarket',
      label: 'سوبر ماركت وبقالة',
      gradientStart: '#10b981',
      gradientEnd: '#059669',
      borderColor: '#a7f3d0',
      glowColor: 'rgba(168, 85, 247, 0.45)',
      iconSvg: `
        <circle cx="8" cy="21" r="1.5" fill="#ffffff"/>
        <circle cx="19" cy="21" r="1.5" fill="#ffffff"/>
        <path d="M2.5 2.5h2.5l2.4 12a2 2 0 0 0 2 1.6h9.6a2 2 0 0 0 1.9-1.5l1.6-7.5H5.4" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      `,
    };
  }

  // 3. Pharmacies, Clinics, Hospitals, Healthcare
  if (
    cat.includes('صيدل') ||
    cat.includes('طبي') ||
    cat.includes('عياد') ||
    cat.includes('مستشفى') ||
    cat.includes('علاج') ||
    cat.includes('أسنان') ||
    cat.includes('رعاية') ||
    cat.includes('تحاليل') ||
    cat.includes('أشعة') ||
    cat.includes('بصريات') ||
    cat.includes('نظارات')
  ) {
    return {
      id: 'pharmacy',
      label: 'صيدليات ورعاية',
      gradientStart: '#06b6d4',
      gradientEnd: '#0284c7',
      borderColor: '#bae6fd',
      glowColor: 'rgba(6, 182, 212, 0.45)',
      iconSvg: `
        <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="m8.5 8.5 7 7" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      `,
    };
  }

  // 4. Fashion, Clothes, Apparel, Shoes
  if (
    cat.includes('ملابس') ||
    cat.includes('أزياء') ||
    cat.includes('فاشون') ||
    cat.includes('أحذية') ||
    cat.includes('عبايات') ||
    cat.includes('بدل') ||
    cat.includes('نسائي') ||
    cat.includes('رجالي') ||
    cat.includes('أطفال')
  ) {
    return {
      id: 'fashion',
      label: 'أزياء وملابس',
      gradientStart: '#a855f7',
      gradientEnd: '#7c3aed',
      borderColor: '#e9d5ff',
      glowColor: 'rgba(168, 85, 247, 0.45)',
      iconSvg: `
        <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      `,
    };
  }

  // 5. Automotive, Mechanics, Tires, Auto Services
  if (
    cat.includes('سيار') ||
    cat.includes('صيانة') ||
    cat.includes('مركبات') ||
    cat.includes('كاوتش') ||
    cat.includes('بطاريات') ||
    cat.includes('غسيل') ||
    cat.includes('أوتو') ||
    cat.includes('ميكانيك') ||
    cat.includes('زيوت')
  ) {
    return {
      id: 'automotive',
      label: 'خدمات سيارات',
      gradientStart: '#f43f5e',
      gradientEnd: '#e11d48',
      borderColor: '#fecdd3',
      glowColor: 'rgba(244, 63, 94, 0.45)',
      iconSvg: `
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <circle cx="7" cy="17" r="1.8" fill="#ffffff"/>
        <path d="M9 17h6" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>
        <circle cx="17" cy="17" r="1.8" fill="#ffffff"/>
      `,
    };
  }

  // 6. Default: Commercial Companies, Services, Real Estate, Retail
  return {
    id: 'commercial',
    label: 'منشآت وخدمات',
    gradientStart: '#6366f1',
    gradientEnd: '#4338ca',
    borderColor: '#c7d2fe',
    glowColor: 'rgba(99, 102, 241, 0.45)',
    iconSvg: `
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M10 6h4M10 10h4M10 14h4M10 18h4" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>
    `,
  };
};

/**
 * Creates custom HTML for Leaflet business pins:
 * - High precision teardrop marker with category icon & gradient
 * - Radiant pulsing aura for verified businesses
 * - Clean connected name tag pill when zoomed in or selected
 */
export const createBusinessMarkerHtml = (
  biz: Business,
  isSelected: boolean,
  showFullPill: boolean
): { html: string; iconSize: [number, number]; iconAnchor: [number, number] } => {
  const theme = getCategoryMarkerTheme(biz.category);
  const isVerified = biz.verificationStatus === 'verified';
  const safeName = escapeHtml(biz.nameAr || 'منشأة معتمدة');
  const gradId = `grad-${theme.id}-${biz.id ? biz.id.replace(/[^a-zA-Z0-9]/g, '') : Math.random().toString(36).slice(2, 7)}`;

  // Pin geometry:
  // Circle head diameter: 36px (radius 16, stroke 2.5px)
  // Sharp needle bottom at (18, 45)
  // Total SVG size: 36 x 48
  const pinSvg = `
    <div style="position: relative; width: 36px; height: 48px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.45));">
      ${
        isVerified
          ? `<span style="position: absolute; top: 1px; left: 1px; width: 34px; height: 34px; border-radius: 9999px; box-shadow: 0 0 0 4px ${theme.glowColor}, 0 0 14px ${theme.glowColor}; pointer-events: none; animation: dalelakPulse 2s infinite ease-in-out;"></span>`
          : ''
      }
      <svg width="36" height="48" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="overflow: visible;">
        <defs>
          <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${theme.gradientStart}" />
            <stop offset="100%" stop-color="${theme.gradientEnd}" />
          </linearGradient>
          <radialGradient id="shadow-${gradId}" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="rgba(0,0,0,0.6)" />
            <stop offset="100%" stop-color="rgba(0,0,0,0)" />
          </radialGradient>
        </defs>

        <!-- Ground Contact Shadow -->
        <ellipse cx="18" cy="46" rx="7" ry="2" fill="url(#shadow-${gradId})" />

        <!-- Teardrop Pin Shape -->
        <path d="M 18 45 C 13.5 38.5, 2 27, 2 18 A 16 16 0 1 1 34 18 C 34 27, 22.5 38.5, 18 45 Z"
              fill="url(#${gradId})"
              stroke="#ffffff"
              stroke-width="${isSelected ? '3' : '2.5'}"
              stroke-linejoin="round" />

        <!-- Inner Highlight Ring -->
        <circle cx="18" cy="18" r="13" stroke="rgba(255,255,255,0.25)" stroke-width="1" fill="none" />

        <!-- Category Icon centered inside head -->
        <g transform="translate(6, 6)">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            ${theme.iconSvg}
          </svg>
        </g>

        ${
          isVerified
            ? `
          <!-- Verified Checkmark Badge on shoulder -->
          <circle cx="28" cy="8" r="5" fill="#10b981" stroke="#ffffff" stroke-width="1.5" />
          <path d="M26 8 L27.5 9.5 L30.5 6.5" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
        `
            : ''
        }
      </svg>
    </div>
  `;

  if (showFullPill || isSelected) {
    // Full container with attached name pill above the pin
    const containerWidth = 200;
    const containerHeight = 82;
    const anchorX = 100;
    const anchorY = 78;

    const html = `
      <div style="position: relative; width: ${containerWidth}px; height: ${containerHeight}px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; cursor: pointer; user-select: none; font-family: Cairo, Tajawal, -apple-system, sans-serif;">
        <!-- Floating Name Pill -->
        <div style="background: ${isSelected ? 'linear-gradient(135deg, #1e1b4b, #312e81)' : 'rgba(15, 23, 42, 0.94)'}; backdrop-filter: blur(8px); border: 1.5px solid ${isSelected ? '#f59e0b' : theme.borderColor}; color: #ffffff; padding: 3px 10px; border-radius: 9999px; font-weight: 800; font-size: 11px; max-width: 190px; box-shadow: 0 4px 16px rgba(0,0,0,0.6); display: flex; align-items: center; gap: 5px; margin-bottom: 2px; transition: transform 0.2s;">
          <span style="width: 7px; height: 7px; border-radius: 9999px; background: ${theme.gradientStart}; flex-shrink: 0;"></span>
          <span style="max-width: 145px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: inline-block; line-height: 1.2;">${safeName}</span>
          ${isVerified ? '<span style="color: #34d399; font-size: 10px; font-weight: 900; line-height: 1;">✓</span>' : ''}
        </div>

        <!-- Pin Head -->
        <div style="transform: ${isSelected ? 'scale(1.18)' : 'scale(1)'}; transition: transform 0.2s;">
          ${pinSvg}
        </div>
      </div>
    `;

    return {
      html,
      iconSize: [containerWidth, containerHeight],
      iconAnchor: [anchorX, anchorY],
    };
  }

  // Compact Pin Only
  const html = `
    <div style="position: relative; width: 36px; height: 48px; cursor: pointer; transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'}; transition: transform 0.2s;">
      ${pinSvg}
    </div>
  `;

  return {
    html,
    iconSize: [36, 48],
    iconAnchor: [18, 46],
  };
};

/**
 * Creates custom HTML for Picker Mode Needle Pin (Amber/Gold target pin)
 */
export const createPickerMarkerHtml = (): {
  html: string;
  iconSize: [number, number];
  iconAnchor: [number, number];
} => {
  const html = `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: grab; user-select: none; width: 170px; font-family: Cairo, Tajawal, -apple-system, sans-serif;">
      <div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #020617; font-weight: 900; font-size: 11px; padding: 3px 10px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(0,0,0,0.6); max-width: 165px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; border: 1.5px solid #fef08a; margin-bottom: 2px;">
        موقع النشاط المحدد
      </div>
      <div style="position: relative; width: 38px; height: 48px; display: flex; justify-content: center; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.55));">
        <svg width="38" height="48" viewBox="0 0 38 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="pickerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#f59e0b" />
              <stop offset="100%" stop-color="#d97706" />
            </linearGradient>
            <radialGradient id="pickerShadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="rgba(0,0,0,0.6)" />
              <stop offset="100%" stop-color="rgba(0,0,0,0)" />
            </radialGradient>
          </defs>
          <ellipse cx="19" cy="46" rx="7" ry="2" fill="url(#pickerShadow)" />
          <path d="M 19 45 C 14 38.5, 2 27, 2 19 A 17 17 0 1 1 36 19 C 36 27, 24 38.5, 19 45 Z" fill="url(#pickerGrad)" stroke="#ffffff" stroke-width="2.5" stroke-linejoin="round" />
          <circle cx="19" cy="19" r="10" fill="#0f172a" />
          <circle cx="19" cy="19" r="5" fill="#f59e0b" />
          <circle cx="19" cy="19" r="2" fill="#ffffff" />
        </svg>
      </div>
    </div>
  `;

  return {
    html,
    iconSize: [170, 76],
    iconAnchor: [85, 74],
  };
};

/**
 * Creates custom HTML for Cluster Markers
 */
export const createClusterMarkerHtml = (
  count: number
): { html: string; iconSize: [number, number]; iconAnchor: [number, number] } => {
  const html = `
    <div style="position: relative; transform: translate(-50%, -50%); cursor: pointer; filter: drop-shadow(0 4px 12px rgba(99, 102, 241, 0.5));">
      <div style="background: linear-gradient(135deg, #6366f1, #4338ca); border: 2.5px solid #ffffff; color: #ffffff; width: 44px; height: 44px; border-radius: 9999px; display: flex; flex-direction: column; align-items: center; justify-content: center; user-select: none; font-family: Cairo, Tajawal, sans-serif; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.35);">
        <span style="font-size: 13px; font-weight: 900; line-height: 1;">${count}</span>
        <span style="font-size: 8.5px; font-weight: 800; color: #c7d2fe; line-height: 1;">نشاط</span>
      </div>
    </div>
  `;

  return {
    html,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  };
};
