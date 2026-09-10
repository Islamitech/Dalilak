import { CATEGORY_GROUPS } from '../data/mockData';

export interface ClassifiedCategoryResult {
  group: string;
  category: string;
  matchedKeyword: string;
  score: number;
  googleCategoryTitle: string;
}

interface TaxonomyRule {
  group: string;
  category: string;
  keywords: string[];
  weight: number;
}

/**
 * Arabic text normalizer: strips tashkeel, unifies alef, taa marbuta, yaa, and whitespace
 */
export function normalizeArabicText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F\u0670]/g, '') // Remove tashkeel
    .replace(/ـ/g, '') // Remove tatweel
    .replace(/[\s\-_,·.|/\\()[\]]+/g, ' ')
    .trim();
}

/**
 * Extracts Arabic token stems by stripping common grammatical prefixes (الـ, للـ, والـ, بالـ, و, ب)
 */
export function getArabicTokens(normalized: string): string[] {
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const expanded = new Set<string>(tokens);
  for (const t of tokens) {
    if (t.startsWith('وال') && t.length > 4) expanded.add(t.substring(3));
    else if (t.startsWith('بال') && t.length > 4) expanded.add(t.substring(3));
    else if (t.startsWith('كال') && t.length > 4) expanded.add(t.substring(3));
    else if (t.startsWith('لل') && t.length > 3) expanded.add(t.substring(2));
    else if (t.startsWith('ال') && t.length > 3) expanded.add(t.substring(2));
    else if (t.startsWith('لت') && t.length > 4) expanded.add(t.substring(1));
    else if (t.startsWith('و') && t.length > 3) expanded.add(t.substring(1));
    else if (t.startsWith('ب') && t.length > 3) expanded.add(t.substring(1));
    else if (t.startsWith('ل') && t.length > 3) expanded.add(t.substring(1));
    else if (t.startsWith('ف') && t.length > 3) expanded.add(t.substring(1));
  }
  return Array.from(expanded);
}

/**
 * Exhaustive mapping of Google Places Taxonomy & Local Egyptian Market keywords to Dalelak categories
 */
