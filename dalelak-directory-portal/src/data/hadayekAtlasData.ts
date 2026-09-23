import { getDistrictByLetter, HADAYEK_OFFICIAL_DISTRICTS, isPointInPolygon } from './hadayekDistrictsGeoData';

/**
 * 🗺️ Hadayek Atlas & Proximity Navigator Data Engine
 * 
 * Comprehensive geographic knowledge base for Hadayek Al-Ahram (هضبة الأهرام - الجيزة):
 * - 16 Master Alphabetical Zones (منطقة أ إلى منطقة ن + س، ص، ع) with verified boundary centroids
 * - The 6 Official Gates (خوفو، أحمس، خفرع، منقرع، حورس، مينا) with OpenStreetMap GPS coordinates
 * - Arterial avenues (شارع الجيش، الثروة المعدنية، النادي، الضغط العالي، الخزان، البوابة الأولى)
 * - Building location estimation and gate routing algorithms
 * - Quick emergency and daily resident lifelines
 */

export interface HadayekGate {
  id: string;
  number: number;
  nameAr: string;
  nameEn: string;
  shortNameAr: string;
  popularNameAr: string;
  lat: number;
  lng: number;
  descriptionAr: string;
  servedZones: string[];
  accessRoadAr: string;
  isOpen24h: boolean;
  tipsAr: string;
}

export interface HadayekZone {
  id: string;
  letterAr: string;
  nameAr: string;
  centerLat: number;
  centerLng: number;
  recommendedGateId: string;
  secondaryGateId?: string;
  mainStreetsAr: string[];
  famousLandmarksAr: string[];
  approximateBuildingsCount: number;
  descriptionAr: string;
}

export interface HadayekLifelineCategory {
  id: string;
  nameAr: string;
  icon: string;
  categoryQuery: string;
  badgeAr?: string;
  descriptionAr: string;
}

