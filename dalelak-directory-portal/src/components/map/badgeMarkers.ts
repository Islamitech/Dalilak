import { Business } from '../../types';
import { escapeHtml } from './constants/mapConstants';
import { getOptimizedImageUrl } from '../../utils/imageOptimizer';
import { getCategoryFallbackCover } from '../../utils/categoryPhotos';
import {
  getBusinessOpenStatus,
  getBusinessMapDetails,
  getSmartWhatsAppUrl,
} from '../../utils/directoryEnhancements';
import { getBusinessHadayekZoneLetter } from '../../utils/hadayekZoneHelper';

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
 * Safely format rating for display. Never fabricates a fake rating (like 4.9).
 * Returns null if rating is invalid, out of range (not between 1 and 5), or disabled.
 */
export function formatDisplayRating(biz: Business): { ratingText: string | null; reviewCountText: string | null } {
  const rawRating =
    biz.googleRating !== undefined && biz.googleRating !== null
      ? biz.googleRating
      : biz.rating;

  if (typeof rawRating !== 'number' || isNaN(rawRating) || rawRating <= 0 || rawRating > 5) {
    return { ratingText: null, reviewCountText: null };
  }

  if (biz.googleRatingEnabled === false && biz.googleRating !== undefined) {
    return { ratingText: null, reviewCountText: null };
  }

  const ratingText = `★ ${rawRating.toFixed(1)}`;
  const count =
    typeof biz.googleReviewsCount === 'number' && !isNaN(biz.googleReviewsCount) && biz.googleReviewsCount > 0
      ? `(${biz.googleReviewsCount})`
      : null;

  return { ratingText, reviewCountText: count };
}

/**
 * Validates and sanitizes a URL strictly ensuring only http, https, or relative paths are permitted.
 * Blocks javascript:, data:, vbscript:, and attribute escape characters.
 */
export function sanitizeSafeUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (/^(?:javascript|data|vbscript):/i.test(trimmed)) return null;
  if (/["'<>\s]/.test(trimmed)) return null;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) {
    return trimmed;
  }
  return null;
}

/**
 * Sanitizes phone number to only contain digits and optional leading +.
 * Rejects any script or character injection.
 */
export function sanitizePhoneNumber(phone?: string | null): string | null {
  if (!phone || typeof phone !== 'string') return null;
  const cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.length < 7 || cleaned.length > 15) return null;
  return cleaned;
}

/**
 * Creates a sleek, compact activity pin marker anchored strictly at its true GPS location.
 * Uses category badge colors, vector icons, prominence badges, and screen-space pixel offsetting for coincident pins.
 */
export function createCompactActivityPinHtml(
  biz: Business,
  isSelected: boolean,
  isTopProminent: boolean = false,
  prominenceRank?: number,
  pixelOffset: [number, number] = [0, 0]
): { html: string; iconSize: [number, number]; iconAnchor: [number, number] } {
  const isVerified = biz.verificationStatus === 'verified';
  const safeName = escapeHtml(biz.nameAr || 'منشأة معتمدة');
  const safeCategory = escapeHtml((biz.category || '').split('/')[0].trim());
  const categoryConfig = getCategoryBadgeConfig(biz.category);

  const pinWidth = isSelected ? 42 : 36;
  const pinHeight = isSelected ? 50 : 44;

  const [dx, dy] = pixelOffset;
  const anchorX = Math.round(pinWidth / 2) - dx;
  const anchorY = pinHeight - dy;

  const rankBadgeHtml =
    isTopProminent && prominenceRank
      ? `<span style="position: absolute; top: -5px; right: -5px; z-index: 5; background: linear-gradient(135deg, #f59e0b, #d97706); color: #020617; font-size: 8.5px; font-weight: 900; width: 17px; height: 17px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1.5px solid #ffffff; box-shadow: 0 1px 4px rgba(0,0,0,0.35); font-family: monospace;">#${prominenceRank}</span>`
      : '';

  const verifiedDotHtml = isVerified
    ? `<span style="position: absolute; top: -3px; left: -3px; z-index: 5; width: 12px; height: 12px; border-radius: 50%; background: #059669; border: 1.5px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"><svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m9 12 2 2 4-4"/></svg></span>`
    : '';

  const pinBorderColor = isSelected ? '#d97706' : isTopProminent ? '#f59e0b' : categoryConfig.borderColor;
  const pinBg = isSelected ? '#fffbeb' : '#ffffff';
  const pinShadow = isSelected
    ? 'box-shadow: 0 0 20px rgba(245, 158, 11, 0.95), 0 4px 12px rgba(0,0,0,0.35);'
    : isTopProminent
    ? 'box-shadow: 0 4px 14px rgba(245, 158, 11, 0.45), 0 2px 6px rgba(0,0,0,0.15);'
    : 'box-shadow: 0 3px 10px rgba(15, 23, 42, 0.18), 0 1px 3px rgba(0,0,0,0.08);';

  const html = `
    <div class="activity-pin-wrapper ${isSelected ? 'selected-pin' : ''} ${isTopProminent ? 'top-prominent' : ''}" style="
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      user-select: none;
      width: ${pinWidth}px;
      font-family: 'Cairo', system-ui, sans-serif;
    " title="${safeName} - ${safeCategory}">
      <!-- Shield / Badge Icon Head -->
      <div style="
        position: relative;
        width: ${pinWidth}px;
        height: ${pinWidth}px;
        background: ${pinBg};
        border: 2px solid ${pinBorderColor};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        ${pinShadow}
        transition: transform 0.15s ease;
      ">
        ${rankBadgeHtml}
        ${verifiedDotHtml}
        <svg width="${isSelected ? 20 : 17}" height="${isSelected ? 20 : 17}" viewBox="0 0 24 24" fill="none" stroke="${categoryConfig.bg}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 1px 1px rgba(0,0,0,0.1));">
          ${categoryConfig.iconSvg}
        </svg>
      </div>

      <!-- Needle Downward Pointer -->
      <div style="
        width: 0;
        height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-top: 6px solid ${pinBorderColor};
        margin-top: -1px;
      "></div>
      <!-- Precise ground anchor dot -->
      <div style="
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: ${pinBorderColor};
        border: 1px solid #ffffff;
        margin-top: -2px;
      "></div>
    </div>
  `;

  return {
    html,
    iconSize: [pinWidth, pinHeight],
    iconAnchor: [anchorX, anchorY],
  };
}

