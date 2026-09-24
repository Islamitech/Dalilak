import { normalizeBuildingQuery } from '../utils/hadayekBuildingSearch';
import { getDistrictLabelPosition } from '../components/map/utils/districtLabelPosition';
import { HADAYEK_OFFICIAL_DISTRICTS as labelDistricts, isPointInPolygon as labelInside } from '../data/hadayekDistrictsGeoData';
import assert from 'node:assert/strict';
import {
  isBusinessInHadayekZone,
  filterBusinessesForMap,
  getBusinessHadayekZoneLetter,
} from '../utils/hadayekZoneHelper';
import {
  disperseCoincidentPins,
  disperseActivityCardsScreenSpace,
} from '../components/map/utils/pinDispersal';
import {
  formatDisplayRating,
  sanitizeSafeUrl,
  sanitizePhoneNumber,
  createLightweightBadgeHtml,
  createExpandedActivityCardHtml,
  createCompactActivityPinHtml,
} from '../components/map/badgeMarkers';
import {
  planCameraTransitionOnZoneChange,
  planCameraTransitionOnCategoryChange,
} from '../components/map/utils/cameraPlanner';
import {
  computeMarkerIconKey,
  reconcileMarkerRegistry,
  MarkerRegistryEntry,
} from '../components/map/utils/markerReconciliation';
import { HADAYEK_OFFICIAL_DISTRICTS } from '../data/hadayekDistrictsGeoData';
import { Business } from '../types';
import {
  classifyBusinessCategory,
  matchesCategorySelection,
  resolveCategorySelection,
} from '../utils/categoryMatcher';

let passedTests = 0;
let totalTests = 0;