// =============================================================================
// 🚪 1. The 6 Official Gates of Hadayek Al-Ahram (OSM-Calibrated GPS)
// =============================================================================
export const HADAYEK_GATES: HadayekGate[] = [
  {
    id: 'gate_1',
    number: 1,
    nameAr: 'البوابة الأولى (خوفو)',
    nameEn: 'Gate 1 (Khufu)',
    shortNameAr: 'بوابة خوفو (1)',
    popularNameAr: 'بوابة خوفو',
    lat: 29.9777,
    lng: 31.1122,
    descriptionAr: 'المدخل الشمالي الرئيسي للحدائق من طريق القاهرة - الفيوم الصحراوي ومدخل شارع الجيش.',
    servedZones: ['أ', 'ب', 'ج', 'د'],
    accessRoadAr: 'طريق القاهرة - الفيوم الصحراوي / مدخل شارع الجيش',
    isOpen24h: true,
    tipsAr: 'أسرع مدخل لمناطق (أ، ب، ج، د)، وشارع الجيش الرئيسي والسنتر التجاري.',
  },
  {
    id: 'gate_ahmes',
    number: 2,
    nameAr: 'بوابة أحمس (2 الجديدة)',
    nameEn: 'Gate Ahmes (2-New)',
    shortNameAr: 'بوابة أحمس (2ج)',
    popularNameAr: 'بوابة أحمس',
    lat: 29.9713,
    lng: 31.1084,
    descriptionAr: 'المدخل الإضافي المستحدث لتخفيف الضغط بين البوابة الأولى والثانية باتجاه شارع الجيش والضغط.',
    servedZones: ['د', 'هـ'],
    accessRoadAr: 'طريق القاهرة - الفيوم الصحراوي',
    isOpen24h: true,
    tipsAr: 'مدخل سريع وممتاز لتفادي زحام البوابة الأولى والثانية لمنطقتي د وهـ.',
  },
  {
    id: 'gate_2',
    number: 2,
    nameAr: 'البوابة الثانية (خفرع)',
    nameEn: 'Gate 2 (Khafre)',
    shortNameAr: 'بوابة خفرع (2)',
    popularNameAr: 'بوابة خفرع',
    lat: 29.9643,
    lng: 31.1083,
    descriptionAr: 'المدخل الأوسط الحيوي من طريق القاهرة - الفيوم الصحراوي نحو وسط الحدائق وشارع الجيش الأوسط.',
    servedZones: ['هـ', 'و', 'ز'],
    accessRoadAr: 'طريق القاهرة - الفيوم الصحراوي / مدخل شارع الجيش الأوسط',
    isOpen24h: true,
    tipsAr: 'المدخل الأنسب لمناطق (هـ، و، ز) وشارع الجيش وشارع الضغط العالي.',
  },
  {
    id: 'gate_3',
    number: 3,
    nameAr: 'البوابة الثالثة (منقرع)',
    nameEn: 'Gate 3 (Menkaure)',
    shortNameAr: 'بوابة منقرع (3)',
    popularNameAr: 'بوابة منقرع',
    lat: 29.9536,
    lng: 31.1037,
    descriptionAr: 'المدخل المباشر لشارع النادي ونادي حدائق الأهرام الرياضي ومناطق ح وط وس وم.',
    servedZones: ['ح', 'ط', 'س', 'م'],
    accessRoadAr: 'طريق الفيوم / مدخل شارع النادي',
    isOpen24h: true,
    tipsAr: 'المدخل الأقرب لنادي حدائق الأهرام ومناطق (ح، ط، س، م).',
  },
  {
    id: 'gate_horus',
    number: 4,
    nameAr: 'بوابة حورس (الجنوبية)',
    nameEn: 'Gate Horus (South)',
    shortNameAr: 'بوابة حورس',
    popularNameAr: 'بوابة حورس',
    lat: 29.9490,
    lng: 31.0954,
    descriptionAr: 'المدخل الجنوبي للحدائق الرابط بطريق الواحات والمناطق الجنوبية (ص، ع).',
    servedZones: ['ص', 'ع'],
    accessRoadAr: 'طريق الواحات / المدخل الجنوبي للحدائق',
    isOpen24h: true,
    tipsAr: 'المدخل المباشر للمناطق الجنوبية ص وع القادمة من طريق الواحات.',
  },
  {
    id: 'gate_4',
    number: 4,
    nameAr: 'البوابة الرابعة (مينا)',
    nameEn: 'Gate 4 (Mena)',
    shortNameAr: 'بوابة مينا (4)',
    popularNameAr: 'بوابة مينا',
    lat: 29.9520,
    lng: 31.0881,
    descriptionAr: 'المدخل الغربي الأكبر، يربط مباشرة بالطريق الدائري وطريق الواحات ومول مصر ومدخل شارع الثروة المعدنية.',
    servedZones: ['ك', 'ل', 'ن'],
    accessRoadAr: 'تقاطع طريق الواحات مع الدائري / مدخل شارع الثروة المعدنية',
    isOpen24h: true,
    tipsAr: 'المدخل الأفضل للقادمين من الدائري والواحات وأكتوبر ومناطق (ك، ل، ن).',
  },
];