/**
 * Creates an authentic, photo-rich Expanded Details Card for the selected business on the map.
 * Shown ONLY for the currently selected activity, with direct action buttons (directions, whatsapp, call)
 * and an explicit close button (✕) to deselect and return to the 3-cards view.
 * 100% secure: ZERO inline onclick or onerror attributes in HTML strings.
 */
export function createExpandedActivityCardHtml(
  biz: Business,
  isTopProminent: boolean = false,
  prominenceRank?: number,
  pixelOffset: [number, number] = [0, 0]
): { html: string; iconSize: [number, number]; iconAnchor: [number, number]; fallbackCover: string } {
  const cardWidth = 256;
  const photoHeight = 100;
  const pointerHeight = 9;

  const isVerified = biz.verificationStatus === 'verified';
  const safeName = escapeHtml(biz.nameAr || 'منشأة معتمدة');
  const safeCategory = escapeHtml((biz.category || '').split('/')[0].trim());
  const fallbackCover = getCategoryFallbackCover(biz.category);
  const rawPhoto = biz.coverPhoto || (biz.photos && biz.photos.length > 0 ? biz.photos[0] : fallbackCover);
  const photoUrl = getOptimizedImageUrl(rawPhoto, 360, 160);
  const openStatus = getBusinessOpenStatus(biz.workingHours);

  // Determine district / location label
  const zoneLetter = getBusinessHadayekZoneLetter(biz);
  const locationLabel = zoneLetter
    ? `منطقة ${zoneLetter}`
    : (biz.city || (biz.street ? biz.street.split('،')[0].trim() : '') || 'حدائق الأهرام');
  const safeLocation = escapeHtml(locationLabel);

  const { ratingText, reviewCountText } = formatDisplayRating(biz);

  const phone = sanitizePhoneNumber(biz.phone || biz.secondaryPhone || biz.ownerPhone || '');
  const { effectiveUrl } = getBusinessMapDetails(biz);
  const safeEffectiveUrl = sanitizeSafeUrl(effectiveUrl);
  const smartWhatsAppUrl = sanitizeSafeUrl(getSmartWhatsAppUrl(biz));

  const rankBadgeHtml = isTopProminent && prominenceRank
    ? `<span style="position: absolute; top: 6px; left: 36px; z-index: 4; display: inline-flex; align-items: center; gap: 2px; font-size: 8.5px; font-weight: 900; padding: 2px 7px; border-radius: 9999px; background: linear-gradient(135deg, #f59e0b, #d97706); color: #020617; border: 0.5px solid #fef08a; box-shadow: 0 1px 4px rgba(0,0,0,0.35); line-height: 1.2;">#${prominenceRank} الأبرز</span>`
    : '';

  const verifiedBadgeHtml = isVerified
    ? `<span style="position: absolute; top: 6px; right: 6px; z-index: 4; display: inline-flex; align-items: center; gap: 2.5px; font-size: 8.5px; font-weight: 900; padding: 2px 6.5px; border-radius: 9999px; background: #059669; color: #ffffff; box-shadow: 0 1px 4px rgba(0,0,0,0.35); backdrop-filter: blur(4px); line-height: 1.2;"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>موثق</span>`
    : '';

  const openStatusBadgeHtml = `
    <span style="position: absolute; bottom: 6px; right: 6px; z-index: 4; display: inline-flex; align-items: center; gap: 3px; font-size: 8px; font-weight: 800; padding: 1.5px 6px; border-radius: 9999px; background: rgba(15, 23, 42, 0.88); color: ${openStatus.isOpen ? '#34d399' : '#f87171'}; border: 0.5px solid ${openStatus.isOpen ? 'rgba(52,211,153,0.4)' : 'rgba(248,113,113,0.4)'}; line-height: 1.2;">
      <span style="width: 4px; height: 4px; border-radius: 50%; background: ${openStatus.isOpen ? '#34d399' : '#f87171'};"></span>
      ${openStatus.badgeText || (openStatus.isOpen ? 'مفتوح للخدمة' : 'مغلق')}
    </span>
  `;

  const [dx, dy] = pixelOffset;
  const estimatedTotalHeight = photoHeight + 155 + pointerHeight;
  const anchorX = Math.round(cardWidth / 2) - dx;
  const anchorY = estimatedTotalHeight - dy;
  const hasOffset = dx !== 0 || dy !== 0;

  const html = `
    <div class="activity-card-pin selected-expanded-pin" style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: default; user-select: none; width: ${cardWidth}px; font-family: 'Cairo', system-ui, sans-serif; direction: rtl;">
      <!-- Card Container with glowing golden amber border -->
      <div style="background: #ffffff; border: 2.5px solid #f59e0b; box-shadow: 0 0 28px rgba(245, 158, 11, 0.85), 0 12px 36px rgba(0,0,0,0.3); border-radius: 16px; overflow: hidden; width: 100%; box-sizing: border-box; display: flex; flex-direction: column;">
        
        <!-- 1. Visual Photo Header with Fixed Dimensions (Zero CLS) -->
        <div style="position: relative; width: 100%; height: ${photoHeight}px; background: #0f172a; overflow: hidden; border-top-left-radius: 14px; border-top-right-radius: 14px;">
          <img
            class="biz-card-photo"
            src="${escapeHtml(photoUrl)}"
            alt="${safeName}"
            width="${cardWidth}"
            height="${photoHeight}"
            style="width: 100%; height: 100%; object-fit: cover; display: block;"
          />
          <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(15, 23, 42, 0.75) 0%, rgba(15, 23, 42, 0.1) 45%, transparent 100%); pointer-events: none;"></div>

          <!-- Close Button (✕) to deselect and return to 3 cards view (DOM listener bound via class) -->
          <button
            type="button"
            class="card-close-btn"
            style="position: absolute; top: 6px; left: 6px; z-index: 10; width: 24px; height: 24px; border-radius: 50%; background: rgba(15, 23, 42, 0.85); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.35); font-size: 11px; font-weight: 900; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"
            title="إغلاق والعودة للخريطة"
          >✕</button>

          ${verifiedBadgeHtml}
          ${rankBadgeHtml}
          ${openStatusBadgeHtml}
        </div>

        <!-- 2. Rich Business Details -->
        <div style="background: #ffffff; padding: 8px 10px 10px 10px; display: flex; flex-direction: column; gap: 4px; direction: rtl; text-align: right; box-sizing: border-box;">
          <!-- Category and Location Zone -->
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; line-height: 1.2;">
            <span style="color: #b45309; font-weight: 900; font-size: 10px; background: #fef3c7; padding: 1.5px 7px; border-radius: 6px; max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${safeCategory}</span>
            <span style="color: #64748b; font-size: 9.5px; font-weight: 700; white-space: nowrap;">${safeLocation}</span>
          </div>

          <!-- Business Name (Bold Cairo) -->
          <div style="font-size: 13px; font-weight: 900; color: #0f172a; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 1px;" title="${safeName}">
            ${safeName}
          </div>

          <!-- Street / Exact Address if available -->
          ${biz.street ? `
            <div style="display: flex; align-items: center; gap: 4px; font-size: 9.5px; color: #64748b; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
              <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(biz.street)}</span>
            </div>
          ` : ''}

          <!-- Rating & Review Count (Authentic - never fake 4.9) -->
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; border-top: 1px solid #f1f5f9; padding-top: 4px; margin-top: 1px;">
            ${ratingText ? `
              <span style="display: inline-flex; align-items: center; gap: 2.5px; font-family: monospace; font-size: 10px; font-weight: 900; color: #d97706; background: rgba(245, 158, 11, 0.12); padding: 1px 6px; border-radius: 5px; border: 0.5px solid rgba(245, 158, 11, 0.25); line-height: 1;">
                <svg width="9.5" height="9.5" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span>${ratingText}</span>
              </span>
            ` : `
              <span style="display: inline-flex; align-items: center; gap: 2px; font-size: 9px; font-weight: 800; color: #059669; background: rgba(5, 150, 105, 0.08); padding: 1px 6px; border-radius: 5px;">
                <span>${isVerified ? 'معتمد رسمي' : 'نشاط مسجل'}</span>
              </span>
            `}
            <span style="font-size: 9px; color: #64748b; font-weight: 700;">
              ${reviewCountText || (isVerified ? 'موثق رسمياً' : '')}
            </span>
          </div>

          <!-- Direct Quick Action Trio (Directions, WhatsApp, Call) -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; margin-top: 3px;">
            ${safeEffectiveUrl ? `
              <a href="${escapeHtml(safeEffectiveUrl)}" target="_blank" rel="noopener noreferrer" class="card-action-link" style="display: flex; align-items: center; justify-content: center; gap: 3px; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; border-radius: 8px; padding: 4.5px 2px; text-decoration: none; font-size: 9.5px; font-weight: 800; cursor: pointer;" title="خرائط Google">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                <span>اتجاهات</span>
              </a>
            ` : `
              <span style="display: flex; align-items: center; justify-content: center; gap: 3px; background: #f8fafc; color: #94a3b8; border: 1px solid #e2e8f0; border-radius: 8px; padding: 4.5px 2px; font-size: 9.5px; font-weight: 800;">
                <span>اتجاهات</span>
              </span>
            `}
            ${smartWhatsAppUrl ? `
              <a href="${escapeHtml(smartWhatsAppUrl)}" target="_blank" rel="noopener noreferrer" class="card-action-link" style="display: flex; align-items: center; justify-content: center; gap: 3px; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; border-radius: 8px; padding: 4.5px 2px; text-decoration: none; font-size: 9.5px; font-weight: 800; cursor: pointer;" title="محادثة واتساب">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                <span>واتساب</span>
              </a>
            ` : `
              <span style="display: flex; align-items: center; justify-content: center; gap: 3px; background: #f8fafc; color: #94a3b8; border: 1px solid #e2e8f0; border-radius: 8px; padding: 4.5px 2px; font-size: 9.5px; font-weight: 800;">
                <span>واتساب</span>
              </span>
            `}
            ${phone ? `
              <a href="tel:${escapeHtml(phone)}" class="card-action-link" style="display: flex; align-items: center; justify-content: center; gap: 3px; background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; border-radius: 8px; padding: 4.5px 2px; text-decoration: none; font-size: 9.5px; font-weight: 800; cursor: pointer;" title="اتصال هاتفي">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <span>اتصال</span>
              </a>
            ` : `
              <span style="display: flex; align-items: center; justify-content: center; gap: 3px; background: #f8fafc; color: #94a3b8; border: 1px solid #e2e8f0; border-radius: 8px; padding: 4.5px 2px; font-size: 9.5px; font-weight: 800;">
                <span>اتصال</span>
              </span>
            `}
          </div>
        </div>
      </div>

      <!-- Precision Anchor Pointer / Leader Line -->
      ${
        hasOffset
          ? `
            <svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; z-index: -1;">
              <path d="M ${cardWidth / 2} ${estimatedTotalHeight - 8} Q ${cardWidth / 2} ${(estimatedTotalHeight - 8 + anchorY) / 2} ${anchorX} ${anchorY}" stroke="#f59e0b" stroke-width="2.2" stroke-dasharray="5,4" fill="none" stroke-linecap="round" />
              <circle cx="${anchorX}" cy="${anchorY}" r="4" fill="#f59e0b" stroke="#ffffff" stroke-width="1.8" filter="drop-shadow(0 0 6px rgba(245,158,11,0.9))" />
            </svg>
            <div style="width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 8px solid #f59e0b; margin-top: -1px; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.15));"></div>
          `
          : `
            <div style="width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 8px solid #f59e0b; margin-top: -1px; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.15));"></div>
            <div style="width: 8px; height: 8px; border-radius: 50%; background: #f59e0b; border: 2px solid #ffffff; margin-top: -2px; box-shadow: 0 0 10px rgba(245,158,11,0.9);"></div>
          `
      }
    </div>
  `;

  return {
    html,
    iconSize: [cardWidth, estimatedTotalHeight],
    iconAnchor: [anchorX, anchorY],
    fallbackCover,
  };
}