function test(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err: any) {
    console.error(`  ✗ ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

function createMockBusiness(
  partial: Partial<Business> & { id: string; nameAr: string; category: string; lat: number; lng: number }
): Business {
  return {
    governorate: 'الجيزة',
    city: 'الجيزة',
    street: '',
    phone: '01000000000',
    workingHours: '10:00 - 22:00',
    description: '',
    ownerName: 'المالك',
    ownerPhone: '01000000000',
    photos: [],
    repId: 'rep-1',
    repName: 'المندوب',
    packageId: 'pkg-1',
    packageName: 'باقة أساسية',
    packagePrice: 0,
    amountPaid: 0,
    paymentStatus: 'fully_paid',
    verificationStatus: 'pending',
    invoiceNumber: 'INV-001',
    invoiceDate: '2026-01-01',
    createdDate: '2026-01-01',
    ...partial,
  };
}

test('Every district label stays inside its own polygon and is stable across calls', () => {
  for (const district of labelDistricts) {
    const point = getDistrictLabelPosition(district);
    assert.ok(district.polygons.some(ring => labelInside(point[0], point[1], ring)), district.letterAr);
    assert.deepEqual(getDistrictLabelPosition(district), point);
  }
});

test('Building search accepts Arabic and Persian phone keyboard digits', () => {
  assert.equal(normalizeBuildingQuery(' ٨٨ '), '88');
  assert.equal(normalizeBuildingQuery('عمارة ۱۲۳'), 'عمارة 123');
});

console.log('\n========================================');
console.log('🧪 RUNNING MAP FIXES & COMPLIANCE TESTS');
console.log('========================================\n');

// ---------------------------------------------------------
// 1. Arabic Zone Regex & Word Boundary Matching Tests
// ---------------------------------------------------------
console.log('1. Hadayek Zone Detection & Boundary Safety:');

test('Matches explicit zone mentions with Arabic boundaries', () => {
  // 1. With genuine GPS coordinates inside District A
  const bizWithGps = createMockBusiness({
    id: '1',
    nameAr: 'صيدلية النيل',
    category: 'صيدليات',
    street: 'حدائق الأهرام - منطقة أ - عمارة 123',
    lat: 29.985605,
    lng: 31.103333,
  });
  assert.equal(isBusinessInHadayekZone(bizWithGps, 'أ'), true, 'Should detect منطقة أ with GPS');
  assert.equal(isBusinessInHadayekZone(bizWithGps, 'ب'), false, 'Should not match منطقة ب');

  // 2. With missing coordinates (lat: 0, lng: 0), falls back to text safely
  const bizTextFallback = createMockBusiness({
    id: '1_no_gps',
    nameAr: 'مكتب النيل',
    category: 'خدمات',
    street: 'حدائق الأهرام - منطقة أ - عمارة 123',
    lat: 0,
    lng: 0,
  });
  assert.equal(isBusinessInHadayekZone(bizTextFallback, 'أ'), true, 'Should detect منطقة أ via text fallback when GPS missing');
  assert.equal(isBusinessInHadayekZone(bizTextFallback, 'ب'), false, 'Should not match منطقة ب via text fallback');
});

test('Matches building address format like "عمارة 456 ب" and "456ب"', () => {
  const bizWithSpace = createMockBusiness({
    id: '2',
    nameAr: 'سوبرماركت المدينة',
    category: 'سوبر ماركت',
    street: 'عمارة 456 ب حدائق الاهرام',
    lat: 29.979184,
    lng: 31.106863,
  });
  assert.equal(isBusinessInHadayekZone(bizWithSpace, 'ب'), true, 'Should match 456 ب');

  const bizWithoutSpace = createMockBusiness({
    id: '3',
    nameAr: 'كافيه الرواد',
    category: 'كافيهات',
    street: 'شارع الجيش 456ب',
    lat: 29.979184,
    lng: 31.106863,
  });
  assert.equal(isBusinessInHadayekZone(bizWithoutSpace, 'ب'), true, 'Should match 456ب without space');

  // Also verify fallback when GPS is missing
  const bizNoGps = createMockBusiness({
    id: '3_no_gps',
    nameAr: 'محل الورود 456ب',
    category: 'خدمات',
    street: 'عمارة 456ب',
    lat: 0,
    lng: 0,
  });
  assert.equal(isBusinessInHadayekZone(bizNoGps, 'ب'), true, 'Should match 456ب via text fallback when GPS missing');
});

test('Does NOT falsely match substrings inside unrelated Arabic words', () => {
  const bizFalsePositive = createMockBusiness({
    id: '4',
    nameAr: 'مركز أحمد لطب الأسنان والأشعة',
    category: 'عيادات / أسنان',
    street: 'شارع أول فيصل الرئيسي - بالقرب من الأكاديمية',
    lat: 29.990,
    lng: 31.130, // outside Hadayek bounds
  });
  assert.equal(
    isBusinessInHadayekZone(bizFalsePositive, 'أ'),
    false,
    'Must NOT match "أ" inside Ahmed, Dental, Xray, or Academy'
  );
});

test('GPS point-in-polygon takes precedence over conflicting address text', () => {
  // District B center coordinates
  const districtB = HADAYEK_OFFICIAL_DISTRICTS.find((d) => d.letterAr === 'ب')!;
  const bizWithConflictingText = createMockBusiness({
    id: '5',
    nameAr: 'مكتب خدمات النخبة',
    category: 'خدمات',
    street: 'حدائق الأهرام - قطاع أ - عمارة 50', // Text claims zone A
    lat: districtB.centerLat, // Actual GPS is in Zone B
    lng: districtB.centerLng,
  });

  // GPS point-in-polygon wins over text:
  assert.equal(
    getBusinessHadayekZoneLetter(bizWithConflictingText),
    'ب',
    'GPS point-in-polygon must take precedence over conflicting address text'
  );
  assert.equal(
    isBusinessInHadayekZone(bizWithConflictingText, 'أ'),
    false,
    'Must NOT display pin in Zone A when its real GPS is in Zone B'
  );
  assert.equal(
    isBusinessInHadayekZone(bizWithConflictingText, 'ب'),
    true,
    'Displays pin in its true geographic Zone B'
  );

  // Fallback to text ONLY when GPS is absent:
  const bizWithoutGps = createMockBusiness({
    id: '5_no_gps',
    nameAr: 'مكتب بلا إحداثيات',
    category: 'خدمات',
    street: 'حدائق الأهرام - قطاع أ - عمارة 50',
    lat: 0,
    lng: 0,
  });
  assert.equal(
    isBusinessInHadayekZone(bizWithoutGps, 'أ'),
    true,
    'Falls back to text search only when GPS coordinates are absent'
  );
});

test('Correctly rejects non-Hadayek locations from Hadayek scope', () => {
  const dokkiBiz = createMockBusiness({
    id: '6',
    nameAr: 'مطعم الدقي',
    category: 'مطاعم',
    street: 'شارع التحرير - الدقي',
    lat: 30.038,
    lng: 31.211,
  });
  assert.equal(
    isBusinessInHadayekZone(dokkiBiz, 'all'),
    false,
    'Dokki must not be in Hadayek scope'
  );

  const nasrCityBiz = createMockBusiness({
    id: '7',
    nameAr: 'متجر مدينة نصر',
    category: 'ملابس',
    governorate: 'القاهرة',
    street: 'شارع عباس العقاد - مدينة نصر',
    lat: 30.060,
    lng: 31.340,
  });
  assert.equal(
    isBusinessInHadayekZone(nasrCityBiz, 'all'),
    false,
    'Nasr City must not be in Hadayek scope'
  );

  const nearbyButOutsideOfficialPolygons = createMockBusiness({
    id: '7_nearby_false_positive',
    nameAr: 'نشاط قريب خارج الحدود',
    category: 'خدمات',
    city: 'حدائق الأهرام',
    street: 'منطقة أ',
    lat: 29.995,
    lng: 31.120,
  });
  assert.equal(
    isBusinessInHadayekZone(nearbyButOutsideOfficialPolygons, 'all'),
    false,
    'Valid GPS outside every official polygon must not pass via broad text or rectangle matching'
  );
});

// ---------------------------------------------------------
// 2. 0m Real GPS Pin Coordinate Preservation & Dispersal
// ---------------------------------------------------------
console.log('\n2. 0m Pin Dispersal & Screen-Space Spiderfy Offsets:');

test('Preserves EXACT 0m geographic coordinates for all pins', () => {
  const testLat = 29.968312;
  const testLng = 31.100245;
  const coincidentList: Business[] = [
    createMockBusiness({ id: 'c1', nameAr: 'عيادة 1', category: 'عيادات', lat: testLat, lng: testLng }),
    createMockBusiness({ id: 'c2', nameAr: 'صيدلية 2', category: 'صيدليات', lat: testLat, lng: testLng }),
    createMockBusiness({ id: 'c3', nameAr: 'معمل 3', category: 'معامل', lat: testLat, lng: testLng }),
  ];

  const dispersed = disperseCoincidentPins(coincidentList);
  assert.equal(dispersed.length, 3);

  dispersed.forEach((item, index) => {
    assert.equal(
      item.dispersedCoord[0],
      testLat,
      `Pin ${index} dispersed lat must equal original lat exactly (0m offset)`
    );
    assert.equal(
      item.dispersedCoord[1],
      testLng,
      `Pin ${index} dispersed lng must equal original lng exactly (0m offset)`
    );
    assert.equal(
      item.originCoord[0],
      testLat,
      `Pin ${index} origin lat preserved`
    );
    assert.equal(
      item.originCoord[1],
      testLng,
      `Pin ${index} origin lng preserved`
    );
  });
});

test('Applies radial screen-space pixel spiderfy to coincident pins (small cluster: 3 items)', () => {
  const testLat = 29.9683;
  const testLng = 31.1002;
  const items: Business[] = [
    createMockBusiness({ id: '1', nameAr: 'نشاط 1', category: 'مطاعم', lat: testLat, lng: testLng }),
    createMockBusiness({ id: '2', nameAr: 'نشاط 2', category: 'كافيهات', lat: testLat, lng: testLng }),
    createMockBusiness({ id: '3', nameAr: 'نشاط 3', category: 'حلويات', lat: testLat, lng: testLng }),
  ];

  const dispersed = disperseCoincidentPins(items);
  const offsets = dispersed.map((d) => d.pixelOffset);

  const distinctOffsets = new Set(offsets.map(([dx, dy]) => `${dx},${dy}`));
  assert.equal(distinctOffsets.size, 3, 'All 3 coincident pins must have distinct pixel offsets');

  offsets.forEach(([dx, dy]) => {
    const dist = Math.hypot(dx, dy);
    assert.ok(dist >= 20 && dist <= 50, `Spiderfy offset radius ${dist} must be bounded between 20px and 50px`);
  });
});

test('Distributes large coincident clusters (12 items) using concentric circular rings without runaway line', () => {
  const testLat = 29.9701;
  const testLng = 31.1055;
  const items: Business[] = Array.from({ length: 12 }, (_, i) =>
    createMockBusiness({
      id: `m_${i}`,
      nameAr: `نشاط مجمع ${i + 1}`,
      category: 'خدمات',
      lat: testLat,
      lng: testLng,
    })
  );

  const dispersed = disperseCoincidentPins(items);
  assert.equal(dispersed.length, 12);

  const uniqueOffsets = new Set(dispersed.map((d) => `${d.pixelOffset[0]},${d.pixelOffset[1]}`));
  assert.equal(uniqueOffsets.size, 12, 'All 12 items in large cluster must have unique offsets');

  const maxOffsetDistance = Math.max(...dispersed.map((d) => Math.hypot(d.pixelOffset[0], d.pixelOffset[1])));
  assert.ok(
    maxOffsetDistance <= 65,
    `Max concentric ring distance (${maxOffsetDistance}px) must stay compact under 65px`
  );
});

test('disperseActivityCardsScreenSpace separates coincident cards by minimum horizontal spacing (cardWidth + 12px)', () => {
  const mockMap = {
    latLngToContainerPoint: (coords: [number, number]) => ({ x: 400, y: 300 }),
    getSize: () => ({ x: 1000, y: 800 }),
  };

  const top3 = [
    createMockBusiness({ id: 'card1', nameAr: 'نشاط 1', category: 'مطاعم', lat: 29.968, lng: 31.100 }),
    createMockBusiness({ id: 'card2', nameAr: 'نشاط 2', category: 'مطاعم', lat: 29.968, lng: 31.100 }),
    createMockBusiness({ id: 'card3', nameAr: 'نشاط 3', category: 'مطاعم', lat: 29.968, lng: 31.100 }),
  ];

  const offsets = disperseActivityCardsScreenSpace(top3, mockMap, {
    cardWidth: 184,
    cardHeight: 143,
    minSpacing: 196,
  });

  assert.equal(offsets.size, 3);
  const offsetValues = Array.from(offsets.values()).map(([dx]) => dx);
  offsetValues.sort((a, b) => a - b);

  // Difference between adjacent cards must be at least minSpacing (196px)
  const diff1 = offsetValues[1] - offsetValues[0];
  const diff2 = offsetValues[2] - offsetValues[1];
  assert.ok(diff1 >= 196, `Distance between card 1 and 2 (${diff1}px) must be >= 196px`);
  assert.ok(diff2 >= 196, `Distance between card 2 and 3 (${diff2}px) must be >= 196px`);
});

// ---------------------------------------------------------
// 3. Security, HTML Escaping & Authentic Rating Display
// ---------------------------------------------------------
console.log('\n3. Security, HTML Escaping & Authentic Rating Display:');

test('sanitizeSafeUrl permits valid URLs and strictly blocks dangerous URI schemes', () => {
  assert.equal(sanitizeSafeUrl('https://example.com/photo.jpg'), 'https://example.com/photo.jpg');
  assert.equal(sanitizeSafeUrl('http://maps.google.com/?q=loc'), 'http://maps.google.com/?q=loc');
  assert.equal(sanitizeSafeUrl('/images/fallback.png'), '/images/fallback.png');

  assert.equal(sanitizeSafeUrl('javascript:alert(document.cookie)'), null);
  assert.equal(sanitizeSafeUrl('data:text/html,<script>alert(1)</script>'), null);
  assert.equal(sanitizeSafeUrl('vbscript:msgbox("test")'), null);
  assert.equal(sanitizeSafeUrl('https://valid.com" onmouseover="alert(1)'), null);
  assert.equal(sanitizeSafeUrl('https://valid.com<script>'), null);
});

test('sanitizePhoneNumber only allows digits and leading + without script injection', () => {
  assert.equal(sanitizePhoneNumber('+201012345678'), '+201012345678');
  assert.equal(sanitizePhoneNumber('01123456789'), '01123456789');
  assert.equal(sanitizePhoneNumber('010-1234-5678'), '01012345678');
  assert.equal(sanitizePhoneNumber('123'), null, 'Rejects too short numbers (<7)');
  assert.equal(sanitizePhoneNumber('01012345678<script>'), '01012345678');
  assert.equal(sanitizePhoneNumber(undefined), null);
});

test('formatDisplayRating displays authentic ratings and NEVER fabricates fake 4.9 or 5.0', () => {
  const genuineBiz = createMockBusiness({
    id: 'r1',
    nameAr: 'نشاط ذو تقييم حقيقي',
    category: 'كافيهات',
    googleRating: 4.3,
    googleReviewsCount: 85,
    lat: 29.968,
    lng: 31.100,
  });
  const res1 = formatDisplayRating(genuineBiz);
  assert.equal(res1.ratingText, '★ 4.3');
  assert.equal(res1.reviewCountText, '(85)');

  const missingRatingBiz = createMockBusiness({
    id: 'r2',
    nameAr: 'نشاط جديد بدون تقييم',
    category: 'مطاعم',
    lat: 29.968,
    lng: 31.100,
  });
  const res2 = formatDisplayRating(missingRatingBiz);
  assert.equal(res2.ratingText, null, 'Must NOT fabricate 4.9 when rating is missing');
  assert.equal(res2.reviewCountText, null);

  const disabledBiz = createMockBusiness({
    id: 'd1',
    nameAr: 'نشاط معطل التقييم',
    category: 'خدمات',
    googleRating: 4.8,
    googleRatingEnabled: false,
    lat: 29.968,
    lng: 31.100,
  });
  const res3 = formatDisplayRating(disabledBiz);
  assert.equal(res3.ratingText, null, 'Must respect googleRatingEnabled: false');
});

test('createCompactActivityPinHtml renders needle pointer, ground anchor and escaped text', () => {
  const biz = createMockBusiness({
    id: 'sec1',
    nameAr: '<script>alert("xss")</script> صيدلية الشفاء',
    category: 'صيدليات',
    lat: 29.968,
    lng: 31.100,
    verificationStatus: 'verified',
  });

  const { html, iconSize, iconAnchor } = createCompactActivityPinHtml(biz, false, true, 1);
  assert.ok(!html.includes('<script>'), 'Must escape malicious HTML script tags');
  assert.ok(html.includes('&lt;script&gt;'), 'Must encode malicious angle brackets');
  assert.ok(html.includes('#1'), 'Must include prominence rank badge');
  assert.ok(html.includes('border-top: 6px solid'), 'Must include needle pointer');
  assert.equal(iconSize[0], 36, 'Compact pin width is 36px');
  assert.equal(iconAnchor[0], 18, 'Anchor X is centered at 18px');
  assert.equal(iconAnchor[1], 44, 'Anchor Y is at ground needle tip at 44px');
});

test('createLightweightBadgeHtml renders photo card with zero inline onclick/onerror', () => {
  const biz = createMockBusiness({
    id: 'card1',
    nameAr: 'مطعم الواحة',
    category: 'مطاعم',
    lat: 29.968,
    lng: 31.100,
    googleRating: 4.7,
  });

  const pixelOffset: [number, number] = [20, -15];
  const { html, iconAnchor } = createLightweightBadgeHtml(biz, false, true, 1, pixelOffset);

  assert.ok(!html.includes('onclick='), 'Forbidden to use inline onclick');
  assert.ok(!html.includes('onerror='), 'Forbidden to use inline onerror');
  assert.ok(html.includes('biz-card-photo'), 'Must render photo with safe class');
  assert.ok(html.includes('<svg style="position: absolute'), 'Must include curved SVG leader line container');
  assert.ok(html.includes('stroke-dasharray="5,4"'), 'Must include dashed connector line');
  assert.equal(iconAnchor[0], Math.round(184 / 2) - 20, 'Anchor X must correctly offset to true ground position');
});

test('createExpandedActivityCardHtml renders expanded details card with close button and actions', () => {
  const biz = createMockBusiness({
    id: 'exp1',
    nameAr: 'مستشفى الأهرام التخصصي',
    category: 'مستشفيات',
    street: 'شارع الثروة المعدنية',
    lat: 29.968,
    lng: 31.100,
    googleRating: 4.5,
    verificationStatus: 'verified',
  });

  const { html, iconSize } = createExpandedActivityCardHtml(biz, true, 1);
  assert.ok(!html.includes('onclick='), 'Forbidden to use inline onclick');
  assert.ok(!html.includes('onerror='), 'Forbidden to use inline onerror');
  assert.ok(html.includes('card-close-btn'), 'Must have close button with card-close-btn class');
  assert.ok(html.includes('✕'), 'Must show close symbol');
  assert.ok(html.includes('card-action-link'), 'Must have action links with card-action-link class');
  assert.equal(iconSize[0], 256, 'Expanded card width is 256px');
});

// ---------------------------------------------------------
// 4. Central Filter Logic & Address Elimination Tests
// ---------------------------------------------------------
console.log('\n4. filterBusinessesForMap Single Source of Truth:');

test('filterBusinessesForMap handles zone, category, and verification filters accurately', () => {
  const businessesList: Business[] = [
    createMockBusiness({
      id: 'b1',
      nameAr: 'مطعم الهرم في منطقة أ',
      category: 'مطاعم',
      street: 'منطقة أ حدائق الاهرام',
      lat: 29.985605, // Inside District A polygon
      lng: 31.103333,
      verificationStatus: 'verified',
    }),
    createMockBusiness({
      id: 'b2',
      nameAr: 'صيدلية الأهرام في منطقة أ',
      category: 'صيدليات',
      street: 'منطقة أ حدائق الاهرام',
      lat: 29.985605, // Inside District A polygon
      lng: 31.103333,
      verificationStatus: 'pending',
    }),
    createMockBusiness({
      id: 'b3',
      nameAr: 'مطعم النجوم في منطقة ب',
      category: 'مطاعم',
      street: 'منطقة ب حدائق الاهرام',
      lat: 29.979184, // Inside District B polygon
      lng: 31.106863,
      verificationStatus: 'verified',
    }),
  ];

  // 1. All zones, all categories
  assert.equal(filterBusinessesForMap(businessesList, 'all', 'all').length, 3);

  // 2. Zone A only
  const zoneAOnly = filterBusinessesForMap(businessesList, 'أ', 'all');
  assert.equal(zoneAOnly.length, 2);
  assert.ok(zoneAOnly.every((b) => b.street.includes('منطقة أ')));

  // 3. Zone A + category 'مطاعم'
  const zoneARestaurants = filterBusinessesForMap(businessesList, 'أ', 'مطاعم');
  assert.equal(zoneARestaurants.length, 1);
  assert.equal(zoneARestaurants[0].id, 'b1');

  // 4. Zone A + only verified
  const zoneAVerified = filterBusinessesForMap(businessesList, 'أ', 'all', true);
  assert.equal(zoneAVerified.length, 1);
  assert.equal(zoneAVerified[0].id, 'b1');

  // 5. Zone B + category 'صيدليات' (None exist)
  const zoneBPharmacies = filterBusinessesForMap(businessesList, 'ب', 'صيدليات');
  assert.equal(zoneBPharmacies.length, 0);
});

test('Business does NOT contain address property and uses street/landmark instead', () => {
  const sampleBiz = createMockBusiness({
    id: 'test_no_addr',
    nameAr: 'منشأة الاختبار',
    category: 'مطاعم',
    street: 'شارع الجيش - منطقة أ',
    landmark: 'بجوار البوابة الأولى',
    lat: 29.985605,
    lng: 31.103333,
  });

  assert.equal((sampleBiz as any).address, undefined, 'Business must not have address property');
  assert.ok(sampleBiz.street.length > 0, 'Uses real street property');
  assert.ok((sampleBiz.landmark || '').length > 0, 'Uses real landmark property');
  assert.equal(isBusinessInHadayekZone(sampleBiz, 'أ'), true, 'Zone detected via street/landmark');
});

// ---------------------------------------------------------
// 5. Camera Coordinator & Marker Registry Isolation Tests
// ---------------------------------------------------------
console.log('\n5. Camera Movement Single Owner & Marker Registry Stability:');

test('Category filter change triggers zero camera transitions', () => {
  const decision1 = planCameraTransitionOnCategoryChange('all', 'مطاعم');
  assert.equal(decision1.shouldMove, false, 'Category change from all to مطاعم must not move camera');

  const decision2 = planCameraTransitionOnCategoryChange('مطاعم', 'كافيهات');
  assert.equal(decision2.shouldMove, false, 'Category change from مطاعم to كافيهات must not move camera');
});

test('Zone change triggers exactly ONE camera transition per selection', () => {
  // 1. Repeating the same zone triggers ZERO transitions
  const repeatDecision = planCameraTransitionOnZoneChange('أ', 'أ', HADAYEK_OFFICIAL_DISTRICTS);
  assert.equal(repeatDecision.shouldMove, false, 'Repeating same zone triggers 0 transitions');

  // 2. Initial zone selection triggers transition to zone boundaries
  const selectADecision = planCameraTransitionOnZoneChange('', 'أ', HADAYEK_OFFICIAL_DISTRICTS);
  assert.equal(selectADecision.shouldMove, true, 'Selecting zone أ triggers transition');
  assert.equal(selectADecision.type, 'zone');
  assert.ok(selectADecision.targetBounds && selectADecision.targetBounds.length > 0, 'Target bounds provided for zone أ');

  // 3. Changing to another zone triggers transition
  const selectBDecision = planCameraTransitionOnZoneChange('أ', 'ب', HADAYEK_OFFICIAL_DISTRICTS);
  assert.equal(selectBDecision.shouldMove, true, 'Switching to zone ب triggers transition');
  assert.equal(selectBDecision.type, 'zone');

  // 4. Clearing zone triggers return to general Hadayek overview
  const clearDecision = planCameraTransitionOnZoneChange('ب', '', HADAYEK_OFFICIAL_DISTRICTS);
  assert.equal(clearDecision.shouldMove, true, 'Clearing zone triggers transition');
  assert.equal(clearDecision.type, 'overview');
  assert.deepEqual(clearDecision.targetCenter, [29.9683, 31.1002]);
  assert.equal(clearDecision.targetZoom, 14);

  const multipartDecision = planCameraTransitionOnZoneChange('', 'س', [
    {
      letterAr: 'س',
      polygons: [
        [[29.95, 31.09], [29.96, 31.10]],
        [[29.97, 31.11], [29.98, 31.12]],
      ],
    },
  ]);
  assert.deepEqual(
    multipartDecision.targetBounds,
    [[29.95, 31.09], [29.96, 31.10], [29.97, 31.11], [29.98, 31.12]],
    'Camera framing must include every polygon ring in a multipart district'
  );
});

test('Marker Registry reconciliation retains identical marker instances across non-affecting renders', () => {
  const registry = new Map<string, MarkerRegistryEntry<{ id: string; currentIcon?: string }>>();

  const biz1 = createMockBusiness({
    id: 'biz_stable_1',
    nameAr: 'نشاط مستقر 1',
    category: 'مطاعم',
    lat: 29.968,
    lng: 31.100,
    googleRating: 4.8,
  });
  const biz2 = createMockBusiness({
    id: 'biz_stable_2',
    nameAr: 'نشاط مستقر 2',
    category: 'كافيهات',
    lat: 29.969,
    lng: 31.101,
    googleRating: 4.5,
  });

  let createdCount = 0;
  let updatedCount = 0;
  let removedCount = 0;

  const callbacks = {
    createMarker: (b: Business, idx: number, key: string) => {
      createdCount++;
      return { id: `marker_${b.id}`, currentIcon: key };
    },
    updateMarkerIcon: (m: { id: string; currentIcon?: string }, b: Business, key: string) => {
      updatedCount++;
      m.currentIcon = key;
    },
    removeMarker: (m: { id: string }, id: string) => {
      removedCount++;
    },
  };

  const itemsPass1 = [
    { biz: biz1, idx: 0, offset: [0, 0] as [number, number], mode: 'card' as const },
    { biz: biz2, idx: 1, offset: [0, 0] as [number, number], mode: 'card' as const },
  ];

  // First pass: creation
  const res1 = reconcileMarkerRegistry(registry, itemsPass1, callbacks);
  assert.equal(res1.added.length, 2);
  assert.equal(createdCount, 2);
  const m1 = registry.get(biz1.id)!.marker;
  const m2 = registry.get(biz2.id)!.marker;

  // Second pass: identical items (re-render)
  const res2 = reconcileMarkerRegistry(registry, itemsPass1, callbacks);
  assert.equal(res2.retained.length, 2);
  assert.equal(res2.added.length, 0);
  assert.equal(res2.updated.length, 0);
  assert.equal(createdCount, 2, 'No new markers created');
  assert.equal(registry.get(biz1.id)!.marker, m1, 'Instance m1 strictly preserved');
  assert.equal(registry.get(biz2.id)!.marker, m2, 'Instance m2 strictly preserved');
});

test('Marker Registry detects changes in name, photo, category, rating, or working hours', () => {
  const registry = new Map<string, MarkerRegistryEntry<{ id: string; currentIcon?: string }>>();

  const biz = createMockBusiness({
    id: 'biz_evolving',
    nameAr: 'الاسم القديم',
    category: 'مطاعم',
    lat: 29.985605,
    lng: 31.103333,
    googleRating: 4.2,
    coverPhoto: 'https://example.com/old.jpg',
    workingHours: '9am - 10pm',
  });

  let updateIconCalls = 0;
  const callbacks = {
    createMarker: (b: Business, idx: number, key: string) => ({ id: `marker_${b.id}`, currentIcon: key }),
    updateMarkerIcon: (m: { id: string; currentIcon?: string }, b: Business, key: string) => {
      updateIconCalls++;
      m.currentIcon = key;
    },
    removeMarker: () => {},
  };

  reconcileMarkerRegistry(registry, [{ biz, idx: 0, offset: [0, 0], mode: 'card' }], callbacks);
  assert.equal(updateIconCalls, 0);

  // Update rating and cover photo
  const updatedBiz = {
    ...biz,
    googleRating: 4.9,
    coverPhoto: 'https://example.com/new.jpg',
  };

  const res = reconcileMarkerRegistry(registry, [{ biz: updatedBiz, idx: 0, offset: [0, 0], mode: 'card' }], callbacks);
  assert.equal(res.updated.length, 1);
  assert.equal(res.updated[0], biz.id);
  assert.equal(updateIconCalls, 1, 'updateMarkerIcon was called with new properties');
  assert.equal(registry.get(biz.id)!.biz.googleRating, 4.9, 'Biz reference refreshed preventing stale closures');
});

test('Marker Registry removes markers no longer present', () => {
  const registry = new Map<string, MarkerRegistryEntry<{ id: string }>>();
  const biz1 = createMockBusiness({
    id: 'staying_biz',
    nameAr: 'نشاط مستمر',
    category: 'مطاعم',
    lat: 29.985605,
    lng: 31.103333,
  });
  const biz2 = createMockBusiness({
    id: 'leaving_biz',
    nameAr: 'نشاط مغادر',
    category: 'كافيهات',
    lat: 29.985605,
    lng: 31.103333,
  });

  let removedId = '';
  const callbacks = {
    createMarker: (b: Business) => ({ id: `m_${b.id}` }),
    updateMarkerIcon: () => {},
    removeMarker: (m: any, id: string) => { removedId = id; },
  };

  reconcileMarkerRegistry(registry, [
    { biz: biz1, idx: 0, offset: [0, 0] },
    { biz: biz2, idx: 1, offset: [0, 0] },
  ], callbacks);
  assert.equal(registry.size, 2);

  // Second pass: only biz1 remains
  const res = reconcileMarkerRegistry(registry, [{ biz: biz1, idx: 0, offset: [0, 0] }], callbacks);
  assert.equal(res.removed.length, 1);
  assert.equal(res.removed[0], 'leaving_biz');
  assert.equal(removedId, 'leaving_biz');
  assert.equal(registry.size, 1);
});

test('Hierarchical taxonomy groups supermarket, grocery, and produce under grocery', () => {
  assert.deepEqual(resolveCategorySelection('سوبرماركت'), { mainCategoryId: 'grocery', subcategoryId: 'supermarket-grocery' });
  assert.equal(classifyBusinessCategory({ category: 'بقالة' }).mainCategoryId, 'grocery');
  const produce = classifyBusinessCategory({ category: 'خضار وفاكهة' });
  assert.equal(produce.mainCategoryId, 'grocery');
  assert.equal(produce.subcategoryId, 'fruit-vegetables');
});

test('Taxonomy distinguishes a plumber service from plumbing supplies', () => {
  const plumber = classifyBusinessCategory({ category: 'سباك' });
  const supplies = classifyBusinessCategory({ category: 'أدوات سباكة' });
  assert.equal(plumber.mainCategoryId, 'crafts');
  assert.equal(plumber.subcategoryId, 'plumber');
  assert.equal(supplies.mainCategoryId, 'home');
  assert.equal(supplies.subcategoryId, 'building-plumbing-supplies');
});

test('Taxonomy distinguishes an electrician from electrical supplies', () => {
  assert.equal(classifyBusinessCategory({ category: 'كهربائي' }).subcategoryId, 'electrician');
  assert.equal(classifyBusinessCategory({ category: 'أدوات كهربائية' }).subcategoryId, 'lighting-electrical-supplies');
});

test('Craft taxonomy covers construction tools and finishing trades', () => {
  assert.equal(classifyBusinessCategory({ category: 'أدوات بناء' }).subcategoryId, 'building-tools');
  assert.equal(classifyBusinessCategory({ category: 'نقاش وتشطيبات منزلية' }).subcategoryId, 'painting-finishing');
});

test('Explicit category outranks incidental words in description', () => {
  const result = classifyBusinessCategory({ category: 'سوبر ماركت', description: 'بجوار مطعم وكافيه مشهور' });
  assert.equal(result.mainCategoryId, 'grocery');
  assert.equal(result.subcategoryId, 'supermarket-grocery');
  assert.equal(result.source, 'category');
});

test('Structured taxonomy fields have the highest priority', () => {
  const result = classifyBusinessCategory({
    mainCategoryId: 'crafts',
    subcategoryId: 'plumber',
    category: 'سوبر ماركت',
  });
  assert.equal(result.mainCategoryId, 'crafts');
  assert.equal(result.subcategoryId, 'plumber');
  assert.equal(result.confidence, 1);
});

test('Main and subcategory filters use the same classification result', () => {
  const business = { category: 'خضروات وفواكه طازجة' };
  assert.equal(matchesCategorySelection(business, 'grocery', 'all'), true);
  assert.equal(matchesCategorySelection(business, 'grocery', 'fruit-vegetables'), true);
  assert.equal(matchesCategorySelection(business, 'grocery', 'supermarket-grocery'), false);
});

test('Unknown legacy categories are flagged for review instead of leaking into a known group', () => {
  const result = classifyBusinessCategory({ category: 'خدمة غير مصنفة تماماً' });
  assert.equal(result.mainCategoryId, 'other');
  assert.equal(result.subcategoryId, 'all');
  assert.equal(result.needsReview, true);
});

console.log('\n========================================');
console.log(`🎉 TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED!`);
console.log('========================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