// =============================================================================
// 🏛️ 2. The 16 Master Zones (أ إلى ن + س، ص، ع)
// =============================================================================
export const HADAYEK_ZONES: HadayekZone[] = [
  {
    id: 'zone_a',
    letterAr: 'أ',
    nameAr: 'منطقة أ',
    centerLat: 29.985605,
    centerLng: 31.103333,
    recommendedGateId: 'gate_1',
    mainStreetsAr: ['شارع البوابة الأولى', 'شارع الثروة المعدنية (البداية)', 'شارع الخزان'],
    famousLandmarksAr: ['ميدان البوابة الأولى', 'سنتر البوابة', 'صيدليات العزبي والعائلات'],
    approximateBuildingsCount: 380,
    descriptionAr: 'واجهة الحدائق عند البوابة الأولى (خوفو)، حيوية تجارياً وتضم كبرى سلاسل الصيدليات والماركت.',
  },
  {
    id: 'zone_b',
    letterAr: 'ب',
    nameAr: 'منطقة ب',
    centerLat: 29.979184,
    centerLng: 31.106863,
    recommendedGateId: 'gate_1',
    secondaryGateId: 'gate_ahmes',
    mainStreetsAr: ['شارع الخزان', 'شارع متفرع من البوابة الأولى'],
    famousLandmarksAr: ['محطة الخزان', 'مجمع خدمات منطقة ب'],
    approximateBuildingsCount: 420,
    descriptionAr: 'منطقة سكنية وتجارية راقية قريبة من البوابة الأولى ومحطة الخزان.',
  },
  {
    id: 'zone_c',
    letterAr: 'ج',
    nameAr: 'منطقة ج',
    centerLat: 29.974896,
    centerLng: 31.108811,
    recommendedGateId: 'gate_1',
    secondaryGateId: 'gate_ahmes',
    mainStreetsAr: ['شارع النادي القديم', 'شارع العشرين'],
    famousLandmarksAr: ['ميدان منطقة ج', 'سوق ج التجاري'],
    approximateBuildingsCount: 450,
    descriptionAr: 'منطقة مرتفعة وهادئة تضم عدداً كبيراً من المراكز الطبية والخدمية.',
  },
  {
    id: 'zone_d',
    letterAr: 'د',
    nameAr: 'منطقة د',
    centerLat: 29.976336,
    centerLng: 31.102045,
    recommendedGateId: 'gate_ahmes',
    secondaryGateId: 'gate_1',
    mainStreetsAr: ['شارع الضغط القديم', 'امتداد شارع الخزان'],
    famousLandmarksAr: ['مدرسة الأهرام', 'سنتر منطقة د'],
    approximateBuildingsCount: 390,
    descriptionAr: 'تتميز بقربها من بوابة أحمس وبوابة خوفو وهدوئها السكني.',
  },
  {
    id: 'zone_e',
    letterAr: 'هـ',
    nameAr: 'منطقة هـ',
    centerLat: 29.966750,
    centerLng: 31.106067,
    recommendedGateId: 'gate_2',
    secondaryGateId: 'gate_ahmes',
    mainStreetsAr: ['شارع الجيش الرئيسي', 'شارع البوابة الثانية'],
    famousLandmarksAr: ['مدخل شارع الجيش', 'ميدان البوابة الثانية (خفرع)'],
    approximateBuildingsCount: 430,
    descriptionAr: 'منطقة استراتيجية جداً تحتضن شارع الجيش، عصب التجارة والمطاعم والكافيهات بالحدائق.',
  },
  {
    id: 'zone_w',
    letterAr: 'و',
    nameAr: 'منطقة و',
    centerLat: 29.960729,
    centerLng: 31.105924,
    recommendedGateId: 'gate_2',
    secondaryGateId: 'gate_3',
    mainStreetsAr: ['شارع الجيش الأوسط', 'شارع الضغط العالي'],
    famousLandmarksAr: ['سنتر القوات المسلحة', 'تقاطع الجيش مع الضغط'],
    approximateBuildingsCount: 460,
    descriptionAr: 'قلب الحدائق، تمتاز بكثافة خدمية وتجارية عالية جداً وقربها من شارع الجيش.',
  },
  {
    id: 'zone_z',
    letterAr: 'ز',
    nameAr: 'منطقة ز',
    centerLat: 29.979663,
    centerLng: 31.094660,
    recommendedGateId: 'gate_2',
    secondaryGateId: 'gate_1',
    mainStreetsAr: ['شارع الضغط العالي', 'شارع الجيش'],
    famousLandmarksAr: ['مجمع مدارس رويال', 'ميدان منطقة ز'],
    approximateBuildingsCount: 410,
    descriptionAr: 'منطقة حيوية قريبة من محاور الحركة والمدارس والأنشطة الترفيهية.',
  },
  {
    id: 'zone_h',
    letterAr: 'ح',
    nameAr: 'منطقة ح',
    centerLat: 29.975586,
    centerLng: 31.095207,
    recommendedGateId: 'gate_3',
    secondaryGateId: 'gate_2',
    mainStreetsAr: ['شارع النادي الرئيسي', 'شارع البوابة الثالثة'],
    famousLandmarksAr: ['نادي حدائق الأهرام الرياضي', 'بوابة منقرع'],
    approximateBuildingsCount: 440,
    descriptionAr: 'منطقة النادي الشهيرة، وجهة الرياضة والتسوق وتضم عيادات ومطاعم متنوعة.',
  },
  {
    id: 'zone_t',
    letterAr: 'ط',
    nameAr: 'منطقة ط',
    centerLat: 29.966395,
    centerLng: 31.096946,
    recommendedGateId: 'gate_3',
    secondaryGateId: 'gate_4',
    mainStreetsAr: ['امتداد شارع النادي', 'شارع الثروة المعدنية'],
    famousLandmarksAr: ['خلف نادي حدائق الأهرام', 'مول العاصمة'],
    approximateBuildingsCount: 470,
    descriptionAr: 'منطقة سكنية وتجارية كبرى تجمع بين هدوء الفيلات وحيوية شارع النادي.',
  },
  {
    id: 'zone_k',
    letterAr: 'ك',
    nameAr: 'منطقة ك',
    centerLat: 29.963337,
    centerLng: 31.099399,
    recommendedGateId: 'gate_4',
    secondaryGateId: 'gate_3',
    mainStreetsAr: ['شارع الثروة المعدنية', 'شارع البوابة الرابعة'],
    famousLandmarksAr: ['ميدان البوابة الرابعة', 'مول الجامعة'],
    approximateBuildingsCount: 510,
    descriptionAr: 'من أكثر المناطق طلباً وقرباً من البوابة الرابعة (مينا) وشريان الثروة المعدنية.',
  },
  {
    id: 'zone_l',
    letterAr: 'ل',
    nameAr: 'منطقة ل',
    centerLat: 29.962123,
    centerLng: 31.094918,
    recommendedGateId: 'gate_4',
    mainStreetsAr: ['شارع الثروة المعدنية الرئيسي', 'شارع جاردينيا'],
    famousLandmarksAr: ['سنتر منطقة ل', 'أشهر معالم الثروة المعدنية', 'بنوك وماكينات ATM'],
    approximateBuildingsCount: 530,
    descriptionAr: 'المنطقة الأكثر كثافة تجارية وحركة في الحدائق، عصب البنوك والمطاعم والعيادات وسوبرماركت.',
  },
  {
    id: 'zone_m',
    letterAr: 'م',
    nameAr: 'منطقة م',
    centerLat: 29.956892,
    centerLng: 31.104221,
    recommendedGateId: 'gate_3',
    secondaryGateId: 'gate_2',
    mainStreetsAr: ['شارع الثروة المعدنية الأخير', 'امتداد جاردينيا'],
    famousLandmarksAr: ['محطة م', 'مجمع الخدمات الطبية'],
    approximateBuildingsCount: 480,
    descriptionAr: 'منطقة راقية حديثة قريبة من البوابة الثالثة وطريق الفيوم.',
  },
  {
    id: 'zone_n',
    letterAr: 'ن',
    nameAr: 'منطقة ن',
    centerLat: 29.956893,
    centerLng: 31.096753,
    recommendedGateId: 'gate_4',
    secondaryGateId: 'gate_horus',
    mainStreetsAr: ['شارع البوابة الرابعة الجديد', 'طريق الواحات الموازي'],
    famousLandmarksAr: ['بوابة مينا الجديدة', 'ممشى منطقة ن'],
    approximateBuildingsCount: 490,
    descriptionAr: 'أحدث مناطق الحدائق السكنية وأقربها لمخرج الدائري وطريق الواحات ومول مصر.',
  },
  {
    id: 'zone_s',
    letterAr: 'س',
    nameAr: 'منطقة س',
    centerLat: 29.954085,
    centerLng: 31.100611,
    recommendedGateId: 'gate_3',
    secondaryGateId: 'gate_horus',
    mainStreetsAr: ['محور النادي الأوسط', 'شارع متفرع من البوابة الثالثة'],
    famousLandmarksAr: ['محور نادي حدائق الأهرام', 'مجمع خدمات س'],
    approximateBuildingsCount: 370,
    descriptionAr: 'منطقة هادئة قريبة من نادي حدائق الأهرام ومحور البوابة الثالثة.',
  },
  {
    id: 'zone_sad',
    letterAr: 'ص',
    nameAr: 'منطقة ص',
    centerLat: 29.950286,
    centerLng: 31.099352,
    recommendedGateId: 'gate_horus',
    secondaryGateId: 'gate_3',
    mainStreetsAr: ['شارع البوابة الجنوبية', 'محور الواحات الداخلي'],
    famousLandmarksAr: ['بوابة حورس', 'مجمع الخدمات الجنوبي'],
    approximateBuildingsCount: 350,
    descriptionAr: 'المنطقة الجنوبية المطلة على بوابة حورس وطريق الواحات.',
  },
  {
    id: 'zone_ain',
    letterAr: 'ع',
    nameAr: 'منطقة ع',
    centerLat: 29.952557,
    centerLng: 31.092712,
    recommendedGateId: 'gate_horus',
    secondaryGateId: 'gate_4',
    mainStreetsAr: ['امتداد شارع الثروة المعدنية', 'شارع بوابة حورس'],
    famousLandmarksAr: ['تقاطع حورس مع مينا', 'ميدان منطقة ع'],
    approximateBuildingsCount: 330,
    descriptionAr: 'المنطقة الغربية الجنوبية الهادئة، قريبة من مخرج طريق الواحات والدائري.',
  },
];

