import { Business, PackageOption, Representative, PaymentGatewayConfig } from '../types';

export const EGYPT_GOVERNORATES = [
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'الدقهلية (المنصورة)',
  'الغربية (طنطا)',
  'الشرقية (الزقازيق)',
  'القليوبية (بنها)',
  'المنوفية (شبين الكوم)',
  'البحيرة (دمنهور)',
  'كفر الشيخ',
  'دمياط',
  'بورسعيد',
  'الإسماعيلية',
  'السويس',
  'الفيوم',
  'بني سويف',
  'المنيا',
  'أسيوط',
  'سوهاج',
  'قنا',
  'الأقصر',
  'أسوان',
  'مطروح',
  'البحر الأحمر (الغردقة)',
  'جنوب سيناء (شرم الشيخ)'
];

export interface CategoryGroup {
  group: string;
  icon: string;
  items: string[];
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    group: 'المطاعم والأغذية والمشروبات',
    icon: '🍔',
    items: [
      'مطعم / مأكولات ومشويات',
      'كافيه / مقهى وكوفي شوب',
      'مخبز / حلواني ومعجنات',
      'سوبر ماركت / هايبر وبقالة',
      'عصائر ومثلجات / آيس كريم',
      'جزارة / لحوم ودواجن وأسماك',
      'عطارة وتوابل / أعشاب طبيعية',
      'خضروات وفواكه طازجة',
      'محامص ومكسرات وتسالي / بن وقهوة'
    ]
  },
  {
    group: 'العيادات والرعاية الصحية والطبية',
    icon: '🩺',
    items: [
      'عيادة طبية / مركز تخصصي',
      'عيادة أسنان / طب وجراحة الفم',
      'عيادة عيون وبصريات / نظارات',
      'عيادة جلدية وتجميل / ليزر',
      'عيادة أطفال ورعاية حديثي الولادة',
      'عيادة نساء وتوليد / حقن مجهري',
      'عيادة باطنة وتغذية علاجية',
      'عيادة عظام ومفاصل / علاج طبيعي',
      'صيدلية وخدمات دوائية',
      'معمل تحاليل طبية',
      'مركز أشعة وتشخيص طبي',
      'مستشفى / مجمع طبي جراحي',
      'مركز علاج طبيعي وتأهيل',
      'عيادة بيطرية ومستلزمات حيوانات'
    ]
  },
  {
    group: 'الملابس والأزياء والإكسسوارات',
    icon: '👗',
    items: [
      'محل ملابس رجالي وبدل',
      'محل ملابس حريمي وعبايات',
      'محل ملابس أطفال ومواليد',
      'محل أحذية وشنط وجلود',
      'محل مجوهرات وذهب وفضة',
      'محل ساعات ونظارات شمسية',
      'مستحضرات تجميل وميكب',
      'محل عطور وبخور وبرفيوم'
    ]
  },
  {
    group: 'الهواتف والإلكترونيات والكمبيوتر',
    icon: '📱',
    items: [
      'محل هواتف وصيانة موبايل وإكسسوارات',
      'أجهزة كمبيوتر ولابتوب وشبكات',
      'أجهزة كهربائية ومنزلية',
      'دش وستالايت وكاميرات مراقبة وأمن'
    ]
  },
  {
    group: 'السيارات والمركبات والصيانة',
    icon: '🚗',
    items: [
      'معرض سيارات / بيع وشراء',
      'مركز صيانة سيارات وميكانيكا',
      'كهرباء سيارات وتكييف وفحص',
      'مغسلة سيارات وديتيلينج وتلميع',
      'كاوتش وبطاريات وضبط زوايا',
      'قطع غيار سيارات وزيوت وشحوم',
      'موتوسيكلات وسكوتر وصيانة'
    ]
  },
  {
    group: 'التجميل والعناية الشخصية واللياقة',
    icon: '💇‍♂️',
    items: [
      'صالون حلاقة رجالي وعناية',
      'بيوتي سنتر وكوافير حريمي',
      'سبا وجاكوزي وحمام مغربي',
      'جيم وصالة لياقة بدنية (Fitness)',
      'أكاديمية رياضية وتأجير ملاعب'
    ]
  },
  {
    group: 'الأثاث والديكور والمنزل',
    icon: '🛋️',
    items: [
      'معرض أثاث وموبيليات منزلية',
      'مفروشات وستائر وسجاد',
      'أدوات منزلية ومطبخ',
      'دهانات وديكورات وورق حائط',
      'إضاءة ونجف وتأسيس كهرباء',
      'أدوات صحية وسيراميك ورخام',
      'مطابخ حديثة ودريسنج روم'
    ]
  },
  {
    group: 'الشركات والخدمات والمكاتب المهنية',
    icon: '🏢',
    items: [
      'شركة خدمات وتجارة عامة',
      'مكتب محاماة واستشارات قانونية',
      'مكتب محاسبة ومراجعة وضرائب',
      'مكتب مقاولات وتشطيبات وبناء',
      'مكتب تسويق إلكتروني ودعاية وإعلان',
      'مكتب ترجمة معتمدة وخدمات فيزا',
      'مكتب عقارات وتسويق عقاري',
      'شركة شحن ونقل عفش وبضائع',
      'ستوديو تصوير وميديا وفوتوجرافي'
    ]
  },
  {
    group: 'المكتبات والأدوات المدرسية والطباعة',
    icon: '📚',
    items: [
      'مكتبة وأدوات مدرسية وقرطاسية',
      'مكتبة تصوير مستندات وطباعة وخدمات كمبيوتر',
      'مكتبة كتب وروايات وأدوات هندسية ورسم',
      'ألعاب أطفال وهدايا وتغليف ومستلزمات مناسبات',
      'مكتبة بيع بالجملة وتوريدات مكاتب ومدارس',
      'مركز خدمات طالب وكتابة أبحاث وملازم',
      'مكتبة وأدوات مدرسية وطباعة'
    ]
  },
  {
    group: 'التعليم والتدريب وتنمية المهارات',
    icon: '🎓',
    items: [
      'حضانة ورعاية أطفال',
      'مدرسة خاصة أو دولية',
      'سنتر تعليمي ودروس خصوصية',
      'أكاديمية كورسات ولغات وبرمجة'
    ]
  },
  {
    group: 'الحرف والورش والصيانة الفنية',
    icon: '🔧',
    items: [
      'ورشة حدادة وكريتال',
      'ورشة نجارة ومصنوعات خشبية',
      'ورشة ألوميتال وزجاج ومطابخ',
      'فني صيانة تكييف وتبريد وأجهزة',
      'فني سباكة وتأسيس صحي',
      'فني كهرباء وصيانة منزلية',
      'مغسلة ملابس ودراي كلين ومكوجي'
    ]
  },
  {
    group: 'السياحة والفنادق والمناسبات',
    icon: '🏨',
    items: [
      'فندق وشقق فندقية ومنتجعات',
      'قاعة مناسبات وأفراح',
      'تنظيم حفلات ومؤتمرات',
      'مكتب حجز رحلات وسياحة'
    ]
  },
  {
    group: 'أنشطة وخدمات عامة أخرى',
    icon: '📍',
    items: [
      'مشتل زهور ونباتات زينة',
      'محطة وقود وغاز طبيعي',
      'جمعية خيرية ومؤسسة أهلية',
      'نشاط تجاري / خدمي آخر'
    ]
  }
];

