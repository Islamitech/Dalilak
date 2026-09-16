import { isWithinHadayekAlAhramScope } from '../src/utils/geoBoundaryGuard.js';

console.log('Starting Hadayek Al-Ahram 8km Geofence Filter Tests...');
let passed = 0;
let total = 0;
function assert(cond, name) { total++; if (cond) { passed++; console.log('[PASS] ' + name); } else { console.error('[FAIL] ' + name); } }

const biz1 = { nameAr: 'Pharmacy Gate 1', city: 'Giza', lat: 29.9880, lng: 31.1210 };
const res1 = isWithinHadayekAlAhramScope(biz1, 8);
assert(res1.matches && res1.matchReason === 'coords' && res1.distanceKm < 2, 'Gate 1 business within 2km');

const biz2 = { nameAr: 'Haram Restaurant', city: 'Haram', lat: 29.9950, lng: 31.1400 };
const res2 = isWithinHadayekAlAhramScope(biz2, 8);
assert(res2.matches && res2.matchReason === 'coords' && res2.distanceKm < 8, 'Haram business within 8km');

const biz3 = { nameAr: 'Alex Cafe', city: 'Alexandria', lat: 31.2001, lng: 29.9187 };
const res3 = isWithinHadayekAlAhramScope(biz3, 8);
assert(!res3.matches && res3.matchReason === 'none', 'Alexandria business rejected');

const biz4 = { nameAr: 'Nasr City', city: 'Cairo', lat: 30.0500, lng: 31.3500 };
const res4 = isWithinHadayekAlAhramScope(biz4, 8);
assert(!res4.matches, 'Nasr City business rejected');

const biz5 = { nameAr: 'Market', street: '\u0634\u0627\u0631\u0639 \u0627\u0644\u062b\u0631\u0648\u0629 \u0627\u0644\u0645\u0639\u062f\u0646\u064a\u0629', city: 'Giza', lat: 0, lng: 0 };
const res5 = isWithinHadayekAlAhramScope(biz5, 8);
assert(res5.matches && res5.matchReason === 'text', 'Unlocated business with Hadayek street matched by text');

const biz6 = { nameAr: 'Tanta Bookshop', street: 'Al Bahr', city: 'Gharbia', lat: 0, lng: 0 };
const res6 = isWithinHadayekAlAhramScope(biz6, 8);
assert(!res6.matches, 'Unlocated unrelated business rejected');

console.log('Summary: ' + passed + '/' + total + ' tests passed.');
if (passed !== total) process.exit(1);
