import { Business } from '../types';

export const DEFAULT_SEO = {
  title: 'دليلك | المنصة الرقمية الشاملة لإدارة وتوثيق الأنشطة التجارية والخدمات في مصر',
  description:
    'دليلك — المنصة الرقمية الشاملة والمتكاملة لتسجيل وإدارة وتوثيق الأنشطة التجارية والخدمات الميدانية، الفواتير الإلكترونية، والتحصيلات في جميع محافظات مصر.',
  url: 'https://www.dalilaak.com/',
  image: 'https://www.dalilaak.com/og-image.jpg?v=2026_dalilak_v5_platform',
};

/**
 * Maps Egyptian business category to Schema.org specific LocalBusiness sub-type
 */
export function mapCategoryToSchemaType(category?: string): string {
  if (!category) return 'LocalBusiness';
  const c = category.trim().toLowerCase();
  if (c.includes('طبي') || c.includes('مستشف') || c.includes('صيدل') || c.includes('عياد') || c.includes('دكتور')) {
    return 'MedicalBusiness';
  }
  if (c.includes('مطعم') || c.includes('كافيه') || c.includes('أكل') || c.includes('مأكولات')) {
    return 'Restaurant';
  }
  if (c.includes('فندق') || c.includes('سياح') || c.includes('إقام')) {
    return 'Hotel';
  }
  if (c.includes('سيار') || c.includes('صيان') || c.includes('ورش')) {
    return 'AutoRepair';
  }
  if (c.includes('محل') || c.includes('ملابس') || c.includes('سوبر') || c.includes('تجار')) {
    return 'Store';
  }
  return 'LocalBusiness';
}

/**
 * Builds Schema.org LocalBusiness JSON-LD structured data
 */
export function generateLocalBusinessSchema(business: Business) {
  const schemaType = mapCategoryToSchemaType(business.category);
  const photos = Array.isArray(business.photos) ? business.photos : [];
  const primaryImage = business.coverPhoto || photos[0] || DEFAULT_SEO.image;

  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    '@id': `https://www.dalilaak.com/?biz=${encodeURIComponent(business.id)}#business`,
    name: business.nameAr,
    alternateName: business.nameEn || business.name,
    description: business.description || `نشاط ${business.nameAr} في ${business.city}، ${business.governorate}. متوفر على منصة دليلك.`,
    url: `https://www.dalilaak.com/?biz=${encodeURIComponent(business.id)}`,
    telephone: business.phone,
    image: primaryImage,
    address: {
      '@type': 'PostalAddress',
      streetAddress: business.street || '',
      addressLocality: business.city || '',
      addressRegion: business.governorate || 'مصر',
      addressCountry: 'EG',
    },
    priceRange: business.packagePrice ? `${business.packagePrice} EGP` : '$$',
  };

  if (business.lat && business.lng && !isNaN(business.lat) && !isNaN(business.lng)) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: Number(business.lat),
      longitude: Number(business.lng),
    };
  }

  if (business.workingHours) {
    schema.openingHours = business.workingHours;
  }

  if (business.googleRating && !isNaN(business.googleRating)) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(business.googleRating),
      reviewCount: Number(business.googleReviewsCount || 1),
      bestRating: '5',
      worstRating: '1',
    };
  }

  return schema;
}

/**
 * Injects or updates Schema.org JSON-LD in DOM
 */
export function injectJsonLd(schemaObj: Record<string, any> | null) {
  if (typeof document === 'undefined') return;

  const SCRIPT_ID = 'dalelak-dynamic-jsonld';
  let scriptTag = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

  if (!schemaObj) {
    if (scriptTag) scriptTag.remove();
    return;
  }

  if (!scriptTag) {
    scriptTag = document.createElement('script');
    scriptTag.id = SCRIPT_ID;
    scriptTag.type = 'application/ld+json';
    document.head.appendChild(scriptTag);
  }

  try {
    scriptTag.textContent = JSON.stringify(schemaObj);
  } catch (err) {
    console.error('[SEO] Failed to serialize JSON-LD:', err);
  }
}

