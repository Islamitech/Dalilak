import os
import sys
import json
import time
import io
import re
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
from PIL import Image, ImageEnhance, ImageFilter, ImageOps
import threading

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

SUPABASE_URL = 'https://xdqpbajymacpdccorjcj.supabase.co'
SUPABASE_ANON_KEY = 'sb_publishable_VJ8y1c53by7_sEn90hy8Pw_vO_K_b2x'
BUCKET_NAME = 'business-media'

RAW_BACKUP_DIR = os.path.join('backups', 'activity_images_raw_backup')
os.makedirs(RAW_BACKUP_DIR, exist_ok=True)

OFFICIAL_CATEGORIES = [
    'مطعم / مأكولات ومشويات', 'كافيه / مقهى وكوفي شوب', 'مخبز / حلواني ومعجنات', 'عصائر ومثلجات / آيس كريم',
    'سوبر ماركت / هايبر وبقالة', 'خضروات وفواكه طازجة', 'جزارة / لحوم ودواجن وأسماك', 'عطارة وتوابل / أعشاب طبيعية',
    'محامص ومكسرات وتسالي / بن وقهوة', 'عيادة طبية / مركز تخصصي', 'عيادة أسنان / طب وجراحة الفم',
    'عيادة عيون وبصريات / نظارات', 'عيادة جلدية وتجميل / ليزر', 'عيادة أطفال ورعاية حديثي الولادة',
    'عيادة نساء وتوليد / حقن مجهري', 'عيادة باطنة وتغذية علاجية', 'عيادة عظام ومفاصل / علاج طبيعي',
    'صيدلية وخدمات دوائية', 'معمل تحاليل طبية', 'مركز أشعة وتشخيص طبي', 'مستشفى / مجمع طبي جراحي',
    'مركز علاج طبيعي وتأهيل', 'عيادة بيطرية ومستلزمات حيوانات', 'محل ملابس رجالي وبدل', 'محل ملابس حريمي وعبايات',
    'محل ملابس أطفال ومواليد', 'محل أحذية وشنط وجلود', 'محل مجوهرات وذهب وفضة', 'محل ساعات ونظارات شمسية',
    'مستحضرات تجميل وميكب', 'محل عطور وبخور وبرفيوم', 'محل هواتف وصيانة موبايل وإكسسوارات',
    'أجهزة كمبيوتر ولابتوب وشبكات', 'أجهزة كهربائية ومنزلية', 'دش وستالايت وكاميرات مراقبة وأمن',
    'معرض سيارات / بيع وشراء', 'مركز صيانة سيارات وميكانيكا', 'كهرباء سيارات وتكييف وفحص',
    'مغسلة سيارات وديتيلينج وتلميع', 'كاوتش وبطاريات وضبط زوايا', 'قطع غيار سيارات وزيوت وشحوم',
    'موتوسيكلات وسكوتر وصيانة', 'صالون حلاقة رجالي وعناية', 'بيوتي سنتر وكوافير حريمي',
    'سبا وجاكوزي وحمام مغربي', 'جيم وصالة لياقة بدنية (Fitness)', 'أكاديمية رياضية وتأجير ملاعب',
    'معرض أثاث وموبيليات منزلية', 'مفروشات وستائر وسجاد', 'أدوات منزلية ومطبخ', 'دهانات وديكورات وورق حائط',
    'إضاءة ونجف وتأسيس كهرباء', 'أدوات صحية وسيراميك ورخام', 'مطابخ حديثة ودريسنج روم',
    'شركة خدمات وتجارة عامة', 'مكتب محاماة واستشارات قانونية', 'مكتب محاسبة ومراجعة وضرائب',
    'مكتب مقاولات وتشطيبات وبناء', 'مكتب تسويق إلكتروني ودعاية وإعلان', 'مكتب ترجمة معتمدة وخدمات فيزا',
    'مكتب عقارات وتسويق عقاري', 'شركة شحن ونقل عفش وبضائع', 'ستوديو تصوير وميديا وفوتوجرافي',
    'مكتبة وأدوات مدرسية وقرطاسية', 'مكتبة تصوير مستندات وطباعة وخدمات كمبيوتر',
    'مكتبة كتب وروايات وأدوات هندسية ورسم', 'ألعاب أطفال وهدايا وتغليف ومستلزمات مناسبات',
    'مكتبة بيع بالجملة وتوريدات مكاتب ومدارس', 'مركز خدمات طالب وكتابة أبحاث وملازم',
    'مكتبة وأدوات مدرسية وطباعة', 'حضانة ورعاية أطفال', 'مدرسة خاصة أو دولية',
    'سنتر تعليمي ودروس خصوصية', 'أكاديمية كورسات ولغات وبرمجة', 'ورشة حدادة وكريتال',
    'ورشة نجارة ومصنوعات خشبية', 'ورشة ألوميتال وزجاج ومطابخ', 'فني صيانة تكييف وتبريد وأجهزة',
    'فني سباكة وتأسيس صحي', 'فني كهرباء وصيانة منزلية', 'مغسلة ملابس ودراي كلين ومكوجي',
    'فندق وشقق فندقية ومنتجعات', 'قاعة مناسبات وأفراح', 'تنظيم حفلات ومؤتمرات', 'مكتب حجز رحلات وسياحة',
    'مشتل زهور ونباتات زينة', 'محطة وقود وغاز طبيعي', 'جمعية خيرية ومؤسسة أهلية', 'نشاط تجاري / خدمي آخر'
]

# Thread safety lock for local file updates
file_lock = threading.Lock()

# =========================================================================
# 1. CATEGORY RESOLUTION & AUDITING LOGIC
# =========================================================================