/**
 * Creates an authentic, photo-rich Activity Card Pin (بطاقة النشاط الميدانية بالصور) for a business on the map.
 * Replicates the visual design of Dalelak's BusinessCard:
 * - Cover photo with anti-extraction protective gradient and zero layout shift
 * - Official verification badge (موثق) in emerald
 * - Top-3 prominence badge (#1 الأبرز, #2, #3) in golden amber
 * - Live open/closed status indicator
 * - Category and zone location
 * - High-contrast business name in Cairo typography
 * - Authentic star rating (NEVER fake 4.9)
 * - Downward pointer tip with amber location dot or SVG leader line
 * - When isSelected is true, delegates to createExpandedActivityCardHtml.
 */
export function createLightweightBadgeHtml(
  biz: Business,
  isSelected: boolean,
  isTopProminent: boolean = false,
  prominenceRank?: number,
  pixelOffset: [number, number] = [0, 0]
): { html: string; iconSize: [number, number]; iconAnchor: [number, number]; fallbackCover: string } {
  if (isSelected) {
    return createExpandedActivityCardHtml(biz, isTopProminent, prominenceRank, pixelOffset);
  }

  const cardWidth = 184;
  const photoHeight = 76;
  const bodyHeight = 58;
  const pointerHeight = 9;
  const totalHeight = photoHeight + bodyHeight + pointerHeight;

  const isVerified = biz.verificationStatus === 'verified';
  const safeName = escapeHtml(biz.nameAr || 'منشأة معتمدة');
  const safeCategory = escapeHtml((biz.category || '').split('/')[0].trim());
  const fallbackCover = getCategoryFallbackCover(biz.category);
  const rawPhoto = biz.coverPhoto || (biz.photos && biz.photos.length > 0 ? biz.photos[0] : fallbackCover);
  const photoUrl = getOptimizedImageUrl(rawPhoto, 360, 160);
  const openStatus = getBusinessOpenStatus(biz.workingHours);

  // Determine district / location label
  const zoneLetter = getBusinessHadayekZoneLetter(biz);
  const locationLabel = zoneLetter
    ? `منطقة ${zoneLetter}`
    : (biz.city || (biz.street ? biz.street.split('،')[0].trim() : '') || 'حدائق الأهرام');
  const safeLocation = escapeHtml(locationLabel);

  const { ratingText } = formatDisplayRating(biz);

  const cardBorder = isTopProminent
    ? 'border: 2px solid #f59e0b; box-shadow: 0 6px 20px rgba(245, 158, 11, 0.35), 0 2px 8px rgba(0,0,0,0.12);'
    : 'border: 1.5px solid #e2e8f0; box-shadow: 0 4px 16px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(0,0,0,0.06);';

  const rankBadgeHtml = isTopProminent && prominenceRank
    ? `<span style="position: absolute; top: 5px; left: 5px; z-index: 4; display: inline-flex; align-items: center; gap: 2px; font-size: 8.5px; font-weight: 900; padding: 1.5px 6px; border-radius: 9999px; background: linear-gradient(135deg, #f59e0b, #d97706); color: #020617; border: 0.5px solid #fef08a; box-shadow: 0 1px 4px rgba(0,0,0,0.35); line-height: 1.2;">#${prominenceRank} الأبرز</span>`
    : '';

  const verifiedBadgeHtml = isVerified
    ? `<span style="position: absolute; top: 5px; right: 5px; z-index: 4; display: inline-flex; align-items: center; gap: 2.5px; font-size: 8.5px; font-weight: 900; padding: 1.5px 5.5px; border-radius: 9999px; background: #059669; color: #ffffff; box-shadow: 0 1px 4px rgba(0,0,0,0.35); backdrop-filter: blur(4px); line-height: 1.2;"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>موثق</span>`
    : '';

  const openStatusBadgeHtml = isTopProminent && prominenceRank
    ? `<span style="position: absolute; bottom: 4px; left: 5px; z-index: 4; display: inline-flex; align-items: center; gap: 2.5px; font-size: 7.5px; font-weight: 800; padding: 1px 4.5px; border-radius: 9999px; background: rgba(15, 23, 42, 0.82); color: ${openStatus.isOpen ? '#34d399' : '#f87171'}; border: 0.5px solid ${openStatus.isOpen ? 'rgba(52,211,153,0.35)' : 'rgba(248,113,113,0.35)'}; line-height: 1.2;"><span style="width: 3.5px; height: 3.5px; border-radius: 50%; background: ${openStatus.isOpen ? '#34d399' : '#f87171'};"></span>${openStatus.isOpen ? 'مفتوح' : 'مغلق'}</span>`
    : `<span style="position: absolute; top: 5px; left: 5px; z-index: 4; display: inline-flex; align-items: center; gap: 3px; font-size: 8px; font-weight: 800; padding: 1.5px 5px; border-radius: 9999px; background: rgba(15, 23, 42, 0.85); color: ${openStatus.isOpen ? '#34d399' : '#f87171'}; border: 0.5px solid ${openStatus.isOpen ? 'rgba(52,211,153,0.4)' : 'rgba(248,113,113,0.4)'}; line-height: 1.2;"><span style="width: 4px; height: 4px; border-radius: 50%; background: ${openStatus.isOpen ? '#34d399' : '#f87171'};"></span>${openStatus.isOpen ? 'مفتوح' : 'مغلق'}</span>`;

  const [dx, dy] = pixelOffset;
  const anchorX = Math.round(cardWidth / 2) - dx;
  const anchorY = totalHeight - dy;
  const hasOffset = dx !== 0 || dy !== 0;

  const html = `
    <div class="activity-card-pin ${isTopProminent ? 'top-prominent-pin' : ''}" style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; user-select: none; width: ${cardWidth}px; font-family: 'Cairo', system-ui, sans-serif; direction: rtl;">
      <!-- Card Container (Fixed 184px, zero layout shift) -->
      <div style="background: #ffffff; ${cardBorder} border-radius: 14px; overflow: hidden; width: 100%; box-sizing: border-box; display: flex; flex-direction: column;">
        <!-- 1. Visual Photo Header with Fixed Dimensions -->
        <div style="position: relative; width: 100%; height: ${photoHeight}px; background: #0f172a; overflow: hidden; border-top-left-radius: 12px; border-top-right-radius: 12px;">
          <img
            class="biz-card-photo"
            src="${escapeHtml(photoUrl)}"
            alt="${safeName}"
            width="${cardWidth}"
            height="${photoHeight}"
            style="width: 100%; height: 100%; object-fit: cover; display: block;"
            loading="lazy"
          />
          <!-- Anti-extraction gradient overlay -->
          <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(15, 23, 42, 0.72) 0%, rgba(15, 23, 42, 0.08) 45%, transparent 100%); pointer-events: none;"></div>
          ${verifiedBadgeHtml}
          ${rankBadgeHtml}
          ${openStatusBadgeHtml}
        </div>

        <!-- 2. Business Details Summary -->
        <div style="background: #ffffff; padding: 6px 8px; display: flex; flex-direction: column; gap: 2px; direction: rtl; text-align: right; box-sizing: border-box;">
          <!-- Category & Location -->
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; line-height: 1;">
            <span style="color: #b45309; font-weight: 800; font-size: 9.5px; max-width: 95px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${safeCategory}</span>
            <span style="color: #64748b; font-size: 8.5px; font-weight: 600; white-space: nowrap;">${safeLocation}</span>
          </div>

          <!-- Business Name -->
          <div style="font-size: 11.5px; font-weight: 900; color: #0f172a; line-height: 1.25; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 1px;" title="${safeName}">
            ${safeName}
          </div>

          <!-- Rating & Action Link (Authentic - never fake 4.9) -->
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; border-top: 1px solid #f1f5f9; padding-top: 3.5px; margin-top: 2px;">
            ${ratingText ? `
              <span style="display: inline-flex; align-items: center; gap: 2.5px; font-family: monospace; font-size: 9.5px; font-weight: 900; color: #d97706; background: rgba(245, 158, 11, 0.12); padding: 0.5px 5px; border-radius: 5px; border: 0.5px solid rgba(245, 158, 11, 0.25); line-height: 1;">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span>${ratingText}</span>
              </span>
            ` : `
              <span style="font-size: 8.5px; font-weight: 800; color: #059669; background: rgba(5, 150, 105, 0.08); padding: 0.5px 4.5px; border-radius: 4px;">
                ${isVerified ? 'معتمد' : 'مسجل'}
              </span>
            `}

            <!-- Mini Action Link -->
            <span style="font-size: 9px; font-weight: 800; color: #d97706; display: inline-flex; align-items: center; gap: 2px;">
              <span>التفاصيل</span>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </span>
          </div>
        </div>
      </div>

      <!-- Precision Ground Pointer / Leader Line -->
      ${
        hasOffset
          ? `
            <svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; z-index: -1;">
              <path d="M ${cardWidth / 2} ${totalHeight - 8} Q ${cardWidth / 2} ${(totalHeight - 8 + anchorY) / 2} ${anchorX} ${anchorY}" stroke="#f59e0b" stroke-width="2.2" stroke-dasharray="5,4" fill="none" stroke-linecap="round" />
              <circle cx="${anchorX}" cy="${anchorY}" r="4" fill="#f59e0b" stroke="#ffffff" stroke-width="1.8" filter="drop-shadow(0 0 6px rgba(245,158,11,0.9))" />
            </svg>
            <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid #f59e0b; margin-top: -1px;"></div>
          `
          : `
            <div style="width: 0; height: 0; border-left: 7px solid transparent; border-right: 7px solid transparent; border-top: 7px solid #ffffff; margin-top: -1px; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.15));"></div>
            <div style="width: 7px; height: 7px; border-radius: 50%; background: #f59e0b; border: 1.5px solid #ffffff; margin-top: -2px; box-shadow: 0 0 8px rgba(245,158,11,0.85);"></div>
          `
      }
    </div>
  `;

  return {
    html,
    iconSize: [cardWidth, totalHeight],
    iconAnchor: [anchorX, anchorY],
    fallbackCover,
  };
}

