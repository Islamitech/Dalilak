import { Business } from '../types';
import { CATEGORY_GROUPS } from '../data/mockData';

/**
 * Calculates real geographical distance between two GPS coordinates using Haversine formula
 * Returns distance in kilometers (km)
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Formats distance into localized Arabic readable string (e.g., "350 م" or "2.4 كم")
 */
export function formatDistanceString(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} م`;
  }
  return `${distanceKm.toFixed(1)} كم`;
}

export interface OpenStatusResult {
  isOpen: boolean;
  badgeText: string;
  is24Hours: boolean;
  statusClass: string;
  dotColor: string;
}

/**
 * Parses working hours and determines if business is currently open
 */
export function getBusinessOpenStatus(workingHours?: string): OpenStatusResult {
  if (!workingHours || !workingHours.trim()) {
    return {
      isOpen: true,
      badgeText: 'مفتوح للخدمة',
      is24Hours: false,
      statusClass: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
      dotColor: 'bg-emerald-500',
    };
  }

  const clean = workingHours.trim().toLowerCase();

  // 1. 24 Hours Detection
  if (
    clean.includes('24') ||
    clean.includes('مدار الساعة') ||
    clean.includes('طوال اليوم') ||
    clean.includes('طوال الوقت')
  ) {
    return {
      isOpen: true,
      badgeText: 'مفتوح 24 ساعة',
      is24Hours: true,
      statusClass: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
      dotColor: 'bg-emerald-500',
    };
  }

  // 2. Closed indicators
  if (clean.includes('مغلق مؤقتا') || clean.includes('تحت الصيانة')) {
    return {
      isOpen: false,
      badgeText: 'مغلق مؤقتاً',
      is24Hours: false,
      statusClass: 'bg-rose-500/15 text-rose-600 border-rose-500/30',
      dotColor: 'bg-rose-500',
    };
  }

  // 3. Time calculation based on Egypt Local Time (UTC+3 / Africa/Cairo)
  try {
    const now = new Date();
    const egyptTimeStr = now.toLocaleTimeString('en-US', {
      timeZone: 'Africa/Cairo',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
    const [currHour, currMin] = egyptTimeStr.split(':').map(Number);
    const currentMinutes = currHour * 60 + currMin;

    const regex = /(\d{1,2})(?::(\d{2}))?\s*(ص|صباحاً|صباحا|am|م|مساءً|مساء|pm)?/gi;
    const matches: { hour: number; isPm: boolean }[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(clean)) !== null) {
      const rawHour = parseInt(match[1], 10);
      const period = (match[3] || '').toLowerCase();
      const isPm = period.includes('م') || period.includes('pm') || period.includes('مساء');
      matches.push({ hour: rawHour, isPm });
    }

    if (matches.length >= 2) {
      let openH = matches[0].hour;
      if (matches[0].isPm && openH < 12) openH += 12;
      if (!matches[0].isPm && openH === 12) openH = 0;

      let closeH = matches[1].hour;
      if (matches[1].isPm && closeH < 12) closeH += 12;
      if (!matches[1].isPm && closeH < openH) closeH += 24;

      const openMinutes = openH * 60;
      const closeMinutes = closeH * 60;

      let adjustedCurrMinutes = currentMinutes;
      if (closeMinutes > 24 * 60 && currentMinutes < 6 * 60) {
        adjustedCurrMinutes += 24 * 60;
      }

      const isOpen = adjustedCurrMinutes >= openMinutes && adjustedCurrMinutes < closeMinutes;

      if (isOpen) {
        return {
          isOpen: true,
          badgeText: 'مفتوح الآن',
          is24Hours: false,
          statusClass: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
          dotColor: 'bg-emerald-500',
        };
      } else {
        return {
          isOpen: false,
          badgeText: 'مغلق حالياً',
          is24Hours: false,
          statusClass: 'bg-rose-500/15 text-rose-600 border-rose-500/30',
          dotColor: 'bg-rose-500',
        };
      }
    }
  } catch {}

  // Safe fallback
  return {
    isOpen: true,
    badgeText: 'متاح للزيارة',
    is24Hours: false,
    statusClass: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
    dotColor: 'bg-emerald-500',
  };
}

/**
 * Resolves the appropriate map link and status for a business
 * Prioritizes official Google Maps URL for verified businesses,
 * falling back to rep GPS field location or latitude/longitude coordinates.
 */
export function getBusinessMapDetails(biz: Business): {
  effectiveUrl: string | null;
  isOfficial: boolean;
  hasLocation: boolean;
} {
  const officialUrl =
    biz.googleMapsUrl &&
    typeof biz.googleMapsUrl === 'string' &&
    biz.googleMapsUrl.trim().startsWith('http') &&
    !biz.googleMapsUrl.includes('search/?api=1&query=') &&
    !biz.googleMapsUrl.includes('maps?q=') &&
    !biz.googleMapsUrl.includes('google.com/maps?q=')
      ? biz.googleMapsUrl.trim()
      : null;

  const repUrl =
    biz.repLocationUrl &&
    typeof biz.repLocationUrl === 'string' &&
    biz.repLocationUrl.trim().startsWith('http')
      ? biz.repLocationUrl.trim()
      : biz.lat && biz.lng
      ? `https://www.google.com/maps?q=${biz.lat},${biz.lng}`
      : null;

  const effectiveUrl = officialUrl || repUrl;
  const isOfficial = Boolean(officialUrl);

  return {
    effectiveUrl,
    isOfficial,
    hasLocation: Boolean(effectiveUrl),
  };
}