def audit_and_resolve_category(name, current_cat, desc=""):
    clean_name = (name or '').lower()
    clean_cat = (current_cat or '').strip().lower()
    text = f"{clean_name} {clean_cat} {(desc or '').lower()}"

    # Priority 1: Car detailing, car care, car wash
    if re.search(r'car\s*spa|car\s*care|غسيل.*سيارات|غسل.*سيارات|مغسلة.*سيارات|محطة.*غس|ديتيلينج|detailing', text):
        return 'مغسلة سيارات وديتيلينج وتلميع', True, 'نشاط غسيل وتلميع وعناية بالسيارات (Car Care / Detailing)', 'high'

    # Priority 2: Car accessories & parts
    if re.search(r'car\s*accessories|accessories.*car|كماليات.*سيارات|إكسسوارات.*سيارات|اكسسوارات.*سيارات|قطع.*غيار|زيوت|شحوم|بطاريات.*سيارات', text):
        return 'قطع غيار سيارات وزيوت وشحوم', True, 'تجارة كماليات وإكسسوارات وقطع غيار سيارات', 'high'

    # Priority 3: Car dealerships & auto sales
    if re.search(r'تاجر.*سيارات|معرض.*سيارات|بيع.*سيارات|شراء.*سيارات|automotive|motors|موتورز', text) and not re.search(r'صيانة|ميكانيك|غسيل', clean_name):
        return 'معرض سيارات / بيع وشراء', True, 'معرض تجارة وبيع وشراء سيارات', 'high'

    # Priority 4: Car maintenance & repair
    if re.search(r'صيانة.*سيارات|ميكانيك|عفشة|فتيس|تكييف.*سيارات|مركز.*خدمة.*سيارات|ميكانيكا|سرفيس.*سيارات', text):
        return 'مركز صيانة سيارات وميكانيكا', True, 'مركز صيانة وفحص فني وميكانيكا سيارات', 'high'

    # Priority 5: Tires & Wheel alignment
    if re.search(r'كاوتش|إطارات|اطارات|ترصيص|ضبط.*زوايا|تيوبلس', text):
        return 'كاوتش وبطاريات وضبط زوايا', True, 'خدمات كاوتش وإطارات وضبط زوايا', 'high'

    # Priority 6: Motorcycles & Scooters
    if re.search(r'موتوسيكل|سكوتر|دراجات.*نارية|scooter', text):
        return 'موتوسيكلات وسكوتر وصيانة', True, 'صيانة ومستلزمات دراجات نارية وسكوتر', 'high'

    # Priority 7: Aluminum, Glass, Securit, Shutters
    if re.search(r'ألوميتال|الوميتال|سيكوريت|زجاج|شبابيك.*أبواب|واجهات.*زجاج|مطابخ.*الوميتال', text):
        return 'ورشة ألوميتال وزجاج ومطابخ', True, 'أعمال ألوميتال وزجاج وسيكوريت ومطابخ', 'high'

    # Priority 8: Air Conditioning & Refrigeration (Name-based override)
    if re.search(r'تكييف|تبريد|تكيف|تكييفات|air.*condition', clean_name):
        return 'فني صيانة تكييف وتبريد وأجهزة', True, 'خدمات وصيانة وتجهيز التكييف والتبريد', 'high'

    # Priority 9: Satellite, Dish & Surveillance Cameras
    if re.search(r'دش\b|ستالايت|كاميرات.*مراقبة|انتركم|أنظمة.*أمن', clean_name):
        return 'دش وستالايت وكاميرات مراقبة وأمن', True, 'تركيب وصيانة الدش والستالايت وكاميرات المراقبة', 'high'

    # Priority 10: Mobile phones, Software, Hardware
    if re.search(r'سوفت.*وير|هارد.*وير|موبايل|محمول|هاتف|فون|mobile\b|phone\b', clean_name):
        return 'محل هواتف وصيانة موبايل وإكسسوارات', True, 'صيانة ومبيعات الهواتف المحمولة والبرمجيات', 'high'
    if re.search(r'برمجيات|برمجة|software', clean_name):
        return 'أجهزة كمبيوتر ولابتوب وشبكات', True, 'حلول البرمجيات والحاسب الآلي والشبكات', 'high'

    # Priority 11: Medical & Health
    if re.search(r'صيدلية|pharmacy|صيدليات|فارماسي', text):
        return 'صيدلية وخدمات دوائية', True, 'صيدلية وصرف أدوية ورعاية دوائية', 'high'
    if re.search(r'معمل|تحاليل|مختبر|lab\b|laborator', text):
        return 'معمل تحاليل طبية', True, 'معمل تحاليل وفحوصات مخبرية', 'high'
    if re.search(r'أشعة|اشعة|scan|رنين|سونار|x-ray', text):
        return 'مركز أشعة وتشخيص طبي', True, 'مركز أشعة وفحص تشخيصي', 'high'
    if re.search(r'أسنان|اسنان|dental|dentist|طب.*فم', text):
        return 'عيادة أسنان / طب وجراحة الفم', True, 'عيادة تخصصية لطب وجراحة الفم والأسنان', 'high'
    if re.search(r'عيون|بصريات|نظارات|optics|eyes', text):
        return 'عيادة عيون وبصريات / نظارات', True, 'بصريات وفحص عيون ونظارات طبية', 'high'
    if re.search(r'جلدية|ليزر|تجميل.*ليزر|dermatology|skin', text):
        return 'عيادة جلدية وتجميل / ليزر', True, 'عيادة جلدية وتجميل بالليزر', 'high'
    if re.search(r'أطفال|اطفال|حديثي.*الولادة|pediatric', text) and not re.search(r'ملابس|حضانة', text):
        return 'عيادة أطفال ورعاية حديثي الولادة', True, 'عيادة أطفال ورعاية حديثي الولادة', 'high'
    if re.search(r'نساء.*توليد|حقن.*مجهري|gynecology|توليد', text):
        return 'عيادة نساء وتوليد / حقن مجهري', True, 'عيادة نساء وتوليد وحقن مجهري', 'high'
    if re.search(r'عظام|مفاصل|علاج.*طبيعي|rehab|orthopedic', text):
        return 'عيادة عظام ومفاصل / علاج طبيعي', True, 'عيادة عظام ومفاصل وتأهيل حركي', 'high'
    if re.search(r'عيادة|عيادات|مركز.*طبي|clinics|clinic|دكتور|طبيب', text):
        return 'عيادة طبية / مركز تخصصي', True, 'عيادات واستشارات طبية تخصصية', 'high'
    if re.search(r'مستشفى|hospital|مجمع.*طبي', text):
        return 'مستشفى / مجمع طبي جراحي', True, 'مستشفى ورعاية طبية سريرية متكاملة', 'high'
    if re.search(r'بيطري|veterinary|حيوانات|pet\b|pets', text):
        return 'عيادة بيطرية ومستلزمات حيوانات', True, 'عيادة ورعاية بيطرية', 'high'

    # Priority 12: Cafes, Bakeries, Food
    if re.search(r'كافيه|مقهى|كوفي|cafe|coffee|coffe|espresso|لاتيه|شيشة|روستري|قهوة', text) and not re.search(r'مطعم|مشويات|restaurant', clean_name):
        return 'كافيه / مقهى وكوفي شوب', True, 'مقهى ومشروبات ساخنة وباردة', 'high'
    if re.search(r'حلواني|مخبز|باتيسري|معجنات|bakery|pastry|تورت|حلويات|كيك|حلوى|شوكولاتة|chocolate', text):
        return 'مخبز / حلواني ومعجنات', True, 'مخبز وحلواني وصناعة حلويات ومعجنات', 'high'
    if re.search(r'عصير|عصائر|مثلجات|آيس.*كريم|ايس.*كريم|ice.*cream|وافل|بان.*كيك|juices', text):
        return 'عصائر ومثلجات / آيس كريم', True, 'عصائر طازجة ومثلجات وآيس كريم', 'high'
    if (re.search(r'مطعم|مشويات|مأكولات|restaurant|شاورما|برجر|بيتزا|كباب|حواوشي|سوشي|sushi|فطائر|طواجن|سمك|أسماك|فول.*فلافل|كشري|وجبات', text) or clean_cat == 'مطعم') and not re.search(r'صيانة|سوفت.*وير|هارد.*وير|موبايل|تكييف|سيارات', clean_name):
        return 'مطعم / مأكولات ومشويات', True, 'مطعم ومأكولات متنوعة ومشويات', 'high'
    if re.search(r'جزارة|لحوم|دواجن|فراخ|طيور|فسخاني|أسماك.*طازجة', text):
        return 'جزارة / لحوم ودواجن وأسماك', True, 'جزارة ولحوم ودواجن طازجة', 'high'
    if re.search(r'خضار|فاكهة|خضروات|فواكه', text):
        return 'خضروات وفواكه طازجة', True, 'خضروات وفواكه طازجة يومية', 'high'
    if re.search(r'عطارة|توابل|أعشاب|بهارات', text):
        return 'عطارة وتوابل / أعشاب طبيعية', True, 'عطارة وتوابل وأعشاب طبيعية', 'high'
    if re.search(r'محمصة|مكسرات|تسالي|بن\b|مطحنة|قهوة', text):
        return 'محامص ومكسرات وتسالي / بن وقهوة', True, 'محامص ومكسرات وبن وتسالي', 'high'
    if re.search(r'سوبر.*ماركت|هايبر|بقالة|supermarket|تموين|ماركت', text) and not re.search(r'car|auto|phone|mobile', clean_name):
        return 'سوبر ماركت / هايبر وبقالة', True, 'سوبر ماركت وهايبر للمنتجات الاستهلاكية', 'high'

    # Priority 10: Barbers & Beauty
    if re.search(r'حلاقة.*رجال|صالون.*رجال|barber|حلاق|barbershop', text) or (clean_cat == 'صالون حلاقة' and not re.search(r'سيدات|تجميل|كوافير', clean_name)):
        return 'صالون حلاقة رجالي وعناية', True, 'صالون حلاقة رجالي وعناية بالمظهر', 'high'
    if re.search(r'كوافير|بيوتي.*سنتر|beauty.*salon|تجميل.*سيدات|عرائس|ميكب|صالون.*سيدات|صالون.*تجميل|كوافير.*حريمي', text):
        return 'بيوتي سنتر وكوافير حريمي', True, 'صالون تجميل وعناية نسائية وميكب', 'high'
    if re.search(r'سبا|جاكوزي|مغربي|ساونا|massage|spa\b|مساج', text) and not re.search(r'car|auto', clean_name):
        return 'سبا وجاكوزي وحمام مغربي', True, 'استرخاء وسبا وعناية بالجسم', 'high'
    if re.search(r'جيم|لياقة|fitness|gym|كمال.*أجسام|crossfit', text):
        return 'جيم وصالة لياقة بدنية (Fitness)', True, 'صالة تدريب ولياقة بدنية وبناء أجسام', 'high'
    if re.search(r'ملاعب|أكاديمية.*رياضية|كورة|كرة|padel|بادل|سباحة', text):
        return 'أكاديمية رياضية وتأجير ملاعب', True, 'تدريب رياضي وملاعب ومسابقات', 'high'

    # Priority 11: Fashion & Apparel
    if re.search(r'بدل|ملابس.*رجال|رجالي|menswear|men\b', text):
        return 'محل ملابس رجالي وبدل', True, 'أزياء وملابس رجالية وبدل رسمية', 'high'
    if re.search(r'عبايات|حريمي|فساتين|طرح|لانجري|women|ladies|محجبات|حجاب|إسدال', text):
        return 'محل ملابس حريمي وعبايات', True, 'أزياء وملابس نسائية وعبايات', 'high'
    if re.search(r'أطفال|اطفال|بيبي|kids|baby|مواليد', text) and re.search(r'ملابس|أزياء|محل|متجر', text):
        return 'محل ملابس أطفال ومواليد', True, 'ملابس ومستلزمات أطفال ومواليد', 'high'
    if re.search(r'أحذية|احذية|شنط|حقائب|شنطة|shoes|bags|جلود', text):
        return 'محل أحذية وشنط وجلود', True, 'أحذية ومصنوعات جلدية وحقائب', 'high'
    if re.search(r'ذهب|مجوهرات|فضة|jewelry|gold|silver|صاغة', text):
        return 'محل مجوهرات وذهب وفضة', True, 'صياغة وبيع الذهب والمجوهرات والفضيات', 'high'
    if re.search(r'ساعات|نظارات.*شمس|watches|eyewear', text):
        return 'محل ساعات ونظارات شمسية', True, 'ساعات يد ونظارات شمسية أصلية', 'high'
    if re.search(r'مستحضرات.*تجميل|ميك.*اب|makeup|cosmetics|عناية.*بشرة', text):
        return 'مستحضرات تجميل وميكب', True, 'مستحضرات تجميل ومكياج وعناية', 'high'
    if re.search(r'عطور|برفيوم|بخور|perfume|fragrance|عود', text):
        return 'محل عطور وبخور وبرفيوم', True, 'عطور شرقية وغربية وبخور', 'high'
    if clean_cat == 'متجر ملابس' or 'ملابس' in text:
        return 'محل ملابس رجالي وبدل', True, 'متجر أزياء وملابس معتمد', 'medium'

    # Priority 12: Tech & Electronics
    if re.search(r'موبايل|هاتف|هواتف|محمول|mobile|phone|اكسسوارات.*موبايل', text):
        return 'محل هواتف وصيانة موبايل وإكسسوارات', True, 'أجهزة هواتف ذكية وصيانة وإكسسوارات', 'high'
    if re.search(r'كمبيوتر|لابتوب|شبكات|computer|laptop|it.*solutions|صيانة.*كمبيوتر', text):
        return 'أجهزة كمبيوتر ولابتوب وشبكات', True, 'أجهزة حاسوب ولابتوب ودعم شبكات', 'high'
    if re.search(r'أجهزة.*كهربائية|غسالات|ثلاجات|تكييفات|شاشات|electronics', text):
        return 'أجهزة كهربائية ومنزلية', True, 'أجهزة كهربائية ومنزلية معتمدة', 'high'
    if re.search(r'كاميرات.*مراقبة|دش|ستالايت|انتركم|أنظمة.*أمن', text):
        return 'دش وستالايت وكاميرات مراقبة وأمن', True, 'كاميرات مراقبة وأنظمة أمن وستالايت', 'high'

    # Priority 13: Home, Furniture & Decor
    if re.search(r'أثاث|موبيليات|اثاث|غرف.*نوم|صالونات|furniture', text):
        return 'معرض أثاث وموبيليات منزلية', True, 'معرض أثاث وموبيليات عصرية وكلاسيكية', 'high'
    if re.search(r'ستائر|مفروشات|سجاد|مفارش|curtains|rugs', text):
        return 'مفروشات وستائر وسجاد', True, 'مفروشات منزلية وستائر وسجاد عصري', 'high'
    if re.search(r'أدوات.*منزلية|أواني|مطبخ|رفايع', text):
        return 'أدوات منزلية ومطبخ', True, 'أدوات ومستلزمات المطبخ والمنزل', 'high'
    if re.search(r'دهانات|بويات|ورق.*حائط|ديكورات|جبس|paints', text):
        return 'دهانات وديكورات وورق حائط', True, 'دهانات وديكورات وتكسيات جدارية', 'high'
    if re.search(r'نجف|إضاءة|كهرباء.*تأسيس|سبوتات|lighting', text):
        return 'إضاءة ونجف وتأسيس كهرباء', True, 'أدوات إضاءة وتأسيس كهربائي ونجف', 'high'
    if re.search(r'سيراميك|رخام|أدوات.*صحية|بورسلين|خلاطات', text):
        return 'أدوات صحية وسيراميك ورخام', True, 'أدوات صحية وتجهيزات سيراميك ورخام', 'high'
    if re.search(r'دريسنج|مطابخ.*حديثة|kitchens|dressing', text):
        return 'مطابخ حديثة ودريسنج روم', True, 'تصميم وتصنيع المطابخ والدريسنج روم', 'high'

    # Priority 14: Professional Services
    if re.search(r'محاماة|استشارات.*قانونية|قضايا|محامي|law\b|legal', text):
        return 'مكتب محاماة واستشارات قانونية', True, 'خدمات استشارات قانونية وترافع', 'high'
    if re.search(r'محاسبة|ضرائب|مراجعة|تأسيس.*شركات|accounting|tax\b', text):
        return 'مكتب محاسبة ومراجعة وضرائب', True, 'خدمات محاسبة وتدقيق ضريبي وقانوني', 'high'
    if re.search(r'مقاولات|تشطيبات|بناء|ديكور.*معماري|contracting|تشطيب|مقاول', text):
        return 'مكتب مقاولات وتشطيبات وبناء', True, 'أعمال مقاولات وبناء وتشطيبات هندسية', 'high'
    if re.search(r'تسويق.*إلكتروني|دعاية|إعلان|advertising|marketing|طباعة.*بنرات', text):
        return 'مكتب تسويق إلكتروني ودعاية وإعلان', True, 'دعاية وإعلان وحلول تسويق رقمي', 'high'
    if re.search(r'ترجمة.*معتمدة|فيزا|سفارات|translation', text):
        return 'مكتب ترجمة معتمدة وخدمات فيزا', True, 'خدمات ترجمة معتمدة وتجهيز تأشيرات', 'high'
    if re.search(r'عقارات|تسويق.*عقاري|سمسار|real.*estate|property', text):
        return 'مكتب عقارات وتسويق عقاري', True, 'وساطة واستشارات وتسويق عقاري', 'high'
    if re.search(r'شحن|نقل.*عفش|نقل.*أثاث|نقل.*بضائع|shipping', text):
        return 'شركة شحن ونقل عفش وبضائع', True, 'خدمات شحن ونقل بضائع وأثاث', 'high'
    if re.search(r'تصوير|فوتوجرافر|فوتوسيشن|studio|photography', text):
        return 'ستوديو تصوير وميديا وفوتوجرافي', True, 'ستوديو تصوير فوتوغرافي وتوثيق مناسبات', 'high'

    # Priority 15: Printing, Education & Crafts
    if re.search(r'مكتبة.*تصوير|طباعة.*مستندات|سيرفر.*طباعة|تصوير.*أوراق', text):
        return 'مكتبة تصوير مستندات وطباعة وخدمات كمبيوتر', True, 'تصوير وطباعة وخدمات طلابية ومكتبية', 'high'
    if re.search(r'مكتبة|قرطاسية|كشاكيل|أدوات.*مدرسية', text):
        return 'مكتبة وأدوات مدرسية وقرطاسية', True, 'أدوات مكتبية ومدرسية وقرطاسية', 'high'
    if re.search(r'كتب|روايات|كتب.*أجنبية|أدوات.*هندسية', text):
        return 'مكتبة كتب وروايات وأدوات هندسية ورسم', True, 'كتب وروايات ومستلزمات رسم وهندسة', 'high'
    if re.search(r'ألعاب.*أطفال|هدايا|تغليف|toys|gifts|بالونات', text):
        return 'ألعاب أطفال وهدايا وتغليف ومستلزمات مناسبات', True, 'ألعاب أطفال وهدايا واحتفالات', 'high'
    if re.search(r'حضانة|نيرسري|nursery|preschool|طفولة.*مبكرة', text):
        return 'حضانة ورعاية أطفال', True, 'حضانة وتنشئة ورعاية أطفال', 'high'
    if re.search(r'مدرسة|school|تعليم.*أساسي|لغات', text):
        return 'مدرسة خاصة أو دولية', True, 'تعليم مدرسي ومنظومة تربوية', 'high'
    if re.search(r'سنتر.*تعليمي|دروس.*خصوصية|تقوية', text):
        return 'سنتر تعليمي ودروس خصوصية', True, 'سنتر تعليمي ومراجعات دراسية', 'high'
    if re.search(r'كورسات|أكاديمية.*لغات|برمجة|تدريب|academy|training', text):
        return 'أكاديمية كورسات ولغات وبرمجة', True, 'أكاديمية تدريب مهني ولغات وبرمجة', 'high'
    if re.search(r'حدادة|كريتال|فورفورجيه|حديد', text):
        return 'ورشة حدادة وكريتال', True, 'أعمال حدادة وتشكيل معادن وكريتال', 'high'
    if re.search(r'نجارة|نجار|مصنوعات.*خشبية|أخشاب', text):
        return 'ورشة نجارة ومصنوعات خشبية', True, 'أعمال نجارة ومصنوعات خشبية دقيقة', 'high'
    if re.search(r'تكييف|تبريد|صيانة.*أجهزة.*منزلية', text):
        return 'فني صيانة تكييف وتبريد وأجهزة', True, 'صيانة تكييف وتبريد وأجهزة منزلية', 'high'
    if re.search(r'سباك|سباكة|أدوات.*سباكة|صحي', text):
        return 'فني سباكة وتأسيس صحي', True, 'تأسيس وصيانة أعمال السباكة والصرف', 'high'
    if re.search(r'كهربائي|كهرباء.*منزلية|صيانة.*كهرباء', text):
        return 'فني كهرباء وصيانة منزلية', True, 'فني كهرباء وتركيبات وتأسيس منزلي', 'high'
    if re.search(r'دراي.*كلين|دراى.*كلين|مغسلة.*ملابس|مكوجي|laundry|dry.*clean', text):
        return 'مغسلة ملابس ودراي كلين ومكوجي', True, 'غسيل جاف وكي وعناية بالملابس', 'high'
    if re.search(r'فندق|أوتيل|hotel|resort|منتجع|شقق.*فندقية', text):
        return 'فندق وشقق فندقية ومنتجعات', True, 'إقامة فندقية وخدمات ضيافة', 'high'
    if re.search(r'قاعة.*أفراح|قاعة.*مناسبات|مناسبات|أفراح', text):
        return 'قاعة مناسبات وأفراح', True, 'قاعة لإقامة المناسبات والاحتفالات', 'high'
    if re.search(r'مشتل|زهور|نباتات.*زينة|شجر|landscape', text):
        return 'مشتل زهور ونباتات زينة', True, 'مشتل زهور ونباتات زينة وتنسيق حدائق', 'high'
    if re.search(r'محطة.*وقود|بنزينة|بنزين|غاز.*طبيعي|gas.*station', text):
        return 'محطة وقود وغاز طبيعي', True, 'محطة تموين وقود وغاز وخدمات سيارات', 'high'
    if re.search(r'خيرية|جمعية|مؤسسة|أيتام|تنمية.*مجتمع', text):
        return 'جمعية خيرية ومؤسسة أهلية', True, 'عمل خيري ومبادرات مجتمعية أهلية', 'high'

    # Check if already official
    if current_cat in OFFICIAL_CATEGORIES:
        return current_cat, False, 'التصنيف معتمد ومطابق للنشاط', 'high'

    if 'شركة' in clean_name or 'group' in clean_name or 'co' in clean_name:
        return 'شركة خدمات وتجارة عامة', True, 'نشاط تجاري واستثماري للشركات', 'medium'

    return 'نشاط تجاري / خدمي آخر', True, 'تصنيف خدمي وتجاري معتمد عام يحتاج تدقيق إضافي', 'low'