// =============================================================================
// ⚡ 3. Emergency & Daily Lifelines
// =============================================================================
export const HADAYEK_LIFELINES: HadayekLifelineCategory[] = [
  {
    id: 'pharmacy_24h',
    nameAr: 'صيدليات 24 ساعة',
    icon: 'Pill',
    categoryQuery: 'صيدليات',
    badgeAr: 'خدمة ليلية',
    descriptionAr: 'أقرب صيدليات توفر دليفري سريع وخدمة طوارئ على مدار 24 ساعة.',
  },
  {
    id: 'supermarket_delivery',
    nameAr: 'دليفري سوبرماركت',
    icon: 'ShoppingCart',
    categoryQuery: 'سوبر ماركت',
    badgeAr: 'توصيل منزلي',
    descriptionAr: 'سوبرماركت ومحلات بقالة جاهزة لتوصيل طلبات البيت حتى باب العمارة.',
  },
  {
    id: 'home_maintenance',
    nameAr: 'صيانة طوارئ (سباك / كهربائي)',
    icon: 'Wrench',
    categoryQuery: 'خدمات',
    badgeAr: 'صنائعية بالحدائق',
    descriptionAr: 'فنيو صيانة متاحون لخدمتك فوراً للأعطال المنزلية والكهرباء والسباكة والتكييف.',
  },
  {
    id: 'bakeries',
    nameAr: 'مخابز وأفران',
    icon: 'Croissant',
    categoryQuery: 'مخبوزات',
    badgeAr: 'طازج يومياً',
    descriptionAr: 'أفران العيش البلدي والفينو والحلويات والمخبوزات الطازجة بالحدائق.',
  },
  {
    id: 'gates_guide',
    nameAr: 'دليل البوابات والملاحة',
    icon: 'Compass',
    categoryQuery: '',
    badgeAr: 'ملاحة أطلس',
    descriptionAr: 'تعرف على البوابة المناسبة لعماراتك وأسهل مسار للدخول بدون زحام.',
  },
];