const GOOGLE_TAXONOMY_RULES: TaxonomyRule[] = [
  // ── 1. الملابس والأزياء والإكسسوارات (العطور أولاً بأعلى أولوية) ──
  {
    group: 'الملابس والأزياء والإكسسوارات',
    category: 'محل عطور وبخور وبرفيوم',
    keywords: [
      'عطور', 'عطر', 'للعطور', 'برفيوم', 'بخور', 'عود', 'دهن عود', 'برفانات', 'تركيبات عطور',
      'متجر عطور', 'محل عطور', 'perfume', 'perfumes', 'fragrance', 'scent', 'oud'
    ],
    weight: 22
  },
  {
    group: 'الملابس والأزياء والإكسسوارات',
    category: 'مستحضرات تجميل وميكب',
    keywords: [
      'ميكب', 'مكياج', 'ميك اب', 'مستحضرات تجميل', 'كوزمتكس', 'عنايه بالبشره', 'عناية بالبشرة',
      'cosmetics', 'makeup', 'skincare'
    ],
    weight: 18
  },
  {
    group: 'الملابس والأزياء والإكسسوارات',
    category: 'محل مجوهرات وذهب وفضة',
    keywords: [
      'مجوهرات', 'ذهب', 'صاغه', 'فضه', 'فضيات', 'الماس', 'مصوغات', 'جواهرجي',
      'jewelry', 'gold', 'silver', 'diamonds', 'goldsmith'
    ],
    weight: 20
  },
  {
    group: 'الملابس والأزياء والإكسسوارات',
    category: 'محل ساعات ونظارات شمسية',
    keywords: [
      'ساعات', 'نظارات شمسيه', 'ساعه يد', 'رولكس', 'ساعات رجالي', 'ساعات حريمي',
      'watches', 'sunglasses', 'watchmaker'
    ],
    weight: 19
  },
  {
    group: 'الملابس والأزياء والإكسسوارات',
    category: 'محل أحذية وشنط وجلود',
    keywords: [
      'احذيه', 'أحذية', 'شنط', 'حقائب', 'جلود', 'كوتشيات', 'شوز',
      'shoes', 'footwear', 'bags', 'leather'
    ],
    weight: 18
  },
  {
    group: 'الملابس والأزياء والإكسسوارات',
    category: 'محل ملابس رجالي وبدل',
    keywords: [
      'ملابس رجالي', 'بدل رجالي', 'قمصان رجالي', 'كاجوال رجالي', 'بدل', 'قمصان', 'بناطيل',
      'menswear', 'men clothing', 'suits'
    ],
    weight: 17
  },
  {
    group: 'الملابس والأزياء والإكسسوارات',
    category: 'محل ملابس حريمي وعبايات',
    keywords: [
      'ملابس حريمي', 'عبايات', 'فساتين', 'ازياء نسائيه', 'لانجري', 'طرح', 'ايشاربات',
      'womenswear', 'dresses', 'ladies fashion', 'abaya'
    ],
    weight: 17
  },
  {
    group: 'الملابس والأزياء والإكسسوارات',
    category: 'محل ملابس أطفال ومواليد',
    keywords: [
      'ملابس اطفال', 'ازياء اطفال', 'مواليد', 'بيبي', 'kidswear', 'baby clothes', 'children clothing'
    ],
    weight: 18
  },
  {
    group: 'الملابس والأزياء والإكسسوارات',
    category: 'محل ملابس رجالي وبدل',
    keywords: [
      'ملابس', 'متجر ملابس', 'محل ملابس', 'ملبوسات', 'أزياء', 'ازياء',
      'clothing store', 'clothing', 'fashion store', 'apparel', 'clothes shop', 'clothes'
    ],
    weight: 8
  },

  // ── 2. المطاعم والأغذية والمشروبات ──
  {
    group: 'المطاعم والأغذية والمشروبات',
    category: 'كافيه / مقهى وكوفي شوب',
    keywords: [
      'كافيه', 'مقهى', 'كوفي شوب', 'قهوه', 'اسبريسو', 'كافيهات', 'استراحه',
      'cafe', 'coffee', 'espresso', 'coffee shop', 'roastery'
    ],
    weight: 19
  },
  {
    group: 'المطاعم والأغذية والمشروبات',
    category: 'مخبز / حلواني ومعجنات',
    keywords: [
      'مخبز', 'حلواني', 'حلويات', 'معجنات', 'باتيسري', 'كيك', 'مخبوزات', 'تورته', 'تورت', 'افران',
      'حلويات شرقيه', 'حلويات غربيه', 'bakery', 'pastry', 'sweets', 'patisserie', 'cake'
    ],
    weight: 19
  },
  {
    group: 'المطاعم والأغذية والمشروبات',
    category: 'سوبر ماركت / هايبر وبقالة',
    keywords: [
      'سوبر ماركت', 'هايبر', 'هايبر ماركت', 'بقاله', 'ميني ماركت', 'تموين', 'ماركت',
      'supermarket', 'hypermarket', 'grocery', 'mart'
    ],
    weight: 18
  },
  {
    group: 'المطاعم والأغذية والمشروبات',
    category: 'سوبر ماركت / هايبر وبقالة',
    keywords: [
      'سوق', 'سويقة', 'سويقه', 'أسواق', 'اسواق',
      'market', 'bazaar', 'بازار', 'معرض تجاري'
    ],
    weight: 8
  },
  {
    group: 'المطاعم والأغذية والمشروبات',
    category: 'عصائر ومثلجات / آيس كريم',
    keywords: [
      'عصائر', 'عصير', 'مثلجات', 'ايس كريم', 'آيس كريم', 'جيلاتي', 'قصب', 'عصير قصب',
      'juice', 'ice cream', 'gelato', 'smoothie'
    ],
    weight: 19
  },
  {
    group: 'المطاعم والأغذية والمشروبات',
    category: 'جزارة / لحوم ودواجن وأسماك',
    keywords: [
      'جزاره', 'جزار', 'لحوم', 'مجزر', 'دواجن', 'طيور', 'فراخ', 'اسماك', 'سمك', 'فسخاني',
      'butcher', 'meat', 'poultry', 'fish', 'fishmonger'
    ],
    weight: 19
  },
  {
    group: 'المطاعم والأغذية والمشروبات',
    category: 'عطارة وتوابل / أعشاب طبيعية',
    keywords: [
      'عطاره', 'عطار', 'توابل', 'بهارات', 'اعشاب', 'اعشاب طبيعيه',
      'spices', 'herbs'
    ],
    weight: 19
  },
  {
    group: 'المطاعم والأغذية والمشروبات',
    category: 'خضروات وفواكه طازجة',
    keywords: [
      'خضار', 'خضروات', 'فواكه', 'فاكهه', 'خضري', 'فكهاني',
      'vegetables', 'fruits', 'produce', 'greengrocer'
    ],
    weight: 19
  },
  {
    group: 'المطاعم والأغذية والمشروبات',
    category: 'محامص ومكسرات وتسالي / بن وقهوة',
    keywords: [
      'محمصه', 'محامص', 'مكسرات', 'تسالي', 'مطحنه بن', 'بن وقهوه', 'لب',
      'roastery', 'nuts', 'coffee beans'
    ],
    weight: 19
  },
  {
    group: 'المطاعم والأغذية والمشروبات',
    category: 'مطعم / مأكولات ومشويات',
    keywords: [
      'مطعم', 'مشويات', 'ماكولات', 'مأكولات', 'مشاوي', 'وجبات', 'كبابجي', 'شاورما', 'برجر', 'بيتزا', 'كشري',
      'حواوشي', 'فطائر', 'ساندوتش', 'فول وطعميه', 'طعام', 'اكلات', 'مطاعم',
      'مندي', 'المندي', 'حنيذ', 'مظبي', 'شوايه', 'شواية', 'مشويات لحوم', 'مطعم لحوم', 'مطعم اطباق لحوم',
      'مطعم اسماك', 'مطعم سمك', 'اطباق لحوم', 'لحوم مشويه', 'مأكولات يمنية', 'ماكولات يمنيه', 'اكلات يمنيه',
      'restaurant', 'grill', 'burger', 'pizza', 'shawarma', 'kebab', 'fast food', 'diner', 'fried chicken',
      'meat dish restaurant', 'mandi restaurant', 'barbecue restaurant', 'seafood restaurant', 'fish restaurant', 'steakhouse'
    ],
    weight: 22
  },

  // ── 3. العيادات والرعاية الصحية والطبية ──
  {
    group: 'العيادات والرعاية الصحية والطبية',
    category: 'عيادة طبية / مركز تخصصي',
    keywords: [
      'عيادة', 'عياده', 'مركز طبي', 'مجمع طبي', 'عيادات',
      'clinic', 'medical center', 'polyclinic', 'medical clinic'
    ],
    weight: 8
  },
  {
    group: 'العيادات والرعاية الصحية والطبية',
    category: 'صيدلية وخدمات دوائية',
    keywords: [
      'صيدليه', 'صيدليات', 'ادويه', 'دواء',
      'pharmacy', 'drugstore', 'chemist'
    ],
    weight: 23
  },
  {
    group: 'العيادات والرعاية الصحية والطبية',
    category: 'عيادة أسنان / طب وجراحة الفم',
    keywords: [
      'اسنان', 'طب اسنان', 'جراحه الفم', 'تقويم اسنان', 'زراعه اسنان',
      'dental', 'dentist', 'orthodontics'
    ],
    weight: 23
  },
  {
    group: 'العيادات والرعاية الصحية والطبية',
    category: 'عيادة عيون وبصريات / نظارات',
    keywords: [
      'عيون', 'رمد', 'بصريات', 'فحص نظر', 'نظارات طبيه', 'ليزك',
      'ophthalmology', 'optics', 'optometrist', 'eye clinic'
    ],
    weight: 23
  },
  {
    group: 'العيادات والرعاية الصحية والطبية',
    category: 'معمل تحاليل طبية',
    keywords: [
      'تحاليل', 'معمل تحاليل', 'مختبر', 'تحاليل طبيه', 'معمل',
      'laboratory', 'medical lab', 'diagnostic lab'
    ],
    weight: 23
  },
  {
    group: 'العيادات والرعاية الصحية والطبية',
    category: 'مركز أشعة وتشخيص طبي',
    keywords: [
      'اشعه', 'مركز اشعه', 'سونار', 'رنين مغناطيسي', 'تشخيص طبي', 'اشعه مقطعيه',
      'radiology', 'x-ray', 'mri', 'scan'
    ],
    weight: 23
  },
  {
    group: 'العيادات والرعاية الصحية والطبية',
    category: 'عيادة جلدية وتجميل / ليزر',
    keywords: [
      'جلديه', 'ليزر', 'تناسليه', 'جلديه وتجميل', 'زراعه شعر',
      'dermatology', 'laser clinic'
    ],
    weight: 22
  },
  {
    group: 'العيادات والرعاية الصحية والطبية',
    category: 'عيادة أطفال ورعاية حديثي الولادة',
    keywords: [
      'اطفال', 'طب اطفال', 'حديثي الولاده', 'مبتسرين',
      'pediatrics', 'pediatrician', 'children clinic'
    ],
    weight: 21
  },
  {
    group: 'العيادات والرعاية الصحية والطبية',
    category: 'عيادة نساء وتوليد / حقن مجهري',
    keywords: [
      'نساء وتوليد', 'توليد', 'حقن مجهري', 'عقم', 'نساء',
      'gynecology', 'obstetrics', 'ivf', 'maternity'
    ],
    weight: 23
  },
  {
    group: 'العيادات والرعاية الصحية والطبية',
    category: 'مستشفى / مجمع طبي جراحي',
    keywords: [
      'مستشفي', 'مستشفيات', 'دار شفاء', 'مجمع جراحي', 'طوارئ',
      'hospital', 'surgery center'
    ],
    weight: 22
  },
  {
    group: 'العيادات والرعاية الصحية والطبية',
    category: 'عيادة بيطرية ومستلزمات حيوانات',
    keywords: [
      'بيطري', 'بيطريه', 'عياده بيطريه', 'مستلزمات حيوانات', 'طيور اليفه',
      'veterinary', 'vet', 'pet clinic'
    ],
    weight: 23
  },
  {
    group: 'العيادات والرعاية الصحية والطبية',
    category: 'عيادة باطنة وتغذية علاجية',
    keywords: [
      'باطنه', 'جهاز هضمي', 'كبد', 'سكر وغدد', 'تغذيه علاجيه',
      'internal medicine', 'gastroenterology', 'nutrition'
    ],
    weight: 21
  },
  {
    group: 'العيادات والرعاية الصحية والطبية',
    category: 'عيادة عظام ومفاصل / علاج طبيعي',
    keywords: [
      'عظام', 'مفاصل', 'عمود فقري', 'روماتيزم',
      'orthopedics', 'spine', 'joint'
    ],
    weight: 21
  },
  {
    group: 'العيادات والرعاية الصحية والطبية',
    category: 'مركز علاج طبيعي وتأهيل',
    keywords: [
      'علاج طبيعي', 'تاهيل', 'اصابات ملاعب', 'physiotherapy', 'physical therapy', 'rehabilitation'
    ],
    weight: 21
  },
  {
    group: 'العيادات والرعاية الصحية والطبية',
    category: 'عيادة طبية / مركز تخصصي',
    keywords: [
      'عياده', 'مستوصف', 'مركز طبي', 'طبيب', 'دكتور', 'استشاري', 'اخصائي', 'مجمع طبي',
      'clinic', 'medical center', 'doctor'
    ],
    weight: 12
  },

  // ── 4. الهواتف والإلكترونيات والكمبيوتر ──
  {
    group: 'الهواتف والإلكترونيات والكمبيوتر',
    category: 'محل هواتف وصيانة موبايل وإكسسوارات',
    keywords: [
      'هواتف', 'موبايل', 'جوال', 'صيانه موبايل', 'اكسسوارات موبايل', 'ايفون', 'سامسونج',
      'mobile', 'phones', 'smartphone', 'phone repair'
    ],
    weight: 21
  },
  {
    group: 'الهواتف والإلكترونيات والكمبيوتر',
    category: 'أجهزة كمبيوتر ولابتوب وشبكات',
    keywords: [
      'كمبيوتر', 'لابتوب', 'شبكات', 'طابعات', 'صيانه كمبيوتر', 'بي سي',
      'pc', 'computer', 'laptop', 'hardware'
    ],
    weight: 21
  },
  {
    group: 'الهواتف والإلكترونيات والكمبيوتر',
    category: 'أجهزة كهربائية ومنزلية',
    keywords: [
      'اجهزه كهربائيه', 'اجهزه منزليه', 'شاشات', 'ثلاجات', 'غسالات', 'بوتاجازات', 'تكييفات',
      'appliances', 'electronics', 'home appliances'
    ],
    weight: 20
  },
  {
    group: 'الهواتف والإلكترونيات والكمبيوتر',
    category: 'دش وستالايت وكاميرات مراقبة وأمن',
    keywords: [
      'ستالايت', 'كاميرات مراقبه', 'انتركم', 'انظمه امنيه', 'دش',
      'cctv', 'satellite', 'security cameras'
    ],
    weight: 20
  },

  // ── 5. السيارات والمركبات والصيانة ──
  {
    group: 'السيارات والمركبات والصيانة',
    category: 'مركز صيانة سيارات وميكانيكا',
    keywords: [
      'صيانه سيارات', 'صيانة سيارات', 'ميكانيكا', 'ميكانيكي', 'ورشه سيارات', 'ورشة سيارات', 'عفشه', 'عفشة',
      'سمكري', 'سمكرى', 'سمكرة', 'سمكره', 'دوكو', 'دهان سيارات', 'رش سيارات', 'تجديد سيارات',
      'تصليح سيارات', 'اصلاح سيارات', 'خدمة سيارات', 'سرفيس سيارات', 'سرفيس',
      'شكمان', 'شكمانات', 'سروجي', 'فرش سيارات',
      'تعديل سيارات', 'رد على البارد', 'pdr', 'رادياتير', 'ردياتير',
      'auto repair', 'mechanic', 'auto service', 'car service', 'auto body shop', 'body repair', 'car repair', 'paint shop'
    ],
    weight: 21
  },
  {
    group: 'السيارات والمركبات والصيانة',
    category: 'كاوتش وبطاريات وضبط زوايا',
    keywords: [
      'كاوتش', 'اطارات', 'إطارات', 'بطاريات', 'بطارية', 'ضبط زوايا', 'ترصيص', 'ظبط زوايا',
      'tires', 'tyres', 'car battery', 'wheel alignment'
    ],
    weight: 21
  },
  {
    group: 'السيارات والمركبات والصيانة',
    category: 'كهرباء سيارات وتكييف وفحص',
    keywords: [
      'كهرباء سيارات', 'تكييف سيارات', 'فحص كمبيوتر سيارات', 'شحن فريون', 'كهربائي سيارات',
      'car electric', 'auto ac'
    ],
    weight: 21
  },
  {
    group: 'السيارات والمركبات والصيانة',
    category: 'مغسلة سيارات وديتيلينج وتلميع',
    keywords: [
      'مغسله سيارات', 'مغسلة سيارات', 'غسيل سيارات', 'تلميع سيارات', 'ديتيلينج', 'نانو سيراميك', 'دراي كلين سيارات',
      'car wash', 'detailing'
    ],
    weight: 21
  },
  {
    group: 'السيارات والمركبات والصيانة',
    category: 'قطع غيار سيارات وزيوت وشحوم',
    keywords: [
      'قطع غيار', 'قطع غيار سيارات', 'غيار سيارات', 'زيوت سيارات', 'تغيير زيت', 'فلاتر', 'شحومات',
      'auto parts', 'spare parts', 'motor oil'
    ],
    weight: 20
  },
  {
    group: 'السيارات والمركبات والصيانة',
    category: 'معرض سيارات / بيع وشراء',
    keywords: [
      'معرض سيارات', 'معارض سيارات', 'تاجر سيارات', 'تجاره سيارات', 'تجارة سيارات', 'بيع وشراء سيارات',
      'وكيل سيارات', 'موزع سيارات', 'تأجير سيارات', 'ايجار سيارات', 'سيارات مستعملة', 'سيارات زيرو', 'كسر زيرو',
      'تقسيط سيارات', 'أوتوموتيف', 'اوتوموتيف',
      'car dealer', 'car_dealer', 'dealership', 'car dealership', 'auto showroom', 'automotive', 'motors', 'car rental', 'car sales'
    ],
    weight: 22
  },
  {
    group: 'السيارات والمركبات والصيانة',
    category: 'موتوسيكلات وسكوتر وصيانة',
    keywords: [
      'موتوسيكل', 'سكوتر', 'دراجات ناريه', 'دراجات نارية', 'صيانه سكوتر', 'فيسبا',
      'motorcycle', 'scooter', 'bikes'
    ],
    weight: 20
  },

  // ── 6. التجميل والعناية الشخصية واللياقة ──
  {
    group: 'التجميل والعناية الشخصية واللياقة',
    category: 'صالون حلاقة رجالي وعناية',
    keywords: [
      'حلاقه', 'حلاق', 'صالون رجالي', 'حلاقه رجاليه', 'حلاقه رجالي',
      'barber', 'barbershop', 'mens salon'
    ],
    weight: 22
  },
  {
    group: 'التجميل والعناية الشخصية واللياقة',
    category: 'بيوتي سنتر وكوافير حريمي',
    keywords: [
      'بيوتي سنتر', 'كوافير', 'تصفيف شعر', 'صالون حريمي', 'ميك اب ارتست',
      'beauty salon', 'hair salon', 'ladies salon'
    ],
    weight: 22
  },
  {
    group: 'التجميل والعناية الشخصية واللياقة',
    category: 'جيم وصالة لياقة بدنية (Fitness)',
    keywords: [
      'جيم', 'صاله لياقه', 'لياقه بدنيه', 'كمال اجسام', 'فيتنس',
      'gym', 'fitness', 'workout'
    ],
    weight: 22
  },
  {
    group: 'التجميل والعناية الشخصية واللياقة',
    category: 'سبا وجاكوزي وحمام مغربي',
    keywords: [
      'سبا', 'جاكوزي', 'حمام مغربي', 'مساج', 'ساونا',
      'spa', 'massage', 'sauna'
    ],
    weight: 22
  },
  {
    group: 'التجميل والعناية الشخصية واللياقة',
    category: 'أكاديمية رياضية وتأجير ملاعب',
    keywords: [
      'اكاديميه رياضيه', 'ملاعب', 'بادل', 'كره قدم', 'تدريب سباحه',
      'sports academy', 'sports club', 'padel'
    ],
    weight: 20
  },

  // ── 7. الأثاث والديكور والمنزل ──
  {
    group: 'الأثاث والديكور والمنزل',
    category: 'معرض أثاث وموبيليات منزلية',
    keywords: [
      'اثاث', 'موبيليا', 'موبيليات', 'غرف نوم', 'انتريه', 'صالون', 'اثاث منزلي',
      'furniture', 'home furniture'
    ],
    weight: 20
  },
  {
    group: 'الأثاث والديكور والمنزل',
    category: 'مفروشات وستائر وسجاد',
    keywords: [
      'مفروشات', 'ستائر', 'سجاد', 'مراتب', 'ملايات', 'بطاطين',
      'curtains', 'carpets', 'rugs'
    ],
    weight: 20
  },
  {
    group: 'الأثاث والديكور والمنزل',
    category: 'أدوات منزلية ومطبخ',
    keywords: [
      'ادوات منزليه', 'اواني', 'رفايع', 'اجهزه مطبخ', 'طاسات',
      'kitchenware', 'houseware'
    ],
    weight: 20
  },
  {
    group: 'الأثاث والديكور والمنزل',
    category: 'دهانات وديكورات وورق حائط',
    keywords: [
      'دهانات', 'بويات', 'ورق حائط', 'جبس بورد', 'ديكورات',
      'paints', 'wallpaper', 'decor'
    ],
    weight: 19
  },
  {
    group: 'الأثاث والديكور والمنزل',
    category: 'إضاءة ونجف وتأسيس كهرباء',
    keywords: [
      'نجف', 'اضاءه', 'سبوتات', 'لمبات', 'ليد', 'تاسيس كهرباء',
      'lighting', 'chandeliers'
    ],
    weight: 20
  },
  {
    group: 'الأثاث والديكور والمنزل',
    category: 'أدوات صحية وسيراميك ورخام',
    keywords: [
      'ادوات صحيه', 'سيراميك', 'بورسلين', 'رخام', 'خلاطات',
      'ceramics', 'sanitary', 'marble'
    ],
    weight: 20
  },
  {
    group: 'الأثاث والديكور والمنزل',
    category: 'مطابخ حديثة ودريسنج روم',
    keywords: [
      'مطابخ خشمونيوم', 'مطابخ الوميتال', 'دريسنج روم', 'مطابخ حديثه',
      'modern kitchens', 'dressing room'
    ],
    weight: 20
  },

  // ── 8. الشركات والخدمات والمكاتب المهنية ──
  {
    group: 'الشركات والخدمات والمكاتب المهنية',
    category: 'مكتب محاماة واستشارات قانونية',
    keywords: [
      'محاماه', 'محامي', 'استشارات قانونيه', 'قضايا', 'مستشار قانوني', 'محاكم',
      'law firm', 'lawyer', 'attorney', 'legal'
    ],
    weight: 22
  },
  {
    group: 'الشركات والخدمات والمكاتب المهنية',
    category: 'مكتب عقارات وتسويق عقاري',
    keywords: [
      'عقارات', 'تسويق عقاري', 'وساطه عقاريه', 'ريل استيت', 'شقق للبيع',
      'real estate', 'realtor', 'broker', 'property'
    ],
    weight: 21
  },
  {
    group: 'الشركات والخدمات والمكاتب المهنية',
    category: 'مكتب محاسبة ومراجعة وضرائب',
    keywords: [
      'محاسبه', 'محاسب قانوني', 'ضرائب', 'مراجعه حسابات',
      'accounting', 'audit', 'tax consultant'
    ],
    weight: 21
  },
  {
    group: 'الشركات والخدمات والمكاتب المهنية',
    category: 'مكتب مقاولات وتشطيبات وبناء',
    keywords: [
      'مقاولات', 'تشطيبات', 'بناء', 'استشارات هندسيه', 'تصميم معماري',
      'contracting', 'finishes', 'engineering'
    ],
    weight: 21
  },
  {
    group: 'الشركات والخدمات والمكاتب المهنية',
    category: 'مكتب تسويق إلكتروني ودعاية وإعلان',
    keywords: [
      'تسويق الكتروني', 'دعايه واعلان', 'مطبوعات دعائيه', 'سوشيال ميديا',
      'marketing', 'digital marketing', 'advertising'
    ],
    weight: 21
  },
  {
    group: 'الشركات والخدمات والمكاتب المهنية',
    category: 'مكتب ترجمة معتمدة وخدمات فيزا',
    keywords: [
      'ترجمه معتمده', 'خدمات فيزا', 'تاشيرات', 'ترجمه',
      'translation', 'certified translation', 'visa services'
    ],
    weight: 21
  },
  {
    group: 'الشركات والخدمات والمكاتب المهنية',
    category: 'شركة شحن ونقل عفش وبضائع',
    keywords: [
      'شحن', 'نقل عفش', 'نقل موبيليا', 'شحن طرود', 'لوجستيك',
      'shipping', 'freight', 'moving', 'transport'
    ],
    weight: 21
  },
  {
    group: 'الشركات والخدمات والمكاتب المهنية',
    category: 'ستوديو تصوير وميديا وفوتوجرافي',
    keywords: [
      'ستوديو تصوير', 'استوديو تصوير', 'مصور', 'فوتوجرافر', 'تصوير فوتوغرافي',
      'photo studio', 'photographer', 'photography'
    ],
    weight: 21
  },
  {
    group: 'الشركات والخدمات والمكاتب المهنية',
    category: 'شركة خدمات وتجارة عامة',
    keywords: [
      'شركه', 'استيراد وتصدير', 'توريدات', 'خدمات عامه',
      'trading', 'general services', 'company'
    ],
    weight: 12
  },

  // ── 9. المكتبات والأدوات المدرسية والطباعة ──
  {
    group: 'المكتبات والأدوات المدرسية والطباعة',
    category: 'مكتبة تصوير مستندات وطباعة وخدمات كمبيوتر',
    keywords: [
      'تصوير مستندات', 'طباعه ديجيتال', 'بلوتر', 'طباعه وتصوير',
      'printing', 'copy center', 'print shop'
    ],
    weight: 21
  },
  {
    group: 'المكتبات والأدوات المدرسية والطباعة',
    category: 'ألعاب أطفال وهدايا وتغليف ومستلزمات مناسبات',
    keywords: [
      'العاب اطفال', 'هدايا', 'تغليف هدايا', 'بلالين', 'مستلزمات اعياد ميلاد',
      'toys', 'gift shop', 'wrapping', 'party supplies'
    ],
    weight: 21
  },
  {
    group: 'المكتبات والأدوات المدرسية والطباعة',
    category: 'مكتبة كتب وروايات وأدوات هندسية ورسم',
    keywords: [
      'كتب', 'روايات', 'ادوات رسم', 'ادوات هندسيه', 'معرض كتب',
      'bookstore', 'books', 'novels'
    ],
    weight: 21
  },
  {
    group: 'المكتبات والأدوات المدرسية والطباعة',
    category: 'مركز خدمات طالب وكتابة أبحاث وملازم',
    keywords: [
      'خدمات طالب', 'ملازم', 'ابحاث جامعيه', 'رسائل علميه',
      'student services'
    ],
    weight: 21
  },
  {
    group: 'المكتبات والأدوات المدرسية والطباعة',
    category: 'مكتبة وأدوات مدرسية وقرطاسية',
    keywords: [
      'مكتبه', 'قرطاسيه', 'ادوات مدرسيه', 'كشاكيل', 'اقلام',
      'stationery', 'school supplies'
    ],
    weight: 20
  },

  // ── 10. التعليم والتدريب وتنمية المهارات ──
  {
    group: 'التعليم والتدريب وتنمية المهارات',
    category: 'حضانة ورعاية أطفال',
    keywords: [
      'حضانه', 'بيبي كير', 'رعايه اطفال', 'رياض اطفال',
      'nursery', 'preschool', 'daycare'
    ],
    weight: 22
  },
  {
    group: 'التعليم والتدريب وتنمية المهارات',
    category: 'مدرسة خاصة أو دولية',
    keywords: [
      'مدرسه', 'مدرسه خاصه', 'مدرسه دوليه', 'اكاديميه تعليميه',
      'school', 'international school', 'private school'
    ],
    weight: 21
  },
  {
    group: 'التعليم والتدريب وتنمية المهارات',
    category: 'سنتر تعليمي ودروس خصوصية',
    keywords: [
      'سنتر تعليمي', 'دروس خصوصيه', 'مراجعات نهائيه',
      'educational center', 'tutoring'
    ],
    weight: 21
  },
  {
    group: 'التعليم والتدريب وتنمية المهارات',
    category: 'أكاديمية كورسات ولغات وبرمجة',
    keywords: [
      'كورسات', 'لغات', 'برمجه', 'تنميه مهارات', 'تدريب',
      'academy', 'courses', 'training center'
    ],
    weight: 21
  },

  // ── 11. الحرف والورش والصيانة الفنية ──
  {
    group: 'الحرف والورش والصيانة الفنية',
    category: 'ورشة ألوميتال وزجاج ومطابخ',
    keywords: [
      'الوميتال', 'ورشه الوميتال', 'زجاج سيكوريت', 'سيكوريت', 'شبابيك الوميتال',
      'alumital', 'glass'
    ],
    weight: 21
  },
  {
    group: 'الحرف والورش والصيانة الفنية',
    category: 'مغسلة ملابس ودراي كلين ومكوجي',
    keywords: [
      'دراي كلين', 'مكوجي', 'غسيل وكوي', 'مغسله ملابس',
      'laundry', 'dry clean'
    ],
    weight: 22
  },
  {
    group: 'الحرف والورش والصيانة الفنية',
    category: 'ورشة حدادة وكريتال',
    keywords: [
      'حداده', 'كريتال', 'فورفورجيه', 'ابواب حديد',
      'blacksmith', 'iron works'
    ],
    weight: 21
  },
  {
    group: 'الحرف والورش والصيانة الفنية',
    category: 'ورشة نجارة ومصنوعات خشبية',
    keywords: [
      'نجاره', 'نجار', 'باب وشباك', 'موبيليا خشب',
      'carpentry', 'carpenter', 'woodwork'
    ],
    weight: 21
  },
  {
    group: 'الحرف والورش والصيانة الفنية',
    category: 'فني صيانة تكييف وتبريد وأجهزة',
    keywords: [
      'تكييف وتبريد', 'صيانه تكييفات', 'شحن تكييف', 'صيانه غسالات',
      'ac repair', 'hvac'
    ],
    weight: 21
  },
  {
    group: 'الحرف والورش والصيانة الفنية',
    category: 'فني سباكة وتأسيس صحي',
    keywords: [
      'سباكه', 'سباك', 'تاسيس صحي', 'تصليح سباكه',
      'plumbing', 'plumber'
    ],
    weight: 21
  },
  {
    group: 'الحرف والورش والصيانة الفنية',
    category: 'فني كهرباء وصيانة منزلية',
    keywords: [
      'كهربائي', 'فني كهرباء', 'تاسيس كهرباء منزلي',
      'electrician'
    ],
    weight: 21
  },

  // ── 12. السياحة والفنادق والمناسبات ──
  {
    group: 'السياحة والفنادق والمناسبات',
    category: 'فندق وشقق فندقية ومنتجعات',
    keywords: [
      'فندق', 'اوتيل', 'شقق فندقيه', 'منتجع', 'قريه سياحيه',
      'hotel', 'resort', 'hotel apartments'
    ],
    weight: 22
  },
  {
    group: 'السياحة والفنادق والمناسبات',
    category: 'قاعة مناسبات وأفراح',
    keywords: [
      'قاعه افراح', 'قاعه مناسبات', 'دار مناسبات',
      'wedding hall', 'event hall'
    ],
    weight: 22
  },
  {
    group: 'السياحة والفنادق والمناسبات',
    category: 'تنظيم حفلات ومؤتمرات',
    keywords: [
      'تنظيم حفلات', 'ايفنتات', 'مؤتمرات', 'تجهيز حفلات',
      'event planner', 'event organizer'
    ],
    weight: 21
  },
  {
    group: 'السياحة والفنادق والمناسبات',
    category: 'مكتب حجز رحلات وسياحة',
    keywords: [
      'حجز طيران', 'رحلات سياحيه', 'سياحه داخليه', 'عمره وحج',
      'travel agency', 'tourism', 'flight booking'
    ],
    weight: 21
  },

  // ── 13. أنشطة وخدمات عامة أخرى ──
  {
    group: 'أنشطة وخدمات عامة أخرى',
    category: 'محطة وقود وغاز طبيعي',
    keywords: [
      'بنزينه', 'محطه وقود', 'غاز طبيعي', 'تموين سيارات', 'محطه بنزين',
      'gas station', 'petrol station'
    ],
    weight: 22
  },
  {
    group: 'أنشطة وخدمات عامة أخرى',
    category: 'مشتل زهور ونباتات زينة',
    keywords: [
      'مشتل', 'نباتات زينه', 'مشتل زهور', 'تنسيق حدائق',
      'plant nursery', 'flowers', 'landscape'
    ],
    weight: 22
  },
  {
    group: 'أنشطة وخدمات عامة أخرى',
    category: 'جمعية خيرية ومؤسسة أهلية',
    keywords: [
      'جمعيه خيريه', 'مؤسسه اهليه', 'عمل تطوعي',
      'charity', 'ngo'
    ],
    weight: 21
  },
  {
    group: 'أنشطة وخدمات عامة أخرى',
    category: 'نشاط تجاري / خدمي آخر',
    keywords: [
      'متجر', 'محل', 'دكان', 'معرض', 'store', 'shop'
    ],
    weight: 4
  }
];

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Classifies any Google Place text/title/address into Dalelak's verified Taxonomy
 */