# =========================================================================
# 2. DYNAMIC, ORIGINAL ARABIC DESCRIPTION GENERATOR
# =========================================================================

def generate_original_description(business, category):
    name = business.get('name_ar') or business.get('name_en') or 'المنشأة'
    city = business.get('city') or business.get('governorate') or 'مصر'
    street = business.get('street') or ''
    loc_str = f"في {city}" + (f" ({street})" if street and len(street) < 35 else "")
    display_name = re.sub(r'[\u200e\u200f\ufeff]', '', name).strip()
    cat = category

    if 'مطعم' in cat or 'مأكولات' in cat:
        return (
            f"يستقبل {display_name} رواده {loc_str} بأجواء دافئة وتجربة طعام متكاملة، "
            f"حيث تتناغم الأطباق الشهية المحضرة بعناية مع المكونات الطازجة والنكهات الغنية التي تلبي تطلعات عشاق المذاق الأصيل. "
            f"يعد المكان وجهة مثالية للعائلات وتجمعات الأصدقاء الباحثين عن جلسات مريحة وخدمة تتسم بالسرعة والاهتمام بأدق التفاصيل."
        )
    elif 'كافيه' in cat or 'مقهى' in cat:
        return (
            f"يشكل {display_name} {loc_str} مساحة هادئة للاسترخاء واللقاءات الودية، "
            f"مقدماً تشكيلة متميزة من مشروبات القهوة المتخصصة والعصائر الطازجة والحلويات الخفيفة في أجواء راقية تبعث على الراحة. "
            f"يناسب الكافيه محبي إنجاز الأعمال والدراسة وأولئك الذين يتطلعون لقضاء وقت ممتع وسط ديكورات أنيقة وموسيقى ملهمة."
        )
    elif 'مخبز' in cat or 'حلواني' in cat:
        return (
            f"يقدم {display_name} {loc_str} تشكيلة طازجة يومياً من المخبوزات والحلويات الشرقية والغربية والمعجنات المتقنة الصنع، "
            f"معتمداً على مقادير عالية الجودة وخبرة متوارثة في إعداد النكهات اللذيذة والتورتات المناسبة لكافة الاحتفالات. "
            f"يجد فيه سكان المنطقة وزوارها خياراً مفضلاً لافتتاح يومهم بإفطار شهي أو تلبية متطلبات مناسباتهم العائلية السعيدة."
        )
    elif 'صيدلية' in cat:
        return (
            f"توفر {display_name} {loc_str} منظومة رعاية صيدلانية متكاملة تشمل صرف الروشتات وتوفير الأدوية والمستلزمات الطبية ومستحضرات العناية الشخصية، "
            f"مع إيلاء عناية خاصة لتقديم استشارات دوائية دقيقة وإرشادات صحية موثوقة تسهم في راحة المراجعين وسلامتهم. "
            f"تعد الصيدلية وجهة موثوقة لأهالي المنطقة لتلبية احتياجاتهم الصحية والعلاجية على مدار الساعة باهتمام ومهنية."
        )
    elif 'عيادة' in cat or 'مركز تخصصي' in cat or 'مركز طبي' in cat:
        return (
            f"يركز {display_name} {loc_str} على تقديم خدمات طبية واستشارية متخصصة وفق أعلى معايير الجودة والتعقيم الطبي، "
            f"من خلال نخبة من الكوادر الطبية المتمرسة والتجهيزات الحديثة التي تضمن دقة التشخيص وسلامة الخطة العلاجية للمراجعين. "
            f"يوفر المركز بيئة هادئة ومريحة تمنح المريض وأسرته طمأنينة تامة ومتابعة صحية دقيقة وشاملة في كافة مراحل العلاج."
        )
    elif 'معمل' in cat or 'أشعة' in cat:
        return (
            f"يتميز {display_name} {loc_str} بتقديم خدمات الفحوصات والتشخيص الطبي بأحدث الأجهزة والتقنيات المعملية المتطورة، "
            f"مما يضمن سرعة الحصول على نتائج دقيقة ومعتمدة تساند الأطباء والمراجعين في اتخاذ القرارات العلاجية الصائبة. "
            f"يلتزم المركز بأعلى معايير الدقة والسرية لتقديم تجربة فحص مريحة وخالية من التوتر لكافة الفئات العمرية."
        )
    elif 'مغسلة سيارات' in cat or 'ديتيلينج' in cat:
        return (
            f"يقدم {display_name} {loc_str} خدمات احترافية متكاملة في غسيل وتلميع وتنظيف السيارات وحمايتها بنظم الديتيلينج الحديثة، "
            f"معتمداً على خامات ومواد تنظيف معتمدة وأجهزة بخار متطورة تعيد للمركبة بريقها الداخلي والخارجي. "
            f"يعد المركز وجهة مفضلة لعشاق العناية بالسيارات للحفاظ على مظهر سياراتهم وحمايتها من العوامل الجوية بعناية فائقة."
        )
    elif 'سيارات' in cat or 'ميكانيكا' in cat or 'زيوت' in cat or 'كاوتش' in cat or 'قطع غيار' in cat:
        return (
            f"يعد {display_name} {loc_str} مقصداً احترافياً لأصحاب المركبات الباحثين عن خدمات فحص وصيانة دورية عالية الكفاءة وتوفير قطع الغيار الأصلية، "
            f"حيث يعتمد على أحدث أجهزة الكشف وفنيين أصحاب خبرة لتشخيص الأعطال وتوفير الحلول الهندسية المناسبة لضمان سلامة القيادة على الطريق. "
            f"يحظى المكان بثقة رواده لما يقدمه من دقة في مواعيد التسليم وشفافية في التعامل والاهتمام بالأداء العام للسيارة."
        )
    elif 'حلاقة' in cat:
        return (
            f"يمنح {display_name} {loc_str} رواده تجربة حلاقة وعناية شخصية رجالية متكاملة، "
            f"تجمع بين أحدث صيحات قصات الشعر وتشذيب اللحى وجلسات العناية بالبشرة في بيئة عصرية نظيفة ومريحة. "
            f"يحرص الصالون على استخدام أدوات معقمة ومستحضرات عالية الجودة لتوفير مظهر أنيق وجذاب يعكس ثقة واعتناء الزائر بمظهره."
        )
    elif 'بيوتي سنتر' in cat or 'كوافير' in cat:
        return (
            f"يقدم {display_name} {loc_str} باقة فاخرة من خدمات التجميل والعناية النسائية الشاملة، "
            f"بدءاً من تصفيف وصبغ الشعر وعلاجات البشرة والأظافر وحتى تجهيز العرائس بأحدث لمسات الميكب الاحترافي المتقن. "
            f"تستمتع الزائرات بأجواء من الخصوصية والراحة التامة بإشراف خبيرات متميزات يحرصن على إبراز الجمال الطبيعي بأرقى المستحضرات العالمية."
        )
    elif 'جيم' in cat or 'لياقة' in cat:
        return (
            f"يوفر {display_name} {loc_str} بيئة رياضية حماسية ومجهزة بأحدث الأجهزة والمعدات الرياضية المتكاملة، "
            f"التي تدعم المتدربين في الوصول لأهدافهم البدنية سواء في بناء العضلات، زيادة اللياقة، أو إنقاص الوزن بإشراف مدربين مؤهلين. "
            f"يعد الجيم وجهة مثالية للشباب والرياضيين الراغبين في اتباع نمط حياة صحي ونشط ضمن مجتمع رياضي مشجع ومحفز."
        )
    elif 'ملابس' in cat or 'أحذية' in cat or 'مجوهرات' in cat:
        return (
            f"يتألق {display_name} {loc_str} بتقديم تشكيلات مميزة من الأزياء والمنتجات المنتقاة التي تواكب أحدث خطوط الموضة والأناقة، "
            f"حيث يجمع بين جودة الخامات ودقة التصنيع والتصاميم الراقية التي ترضي مختلف الأذواق في كل مناسبة. "
            f"يستمتع الزوار بتجربة تسوق ممتعة وسلسة وسط خيارات متعددة تناسب الإطلالة اليومية والرسمية على حد سواء."
        )
    elif 'سوبر ماركت' in cat or 'هايبر' in cat:
        return (
            f"يلبي {display_name} {loc_str} كافة الاحتياجات اليومية للأسرة من خلال توفير تشكيلة شاملة من السلع الغذائية والمنتجات الاستهلاكية الطازجة والمعلبة، "
            f"مع الحفاظ على تنوع الأصناف وسهولة التسوق وجودة التخزين لتقديم أفضل تجربة شراء لسكان المنطقة. "
            f"يعد المتجر خياراً موثوقاً لقضاء المشتريات المنزلية بسرعة وسلاسة مع خدمات مميزة تلبي تطلعات رواده باستمرار."
        )
    elif 'هواتف' in cat or 'كمبيوتر' in cat or 'إلكترونيات' in cat:
        return (
            f"يقدم {display_name} {loc_str} أحدث حلول التكنولوجيا والأجهزة الإلكترونية وإكسسواراتها الأصلية، "
            f"بالإضافة إلى خدمات الفحص والصيانة الفنية الدقيقة المعتمدة لضمان استعادة كفاءة الأجهزة وأدائها المثالي. "
            f"يجد فيه العملاء دعماً فنياً موثوقاً وإرشادات عملية لاختيار الأنسب لاحتياجاتهم الرقمية وشخصياتهم العملية."
        )
    elif 'مكتبة' in cat or 'طباعة' in cat:
        return (
            f"تعد {display_name} {loc_str} مركزاً متكاملاً للخدمات الطلابية والمكتبية وطباعة وتصوير المستندات بدقة وسرعة، "
            f"إلى جانب توفير تشكيلة واسعة من الأدوات المدرسية والقرطاسية والكتب التي تلبي متطلبات الدارسين والمهنيين على حد سواء. "
            f"تحظى المكتبة بتقدير روادها لما تقدمه من سرعة في الإنجاز وتوافر كافة المستلزمات المكتبية بجودة ممتازة."
        )
    elif 'أثاث' in cat or 'ديكور' in cat or 'مفروشات' in cat:
        return (
            f"يعرض {display_name} {loc_str} مجموعة راقية ومتنوعة من الأثاث المنزلي والمفروشات والتصميمات الديكورية التي تجمع بين الراحة والجمال العصري، "
            f"مساعداً العملاء على تجديد مساحاتهم الخاصة وحجراتهم بقطع متناسقة تضفي لمسة من الأناقة والدفء. "
            f"يوفر المعرض حلولاً ذكية ومتنوعة تناسب مختلف المساحات والأنماط المعمارية لتأثيث متكامل ومتقن."
        )
    elif 'مقاولات' in cat or 'تشطيبات' in cat or 'ألوميتال' in cat:
        return (
            f"يتخصص {display_name} {loc_str} في تنفيذ أعمال التشطيبات والديكور والمقاولات بأعلى معايير الإتقان والدقة الفنية، "
            f"مع الالتزام بالمعايير الهندسية والمواعيد المحددة لتقديم مخرجات تليق بتطلعات العملاء في منشآتهم ومنازلهم. "
            f"يعتمد النشاط على فريق فني محترف يضمن متانة التنفيذ واستخدام أفضل الخامات لتحقيق أعلى مستويات الرضا والاستدامة."
        )
    else:
        return (
            f"يقدم {display_name} {loc_str} خدمات احترافية تلبي احتياجات العملاء والرواد بجودة وموثوقية عالية، "
            f"مركّزاً على تقديم تجربة تعامل مريحة ومبنية على الشفافية والاهتمام بمتطلبات المتعاملين اليومية والتجارية. "
            f"يعد النشاط من العلامات الخدمية البارزة في منطقته التي توفر الدعم اللازم والحلول المتقنة لجمهوره."
        )


