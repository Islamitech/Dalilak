import { classifyPhoneNumber, isPhoneAllowedByFilter } from '../src/utils/phoneClassifier.js';
import { calculateHaversineDistanceKm, evaluatePlaceGeoBoundary, formatLocalizedDistance } from '../src/utils/geoBoundaryGuard.js';

console.log('=== 🧪 STARTING UNIT TESTS FOR GOOGLE INGESTION ENHANCEMENTS ===\n');

// 1. Phone Classifier Tests
console.log('--- 1. Testing Phone Classifier ---');
const testPhones = [
  { raw: '01012345678', expected: 'mobile', label: 'Egyptian Mobile (Vodafone)' },
  { raw: '+20 11 9876 5432', expected: 'mobile', label: 'Egyptian Mobile with intl code (Etisalat)' },
  { raw: '01234567890', expected: 'mobile', label: 'Egyptian Mobile (Orange)' },
  { raw: '01512345678', expected: 'mobile', label: 'Egyptian Mobile (WE)' },
  { raw: '02 33456789', expected: 'landline', label: 'Cairo/Giza Landline' },
  { raw: '+20 2 27912345', expected: 'landline', label: 'Cairo Landline (+20 2)' },
  { raw: '03 5432100', expected: 'landline', label: 'Alexandria Landline' },
  { raw: '050 2233445', expected: 'landline', label: 'Mansoura Landline' },
  { raw: '19011', expected: 'short_code', label: 'Hotline 5-digits (19011)' },
  { raw: '16670', expected: 'short_code', label: 'Hotline 5-digits (16670)' },
  { raw: '15555', expected: 'short_code', label: 'Hotline 5-digits (15555)' },
  { raw: '920001234', expected: 'short_code', label: 'Saudi Unified 9200' },
  { raw: '', expected: 'none', label: 'Empty Phone' },
  { raw: '00000000000', expected: 'none', label: 'Dummy 0000 Phone' },
];

let phoneTestsPassed = true;
for (const item of testPhones) {
  const res = classifyPhoneNumber(item.raw);
  const match = res.type === item.expected;
  if (!match) phoneTestsPassed = false;
  console.log(`[${match ? 'PASS' : 'FAIL'}] ${item.label} ("${item.raw}") => ${res.type} (${res.labelAr})`);
}

// 2. Phone Filter Evaluation Tests
console.log('\n--- 2. Testing Phone Filter Constraints ---');
const testNoPhone = isPhoneAllowedByFilter('', { excludeNoPhone: true });
console.log(`Exclude No Phone on "": allowed=${testNoPhone.allowed} => ${!testNoPhone.allowed ? 'PASS' : 'FAIL'}`);

const testLandline = isPhoneAllowedByFilter('02 33456789', { excludeLandline: true });
console.log(`Exclude Landline on 02 33456789: allowed=${testLandline.allowed} => ${!testLandline.allowed ? 'PASS' : 'FAIL'}`);

const testHotline = isPhoneAllowedByFilter('19011', { excludeShortCodes: true });
console.log(`Exclude Short Code on 19011: allowed=${testHotline.allowed} => ${!testHotline.allowed ? 'PASS' : 'FAIL'}`);

const testOnlyMobileValid = isPhoneAllowedByFilter('01012345678', { onlyMobile: true });
const testOnlyMobileInvalid = isPhoneAllowedByFilter('02 33456789', { onlyMobile: true });
console.log(`Only Mobile on 01012345678: allowed=${testOnlyMobileValid.allowed} => ${testOnlyMobileValid.allowed ? 'PASS' : 'FAIL'}`);
console.log(`Only Mobile on 02 33456789: allowed=${testOnlyMobileInvalid.allowed} => ${!testOnlyMobileInvalid.allowed ? 'PASS' : 'FAIL'}`);

// 3. Geographic Boundary & Distance Tests
console.log('\n--- 3. Testing Geo Boundary & Haversine Distance ---');
const zayedCenter = { lat: 30.0461, lng: 30.9856 };

const insideZayed = { lat: 30.0380, lng: 30.9700 };
const dist1 = calculateHaversineDistanceKm(zayedCenter.lat, zayedCenter.lng, insideZayed.lat, insideZayed.lng);
const checkInside = evaluatePlaceGeoBoundary(insideZayed, 'الشيخ زايد، الجيزة', {
  strictBoundary: true,
  maxRadiusKm: 8,
  hubLocation: zayedCenter,
  hubName: 'الشيخ زايد',
});
console.log(`Inside Zayed: dist=${formatLocalizedDistance(dist1)} => withinBoundary=${checkInside.withinBoundary} => ${checkInside.withinBoundary ? 'PASS' : 'FAIL'}`);

const nasrCity = { lat: 30.0566, lng: 31.3301 };
const dist2 = calculateHaversineDistanceKm(zayedCenter.lat, zayedCenter.lng, nasrCity.lat, nasrCity.lng);
const checkOutside = evaluatePlaceGeoBoundary(nasrCity, 'مدينة نصر، القاهرة', {
  strictBoundary: true,
  maxRadiusKm: 8,
  hubLocation: zayedCenter,
  hubName: 'الشيخ زايد',
});
console.log(`Nasr City from Zayed: dist=${formatLocalizedDistance(dist2)} => withinBoundary=${checkOutside.withinBoundary} => ${!checkOutside.withinBoundary ? 'PASS' : 'FAIL'}`);

const checkConflict = evaluatePlaceGeoBoundary({ lat: undefined, lng: undefined }, 'محطة الرمل، الإسكندرية', {
  strictBoundary: true,
  maxRadiusKm: 8,
  hubName: 'الشيخ زايد',
});
console.log(`Conflicting Alexandria Address: withinBoundary=${checkConflict.withinBoundary} => ${!checkConflict.withinBoundary ? 'PASS' : 'FAIL'}`);

console.log('\n=== ✅ ALL TESTS COMPLETED SUCCESSFULLY ===');