/**
 * Attaches DOM event listeners to Leaflet marker element safely without inline HTML attributes:
 * - Image onError fallback to fallbackCover
 * - Close button (✕) click listener with stopPropagation
 * - Action links stopPropagation
 */
export function attachCardDomListeners(
  marker: any,
  fallbackCover: string,
  onClose?: () => void
): void {
  const bind = () => {
    const el = marker.getElement ? marker.getElement() : null;
    if (!el) return;

    // 1. Safe image fallback
    const img = el.querySelector('img.biz-card-photo');
    if (img && fallbackCover) {
      img.addEventListener('error', () => {
        if (img.src !== fallbackCover) {
          img.src = fallbackCover;
        }
      }, { once: true });
    }

    // 2. Safe close button
    const closeBtn = el.querySelector('.card-close-btn');
    if (closeBtn && onClose) {
      closeBtn.addEventListener('click', (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onClose();
      });
    }

    // 3. Action links stopPropagation
    const actionLinks = el.querySelectorAll('.card-action-link');
    actionLinks.forEach((link: Element) => {
      link.addEventListener('click', (e: Event) => {
        e.stopPropagation();
      });
    });
  };

  if (marker.getElement && marker.getElement()) {
    bind();
  } else if (marker.once) {
    marker.once('add', bind);
  }
}