# =========================================================================
# 3. ADVANCED IMAGE ENHANCEMENT & WEBP CONVERTER
# =========================================================================

def process_and_enhance_image(raw_bytes, target_aspect=1.6):
    orig_size = len(raw_bytes)
    img = Image.open(io.BytesIO(raw_bytes)).convert('RGB')
    w, h = img.size
    orig_dim = (w, h)

    # 1. 16:10 Smart Crop
    cur_aspect = w / h
    if cur_aspect > target_aspect:
        new_w = int(h * target_aspect)
        left = max(0, (w - new_w) // 2)
        img = img.crop((left, 0, left + new_w, h))
    else:
        new_h = int(w / target_aspect)
        diff = h - new_h
        top = int(diff * 0.35)
        img = img.crop((0, top, w, top + new_h))

    # 2. Resampling & Standardization
    if img.width > 1280:
        img = img.resize((1280, 800), Image.Resampling.LANCZOS)
    elif img.width < 750:
        img = img.resize((960, 600), Image.Resampling.LANCZOS)

    new_dim = (img.width, img.height)

    # 3. Optical Enhancement
    img = ImageOps.autocontrast(img, cutoff=0.5)
    enh_col = ImageEnhance.Color(img)
    img = enh_col.enhance(1.08)
    enh_con = ImageEnhance.Contrast(img)
    img = enh_con.enhance(1.05)
    img = img.filter(ImageFilter.UnsharpMask(radius=1.5, percent=115, threshold=3))

    # 4. WebP Compression
    out_buf = io.BytesIO()
    img.save(out_buf, format='WEBP', quality=85, method=6)
    webp_bytes = out_buf.getvalue()
    webp_size = len(webp_bytes)

    reduction = round(100.0 * (1.0 - (webp_size / orig_size)), 1) if orig_size > 0 else 0
    return webp_bytes, orig_dim, new_dim, reduction


# =========================================================================
# 4. SUPABASE STORAGE & DATABASE CLIENT HELPERS
# =========================================================================

def upload_webp_to_supabase(webp_bytes, filename):
    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/photos/{filename}"
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
        'Content-Type': 'image/webp',
        'x-upsert': 'true'
    }
    req = urllib.request.Request(url, data=webp_bytes, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            if resp.status in [200, 201]:
                return f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/photos/{filename}"
    except Exception as e:
        print(f"    [Error uploading to Supabase Storage]: {e}")
    return None


def patch_business_to_supabase(biz_id, payload):
    url = f"{SUPABASE_URL}/rest/v1/businesses?id=eq.{urllib.parse.quote(biz_id)}"
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    }
    data = json.dumps(payload, ensure_ascii=False).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=headers, method='PATCH')
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return resp.status in [200, 204]
    except Exception as e:
        print(f"    [Error patching business in Supabase {biz_id}]: {e}")
        return False