/**
 * Updates DOM meta tags
 */
function setMetaTag(selector: string, attrName: string, value: string) {
  if (typeof document === 'undefined') return;
  let element = document.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    if (selector.startsWith('meta[name=')) {
      const name = selector.slice(11, -2);
      element.setAttribute('name', name);
    } else if (selector.startsWith('meta[property=')) {
      const prop = selector.slice(15, -2);
      element.setAttribute('property', prop);
    }
    document.head.appendChild(element);
  }
  element.setAttribute(attrName, value);
}

/**
 * Dynamically applies SEO metadata to client DOM
 */
export function setDynamicSEO(options: {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  business?: Business | null;
  category?: string;
  governorate?: string;
}) {
  if (typeof document === 'undefined') return;

  let finalTitle = DEFAULT_SEO.title;
  let finalDesc = DEFAULT_SEO.description;
  let finalImage = DEFAULT_SEO.image;
  let finalUrl = DEFAULT_SEO.url;

  if (options.business) {
    const biz = options.business;
    finalTitle = `${biz.nameAr} - ${biz.category} في ${biz.city}، ${biz.governorate} | منصة دليلك`;
    finalDesc = biz.description
      ? `${biz.nameAr}: ${biz.description.slice(0, 150)}... تواصل: ${biz.phone}`
      : `تواصل مع ${biz.nameAr} في ${biz.city}، ${biz.governorate}. العنوان: ${biz.street}. رقم الهاتف: ${biz.phone}. موثق عبر منصة دليلك.`;
    
    const photos = Array.isArray(biz.photos) ? biz.photos : [];
    if (biz.coverPhoto) finalImage = biz.coverPhoto;
    else if (photos.length > 0) finalImage = photos[0];

    finalUrl = `https://www.dalilaak.com/?biz=${encodeURIComponent(biz.id)}`;

    // Inject JSON-LD
    const schema = generateLocalBusinessSchema(biz);
    injectJsonLd(schema);
  } else if (options.category || options.governorate) {
    const cat = options.category && options.category !== 'all' ? options.category : 'الأنشطة التجارية';
    const gov = options.governorate && options.governorate !== 'all' ? `في ${options.governorate}` : 'في جميع المحافظات';
    finalTitle = `دليل ${cat} ${gov} | منصة دليلك`;
    finalDesc = `استكشف أفضل وأحدث ${cat} ${gov}. أرقام التليفون، المواعيد، العناوين المعتمدة على Google Maps.`;
    injectJsonLd(null);
  } else {
    if (options.title) finalTitle = options.title;
    if (options.description) finalDesc = options.description;
    if (options.image) finalImage = options.image;
    if (options.url) finalUrl = options.url;
    injectJsonLd(null);
  }

  // Set Title
  document.title = finalTitle;

  // Standard Meta
  setMetaTag('meta[name="description"]', 'content', finalDesc);

  // Canonical Link
  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = finalUrl;

  // Open Graph
  setMetaTag('meta[property="og:title"]', 'content', finalTitle);
  setMetaTag('meta[property="og:description"]', 'content', finalDesc);
  setMetaTag('meta[property="og:image"]', 'content', finalImage);
  setMetaTag('meta[property="og:url"]', 'content', finalUrl);

  // Twitter Card
  setMetaTag('meta[name="twitter:title"]', 'content', finalTitle);
  setMetaTag('meta[name="twitter:description"]', 'content', finalDesc);
  setMetaTag('meta[name="twitter:image"]', 'content', finalImage);
}

/**
 * Resets SEO back to default platform metadata
 */
export function resetSEO() {
  setDynamicSEO({
    title: DEFAULT_SEO.title,
    description: DEFAULT_SEO.description,
    image: DEFAULT_SEO.image,
    url: DEFAULT_SEO.url,
  });
}
