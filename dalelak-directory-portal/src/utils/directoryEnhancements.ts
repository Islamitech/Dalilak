import { Business } from '../types';

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
      statusClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
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
      statusClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      dotColor: 'bg-emerald-500',
    };
  }

  // 2. Closed indicators
  if (clean.includes('مغلق مؤقتا') || clean.includes('تحت الصيانة')) {
    return {
      isOpen: false,
      badgeText: 'مغلق مؤقتاً',
      is24Hours: false,
      statusClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
      dotColor: 'bg-rose-500',
    };
  }

  // 3. Time calculation based on Egypt Local Time (UTC+3)
  try {
    const now = new Date();
    // Get current Egypt time
    const egyptTimeStr = now.toLocaleTimeString('en-US', {
      timeZone: 'Africa/Cairo',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
    const [currHour, currMin] = egyptTimeStr.split(':').map(Number);
    const currentMinutes = currHour * 60 + currMin;

    // Regex to capture start & end hours (e.g. "9 ص إلى 11 م" or "من 10 صباحا حتى 12 مساء")
    // Match patterns like: 9 ص, 10:30 ص, 11 م, 12:00 م
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
      // If closing past midnight (e.g. 1 ص or 2 ص)
      if (!matches[1].isPm && closeH < openH) closeH += 24;

      const openMinutes = openH * 60;
      const closeMinutes = closeH * 60;

      let adjustedCurrMinutes = currentMinutes;
      // If closing spans past midnight and we are in early morning (00:00 - 04:00)
      if (closeMinutes > 24 * 60 && currentMinutes < 6 * 60) {
        adjustedCurrMinutes += 24 * 60;
      }

      const isOpen = adjustedCurrMinutes >= openMinutes && adjustedCurrMinutes < closeMinutes;

      if (isOpen) {
        return {
          isOpen: true,
          badgeText: 'مفتوح الآن',
          is24Hours: false,
          statusClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          dotColor: 'bg-emerald-500',
        };
      } else {
        return {
          isOpen: false,
          badgeText: 'مغلق حالياً',
          is24Hours: false,
          statusClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
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
    statusClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    dotColor: 'bg-emerald-500',
  };
}

/**
 * Generates and triggers downloading of a standardized vCard (.vcf)
 * Allows users to add the business to their smartphone contacts instantly.
 */
export function downloadBusinessVCard(biz: Business): void {
  const name = biz.nameAr || biz.nameEn || 'نشاط تجاري';
  const phone = biz.phone || biz.secondaryPhone || '';
  const street = biz.street || '';
  const city = biz.city || '';
  const gov = biz.governorate || '';
  const mapsUrl = biz.googleMapsUrl || (biz.lat && biz.lng ? `https://www.google.com/maps?q=${biz.lat},${biz.lng}` : '');
  const note = `منصة دليلك المعتمدة | ${biz.category} | ${biz.workingHours || ''}`;

  const vCardContent = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN;CHARSET=UTF-8:${name}`,
    `ORG;CHARSET=UTF-8:${name} - ${biz.category}`,
    `TITLE;CHARSET=UTF-8:${biz.category}`,
    phone ? `TEL;TYPE=WORK,VOICE:${phone}` : '',
    biz.secondaryPhone ? `TEL;TYPE=CELL,VOICE:${biz.secondaryPhone}` : '',
    `ADR;TYPE=WORK;CHARSET=UTF-8:;;${street};${city};${gov};;مصر`,
    mapsUrl ? `URL:${mapsUrl}` : '',
    `NOTE;CHARSET=UTF-8:${note}`,
    'END:VCARD',
  ]
    .filter(Boolean)
    .join('\r\n');

  const blob = new Blob([vCardContent], { type: 'text/vcard;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeFileName = `${name.replace(/[\\/:*?"<>|]/g, '_')}.vcf`;
  link.setAttribute('download', safeFileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Smart contextual WhatsApp message generator tuned to business category
 */
export function getSmartWhatsAppUrl(biz: Business): string {
  const targetPhone = (biz.whatsapp || biz.phone || '')
    .replace(/\D/g, '')
    .replace(/^0/, '');

  if (!targetPhone) return '';

  const cat = (biz.category || '').toLowerCase();
  let message = '';

  if (cat.includes('مطعم') || cat.includes('كافيه') || cat.includes('حلويات') || cat.includes('أغذية') || cat.includes('مأكولات')) {
    message = `السلام عليكم ورحمة الله 👋\nأود الاستفسار عن قائمة الأسعار (المنيو) ومواعيد التوصيل في نشاط "${biz.nameAr}" عبر منصة دليلك.`;
  } else if (cat.includes('طبيب') || cat.includes('عيادة') || cat.includes('مستشفى') || cat.includes('صيدلية') || cat.includes('أسنان') || cat.includes('عيادات')) {
    message = `السلام عليكم ورحمة الله 👋\nأود الاستفسار عن مواعيد الكشف والحجز في "${biz.nameAr}" المعروض على منصة دليلك.`;
  } else if (cat.includes('صيانة') || cat.includes('حرف') || cat.includes('خدمات منزلية') || cat.includes('سيارات') || cat.includes('سباكة') || cat.includes('كهرباء')) {
    message = `السلام عليكم ورحمة الله 👋\nأود الاستفسار عن حجز موعد ومعاينة فنية من "${biz.nameAr}" عبر منصة دليلك.`;
  } else {
    message = `السلام عليكم ورحمة الله 👋\nأود الاستفسار عن المنتجات والخدمات المتاحة لدى نشاط "${biz.nameAr}" عبر منصة دليلك.`;
  }

  return `https://wa.me/20${targetPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Injects or updates Schema.org JSON-LD structured data for Google SEO rich snippets
 */
export function injectBusinessSchemaLd(biz: Business | null): void {
  if (typeof document === 'undefined') return;

  const scriptId = 'dalelak-schema-localbusiness';
  let script = document.getElementById(scriptId) as HTMLScriptElement | null;

  if (!biz) {
    if (script) script.remove();
    return;
  }

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: biz.nameAr || biz.nameEn,
    description: biz.description || `${biz.category} في ${biz.governorate}، ${biz.city}`,
    telephone: biz.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: biz.street || undefined,
      addressLocality: biz.city,
      addressRegion: biz.governorate,
      addressCountry: 'EG',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: biz.lat,
      longitude: biz.lng,
    },
    url: biz.googleMapsUrl || window.location.href,
    image: biz.photos && biz.photos.length > 0 ? biz.photos[0] : undefined,
  };

  if (!script) {
    script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }

  script.textContent = JSON.stringify(schemaData);
}