# =========================================================================
# 5. SINGLE ACTIVITY WORKER FOR MULTI-THREADING
# =========================================================================

def process_single_business(biz):
    biz_id = biz['id']
    name = biz.get('name_ar') or biz.get('name_en') or ''
    orig_cat = biz.get('category') or ''
    orig_desc = biz.get('description') or ''
    photos = biz.get('photos') or []

    if isinstance(photos, str):
        try:
            photos = json.loads(photos)
        except Exception:
            photos = [photos] if photos.strip() else []

    # 1. Category resolution
    resolved_cat, cat_changed, cat_reason, confidence = audit_and_resolve_category(name, orig_cat, orig_desc)
    cat_entry = None
    if cat_changed:
        cat_entry = {
            'id': biz_id,
            'name': name,
            'old_category': orig_cat,
            'new_category': resolved_cat,
            'reason': cat_reason,
            'confidence': confidence
        }
    review_entry = None
    if confidence == 'low':
        review_entry = {
            'id': biz_id,
            'name': name,
            'category': resolved_cat,
            'reason': 'تصنيف عام يحتاج مراجعة بشرية لتحديد التخصص الدقيق'
        }

    # 2. Original Description
    new_desc = generate_original_description(biz, resolved_cat)

    # 3. Photos
    enhanced_photos = []
    enhanced_entries = []
    manual_img_entries = []

    for p_idx, photo_url in enumerate(photos):
        if not photo_url or not isinstance(photo_url, str):
            continue

        if 'business-media/photos/enhanced_' in photo_url and photo_url.endswith('.webp'):
            enhanced_photos.append(photo_url)
            continue

        try:
            raw_bytes = None
            file_ext = 'jpg'

            if photo_url.startswith('data:'):
                header, b64_data = photo_url.split(';base64,')
                import base64
                raw_bytes = base64.b64decode(b64_data)
                file_ext = 'png' if 'png' in header else 'jpg'
            elif photo_url.startswith('http://') or photo_url.startswith('https://'):
                req = urllib.request.Request(photo_url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=15) as img_resp:
                    raw_bytes = img_resp.read()
                    if 'png' in photo_url:
                        file_ext = 'png'
                    elif 'webp' in photo_url:
                        file_ext = 'webp'

            if not raw_bytes or len(raw_bytes) < 100:
                manual_img_entries.append({
                    'biz_id': biz_id,
                    'name': name,
                    'photo_url': photo_url,
                    'reason': 'الصورة فارغة أو تعذر تنزيلها'
                })
                enhanced_photos.append(photo_url)
                continue

            raw_filename = f"{biz_id}_{p_idx}.{file_ext}"
            raw_backup_path = os.path.join(RAW_BACKUP_DIR, raw_filename)
            with open(raw_backup_path, 'wb') as rf:
                rf.write(raw_bytes)

            webp_bytes, orig_dim, new_dim, reduction = process_and_enhance_image(raw_bytes)
            webp_filename = f"enhanced_{biz_id}_{p_idx}.webp"
            public_cdn_url = upload_webp_to_supabase(webp_bytes, webp_filename)

            if public_cdn_url:
                enhanced_photos.append(public_cdn_url)
                enhanced_entries.append({
                    'biz_id': biz_id,
                    'name': name,
                    'orig_dim': orig_dim,
                    'enhanced_dim': new_dim,
                    'orig_bytes': len(raw_bytes),
                    'webp_bytes': len(webp_bytes),
                    'reduction_pct': reduction,
                    'cdn_url': public_cdn_url,
                    'backup_file': raw_backup_path
                })
            else:
                enhanced_photos.append(photo_url)

        except Exception as e:
            manual_img_entries.append({
                'biz_id': biz_id,
                'name': name,
                'photo_url': photo_url,
                'reason': f"خطأ أثناء المعالجة: {str(e)}"
            })
            enhanced_photos.append(photo_url)

    # 4. Patch to Supabase
    biz_updates = {
        'category': resolved_cat,
        'description': new_desc,
        'photos': enhanced_photos
    }
    patch_ok = patch_business_to_supabase(biz_id, biz_updates)

    return {
        'biz_id': biz_id,
        'name': name,
        'category': resolved_cat,
        'description': new_desc,
        'photos': enhanced_photos,
        'patch_ok': patch_ok,
        'cat_entry': cat_entry,
        'review_entry': review_entry,
        'enhanced_entries': enhanced_entries,
        'manual_img_entries': manual_img_entries
    }