/**
 * Lightweight, modern cluster badge with gradient and activity count.
 */
export function createLightweightClusterHtml(
  count: number
): { html: string; iconSize: [number, number]; iconAnchor: [number, number] } {
  const html = `
    <div style="position: relative; cursor: pointer; user-select: none; font-family: 'Cairo', system-ui, sans-serif;">
      <div style="background: linear-gradient(135deg, #4f46e5 0%, #312e81 100%); border: 2.5px solid #ffffff; color: #ffffff; width: 42px; height: 42px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.45); display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <span style="font-size: 13px; font-weight: 900; line-height: 1;">${count}</span>
        <span style="font-size: 8px; font-weight: 800; color: #c7d2fe; line-height: 1;">نشاطاً</span>
      </div>
    </div>
  `;

  return {
    html,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  };
}

/**
 * Creates an interactive District Cluster Pill ("دبوس مجمع") for remaining activities in a zone.
 * When clicked, triggers camera zoom and bursts remaining activities into cards!
 */
export function createDistrictClusterHtml(
  count: number,
  categoryLabel?: string
): { html: string; iconSize: [number, number]; iconAnchor: [number, number] } {
  const width = 165;
  const height = 38;
  const totalHeight = height + 10;
  const safeLabel = escapeHtml(categoryLabel ? `${categoryLabel}` : 'أنشطة');

  const html = `
    <div class="district-cluster-pin" style="
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      user-select: none;
      width: ${width}px;
      font-family: 'Cairo', system-ui, sans-serif;
      direction: rtl;
    ">
      <div style="
        background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
        color: #ffffff;
        border: 2px solid #818cf8;
        border-radius: 9999px;
        padding: 4px 10px;
        width: 100%;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        box-shadow: 0 6px 20px rgba(79, 70, 229, 0.45), 0 2px 8px rgba(0,0,0,0.4);
      ">
        <span style="
          background: #4f46e5;
          color: #ffffff;
          font-size: 11px;
          font-weight: 900;
          padding: 1px 7px;
          border-radius: 9999px;
          border: 1px solid #c7d2fe;
          flex-shrink: 0;
        ">+${count}</span>
        <span style="
          font-size: 11px;
          font-weight: 800;
          color: #e2e8f0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        ">${safeLabel} إضافية 🔍</span>
      </div>
      <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid #0f172a; margin-top: -1px;"></div>
      <div style="width: 6px; height: 6px; border-radius: 50%; background: #818cf8; border: 1.5px solid #ffffff; margin-top: -2px; box-shadow: 0 0 8px #818cf8;"></div>
    </div>
  `;

  return {
    html,
    iconSize: [width, totalHeight],
    iconAnchor: [width / 2, totalHeight],
  };
}