export const BUSINESS_CATEGORIES: string[] = CATEGORY_GROUPS.flatMap(g => g.items);

export function getGroupFromCategory(catName?: string): CategoryGroup | undefined {
  if (!catName) return undefined;
  return CATEGORY_GROUPS.find((g) => g.items.includes(catName));
}

/**
 * تطبيع النص العربي للبحث والمطابقة الذكية
 */
function normalizeArabicTaxonomy(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\u064B-\u065F]/g, '') // إزالة التشكيل
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[ى]/g, 'ي')
    .replace(/[\/\\\-_,\.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * دالة المطابقة الذكية للربط بين مدخلات Google Maps والتصنيفات المعتمدة في دليلك
 */
export function findClosestCategory(rawCategory?: string | null): { category: string; group: string } | null {
  if (!rawCategory || typeof rawCategory !== 'string') return null;
  const trimmed = rawCategory.trim();
  if (!trimmed || trimmed === 'عميل مهتم' || trimmed === 'عملاء مهتمون') return null;

  // 1. المطابقة الدقيقة الحرفية في عناصر المجموعات
  for (const groupObj of CATEGORY_GROUPS) {
    if (groupObj.items.includes(trimmed)) {
      return { category: trimmed, group: groupObj.group };
    }
  }

  const normalizedRaw = normalizeArabicTaxonomy(trimmed);
  if (!normalizedRaw) return null;

  // 2. مطابقة باختصارات المظلة الشائعة من Google Maps
  const COMMON_ALIASES: Array<{ terms: string[]; category: string; group: string }> = [
    {
      terms: ['ملابس', 'متجر ملابس', 'محل ملابس', 'ازياء', 'clothing store', 'clothing', 'fashion store', 'apparel', 'clothes'],
      category: 'محل ملابس رجالي وبدل',
      group: 'الملابس والأزياء والإكسسوارات'
    },
    {
      terms: ['سوق', 'اسواق', 'ماركت', 'market', 'bazaar', 'بازار', 'معرض تجاري', 'سوبرماركت', 'هايبر'],
      category: 'سوبر ماركت / هايبر وبقالة',
      group: 'المطاعم والأغذية والمشروبات'
    },
    {
      terms: ['مطعم', 'restaurant', 'مشاوي', 'مشويات', 'ماكولات', 'وجبات', 'diner'],
      category: 'مطعم / مأكولات ومشويات',
      group: 'المطاعم والأغذية والمشروبات'
    },
    {
      terms: ['كافيه', 'مقهى', 'مقهي', 'قهوه', 'كوفي', 'cafe', 'coffee'],
      category: 'كافيه / مقهى وكوفي شوب',
      group: 'المطاعم والأغذية والمشروبات'
    },
    {
      terms: ['صيدلية', 'صيدليه', 'pharmacy', 'drugstore'],
      category: 'صيدلية وخدمات دوائية',
      group: 'العيادات والرعاية الصحية والطبية'
    },
    {
      terms: ['عيادة', 'عياده', 'مركز طبي', 'مستوصف', 'clinic'],
      category: 'عيادة طبية / مركز تخصصي',
      group: 'العيادات والرعاية الصحية والطبية'
    },
    {
      terms: ['حلاقة', 'حلاقه', 'حلاق', 'صالون رجالي', 'barber'],
      category: 'صالون حلاقة رجالي وعناية',
      group: 'التجميل والعناية الشخصية واللياقة'
    },
    {
      terms: ['جيم', 'لياقة', 'لياقه', 'فيتنس', 'gym', 'fitness'],
      category: 'جيم وصالة لياقة بدنية (Fitness)',
      group: 'التجميل والعناية الشخصية واللياقة'
    },
    {
      terms: ['فندق', 'منتجع', 'hotel', 'resort'],
      category: 'فندق وشقق فندقية ومنتجعات',
      group: 'السياحة والفنادق والمناسبات'
    }
  ];

  for (const alias of COMMON_ALIASES) {
    for (const term of alias.terms) {
      const normTerm = normalizeArabicTaxonomy(term);
      if (normalizedRaw === normTerm || normalizedRaw.includes(normTerm) || normTerm.includes(normalizedRaw)) {
        return { category: alias.category, group: alias.group };
      }
    }
  }

  // 3. المطابقة بالتطبيع الكامل ومطابقة الكلمات المفتاحية
  const rawWords = normalizedRaw.split(' ').map(w => (w.startsWith('ال') && w.length > 3 ? w.slice(2) : w)).filter(w => w.length >= 3);

  let bestMatch: { category: string; group: string; score: number } | null = null;

  for (const groupObj of CATEGORY_GROUPS) {
    for (const item of groupObj.items) {
      const normItem = normalizeArabicTaxonomy(item);

      // تطابق نصي تام بعد التطبيع
      if (normItem === normalizedRaw) {
        return { category: item, group: groupObj.group };
      }

      // تطابق احتواء كامل
      if (normItem.includes(normalizedRaw) || normalizedRaw.includes(normItem)) {
        return { category: item, group: groupObj.group };
      }

      // حساب تطابق الكلمات الفردية
      const itemWords = normItem.split(' ').map(w => (w.startsWith('ال') && w.length > 3 ? w.slice(2) : w)).filter(w => w.length >= 3);
      let matchedWordCount = 0;

      for (const rw of rawWords) {
        if (itemWords.includes(rw)) {
          matchedWordCount += 1;
        }
      }

      if (matchedWordCount > 0) {
        if (!bestMatch || matchedWordCount > bestMatch.score) {
          bestMatch = { category: item, group: groupObj.group, score: matchedWordCount };
        }
      }
    }
  }

  if (bestMatch) {
    return { category: bestMatch.category, group: bestMatch.group };
  }

  return null;
}


export const FREE_DIRECTORY_SERVICE = {
  id: 'free_directory_listing',
  title: 'إدراج وظهور المنشأة في الدليل مجاناً',
  condition: 'يشترط أن يكون للنشاط التجاري موقع جغرافي موثق بالفعل على خرائط Google.',
  description: 'إدراج كامل لمنشأتكم في دليل منصة دليلك مع كافة بيانات التواصل، العنوان، الخريطة، وساعات العمل مجاناً 100% بدون أي مقابل مالي، بشرط وجود موقع موثق بالفعل على خرائط Google.',
  unverifiedNote: 'إذا لم يكن لمنشأتكم موقع موثق على خرائط Google، نقترح البدء بـ «باقة التوثيق الأساسي» (250 ج.م) لتفعيل الموقع الجغرافي وتثبيته على الخريطة أولاً.',
  features: [
    'ظهور اسم المنشأة وتصنيفها في دليل المحافظة والمنطقة للجمهور.',
    'عرض أرقام الهواتف وروابط الواتساب للتواصل المباشر والسريع مع الزبائن.',
    'تثبيت وتوجيه العنوان لموقعكم المعتمد على الخريطة التفاعلية.',
    'عرض مواعيد وساعات العمل الرسمية طوال أيام الأسبوع وتوضيح حالة المكان.',
    'إمكانية تحديث وتعديل البيانات في أي وقت عبر خدمة العملاء.',
    'بدون أي رسوم تسجيل وبدون أي اشتراكات دورية (مجاني 100%).'
  ]
};

export {
  PACKAGES,
  EXEMPT_PACKAGE,
  ALREADY_ON_GOOGLE_PACKAGE,
  getPackageById,
  isExemptPackage,
} from './packages';



export const MOCK_REPRESENTATIVES: Representative[] = [
  {
    id: 'rep_ahmed_ezalden',
    name: 'أحمد عزالدين محمد',
    email: 'ahmedhufne@gmail.com',
    phone: '01143888355',
    role: 'admin',
    roleTitle: 'مدير النظام والمشرف العام',
    governorate: 'الجيزة',
    targetMonth: 50,
    avatar: '',
    avatarStatus: 'approved',
    commissionRate: 42.86,
    status: 'active',
    password: 'sha256:1bd455df4d1c614f4187e90c9c9c5920d86f6b8a2ae9bcd12a9174b62c90f432',
    referralCode: 'DALIL-8355',
    referralUnlocked: true,
    adminBypassReferral: true,
  },
  {
    id: 'rep_ahmed_ezalden_official',
    name: 'أحمد عزالدين محمد',
    email: 'info@dalilaak.com',
    phone: '01143888355',
    role: 'admin',
    roleTitle: 'مدير النظام',
    governorate: 'الجيزة',
    targetMonth: 50,
    avatar: '',
    avatarStatus: 'approved',
    commissionRate: 42.86,
    status: 'active',
    password: 'scrypt:6dda1363e43107c049b7d4f2b2f4a934:e2254436f27e8b385c85bc143b219121327f3629fd060ce791b0159fb4695bb81fed6d19236042e8a20774658b6141b97a1518065da86931ea76f87746546184',
    referralCode: 'DALIL-8355',
    referralUnlocked: true,
    adminBypassReferral: true,
  },
  {
    id: 'admin_master',
    name: 'مدير النظام دليلك',
    email: 'admin@gmail.com',
    phone: '01000000000',
    role: 'admin',
    roleTitle: 'مدير النظام العام',
    governorate: 'القاهرة',
    targetMonth: 50,
    avatar: '',
    avatarStatus: 'approved',
    commissionRate: 100,
    status: 'active',
    password: 'Aa123456',
    referralCode: 'DALIL-0000',
    referralUnlocked: true,
    adminBypassReferral: true,
  },
  {
    id: 'rep_1787879237270',
    name: 'هند عبد الستار محمد',
    email: 'hendhofny437@gmail.com',
    phone: '01159781720',
    role: 'admin',
    roleTitle: 'المديرة العامة',
    governorate: 'الجيزة',
    targetMonth: 26,
    avatar: '',
    avatarStatus: 'approved',
    commissionRate: 100,
    status: 'active',
    password: 'sha256:dcdce6dd7a96b21e5dc9b42970f80d5a6ead9a1f79f35eedecde8ae01a9275d6',
    referralCode: 'DALIL-7270',
    referralUnlocked: true,
    adminBypassReferral: true,
  },
  {
    id: 'rep_1787508999986',
    name: 'هيثم ايمن السيد',
    email: 'haithamayman08@gmail.com',
    phone: '01062206179',
    role: 'admin',
    roleTitle: 'المدير التسويقي والمشرف العام',
    governorate: 'الجيزة',
    targetMonth: 25,
    avatar: '',
    avatarStatus: 'approved',
    commissionRate: 100,
    status: 'active',
    password: 'sha256:a0dca7a2c040cfff7da0fcbe1f5daa4da3a77c41aa6f5e79fcf5005ad4de47c0',
    referralCode: 'DALIL-9986',
    referralUnlocked: true,
    adminBypassReferral: true,
  },
  {
    id: 'rep_1787455048297',
    name: 'كريم عزالدين محمد حفني',
    email: 'kareemezzaldin17@gmail.com',
    phone: '01013809276',
    role: 'rep',
    roleTitle: 'مندوب مبيعات ميداني',
    governorate: 'القاهرة',
    targetMonth: 25,
    avatar: '',
    avatarStatus: 'approved',
    commissionRate: 42.86,
    status: 'active',
    password: 'K1kareem',
    referralCode: 'DALIL-8297',
    referralUnlocked: true,
    adminBypassReferral: false,
  },
  {
    id: 'rep_1788529754300',
    name: 'احمد السيد عيسى العوضي',
    email: 'ahmedessa@gmail.com',
    phone: '01128554548',
    role: 'supervisor',
    roleTitle: 'مشرف إدارة منطقة ومحافظة',
    governorate: 'الجيزة',
    targetMonth: 25,
    avatar: '',
    avatarStatus: 'approved',
    commissionRate: 42.86,
    status: 'active',
    password: 'Aa123456',
    referralCode: 'DALIL-4300',
    referralUnlocked: true,
    adminBypassReferral: false,
  },
  {
    id: 'rep_1788778521536',
    name: 'ياسمين السيد عيسى',
    email: 'yasso@gmail.com',
    phone: '01231322324',
    role: 'supervisor',
    roleTitle: 'مشرف إدارة منطقة ومحافظة',
    governorate: 'الجيزة',
    targetMonth: 25,
    avatar: '',
    avatarStatus: 'approved',
    commissionRate: 42.86,
    status: 'active',
    password: 'Aa123456',
    referralCode: 'DALIL-1536',
    referralUnlocked: true,
    adminBypassReferral: false,
  },
];

export const DEFAULT_PAYMENT_CONFIG: PaymentGatewayConfig = {
  vodafoneCashNumber: '01143888355',
  vodafoneCashNumber2: '01556221141',
  fawryMerchantCode: '',
  instaPayHandle: '@daz31181',
  cardGatewayActive: false
};

// Clean initial registry for production - only real user-created businesses are stored
export const INITIAL_BUSINESSES: Business[] = [];