# =========================================================================
# 6. MAIN MULTI-THREADED PIPELINE
# =========================================================================

def run_full_review(workers=8, max_items=None):
    backup_file = 'backups/businesses_supabase_pre_audit_1789554750989.json'
    local_store_file = 'data/server_biz_store.json'
    registry_file = 'data/full_audit_registry.json'
    progress_file = 'data/audit_progress.json'

    with open(backup_file, 'r', encoding='utf-8') as f:
        all_businesses = json.load(f)

    target_businesses = [b for b in all_businesses if b.get('package_id') != 'pkg_interested_lead']
    if max_items:
        target_businesses = target_businesses[:max_items]

    total_count = len(target_businesses)
    print(f"🚀 Starting comprehensive concurrent review on {total_count} activities with {workers} workers...")

    completed_ids = set()
    if os.path.exists(progress_file):
        try:
            with open(progress_file, 'r', encoding='utf-8') as pf:
                p_data = json.load(pf)
                completed_ids = set(p_data.get('completed_ids', []))
                print(f"⚡ Resuming: {len(completed_ids)} already completed.")
        except Exception:
            pass

    local_store = []
    if os.path.exists(local_store_file):
        with open(local_store_file, 'r', encoding='utf-8') as lsf:
            local_store = json.load(lsf)
    local_map = {b['id']: b for b in local_store if 'id' in b}

    registry = {
        'start_timestamp': time.time(),
        'total_evaluated': total_count,
        'enhanced_photos': [],
        'corrected_categories': [],
        'manual_review_items': [],
        'manual_review_images': [],
        'errors': []
    }
    if os.path.exists(registry_file):
        try:
            with open(registry_file, 'r', encoding='utf-8') as rf:
                registry = json.load(rf)
        except Exception:
            pass

    to_process = [b for b in target_businesses if b['id'] not in completed_ids]
    processed_count = len(completed_ids)

    with ThreadPoolExecutor(max_workers=workers) as executor:
        future_to_biz = {executor.submit(process_single_business, b): b for b in to_process}

        for future in as_completed(future_to_biz):
            res = future.result()
            biz_id = res['biz_id']

            with file_lock:
                if res['cat_entry']:
                    registry['corrected_categories'].append(res['cat_entry'])
                if res['review_entry']:
                    registry['manual_review_items'].append(res['review_entry'])
                registry['enhanced_photos'].extend(res['enhanced_entries'])
                registry['manual_review_images'].extend(res['manual_img_entries'])
                if not res['patch_ok']:
                    registry['errors'].append({'biz_id': biz_id, 'step': 'supabase_patch'})

                # Update local map
                if biz_id in local_map:
                    local_map[biz_id]['category'] = res['category']
                    local_map[biz_id]['description'] = res['description']
                    local_map[biz_id]['photos'] = res['photos']
                else:
                    b_copy = dict(future_to_biz[future])
                    b_copy['category'] = res['category']
                    b_copy['description'] = res['description']
                    b_copy['photos'] = res['photos']
                    local_store.append(b_copy)
                    local_map[biz_id] = b_copy

                completed_ids.add(biz_id)
                processed_count += 1

                print(f"[{processed_count}/{total_count}] ✅ {res['name']} -> {res['category']} | صور: {len(res['photos'])}")

                # Checkpoint every 20 items
                if processed_count % 20 == 0 or processed_count == total_count:
                    with open(local_store_file, 'w', encoding='utf-8') as lsf:
                        json.dump(list(local_map.values()), lsf, ensure_ascii=False, indent=2)
                    with open(progress_file, 'w', encoding='utf-8') as pf:
                        json.dump({'completed_ids': list(completed_ids), 'timestamp': time.time()}, pf, indent=2)
                    with open(registry_file, 'w', encoding='utf-8') as rf:
                        json.dump(registry, rf, ensure_ascii=False, indent=2)
                    print(f"  💾 [حفظ التقدّم التلقائي: {processed_count}/{total_count}]")

    # Final persist
    with open(local_store_file, 'w', encoding='utf-8') as lsf:
        json.dump(list(local_map.values()), lsf, ensure_ascii=False, indent=2)
    with open(progress_file, 'w', encoding='utf-8') as pf:
        json.dump({'completed_ids': list(completed_ids), 'timestamp': time.time()}, pf, indent=2)
    with open(registry_file, 'w', encoding='utf-8') as rf:
        json.dump(registry, rf, ensure_ascii=False, indent=2)

    print("\n🎉 اكتملت المراجعة والتحسين الشامل لكافة الأنشطة بنجاح تام!")
    print(f"  - إجمالي الأنشطة المعالجة: {processed_count}")
    print(f"  - التصنيفات المصححة: {len(registry['corrected_categories'])}")
    print(f"  - الصور المحسنة إلى WebP: {len(registry['enhanced_photos'])}")
    print(f"  - عناصر المراجعة البشرية: {len(registry['manual_review_items'])}")
    print(f"  - الصور التي تعذر تحسينها: {len(registry['manual_review_images'])}")

if __name__ == '__main__':
    workers_count = 8
    max_count = None
    if len(sys.argv) > 1:
        val = int(sys.argv[1])
        max_count = val if val > 0 else None
    if len(sys.argv) > 2:
        workers_count = int(sys.argv[2])
    run_full_review(workers=workers_count, max_items=max_count)