export function classifyPlaceCategory(text: string): ClassifiedCategoryResult | null {
  if (!text || typeof text !== 'string') return null;

  const normalized = normalizeArabicText(text);
  if (!normalized) return null;

  const tokens = getArabicTokens(normalized);
  const normalizedWithStems = `${normalized} ${tokens.join(' ')}`;

  let bestRule: TaxonomyRule | null = null;
  let highestScore = -1;
  let matchedKw = '';

  for (const rule of GOOGLE_TAXONOMY_RULES) {
    for (const rawKw of rule.keywords) {
      const kw = normalizeArabicText(rawKw);
      if (!kw) continue;

      const isMultiWord = kw.includes(' ');
      let isMatch = false;

      if (isMultiWord) {
        // Multi-word phrase: must match with boundary (whitespace or string boundary)
        const escaped = escapeRegex(kw);
        const phrasePattern = new RegExp(`(?:^|\\s)${escaped}(?:\\s|$)`);
        isMatch = phrasePattern.test(normalized) || phrasePattern.test(normalizedWithStems);
      } else {
        // Single word:
        // 1. Direct token or stem match
        isMatch = tokens.includes(kw);
        // 2. For words with 4 or more characters, also allow whole-word regex on normalized text
        if (!isMatch && kw.length >= 4) {
          const escaped = escapeRegex(kw);
          const wordPattern = new RegExp(`(?:^|\\s)${escaped}(?:\\s|$)`);
          isMatch = wordPattern.test(normalized);
        }
      }

      if (isMatch) {
        // Precedence Guard: Dining/Restaurant over raw ingredients (Update 41)
        // If text contains dining intent (مطعم, restaurant, diner, مشويات, مشاوي, اكلات, وجبات, كبابجي, مندي, حنيذ),
        // do not classify as 'جزارة' solely on generic food terms ('meat', 'fish', 'لحوم', 'سمك', 'فراخ', 'دواجن')
        // unless explicit butchery terms ('جزار', 'جزاره', 'جزارة', 'butcher', 'مجزر', 'فسخاني') are present.
        const hasRestaurantIntent =
          tokens.includes('مطعم') ||
          tokens.includes('restaurant') ||
          tokens.includes('diner') ||
          tokens.includes('مشويات') ||
          tokens.includes('مشاوي') ||
          tokens.includes('كبابجي') ||
          tokens.includes('مندي') ||
          tokens.includes('حنيذ');

        if (rule.category === 'جزارة / لحوم ودواجن وأسماك' && hasRestaurantIntent) {
          const hasExplicitButcherWord =
            tokens.includes('جزاره') ||
            tokens.includes('جزار') ||
            tokens.includes('جزارة') ||
            tokens.includes('butcher') ||
            tokens.includes('مجزر') ||
            tokens.includes('فسخاني');

          if (!hasExplicitButcherWord) {
            continue;
          }
        }

        const lengthBonus = Math.min(kw.length, 10);
        const phraseBonus = isMultiWord ? 4 : 0;
        const score = rule.weight * 2 + lengthBonus + phraseBonus;
        if (score > highestScore) {
          highestScore = score;
          bestRule = rule;
          matchedKw = kw;
        }
      }
    }
  }

  // Fallback check against existing category groups directly if no rule matched
  if (!bestRule) {
    for (const grp of CATEGORY_GROUPS) {
      for (const item of grp.items) {
        const normItem = normalizeArabicText(item);
        const isMultiWord = normItem.includes(' ');
        let isMatch = false;
        if (isMultiWord) {
          const phrasePattern = new RegExp(`(?:^|\\s)${escapeRegex(normItem)}(?:\\s|$)`);
          isMatch = phrasePattern.test(normalized);
        } else {
          isMatch = tokens.includes(normItem);
        }
        if (isMatch) {
          return {
            group: grp.group,
            category: item,
            matchedKeyword: item,
            score: 10,
            googleCategoryTitle: item,
          };
        }
      }
    }
    return null;
  }

  return {
    group: bestRule.group,
    category: bestRule.category,
    matchedKeyword: matchedKw,
    score: highestScore,
    googleCategoryTitle: bestRule.category,
  };
}
