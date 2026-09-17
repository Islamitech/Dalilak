import { describe, it, expect, beforeEach } from 'vitest';
import {
  mapCategoryToSchemaType,
  generateLocalBusinessSchema,
  setDynamicSEO,
  resetSEO,
  DEFAULT_SEO,
} from '../src/utils/seoHelper';
import { isSocialBotOrCrawler, injectBusinessSocialMetadata } from '../server';
import { Business } from '../src/types';

describe('SEO & Schema.org LocalBusiness Standard Suite (WS-09)', () => {
  const sampleBusiness: Business = {
    id: 'biz_seo_test_101',
    nameAr: 'مستشفى الشروق التخصصي',
    nameEn: 'Al Shorouk Hospital',
    category: 'طبي',
    subCategory: 'مستشفيات',
    governorate: 'القاهرة',
    city: 'الشروق',
    street: 'المحور الغربي',
    phone: '01099887766',
    workingHours: '24 ساعة',
    description: 'مستشفى متكامل يقدم رعاية صحية وطوارئ 24 ساعة بمحافظة القاهرة.',
    lat: 30.1234,
    lng: 31.5678,
    ownerName: 'د. أحمد هلال',
    ownerPhone: '01099887766',
    photos: ['https://dalilaak.com/images/hospital_cover.jpg'],
    coverPhoto: 'https://dalilaak.com/images/hospital_cover.jpg',
    repId: 'rep_1',
    repName: 'مندوب الشروق',
    packageId: 'pkg_standard',
    packageName: 'باقة التوثيق',
    packagePrice: 500,
    amountPaid: 500,
    paymentStatus: 'fully_paid',
    verificationStatus: 'verified',
    publishedStatus: 'published',
    invoiceNumber: 'INV-101',
    invoiceDate: '2026-09-17',
    createdDate: '2026-09-17T08:00:00Z',
    googleRating: 4.8,
    googleReviewsCount: 85,
  };

  it('1. should map category to appropriate Schema.org sub-type', () => {
    expect(mapCategoryToSchemaType('طبي')).toBe('MedicalBusiness');
    expect(mapCategoryToSchemaType('مطعم وكافيه')).toBe('Restaurant');
    expect(mapCategoryToSchemaType('محل ملابس')).toBe('Store');
    expect(mapCategoryToSchemaType('صيانة سيارات')).toBe('AutoRepair');
    expect(mapCategoryToSchemaType('خدمات أخرى')).toBe('LocalBusiness');
  });

  it('2. should generate valid Schema.org LocalBusiness JSON-LD structure', () => {
    const schema = generateLocalBusinessSchema(sampleBusiness);

    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('MedicalBusiness');
    expect(schema.name).toBe('مستشفى الشروق التخصصي');
    expect(schema.telephone).toBe('01099887766');
    expect(schema.address['@type']).toBe('PostalAddress');
    expect(schema.address.addressLocality).toBe('الشروق');
    expect(schema.address.addressRegion).toBe('القاهرة');
    expect(schema.address.addressCountry).toBe('EG');
    expect(schema.geo['@type']).toBe('GeoCoordinates');
    expect(schema.geo.latitude).toBe(30.1234);
    expect(schema.geo.longitude).toBe(31.5678);
    expect(schema.aggregateRating['@type']).toBe('AggregateRating');
    expect(schema.aggregateRating.ratingValue).toBe(4.8);
    expect(schema.aggregateRating.reviewCount).toBe(85);
  });

  it('3. should dynamically update document title and meta tags for a business', () => {
    // In Node/Vitest with happy-dom or jsdom or mock document
    if (typeof document !== 'undefined') {
      setDynamicSEO({ business: sampleBusiness });
      expect(document.title).toContain('مستشفى الشروق التخصصي');
      expect(document.title).toContain('الشروق');

      const descMeta = document.querySelector('meta[name="description"]');
      expect(descMeta?.getAttribute('content')).toContain('مستشفى الشروق التخصصي');

      const ogTitle = document.querySelector('meta[property="og:title"]');
      expect(ogTitle?.getAttribute('content')).toContain('مستشفى الشروق التخصصي');

      const ogImage = document.querySelector('meta[property="og:image"]');
      expect(ogImage?.getAttribute('content')).toBe('https://dalilaak.com/images/hospital_cover.jpg');

      resetSEO();
      expect(document.title).toBe(DEFAULT_SEO.title);
    }
  });

  it('4. should accurately detect social sharing crawlers and bots', () => {
    expect(isSocialBotOrCrawler('WhatsApp/2.21.11.17 i')).toBe(true);
    expect(isSocialBotOrCrawler('facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)')).toBe(true);
    expect(isSocialBotOrCrawler('Twitterbot/1.0')).toBe(true);
    expect(isSocialBotOrCrawler('TelegramBot (like TwitterBot)')).toBe(true);
    expect(isSocialBotOrCrawler('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')).toBe(true);

    // Regular browser user-agents should NOT be classified as bots
    expect(
      isSocialBotOrCrawler(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      )
    ).toBe(false);
    expect(
      isSocialBotOrCrawler(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
      )
    ).toBe(false);
  });

  it('5. should inject business social metadata and JSON-LD into raw HTML template', () => {
    const rawHtml = `<!doctype html>
<html>
  <head>
    <title>Default Title</title>
    <meta property="og:title" content="Default OG Title" />
    <meta property="og:description" content="Default Description" />
    <meta property="og:image" content="https://dalilaak.com/default.jpg" />
    <meta property="og:url" content="https://dalilaak.com/" />
    <meta name="twitter:title" content="Default Twitter" />
    <meta name="twitter:description" content="Default Description" />
    <meta name="twitter:image" content="https://dalilaak.com/default.jpg" />
  </head>
  <body><div id="root"></div></body>
</html>`;

    const injected = injectBusinessSocialMetadata(rawHtml, sampleBusiness);

    expect(injected).toContain('<title>مستشفى الشروق التخصصي');
    expect(injected).toContain('content="مستشفى الشروق التخصصي');
    expect(injected).toContain('https://dalilaak.com/images/hospital_cover.jpg');
    expect(injected).toContain('<script type="application/ld+json">');
    expect(injected).toContain('"name":"مستشفى الشروق التخصصي"');
    expect(injected).toContain('"telephone":"01099887766"');
  });
});