// =============================================================================
// 🧮 Helper Functions & Routing Engines
// =============================================================================

function normalizeArabicText(str: string): string {
  return (str || '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/هـ/g, 'ه')
    .trim();
}

export function getHadayekZone(letterOrId: string): HadayekZone | undefined {
  if (!letterOrId) return undefined;
  const clean = letterOrId.trim().replace(/^منطقة\s+/, '');
  const norm = normalizeArabicText(clean);

  return HADAYEK_ZONES.find((z) => {
    const zNorm = normalizeArabicText(z.letterAr);
    return (
      z.letterAr === clean ||
      zNorm === norm ||
      z.id.toLowerCase() === clean.toLowerCase() ||
      z.nameAr === clean ||
      normalizeArabicText(z.nameAr) === norm
    );
  });
}

export function getHadayekGate(gateId: string): HadayekGate | undefined {
  return HADAYEK_GATES.find((g) => g.id === gateId);
}

export function getRecommendedGateForZone(letterOrId: string): {
  primaryGate: HadayekGate;
  secondaryGate?: HadayekGate;
} {
  const zone = getHadayekZone(letterOrId);
  const defaultGate = HADAYEK_GATES[0];

  if (!zone) {
    return { primaryGate: defaultGate };
  }

  const primaryGate = getHadayekGate(zone.recommendedGateId) || defaultGate;
  const secondaryGate = zone.secondaryGateId ? getHadayekGate(zone.secondaryGateId) : undefined;

  return { primaryGate, secondaryGate };
}

export function estimateBuildingCoordinates(
  zoneLetter: string,
  buildingNumber: string
): { lat: number; lng: number } {
  const district = getDistrictByLetter(zoneLetter);
  if (district) {
    return { lat: district.centerLat, lng: district.centerLng };
  }
  const zone = getHadayekZone(zoneLetter);
  if (zone) {
    return { lat: zone.centerLat, lng: zone.centerLng };
  }
  return { lat: 29.9675, lng: 31.1015 };
}

let cachedBuildingsDB: Record<string, Array<{ lat: number; lng: number }>> | null = null;

async function getBuildingsDB(): Promise<Record<string, Array<{ lat: number; lng: number }>> | null> {
  if (!cachedBuildingsDB) {
    try {
      const mod = await import('./hadayekBuildingsCoords.json');
      cachedBuildingsDB = (mod as any).default || mod;
    } catch (e) {
      console.warn('[HadayekAtlas] Failed to load offline buildings DB dynamically:', e);
      return null;
    }
  }
  return cachedBuildingsDB;
}

// Helper: Ray-casting algorithm to check if a point is inside a polygon
function pointInPolygon(point: [number, number], vs: [number, number][]) {
  let x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    let xi = vs[i][0], yi = vs[i][1];
    let xj = vs[j][0], yj = vs[j][1];
    let intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export async function searchBuildingCoordinatesExact(
  zoneLetter: string,
  buildingNumber: string
): Promise<{ lat: number; lng: number } | null> {
  const district = getDistrictByLetter(zoneLetter);
  
  // Clean building number
  const numMatch = buildingNumber.match(/\d+/);
  if (!numMatch) return null;
  const cleanNum = numMatch[0];

  // 1. FAST LOCAL DATABASE LOOKUP (O(1) Offline Background DB - Lazy Loaded)
  const buildingsDB = await getBuildingsDB();
  if (buildingsDB && (buildingsDB as any)[cleanNum]) {
    const records = (buildingsDB as any)[cleanNum] as Array<{ lat: number; lng: number }>;
    if (district && district.polygons) {
      // Step A: Check which record actually falls inside this zone's polygon rings
      for (const rec of records) {
        for (const poly of district.polygons) {
          if (isPointInPolygon(rec.lat, rec.lng, poly)) {
            return { lat: rec.lat, lng: rec.lng };
          }
        }
      }

      // Step B: Fallback if cadastral point lies slightly on boundary - pick record closest to district center
      let closestRec: { lat: number; lng: number } | null = null;
      let minDistance = Infinity;
      for (const rec of records) {
        const d = calculateDirectDistanceMeters(rec.lat, rec.lng, district.centerLat, district.centerLng);
        if (d < 1200 && d < minDistance) {
          minDistance = d;
          closestRec = { lat: rec.lat, lng: rec.lng };
        }
      }
      if (closestRec) {
        return closestRec;
      }
    } else if (records.length === 1) {
      return { lat: records[0].lat, lng: records[0].lng };
    }
  }

  // 2. FALLBACK TO OVERPASS API (Network)
  let filterStr = `29.93,31.05,30.01,31.14`; // Default bbox fallback
  if (district && district.polygons && district.polygons[0]) {
    const polyCoords = district.polygons[0].map(p => `${p[0]} ${p[1]}`).join(' ');
    filterStr = `poly:"${polyCoords}"`;
  }

  const query = `[out:json][timeout:10];
(
  way["addr:housenumber"~"^${cleanNum}$"](${filterStr});
  node["addr:housenumber"~"^${cleanNum}$"](${filterStr});
  way["name"~"^${cleanNum}( |$)"](${filterStr});
  node["name"~"^${cleanNum}( |$)"](${filterStr});
);
out center;`;

  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.elements && data.elements.length > 0) {
        const el = data.elements[0];
        return {
          lat: el.lat || el.center.lat,
          lng: el.lon || el.center.lon
        };
      }
    }
  } catch (err) {
    console.warn('Overpass network search fallback failed:', err);
  }
  return null;
}

export function calculateDirectDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export function formatHadayekDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} متر`;
  }
  const km = (meters / 1000).toFixed(1);
  return `${km} كم`;
}