/**
 * 🏢 Building Badge Marker:
 * Elegant high-contrast building pin for Hadayek Al-Ahram building coordinates.
 */
export function createBuildingBadgeHtml(
  buildingNumber: string,
  zoneLetter?: string,
  isSelected: boolean = false
): { html: string; iconSize: [number, number]; iconAnchor: [number, number] } {
  const safeNum = escapeHtml(buildingNumber || 'مبنى');
  const safeZone = zoneLetter ? escapeHtml(zoneLetter) : '';
  const width = isSelected ? 150 : 130;
  const height = 40;
  const totalHeight = height + 10;

  const html = `
    <div class="building-badge-pin ${isSelected ? 'animate-bounce-subtle' : ''}" style="
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      width: ${width}px;
      font-family: 'Cairo', system-ui, sans-serif;
      direction: rtl;
    ">
      <div style="
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        color: #ffffff;
        border: 2px solid ${isSelected ? '#f59e0b' : '#38bdf8'};
        border-radius: 12px;
        padding: 4px 10px;
        width: 100%;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        box-shadow: ${isSelected ? '0 0 20px rgba(245, 158, 11, 0.6), 0 8px 24px rgba(0,0,0,0.5)' : '0 4px 16px rgba(0,0,0,0.35)'};
      ">
        <span style="
          background: ${isSelected ? '#f59e0b' : '#0284c7'};
          color: ${isSelected ? '#0f172a' : '#ffffff'};
          width: 22px;
          height: 22px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 900;
          flex-shrink: 0;
        ">🏢</span>
        <div style="display: flex; flex-direction: column; min-width: 0; overflow: hidden; text-align: right;">
          <span style="
            font-size: 12px;
            font-weight: 900;
            color: ${isSelected ? '#fef08a' : '#ffffff'};
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.2;
          ">عمارة ${safeNum}</span>
          ${safeZone ? `<span style="font-size: 9px; font-weight: 700; color: #94a3b8; line-height: 1;">منطقة ${safeZone}</span>` : ''}
        </div>
      </div>
      <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid #0f172a; margin-top: -1px;"></div>
      <div style="
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: ${isSelected ? '#f59e0b' : '#38bdf8'};
        border: 2px solid #ffffff;
        margin-top: -2px;
        box-shadow: 0 0 10px ${isSelected ? '#f59e0b' : '#38bdf8'};
      "></div>
    </div>
  `;

  return {
    html,
    iconSize: [width, totalHeight],
    iconAnchor: [width / 2, totalHeight],
  };
}