/**
 * Extracts category icon/emoji for pins and badges
 */
export function getCategoryIcon(category?: string): string {
  if (!category) return '📍';
  for (const group of CATEGORY_GROUPS) {
    if (group.items.some(item => category.includes(item) || item.includes(category))) {
      return group.icon;
    }
  }
  if (category.includes('مطعم') || category.includes('أكل') || category.includes('مشويات') || category.includes('مأكولات')) return '🍴';
  if (category.includes('كافيه') || category.includes('قهوة') || category.includes('مقهى') || category.includes('مشروب')) return '☕';
  if (category.includes('طبي') || category.includes('عيادة') || category.includes('صيدلية') || category.includes('دكتور') || category.includes('مستشفى')) return '🏥';
  if (category.includes('سيار') || category.includes('صيانة') || category.includes('معرض') || category.includes('أوتو')) return '🚗';
  if (category.includes('سوبر') || category.includes('ماركت') || category.includes('بقالة') || category.includes('هايبر')) return '🛒';
  if (category.includes('ملابس') || category.includes('أزياء') || category.includes('فاشون') || category.includes('أحذية')) return '👔';
  if (category.includes('ورد') || category.includes('زهور')) return '🌸';
  if (category.includes('عطور') || category.includes('مستحضرات') || category.includes('تجميل')) return '✨';
  if (category.includes('إلكترون') || category.includes('موبايل') || category.includes('كمبيوتر')) return '📱';
  if (category.includes('أثاث') || category.includes('مفروشات') || category.includes('ديكور')) return '🛋️';
  return '📍';
}

/**
 * Smart contextual WhatsApp message generator tuned to business category
 */
export function getSmartWhatsAppUrl(biz: Business): string {
  const targetPhone = (biz.phone || biz.ownerPhone || biz.secondaryPhone || '')
    .replace(/\D/g, '')
    .replace(/^0/, '');

  if (!targetPhone) return '';

  const cat = (biz.category || '').toLowerCase();
  let message = '';

  if (cat.includes('مطعم') || cat.includes('كافيه') || cat.includes('حلويات') || cat.includes('أغذية') || cat.includes('مأكولات')) {
    message = `السلام عليكم ورحمة الله 👋\nأود الاستفسار عن قائمة الأسعار (المنيو) ومواعيد التوصيل في "${biz.nameAr}" عبر منصة دليلك.`;
  } else if (cat.includes('طبيب') || cat.includes('عيادة') || cat.includes('مستشفى') || cat.includes('صيدلية') || cat.includes('أسنان') || cat.includes('عيادات')) {
    message = `السلام عليكم ورحمة الله 👋\nأود الاستفسار عن مواعيد الكشف والحجز في "${biz.nameAr}" المعروض على منصة دليلك.`;
  } else if (cat.includes('صيانة') || cat.includes('حرف') || cat.includes('خدمات منزلية') || cat.includes('سيارات') || cat.includes('سباكة') || cat.includes('كهرباء')) {
    message = `السلام عليكم ورحمة الله 👋\nأود الاستفسار عن حجز موعد ومعاينة فنية من "${biz.nameAr}" عبر منصة دليلك.`;
  } else {
    message = `السلام عليكم ورحمة الله 👋\nأود الاستفسار عن المنتجات والخدمات المتاحة لدى "${biz.nameAr}" عبر منصة دليلك.`;
  }

  return `https://wa.me/20${targetPhone}?text=${encodeURIComponent(message)}`;
}
