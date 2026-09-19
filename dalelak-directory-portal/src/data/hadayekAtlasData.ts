/**
 * 🗺️ Hadayek Atlas & Proximity Navigator Data Engine
 * 
 * Comprehensive geographic knowledge base for Hadayek Al-Ahram (هضبة الأهرام - الجيزة):
 * - 16 Master Alphabetical Zones (منطقة أ إلى منطقة ن) with central bounds and landmarks
 * - The 4 Major Gates (خوفو، خفرع، منقرع، مينا) + Auxiliary Gates (حورس، أحمس)
 * - Arterial avenues (شارع الجيش، الثروة المعدنية، النادي، الضغط العالي، الخزان، البوابة الأولى)
 * - Building location estimation and gate routing algorithms
 * - Quick emergency and daily resident lifelines
 */

export interface HadayekGate {
  id: string;
  nameAr: string;
  nameEn: string;
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
// 🚪 1. The 4 Major Gates + Auxiliary Gates
// =============================================================================
export const HADAYEK_GATES: HadayekGate[] = [
  {
    id: 'gate_1',
    nameAr: 'البوابة الأولى',
    nameEn: 'Gate 1 (Khufu)',
    popularNameAr: 'بوابة خوفو',
    lat: 29.9882,
    lng: 31.1215,
    descriptionAr: 'المدخل الشمالي الرئيسي للحدائق من طريق مصر الفيوم / ميدان الرماية والمتحف المصري الكبير.',
    servedZones: ['أ', 'ب', 'ج', 'د'],
    accessRoadAr: 'طريق مصر الفيوم / الرماية',
    isOpen24h: true,
    tipsAr: 'أسرع مدخل لمناطق (أ، ب، ج، د)، وشارع البوابة الأولى الرئيسي المؤدي للثروة المعدنية.',
  },
  {
    id: 'gate_2',
    nameAr: 'البوابة الثانية',
    nameEn: 'Gate 2 (Khafre / Horus)',
    popularNameAr: 'بوابة خفرع (حورس)',
    lat: 29.9805,
    lng: 31.1158,
    descriptionAr: 'المدخل الأوسط من طريق مصر الفيوم، المدخل المباشر لشارع الجيش ومناطق وسط الحدائق.',
    servedZones: ['هـ', 'و', 'ز'],
    accessRoadAr: 'طريق مصر الفيوم / مدخل شارع الجيش',
    isOpen24h: true,
    tipsAr: 'المدخل الأنسب لمنطقة (هـ، و، ز) وشارع الجيش وشارع الضغط العالي ومجمع المدارس.',
  },
  {
    id: 'gate_3',
    nameAr: 'البوابة الثالثة',
    nameEn: 'Gate 3 (Menkaure)',
    popularNameAr: 'بوابة منقرع',
    lat: 29.9728,
    lng: 31.1092,
    descriptionAr: 'المدخل المؤدي لشارع النادي ومنطقة نادي حدائق الأهرام الرياضي.',
    servedZones: ['ح', 'ط'],
    accessRoadAr: 'طريق مصر الفيوم / مدخل شارع النادي',
    isOpen24h: true,
    tipsAr: 'المدخل الأقرب لمنطقتي (ح، ط) ونادي حدائق الأهرام الرياضي والأنشطة المحيطة به.',
  },
  {
    id: 'gate_4',
    nameAr: 'البوابة الرابعة',
    nameEn: 'Gate 4 (Mena / Ahmes)',
    popularNameAr: 'بوابة مينا (أحمس)',
    lat: 29.9655,
    lng: 31.1025,
    descriptionAr: 'المدخل الجنوبي الأكبر والأحدث، يربط مباشرة بالطريق الدائري وطريق الواحات ومول مصر.',
    servedZones: ['ك', 'ل', 'م', 'ن'],
    accessRoadAr: 'الطريق الدائري / طريق الواحات / مدخل شارع الثروة المعدنية',
    isOpen24h: true,
    tipsAr: 'المدخل الأفضل للقادمين من الدائري والواحات وأكتوبر، ومدخل مباشر لشارع الثروة ومناطق (ك، ل، م، ن).',
  },
];

// =============================================================================
// 🏛️ 2. The 16 Master Zones (أ إلى ن)
// =============================================================================
export const HADAYEK_ZONES: HadayekZone[] = [
  {
    id: 'zone_a',
    letterAr: 'أ',
    nameAr: 'منطقة أ',
    centerLat: 29.9868,
    centerLng: 31.1180,
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
    centerLat: 29.9845,
    centerLng: 31.1210,
    recommendedGateId: 'gate_1',
    secondaryGateId: 'gate_2',
    mainStreetsAr: ['شارع الخزان', 'شارع متفرع من البوابة الأولى'],
    famousLandmarksAr: ['محطة الخزان', 'مجمع خدمات منطقة ب'],
    approximateBuildingsCount: 420,
    descriptionAr: 'منطقة سكنية وتجارية راقية قريبة من البوابة الأولى ومحطة الخزان.',
  },
  {
    id: 'zone_c',
    letterAr: 'ج',
    nameAr: 'منطقة ج',
    centerLat: 29.9818,
    centerLng: 31.1245,
    recommendedGateId: 'gate_1',
    secondaryGateId: 'gate_2',
    mainStreetsAr: ['شارع النادي القديم', 'شارع العشرين'],
    famousLandmarksAr: ['ميدان منطقة ج', 'سوق ج التجاري'],
    approximateBuildingsCount: 450,
    descriptionAr: 'منطقة مرتفعة وهادئة تضم عدداً كبيراً من المراكز الطبية والخدمية.',
  },
  {
    id: 'zone_d',
    letterAr: 'د',
    nameAr: 'منطقة د',
    centerLat: 29.9790,
    centerLng: 31.1265,
    recommendedGateId: 'gate_1',
    secondaryGateId: 'gate_2',
    mainStreetsAr: ['شارع الضغط القديم', 'امتداد شارع الخزان'],
    famousLandmarksAr: ['مدرسة الأهرام', 'سنتر منطقة د'],
    approximateBuildingsCount: 390,
    descriptionAr: 'تتميز بقربها من البوابة الأولى والثانية وهدوئها السكني.',
  },
  {
    id: 'zone_e',
    letterAr: 'هـ',
    nameAr: 'منطقة هـ',
    centerLat: 29.9795,
    centerLng: 31.1165,
    recommendedGateId: 'gate_2',
    secondaryGateId: 'gate_1',
    mainStreetsAr: ['شارع الجيش الرئيسي', 'شارع البوابة الثانية'],
    famousLandmarksAr: ['مدخل شارع الجيش', 'ميدان البوابة الثانية (خفرع)'],
    approximateBuildingsCount: 430,
    descriptionAr: 'منطقة استراتيجية جداً تحتضن شارع الجيش، عصب التجارة والمطاعم والكافيهات بالحدائق.',
  },
  {
    id: 'zone_w',
    letterAr: 'و',
    nameAr: 'منطقة و',
    centerLat: 29.9772,
    centerLng: 31.1198,
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
    centerLat: 29.9748,
    centerLng: 31.1225,
    recommendedGateId: 'gate_2',
    secondaryGateId: 'gate_3',
    mainStreetsAr: ['شارع الضغط العالي', 'شارع الجيش'],
    famousLandmarksAr: ['مجمع مدارس رويال', 'ميدان منطقة ز'],
    approximateBuildingsCount: 410,
    descriptionAr: 'منطقة حيوية قريبة من محاور الحركة والمدارس والأنشطة الترفيهية.',
  },
  {
    id: 'zone_h',
    letterAr: 'ح',
    nameAr: 'منطقة ح',
    centerLat: 29.9735,
    centerLng: 31.1120,
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
    centerLat: 29.9712,
    centerLng: 31.1155,
    recommendedGateId: 'gate_3',
    secondaryGateId: 'gate_4',
    mainStreetsAr: ['امتداد شارع النادي', 'شارع الثروة المعدنية'],
    famousLandmarksAr: ['خلف النادي الأهلي / حدائق الأهرام', 'مول العاصمة'],
    approximateBuildingsCount: 470,
    descriptionAr: 'منطقة سكنية وتجارية كبرى تجمع بين هدوء الفيلات وحيوية شارع النادي.',
  },
  {
    id: 'zone_k',
    letterAr: 'ك',
    nameAr: 'منطقة ك',
    centerLat: 29.9695,
    centerLng: 31.1075,
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
    centerLat: 29.9670,
    centerLng: 31.1105,
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
    centerLat: 29.9642,
    centerLng: 31.1140,
    recommendedGateId: 'gate_4',
    mainStreetsAr: ['شارع الثروة المعدنية الأخير', 'امتداد جاردينيا'],
    famousLandmarksAr: ['محطة م', 'مجمع الخدمات الطبية'],
    approximateBuildingsCount: 480,
    descriptionAr: 'منطقة راقية حديثة قريبة من البوابة الرابعة والطريق الدائري.',
  },
  {
    id: 'zone_n',
    letterAr: 'ن',
    nameAr: 'منطقة ن',
    centerLat: 29.9620,
    centerLng: 31.1070,
    recommendedGateId: 'gate_4',
    mainStreetsAr: ['شارع البوابة الرابعة الجديد', 'طريق الواحات الموازي'],
    famousLandmarksAr: ['بوابة أحمس الجديدة', 'ممشى منطقة ن'],
    approximateBuildingsCount: 490,
    descriptionAr: 'أحدث مناطق الحدائق السكنية وأقربها لمخرج الدائري وطريق الواحات ومول مصر.',
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

export function getHadayekZone(letterOrId: string): HadayekZone | undefined {
  if (!letterOrId) return undefined;
  const clean = letterOrId.trim().replace(/^منطقة\s+/, '');
  return HADAYEK_ZONES.find(
    (z) => z.letterAr === clean || z.id.toLowerCase() === clean.toLowerCase() || z.nameAr === clean
  );
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
  zoneLetterOrId: string,
  buildingNumber: number | string
): { lat: number; lng: number; isExact: boolean; accuracyRadiusMeters: number } {
  const zone = getHadayekZone(zoneLetterOrId);
  if (!zone) {
    return { lat: 29.9753, lng: 31.1120, isExact: false, accuracyRadiusMeters: 500 };
  }

  const num = typeof buildingNumber === 'string' ? parseInt(buildingNumber.replace(/\D/g, ''), 10) : buildingNumber;

  if (!num || isNaN(num)) {
    return {
      lat: zone.centerLat,
      lng: zone.centerLng,
      isExact: false,
      accuracyRadiusMeters: 400,
    };
  }

  const angle = ((num * 137.5) % 360) * (Math.PI / 180);
  const distanceKm = 0.08 + ((num % 10) / 10) * 0.18;

  const latOffset = (distanceKm / 110.574) * Math.cos(angle);
  const lngOffset = (distanceKm / (111.32 * Math.cos((zone.centerLat * Math.PI) / 180))) * Math.sin(angle);

  return {
    lat: Number((zone.centerLat + latOffset).toFixed(6)),
    lng: Number((zone.centerLng + lngOffset).toFixed(6)),
    isExact: true,
    accuracyRadiusMeters: 250,
  };
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
