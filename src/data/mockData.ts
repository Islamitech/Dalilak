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
    group: 'التعليم والتدريب وتنمية المهارات',
    icon: '🎓',
    items: [
      'حضانة ورعاية أطفال',
      'مدرسة خاصة أو دولية',
      'سنتر تعليمي ودروس خصوصية',
      'أكاديمية كورسات ولغات وبرمجة',
      'مكتبة وأدوات مدرسية وطباعة'
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

export const PACKAGES: PackageOption[] = [
  {
    id: 'pkg_basic',
    title: '1. باقة التوثيق الأساسي',
    price: 250,
    description: 'تفعيل وتوثيق النشاط الميداني الرسمي على خرائط جوجل.',
    features: [
      'التفعيل الميداني الرسمي واستخراج الإحداثيات الدقيقة على خرائط جوجل.',
      'تثبيت وتحديث مواعيد العمل، أرقام الهواتف، والعنوان الجغرافي المعتمد.',
      'رفع الشعار (اللوجو) وصور الواجهة الرئيسية ومقر النشاط التجاري.',
      'إصدار فاتورة إلكترونية معتمدة برمز QR مع إمكانية المشاركة عبر واتساب.'
    ]
  },
  {
    id: 'pkg_pro',
    title: '2. عرض التأسيس والربط الذكي (الأكثر طلباً)',
    price: 750,
    popular: true,
    description: 'توثيق جوجل + تأسيس المنصات وتصميم الإعلانات والربط التلقائي ومتابعة 3 أيام.',
    features: [
      'جميع مميزات باقة التوثيق الأساسي على خرائط جوجل.',
      'كتابة وصف تسويقي احترافي وتحسين الكلمات المفتاحية ومحركات البحث (SEO).',
      'تأسيس الصفحات: تصميم صفحات باسم وهوية مميزة لنشاطك (فيسبوك والمنصات).',
      'تصميم الإعلان وعرض البضائع: تجهيز إعلان وطريقة عرض احترافية تشد الزبائن.',
      'متابعة 3 أيام: مرافقة خطوة بخطوة للوصول لأفضل تفاعل ونتائج.',
      'تقديم اقتراحات وتوجيهات مستمرة لتحسين تفاعل العملاء وزيادة المبيعات.',
      '💡 شرط بسيط: المعرفة باستخدام تطبيقات الموبايل لتحقيق أفضل نمو.'
    ]
  },
  {
    id: 'pkg_vip',
    title: '3. عرض الدعم الميداني والإدارة الشاملة VIP',
    price: 2000,
    description: 'إدارة متكاملة وزيارات ميدانية وتدريب احترافي ودعم يومي لمدة شهر (2000 ج أول شهر).',
    features: [
      'كل ميزات عرض التأسيس والربط الذكي + توثيق جوجل والـ SEO.',
      'خطة تسويقية متكاملة وتصميمات رقمية مخصصة للنشاط (هوية، إعلانات، وبوستات).',
      'تدريب خطوة بخطوة: لتعلم كيفية صناعة الإعلانات والعروض الناجحة وإدارتها بنفسك.',
      'دعم وتوجيه متكامل لمدة شهر: متابعة يوم بيوم والرد على كافة الاستفسارات.',
      'زيارات ميدانية (مناديب): زيارة لمقر نشاطك لتصوير احترافي وإجراء تحسينات مباشرة.',
      'توثيق مباشر وأولوية VIP مع إدارة التقييمات والمراجعات.',
      'تجديد اختياري مخفض: بعد نهاية الشهر، إمكانية تجديد الدعم بـ 1000 جنيه فقط للشهر التالي.',
      '💡 الفئة المستهدفة: للمبتدئين ومن يواجهون صعوبة في إدارة التطبيقات والصفحات الرقمية.'
    ]
  }
];

export const MOCK_REPRESENTATIVES: Representative[] = [
  {
    id: 'admin_1',
    name: 'مدير النظام دليلك',
    email: 'dalilaakeg@gmail.com',
    phone: '01000000000',
    role: 'admin',
    roleTitle: 'مدير النظام دليلك',
    governorate: 'القاهرة (المقرات الرئيسية)',
    targetMonth: 50,
    avatar: '',
    avatarStatus: 'approved',
    commissionRate: 0,
    status: 'active',
    password: 'admin',
    referralCode: 'DALIL-ADMIN',
    referralUnlocked: true,
    adminBypassReferral: true,
  },
  {
    id: 'admin_1',
    name: 'Ahmed Ezalden',
    email: 'daz31181@gmail.com',
    phone: '01143888355',
    role: 'admin',
    roleTitle: 'مدير النظام',
    governorate: 'القاهرة (المقرات الرئيسية)',
    targetMonth: 50,
    avatar: '',
    avatarStatus: 'approved',
    commissionRate: 0,
    status: 'active',
    password: 'admin',
    referralCode: 'DALIL-ADMIN',
    referralUnlocked: true,
    adminBypassReferral: true,
  },
  {
    id: 'admin_1',
    name: 'المدير',
    email: 'admin@gmail.com',
    phone: '01000000000',
    role: 'admin',
    roleTitle: 'مدير النظام',
    governorate: 'القاهرة (المقرات الرئيسية)',
    targetMonth: 50,
    avatar: '',
    avatarStatus: 'approved',
    commissionRate: 0,
    status: 'active',
    password: 'admin',
    referralCode: 'DALIL-ADMIN',
    referralUnlocked: true,
    adminBypassReferral: true,
  },
  {
    id: 'rep_ahmed_ezalden',
    name: 'Ahmed Ezalden',
    email: 'ahmedhufne@gmail.com',
    phone: '01143888355',
    role: 'rep',
    roleTitle: 'مندوب مبيعات ميداني',
    governorate: 'الجيزة',
    targetMonth: 25,
    avatar: '',
    avatarStatus: 'approved',
    commissionRate: 42.86,
    status: 'active',
    password: 'Aa123456',
    referralCode: 'DALIL-8355',
    referralUnlocked: true,
    adminBypassReferral: true,
  },
  {
    id: 'rep_1787894231000',
    name: 'أسامة محمد السيد',
    email: 'osama@gmail.com',
    phone: '01012345678',
    role: 'rep',
    roleTitle: 'مندوب مبيعات ميداني',
    governorate: 'الجيزة',
    targetMonth: 25,
    avatar: '',
    avatarStatus: 'approved',
    commissionRate: 42.86,
    status: 'active',
    password: 'Aa123456',
    referralCode: 'DALIL-4231',
    referralUnlocked: true,
    adminBypassReferral: true,
  },
];

export const DEFAULT_PAYMENT_CONFIG: PaymentGatewayConfig = {
  vodafoneCashNumber: '01143888355',
  vodafoneCashNumber2: '01556221141',
  fawryMerchantCode: '',
  instaPayHandle: '@daz31181',
  cardGatewayActive: false
};

// Full persistent businesses registry across Egypt
export const INITIAL_BUSINESSES: Business[] = [
  {
    id: 'biz_1787890511032',
    nameAr: 'ليب ليبل يبل',
    nameEn: 'Leeb Label',
    category: 'محل ملابس رجالي وبدل',
    governorate: 'الجيزة',
    city: 'الجيزة',
    street: 'شارع الهرم الرئيسي، بجوار نصر الدين',
    landmark: 'بجوار محطة مترو الجيزة',
    phone: '01143234423',
    workingHours: 'يومياً من 9:00 صباحاً حتى 11:00 مساءً',
    description: 'نشاط ليب ليبل يبل للملابس والبدل في الجيزة',
    lat: 30.0131,
    lng: 31.2089,
    ownerName: 'للبيل يبل',
    ownerPhone: '01143234423',
    photos: [],
    repId: 'rep_ahmed_ezalden',
    repName: 'Ahmed Ezalden',
    repCommissionRate: 42.86,
    packageId: 'pkg_basic',
    packageName: '1. باقة التوثيق الأساسي',
    packagePrice: 250,
    amountPaid: 250,
    paymentMethod: 'cash_by_rep',
    cashCollectedByRep: 250,
    paymentStatus: 'fully_paid',
    verificationStatus: 'verified',
    googleSyncStatus: 'synced',
    invoiceNumber: 'INV-2026-001',
    invoiceDate: '2026-08-28',
    createdDate: '2026-08-28T04:15:11.032Z',
    googleSyncDate: '2026-08-28',
    googlePlaceId: 'ChIJ_P2LLW60_MTCFJ65Y',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=30.0131,31.2089'
  },
  {
    id: 'biz_1787889768524',
    nameAr: 'لبي ليبليبل',
    category: 'محل ملابس رجالي وبدل',
    governorate: 'الجيزة',
    city: 'الجيزة',
    street: 'الموقع الجغرافي المسجل على الخريطة',
    phone: '01131421322',
    workingHours: 'يومياً من 9:00 صباحاً حتى 11:00 مساءً',
    description: 'نشاط لبي ليبليبل في الجيزة',
    lat: 30.0444,
    lng: 31.2357,
    ownerName: 'بليل بليب',
    ownerPhone: '01131421322',
    photos: [],
    repId: 'rep_1787894231000',
    repName: 'أسامة محمد السيد',
    repCommissionRate: 42.86,
    packageId: 'pkg_basic',
    packageName: '1. باقة التوثيق الأساسي',
    packagePrice: 250,
    amountPaid: 250,
    paymentMethod: 'gateway_online',
    cashCollectedByRep: 0,
    paymentStatus: 'fully_paid',
    verificationStatus: 'verified',
    googleSyncStatus: 'synced',
    invoiceNumber: 'INV-2026-472',
    invoiceDate: '2026-08-28',
    createdDate: '2026-08-28T04:02:48.524Z',
    googleSyncDate: '2026-08-28',
    googlePlaceId: 'ChIJ_P2LLW60_MTCFJ65Y',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=30.0444,31.2357'
  },
  {
    id: 'biz_1787888211868',
    nameAr: 'بسي سيب سيبس',
    category: 'مطعم / مأكولات ومشويات',
    governorate: 'الجيزة',
    city: 'الجيزة',
    street: 'الموقع الجغرافي المسجل على الخريطة',
    phone: '01131234213',
    workingHours: 'يومياً من 9:00 صباحاً حتى 11:00 مساءً',
    description: 'نشاط بسي سيب سيبس في الجيزة',
    lat: 30.0444,
    lng: 31.2357,
    ownerName: 'لبي سيب سيب',
    ownerPhone: '01131234213',
    photos: [],
    repId: 'rep_1787894231000',
    repName: 'أسامة محمد السيد',
    repCommissionRate: 42.86,
    packageId: 'pkg_basic',
    packageName: '1. باقة التوثيق الأساسي',
    packagePrice: 250,
    amountPaid: 250,
    paymentMethod: 'gateway_online',
    cashCollectedByRep: 0,
    paymentStatus: 'fully_paid',
    verificationStatus: 'verified',
    googleSyncStatus: 'synced',
    invoiceNumber: 'INV-2026-874',
    invoiceDate: '2026-08-28',
    createdDate: '2026-08-28T03:36:51.868Z',
    googleSyncDate: '2026-08-28',
    googlePlaceId: 'ChIJ_XKI7FLQ_MTCFIQZ5',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=30.0444,31.2357'
  },
  {
    id: 'biz_1787887741420',
    nameAr: 'ابليا يبل يبل',
    category: 'محل هواتف وصيانة موبايل وإكسسوارات',
    governorate: 'الجيزة',
    city: 'الجيزة',
    street: 'الموقع الجغرافي المسجل على الخريطة',
    phone: '01132413233',
    workingHours: 'يومياً من 9:00 صباحاً حتى 11:00 مساءً',
    description: 'نشاط ابليا يبل يبل في الجيزة',
    lat: 30.0444,
    lng: 31.2357,
    ownerName: 'الب ابلا بل',
    ownerPhone: '01132413233',
    photos: [],
    repId: 'rep_1787894231000',
    repName: 'أسامة محمد السيد',
    repCommissionRate: 42.86,
    packageId: 'pkg_basic',
    packageName: '1. باقة التوثيق الأساسي',
    packagePrice: 250,
    amountPaid: 250,
    paymentMethod: 'cash_by_rep',
    cashCollectedByRep: 250,
    paymentStatus: 'fully_paid',
    verificationStatus: 'pending',
    googleSyncStatus: 'not_synced',
    invoiceNumber: 'INV-2026-695',
    invoiceDate: '2026-08-28',
    createdDate: '2026-08-28T03:29:01.420Z',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=30.0444,31.2357'
  },
  {
    id: 'biz_101',
    nameAr: 'مطعم أبو طارق للكشري',
    nameEn: 'Abou Tarek Koshary',
    category: 'مطعم / مأكولات ومشويات',
    governorate: 'القاهرة',
    city: 'وسط البلد',
    street: '16 شارع معروف، تقاطع شارع شامبليون',
    landmark: 'وسط البلد بالقرب من ميدان التحرير',
    phone: '0225775935',
    secondaryPhone: '01000000101',
    workingHours: 'يومياً من 7:00 ص حتى 1:00 ص',
    description: 'أشهر مطعم كشري في مصر وخدمة التوصيل السريع لجميع المناطق.',
    lat: 30.0511,
    lng: 31.2384,
    ownerName: 'يوسف زكي (أبو طارق)',
    ownerPhone: '01000000101',
    ownerEmail: 'contact@aboutarek.com',
    photos: [],
    repId: 'rep_ahmed_ezalden',
    repName: 'Ahmed Ezalden',
    repCommissionRate: 42.86,
    packageId: 'pkg_basic',
    packageName: '1. باقة التوثيق الأساسي',
    packagePrice: 250,
    amountPaid: 250,
    paymentMethod: 'cash_by_rep',
    cashCollectedByRep: 250,
    paymentStatus: 'fully_paid',
    verificationStatus: 'verified',
    googleSyncStatus: 'synced',
    invoiceNumber: 'INV-2026-001',
    invoiceDate: '2026-08-28',
    createdDate: '2026-08-28T01:00:00.000Z',
    googleSyncDate: '2026-08-28',
    googlePlaceId: 'ChIJdeu485k_WBQRWc4ZqY4g70M',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=30.0511,31.2384'
  }
];