/**
 * 🧭 Navigation Route Pins (Origin & Destination)
 */
export function createNavigationPinHtml(
  type: 'origin' | 'destination',
  label: string
): { html: string; iconSize: [number, number]; iconAnchor: [number, number] } {
  const isOrigin = type === 'origin';
  const safeLabel = escapeHtml(label || (isOrigin ? 'نقطة الانطلاق' : 'الوجهة'));
  const width = 140;
  const height = 36;
  const totalHeight = height + 10;
  const mainColor = isOrigin ? '#10b981' : '#f59e0b';

  const html = `
    <div class="nav-route-pin animate-bounce-subtle" style="
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      width: ${width}px;
      font-family: 'Cairo', system-ui, sans-serif;
      direction: rtl;
    ">
      <div style="
        background: #0f172a;
        color: #ffffff;
        border: 2px solid ${mainColor};
        border-radius: 9999px;
        padding: 4px 10px;
        width: 100%;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        box-shadow: 0 0 16px ${mainColor}80, 0 6px 18px rgba(0,0,0,0.4);
      ">
        <span style="
          background: ${mainColor};
          color: #ffffff;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 900;
          flex-shrink: 0;
        ">${isOrigin ? '📍' : '🏁'}</span>
        <span style="
          font-size: 11px;
          font-weight: 800;
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        ">${safeLabel}</span>
      </div>
      <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid #0f172a; margin-top: -1px;"></div>
      <div style="
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: ${mainColor};
        border: 2px solid #ffffff;
        margin-top: -2px;
        box-shadow: 0 0 10px ${mainColor};
      "></div>
    </div>
  `;

  return {
    html,
    iconSize: [width, totalHeight],
    iconAnchor: [width / 2, totalHeight],
  };
}


