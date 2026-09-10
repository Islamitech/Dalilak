import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  MapPin, 
  Globe, 
  Share2, 
  Camera, 
  TrendingUp, 
  Crown, 
  Zap, 
  Clock, 
  HelpCircle, 
  Layers, 
  Check, 
  X,
  FileText,
  Smartphone,
  ShieldCheck,
  Award,
  Users,
  Building2,
  MessageCircle,
  Rocket,
  Gift,
  Palette,
  Megaphone,
  QrCode,
  Store,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { PACKAGES, FREE_DIRECTORY_SERVICE } from '../data/mockData';

interface PackagesHubProps {
  initialPackageId?: string;
  onSelectPackage?: (packageTitle: string) => void;
  onClose?: () => void;
}

export const PackagesHub: React.FC<PackagesHubProps> = ({
  initialPackageId = 'pkg_basic',
  onSelectPackage,
  onClose
}) => {
  const [selectedPkgId, setSelectedPkgId] = useState<string>(initialPackageId || 'pkg_basic');
  const [categoryTab, setCategoryTab] = useState<'all' | 'essential' | 'growth' | 'enterprise'>('all');
  const detailsRef = useRef<HTMLDivElement>(null);
  const packagesGridRef = useRef<HTMLDivElement>(null);

  const detailedPackages = [
    {
      id: 'pkg_basic',
      shortName: 'التوثيق الأساسي (250 ج)',
      title: 'باقة التوثيق الأساسي وتصدر Google',
      englishTitle: 'Basic Google Maps Verification',
      price: 250,
      priceLabel: '250 جنيه',
      priceSubtext: 'سداد لمرة واحدة + هدية QR',
      badge: 'توثيق رسمي 📍',
      badgeColor: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40',
      cardBorder: 'hover:border-blue-500/60',
      activeBorder: 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-500/5 dark:bg-blue-950/30',
      icon: MapPin,
      iconBg: 'from-blue-600 to-cyan-500 text-white',
      accentColor: 'text-blue-500',
      summary: 'التفعيل الميداني الرسمي لمنشأتكم ومكانكم على خرائط جوجل مع تثبيت الإحداثيات والبيانات الأساسية وملصق QR.',
      deliveryTime: '24 - 48 ساعة عمل',
      targetAudience: 'المحلات والمنشآت التي تحتاج لظهور رسمي فوري وموثق على خرائط جوجل لسهولة وصول الزبائن وتوصيل الطلبات.',
      highlights: [
        'تثبيت الموقع الجغرافي الدقيق بنظام GPS',
        'رفع اللوجو وصور الواجهة ومقر المكان بجودة عالية',
        'إضافة أرقام الهواتف ومواعيد العمل الرسمية المعتمدة',
        'إصدار فاتورة إلكترونية معتمدة برمز QR مع مشاركة واتساب',
        '🎁 هدية خاصة: ملصق باركود QR Code احترافي جاهز للطباعة'
      ],
      featuresIncluded: [
        { name: 'التفعيل الميداني الرسمي على خرائط Google', desc: 'تثبيت مكان محلك بنقطة جغرافية دقيقة تظهر لجميع الباحثين في منطقتك ومحيطك.' },
        { name: 'ضبط بيانات التواصل وساعات العمل', desc: 'إضافة رقم التليفون، الواتساب، وأوقات الفتح والإغلاق طوال أيام الأسبوع.' },
        { name: 'رفع الشعار والواجهة والمنتجات', desc: 'إضافة صور عالية الجودة لواجهة المحل ومنتجاتك لجذب الزبائن.' },
        { name: 'فاتورة إلكترونية معتمدة ومشاركة WhatsApp', desc: 'إصدار رابط وفاتورة رسمية فورية يمكن مشاركتها وتنزيلها.' },
        { name: 'هدية خاصة: ملصق باركود QR Code', desc: 'تصميم ملصق باركود مخصص لموقع مكانكم جاهز للطباعة والتعليق في واجهة المحل.' }
      ],
      idealPractices: [
        '💡 الممارسة المثالية: تزويد المندوب بأرقام هواتف نشطة طوال اليوم وتحديد مواعيد العمل بدقة.',
        '📸 نصيحة الصور: تجهيز صورة واضحة للواجهة بدون عوائق مع لافتة المحل التجارية.'
      ]
    },
    {
      id: 'pkg_pro',
      shortName: 'التأسيس والربط (750 ج)',
      title: 'عرض التأسيس والربط الذكي',
      englishTitle: 'Pro Setup & Smart Growth',
      price: 750,
      priceLabel: '750 جنيه',
      priceSubtext: 'توثيق + سوشيال ميديا + 3 أيام دعم',
      popular: true,
      badge: 'الأكثر طلباً ⭐',
      badgeColor: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40',
      cardBorder: 'hover:border-emerald-500/60',
      activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/30',
      icon: Zap,
      iconBg: 'from-emerald-600 to-teal-500 text-white',
      accentColor: 'text-emerald-500',
      summary: 'توثيق جوجل + تأسيس وتجهيز صفحات المنصات الاجتماعية وتصميم الإعلانات وهوية العرض مع متابعة 3 أيام.',
      deliveryTime: '3 أيام عمل مع مرافقة حية',
      targetAudience: 'المحلات والشركات الراغبة في انطلاقة رقمية قوية، زيادة المبيعات، وبناء هوية تسويقية تجذب العملاء الجدد.',
      highlights: [
        'كل مميزات باقة التوثيق الأساسي على خرائط جوجل',
        'كتابة وصف تسويقي احترافي وتحسين الكلمات المفتاحية (SEO)',
        'تأسيس صفحات فيسبوك والمنصات بهوية بصرية مميزة',
        'تصميم إعلان احترافي وطريقة عرض البضائع والمنتجات',
        'متابعة ومرافقة ودعم تسويقي خطوة بخطوة لمدة 3 أيام'
      ],
      featuresIncluded: [
        { name: 'التوثيق الميداني الشامل على Google Maps', desc: 'توثيق رسمي وتثبيت معتمد مع تهيئة محركات البحث الموضعية.' },
        { name: 'تحسين محركات البحث والكلمات المفتاحية (SEO)', desc: 'صياغة اسم ووصف المحل بالكلمات التي يبحث عنها أهالي المنطقة لتتصدر النتائج.' },
        { name: 'تأسيس وبناء صفحات التواصل الاجتماعي', desc: 'إنشاء وضبط صفحات فيسبوك والمنصات باسم وهوية بصرية متناسقة مع هويتكم ومكانكم.' },
        { name: 'تصميم إعلان وطريقة عرض البضائع', desc: 'تصميمات إعلانية جذابة لعرض المنتجات بطريقة تشد انتباه الزبائن.' },
        { name: 'مرافقة وتوجيه لمدة 3 أيام', desc: 'فريق العمل يرافقك لمدة 3 أيام للرد على الاستفسارات ومساعدتك في نشر أولى العروض.' },
        { name: 'استشارات وزيادة اتصالات العملاء', desc: 'توجيهات عملية ونماذج فعالة لتحويل استفسارات المتصلين إلى مبيعات فورية.' }
      ],
      idealPractices: [
        '💡 الشرط الأساسي: معرفة صاحب المكان أو من ينوب عنه باستخدام تطبيقات الموبايل لتحقيق أفضل نتائج.',
        '🎯 نصيحة المبيعات: الاستفادة من تصاميم الإعلانات لنشر عروض افتتاح أو خصومات موسمية.'
      ]
    },
    {
      id: 'pkg_reputation',
      shortName: 'درع السمعة (950 ج)',
      title: 'باقة درع السمعة والمراجعات الموثقة',
      englishTitle: 'Reputation Shield & Verified Reviews',
      price: 950,
      priceLabel: '950 جنيه',
      priceSubtext: 'حماية السمعة + تقييمات 5 نجوم',
      badge: 'حماية السمعة 🛡️',
      badgeColor: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/40',
      cardBorder: 'hover:border-indigo-500/60',
      activeBorder: 'border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-500/5 dark:bg-indigo-950/30',
      icon: ShieldCheck,
      iconBg: 'from-indigo-600 to-violet-500 text-white',
      accentColor: 'text-indigo-500',
      summary: 'حماية وتطوير السمعة الرقمية للمنشأة، معالجة الملاحظات، وتحفيز الزبائن الحقيقيين على كتابة مراجعات إيجابية موثقة.',
      deliveryTime: '5 - 7 أيام عمل',
      targetAudience: 'العيادات، المطاعم، المتاجر والأنشطة الخدمية التي تعتمد على ثقة الزبائن ومراجعات محركات البحث.',
      highlights: [
        'فحص شامل لملف النشاط على Google ومعالجة الملاحظات وحماية التقييم العام',
        'منظومة ذكية لتوجيه العملاء الراضين لكتابة تقييمات إيجابية موثقة',
        'معالجة الشكاوى بهدوء عبر قنوات داخلية قبل تحولها لتقييمات سلبية عامة',
        'توفير كروت وملصقات ذكية سريعة للوصول لصفحة التقييم في ثوانٍ',
        'صياغة نماذج ردود رسمية ومهنية تعكس رقي التعامل وتزيد ثقة الزوار الجدد'
      ],
      featuresIncluded: [
        { name: 'فحص ملف جوجل وحماية التقييم العام', desc: 'مراجعة كافة تقييمات العملاء وحماية التقييم العام للمكان ومعالجة الملاحظات بهدوء.' },
        { name: 'منظومة جمع التقييمات الإيجابية الذكية', desc: 'آلية مخصصة تيسر على عملائك الفعليين ترك تجاربهم الإيجابية بسهولة وسرعة.' },
        { name: 'كروت وملصقات باركود سريعة للتقييم', desc: 'تصميم ملصق وكارت مخصص للمحل يوجه كاميرا هاتف العميل مباشرة لكتابة التقييم.' },
        { name: 'صياغة قوالب الردود المهنية', desc: 'نماذج جاهزة واحترافية للرد على استفسارات وتقييمات العملاء بأسلوب يعكس رقي التعامل.' },
        { name: 'تقرير سمعة ومصداقية المكان', desc: 'تقرير مفصل بتطور مستوى التفاعل ورضا العملاء وأبرز الإيجابيات لتعزيزها.' }
      ],
      idealPractices: [
        '💡 نصيحة التقييم: تشجيع الموظفين على إهداء كارت التقييم للعميل فور شعوره بالرضا عن الخدمة أو المنتج.',
        '⭐ قاعدة ذهبية: التقييمات الإيجابية الحقيقية المستمرة هي العامل رقم 1 لترشيح نشاطك للمستخدمين الجدد.'
      ]
    },
    {
      id: 'pkg_reels',
      shortName: 'فيديو ريلز (1,250 ج)',
      title: 'باقة فيديو ريلز والانتشار السريع',
      englishTitle: 'Reels & Fast Viral Growth',
      price: 1250,
      priceLabel: '1,250 جنيه',
      priceSubtext: 'فيديوهات ريلز + إعلان جغرافي',
      badge: 'انتشار سريع 🎬',
      badgeColor: 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40',
      cardBorder: 'hover:border-rose-500/60',
      activeBorder: 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-500/5 dark:bg-rose-950/30',
      icon: Camera,
      iconBg: 'from-rose-600 to-pink-500 text-white',
      accentColor: 'text-rose-500',
      summary: 'إنتاج محتوى مرئي قصير جذاب (Reels & TikTok) يبرز أقوى منتجاتك مع تجهيز حملة إعلانية تستهدف سكان منطقتك.',
      deliveryTime: '3 - 5 أيام عمل',
      targetAudience: 'المطاعم، الكافيهات، محلات الملابس، صالونات التجميل وكل نشاط يعتمد على الجاذبية البصرية المباشرة.',
      highlights: [
        'إنتاج مقطعي فيديو قصيرين (2 Reels / TikTok) بمونتاج عصري خاطف',
        'صياغة سكريبت جذاب ومقدمة خاطفة لشد انتباه المتابع خلال أول 3 ثوانٍ',
        'تصميم أغلفة لافتة واختيار الهاشتاجات الأكثر تداولاً وتفاعلاً',
        'إعداد وضبط حملة ترويجية جغرافية لسكان النطاق المحيط بمقرك',
        'إرشادات استثمار الفيديو على قصص الواتساب وفيسبوك لتعظيم المشاهدات'
      ],
      featuresIncluded: [
        { name: 'إنتاج مقاطع ريلز احترافية قصيرة', desc: 'مونتاج عالي الجودة متوافق مع خوارزميات إنستغرام وتيك توك وفيسبوك ريلز.' },
        { name: 'صياغة السيناريو والعرض الترويجي', desc: 'كتابة سكريبت ترويجي جذاب يركز على العرض والميزة التي لا تقاوم للمكان.' },
        { name: 'تصميم بوسترات وأغلفة الفيديو', desc: 'أغلفة مخصصة تجعل الفيديو بارزاً وتزيد نسبة النقر والمشاهدة.' },
        { name: 'ضبط الحملة الإعلانية الترويجية', desc: 'تحديد الفئات والاهتمامات وسكان المنطقة بدقة لتحقيق أعلى نسبة مشاهدة للمحل.' },
        { name: 'تسليم الملفات بدقة عالية', desc: 'استلام الفيديوهات بجودة أصلية جاهزة للاستخدام الدائم في أي وقت.' }
      ],
      idealPractices: [
        '💡 الممارسة المثالية: تزويدنا بأوضح لقطات للمنتجات الأكثر مبيعاً أو أكثرها تميزاً بصرياً.',
        '🚀 نصيحة الانتشار: مشاركة الريلز على مجموعات وحالات الواتساب في نفس توقيت نشر الإعلان.'
      ]
    },
    {
      id: 'pkg_vip',
      shortName: 'الإدارة والتسويق VIP (2,000 ج)',
      title: 'باقة الدعم والإدارة التسويقية الشاملة VIP',
      englishTitle: 'VIP Monthly Marketing Management',
      price: 2000,
      priceLabel: '2,000 جنيه / شهر',
      priceSubtext: 'إدارة شهرية متكاملة + دعم يومي',
      badge: 'إدارة شاملة VIP 👑',
      badgeColor: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40',
      cardBorder: 'hover:border-amber-500/60',
      activeBorder: 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-500/5 dark:bg-amber-950/30',
      icon: Crown,
      iconBg: 'from-amber-500 to-yellow-400 text-slate-950',
      accentColor: 'text-amber-500',
      summary: 'إدارة تسويقية ورقمية شاملة لمدة شهر كامل: تصميمات متجددة، إعداد الحملات الممولة، إدارة التقييمات، ومتابعة يومية مستمرة.',
      deliveryTime: 'شهر كامل (30 يوماً متابعة حية)',
      targetAudience: 'أصحاب الأعمال والمحلات المشغولين الذين يريدون فريقاً تسويقياً متكاملاً يتولى إدارة المنصات وضبط الحملات وتطوير المبيعات.',
      highlights: [
        'تصميم منشورات وبانرات إعلانية احترافية متجددة طوال الشهر',
        'معالجة وإعادة إخراج صور وفيديوهات المنتجات المرسلة من المحل بأحدث القوالب الجذابة',
        'جدولة ونشر المحتوى الترويجي وتنشيط الحضور الرقمي باستمرار',
        'إعداد وضبط الحملات الإعلانية الممولة جغرافياً لتقليل تكلفة الرسالة (ميزانية الإعلانات يحددها ويسددها العميل للمنصات مباشرة)',
        'إدارة التقييمات وصياغة الردود المهنية لتعزيز سمعة المنشأة ومصداقيتها أمام الجمهور',
        'دعم وتوجيه واستشارات تسويقية يومية مع صاحب العمل والموظفين لتطوير أساليب البيع',
        'ميزة التجديد المخفض بـ 1,000 ج فقط للشهور التالية'
      ],
      featuresIncluded: [
        { name: 'تصميم المنشورات والبانرات التسويقية', desc: 'تصميمات جرافيكية متناسقة مع هوية المحل لعرض المنتجات والعروض طوال الشهر.' },
        { name: 'إعداد واستهداف الحملات الإعلانية الممولة', desc: 'ضبط الإعلانات واستهداف سكان النطاق الجغرافي بأقل تكلفة للعميل (ميزانية الإعلانات يحددها ويسددها العميل للمنصات مباشرة حسب قدرته).' },
        { name: 'إعادة إنتاج مواد العرض البصرية', desc: 'تحسين ومعالجة صور وفيديوهات منتجاتكم وإبراز تفاصيلها للمشترين.' },
        { name: 'إدارة التقييمات ومراجعات العملاء', desc: 'متابعة تقييمات Google والردود المهنية لحماية وتنمية سمعة المكان.' },
        { name: 'دعم واستشارات تسويقية يومية', desc: 'تواصل ومتابعة يومية مع صاحب المكان لمراجعة المبيعات وتقديم حلول تطويرية.' },
        { name: 'ميزة التجديد بنصف السعر (1000 ج/شهر)', desc: 'بعد انتهاء الشهر الأول، يمكنك الاستمرار في إدارة المنظومة بـ 1000 ج فقط شهرياً.' }
      ],
      idealPractices: [
        '💡 الممارسة المثالية: إرسال صور وفيديوهات دورية للمنتجات الجديدة أو العروض لتوظيفها في التصميمات والنشر.',
        '🎯 نصيحة الإعلانات: البدء بميزانية تمويل يومية مدروسة وقياس نسبة الرسائل والاتصالات اليومية لتحقيق أعلى عائد.'
      ]
    },
    {
      id: 'pkg_smart_menu',
      shortName: 'المنيو والمتجر الذكي (3,500 ج)',
      title: 'باقة المنيو التفاعلي ومتجر الواتساب الذكي',
      englishTitle: 'Smart Menu & WhatsApp Store',
      price: 3500,
      priceLabel: '3,500 جنيه',
      priceSubtext: 'منيو رقمي + سلة واتساب بدون عمولات',
      badge: 'متجر ذكي 📱',
      badgeColor: 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/40',
      cardBorder: 'hover:border-cyan-500/60',
      activeBorder: 'border-cyan-500 ring-2 ring-cyan-500/30 bg-cyan-500/5 dark:bg-cyan-950/30',
      icon: Smartphone,
      iconBg: 'from-cyan-600 to-blue-500 text-white',
      accentColor: 'text-cyan-500',
      summary: 'منيو وكتالوج رقمي تفاعلي سريع وسلة طلبات مباشرة على واتساب المحل بدون عمولات وسيطة لتطبيقات التوصيل.',
      deliveryTime: '5 - 7 أيام عمل',
      targetAudience: 'المطاعم، الكافيهات، محلات الحلويات، السوبرماركت، والمتاجر التي تتلقى طلبات توصيل مستمرة.',
      highlights: [
        'تصميم وبرمجة منيو/كتالوج رقمي متكامل فائق السرعة عبر رمز QR',
        'سلة مشتريات ذكية ترسل تفاصيل أصناف الطلب والعنوان لواتساب المحل فوراً',
        'استقبال طلبات التوصيل المباشر وتوفير عمولات تطبيقات الطرف الثالث',
        'تصميم ستاندات وكروت كود QR جاهزة للطباعة والوضع على الطاولات والكاونتر',
        'ربط مباشر للمنيو بصفحة المكان على دليل منصة دليلك'
      ],
      featuresIncluded: [
        { name: 'منيو إلكتروني سريع متوافق مع كل الهواتف', desc: 'تصفح سلس وسريع بدون الحاجة لتحميل أي تطبيقات من العميل.' },
        { name: 'نظام سلة طلبات الواتساب الفورية', desc: 'العميل يختار أصنافه وتصله رسالة منظمة بتفاصيل طلبه وسعره وعنوانه على واتساب المحل بنقرة واحدة.' },
        { name: 'لوحة تحكم وتعديل مرنة للأسعار والأصناف', desc: 'إمكانية تحديث الأسعار، إضافة أصناف، أو تغيير التوافر بكل سهولة.' },
        { name: 'تصميم ستاندات وكروت QR للطاولات', desc: 'تصميمات بصرية أنيقة لوضع الباركود على الطاولات وكاونتر المكان.' },
        { name: 'توفير تكاليف وعمولات شركات التوصيل', desc: 'البيع المباشر لزبائنك يرفع أرباحك الصافية ويحافظ على ولاء عملائك.' }
      ],
      idealPractices: [
        '💡 الممارسة المثالية: وضع كود المنيو على كل طاولة لتقليل وقت انتظار الزبائن وتسريع طلب الأوردرات.',
        '🛵 نصيحة التوصيل: تفعيل عروض ترويجية حصرية لطلبات التوصيل عبر المنيو لبناء قاعدة زبائن خاصة بمحلك.'
      ]
    },
    {
      id: 'pkg_annual_partner',
      shortName: 'الشريك الماسي السنوي (6,000 ج)',
      title: 'باقة الشريك الماسي والظهور السنوي',
      englishTitle: 'Diamond Annual Featured Partner',
      price: 6000,
      priceLabel: '6,000 جنيه / سنوياً',
      priceSubtext: 'شراكة حصرية + تصدر دائم لمدة عام',
      badge: 'شريك ماسي سنوي 💎',
      badgeColor: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/40',
      cardBorder: 'hover:border-purple-500/60',
      activeBorder: 'border-purple-500 ring-2 ring-purple-500/30 bg-purple-500/5 dark:bg-purple-950/30',
      icon: Award,
      iconBg: 'from-purple-600 via-indigo-600 to-purple-800 text-white',
      accentColor: 'text-purple-500',
      summary: 'شراكة سنوية تضمن تصدر المنشأة لنتائج البحث في الدليل مع شارة التوثيق الذهبية وتحديث ربع سنوي طوال 12 شهراً.',
      deliveryTime: 'سنة كاملة (365 يوماً رعاية مستمرة)',
      targetAudience: 'الأنشطة الرائدة، البراندات، والمراكز الخدمية الكبرى التي تريد تصدر قطاعها ومنطقتها باستمرار طوال العام.',
      highlights: [
        'ظهور مثبت في صدارة نتائج البحث (Featured Top Result) بتصنيف المحافظة طوال العام',
        'منح شارة التوثيق الذهبية المعتمدة (Gold Certified) كأحد أبرز الخيارات الموصى بها',
        'تمييز علامة وشعار المكان على الخريطة التفاعلية للدليل للمستخدمين القريبين',
        'تحديث ربع سنوي شامل للصور، العروض، والمحتوى لمواكبة مواسم التسوق والأعياد',
        'أولوية استثنائية في الدعم الفني وتحديث البيانات السريع على مدار العام'
      ],
      featuresIncluded: [
        { name: 'تصدر دائم لنتائج البحث في الدليل', desc: 'يظهر مكانكم كأول نتيجة موصى بها في منطقتكم وتصنيفكم التجاري على مدار العام.' },
        { name: 'شارة الشريك الذهبي المعتمد', desc: 'علامة توثيق ذهبية تمنح الثقة التامة للعملاء وتضاعف معدل الاتصال والتواصل.' },
        { name: 'إبراز العلامة على الخريطة التفاعلية', desc: 'أيقونة مميزة وبارزة تلفت أنظار الباحثين على خريطة المحافظة والمنطقة.' },
        { name: 'تحديثات ربع سنوية موسمية (4 مرات بالعام)', desc: 'تجديد صور الواجهة، المنتجات، والعروض الخاصة في المواسم والأعياد.' },
        { name: 'دعم فني وتحديث بيانات فوري ذو أولوية قصوى', desc: 'خط دعم مباشر لتعديل ومتابعة أي بيانات في أي وقت خلال دقائق.' }
      ],
      idealPractices: [
        '💡 الممارسة المثالية: إبلاغ فريق الدعم بالعروض الموسمية قبل بدء الأعياد والمواسم بأسبوع لإبرازها في الصدارة.',
        '💎 الميزة التنافسية: الاستفادة من شارة التوثيق الذهبية كدليل ثقة وجودة في جميع موادك التسويقية.'
      ]
    },
    {
      id: 'pkg_corporate',
      shortName: 'الشركات والمشاريع الكبرى',
      title: 'باقة الشركات والمشاريع الكبرى',
      englishTitle: 'Corporate & Enterprise Solutions',
      price: 0,
      priceLabel: 'تسعير مخصص حسب متطلبات المشروع',
      priceSubtext: 'دراسة مخصصة للمشاريع والفروع والأنشطة تحت التجهيز',
      isFlagship: true,
      badge: 'حلول مؤسسية متكاملة 🏢',
      badgeColor: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black border-amber-300 shadow-md',
      cardBorder: 'hover:border-amber-400 border-amber-500/50',
      activeBorder: 'border-amber-400 ring-2 ring-amber-400/30 bg-gradient-to-br from-amber-500/10 via-[var(--bg-card)] to-yellow-500/5 shadow-2xl shadow-amber-500/20',
      icon: Building2,
      iconBg: 'from-amber-500 via-yellow-400 to-amber-600 text-slate-950',
      accentColor: 'text-amber-500',
      summary: 'حلول مؤسسية متكاملة للشركات، الفروع المتعددة، والأنشطة تحت التجهيز والإنشاء: بناء الهوية المؤسسية، التأسيس الرقمي، وإدارة حملات الافتتاح والانطلاق.',
      deliveryTime: 'وفق الجدول الزمني المحدد للمشروع',
      targetAudience: 'الشركات، السلاسل التجارية، الفروع المتعددة، والمنشآت تحت التجهيز والإنشاء التي تحتاج لحلول مخصصة متكاملة.',
      highlights: [
        'بناء وتطوير الهوية البصرية والمؤسسية المتكاملة والشعار بالملفات المفتوحة الكاملة',
        'تصميم الواجهات واللافتات والمطبوعات الميدانية وباقات التعبئة والتغليف',
        'تأسيس الحضور الرقمي لكافة فروع المنشأة وتوثيقها الرسمي على الخرائط ومحركات البحث',
        'إنتاج المحتوى والمواد المرئية وإدارة الحملات الإعلانية الموجهة للافتتاح',
        'بناء منظومات ولاء العملاء وتدريب فرق العمل والتشغيل على معايير المبيعات والمتابعة',
        'دراسة مخصصة وجلسة استشارية وتحديد خطة العمل والعرض المالي المناسب لحجم المشروع'
      ],
      featuresIncluded: [
        { name: 'بناء وتطوير الهوية البصرية والمؤسسية', desc: 'تصميم الشعار، دليل استخدام الهوية، والألوان والخطوط بجميع صيغ التصميم والطباعة.' },
        { name: 'تصميم الواجهات الخارجية والمطبوعات الميدانية', desc: 'تصورات هندسية للافتات المحل، المطبوعات الترويجية، كروت العمل، والأكياس والزي الموحد.' },
        { name: 'التأسيس الرقمي الموحد لجميع الفروع', desc: 'ربط وتوثيق كافة الفروع والمواقع على خرائط جوجل وحسابات المنصات الرسمية بدقة.' },
        { name: 'تخطيط وإدارة حملات الإطلاق والافتتاح', desc: 'خطة ترويجية متكاملة لضمان حضور وتفاعل قوي ومبيعات متصاعدة من اليوم الأول.' },
        { name: 'بناء أنظمة ولاء العملاء وتكرار الشراء', desc: 'تأسيس آليات رقمية لحفظ بيانات العملاء وتقديم العروض التفضيلية لهم دورياً.' },
        { name: 'تدريب فريق التشغيل وخدمة العملاء', desc: 'تأهيل وتدريب كوادر العمل على أساليب استقبال العملاء وزيادة متوسط حجم الفاتورة.' },
        { name: 'جلسة استشارية وعرض فني ومالي مخصص', desc: 'تحليل دقيق لمتطلبات المنشأة وتقديم خطة تنفيذية مخصصة تلائم ميزانية وأهداف النشاط.' }
      ],
      idealPractices: [
        '💡 الممارسة المثالية: حجز الجلسة الاستشارية في بدايات مرحلة التجهيز لتوحيد الرؤية البصرية والتسويقية قبل تدشين المكان.',
        '🤝 الشراكة المؤسسية: يتم تعيين مسؤول اتصال مخصص لمتابعة تنفيذ كافة مراحل الخطة وتسليم المخرجات بدقة.'
      ]
    }
  ];

  const selectedPkg = detailedPackages.find((p) => p.id === selectedPkgId) || detailedPackages[1];

  const comparisonRows = [
    {
      feature: 'ظهور المنشأة في دليل المنصة والمحافظة',
      basic: true,
      pro: true,
      vip: true,
      enterprise: true,
    },
    {
      feature: 'عرض أرقام التواصل وروابط الواتساب المباشرة',
      basic: true,
      pro: true,
      vip: true,
      enterprise: true,
    },
    {
      feature: 'التفعيل والتوثيق المعتمد على خرائط Google',
      basic: true,
      pro: true,
      vip: true,
      enterprise: true,
    },
    {
      feature: 'تثبيت إحداثيات الموقع بدقة GPS مع ساعات العمل',
      basic: true,
      pro: true,
      vip: true,
      enterprise: true,
    },
    {
      feature: 'ملصق باركود QR Code احترافي مخصص للمحل',
      basic: true,
      pro: true,
      vip: true,
      enterprise: true,
    },
    {
      feature: 'تحسين محركات البحث والكلمات المفتاحية (SEO)',
      basic: false,
      pro: true,
      vip: true,
      enterprise: true,
    },
    {
      feature: 'تأسيس صفحات المنصات الاجتماعية بهوية متناسقة',
      basic: false,
      pro: true,
      vip: true,
      enterprise: true,
    },
    {
      feature: 'تصميم إعلانات وبوستات ترويجية احترافية',
      basic: false,
      pro: true,
      vip: 'متجددة طوال الشهر',
      enterprise: 'حملة إطلاق شاملة',
    },
    {
      feature: 'إدارة وتوجيه تقييمات ومراجعات العملاء',
      basic: false,
      pro: false,
      vip: true,
      enterprise: true,
    },
    {
      feature: 'إعداد وضبط الحملات الإعلانية الممولة',
      basic: false,
      pro: false,
      vip: 'إدارة واستهداف شهري',
      enterprise: 'تخطيط وإطلاق متكامل',
    },
    {
      feature: 'تصميم الشعار واللافتات والمطبوعات الميدانية',
      basic: false,
      pro: false,
      vip: false,
      enterprise: true,
    },
    {
      feature: 'منظومة ولاء العملاء وتكرار الشراء الدائم',
      basic: false,
      pro: false,
      vip: false,
      enterprise: true,
    },
    {
      feature: 'مدة المرافقة والدعم التسويقي المباشر',
      basic: 'تسليم 48 ساعة',
      pro: 'متابعة 3 أيام',
      vip: 'دعم يومي شهر كامل',
      enterprise: 'طوال المشروع + شهر',
    },
    {
      feature: 'الاستثمار / السعر الرسمي',
      basic: '250 ج.م',
      pro: '750 ج.م',
      vip: '2,000 ج.م',
      enterprise: 'تسعير مخصص حسب المشروع',
    },
  ];

  const getWhatsAppMessage = (pkg: typeof selectedPkg) => {
    if (pkg.id === 'pkg_corporate') {
      return encodeURIComponent(
        `مرحباً دليلك 👋 أود الاستفسار وطلب دراسة وعرض سعر مخصص لـ "باقة الشركات والمشاريع الكبرى" لتجهيز وتطوير منظومة منشأتنا ومكاننا.`
      );
    }
    const priceText = pkg.priceLabel ? pkg.priceLabel : `${pkg.price.toLocaleString('en-US')} جنيه مصري`;
    return encodeURIComponent(
      `مرحباً دليلك 👋 أود الاستفسار والاشتراك في "${pkg.title}" بقيمة (${priceText}) لمنشأتنا ومكاننا.`
    );
  };

  const handleSelectForForm = (pkgTitle: string) => {
    if (onSelectPackage) {
      onSelectPackage(pkgTitle);
    }
    if (onClose) {
      onClose();
    }
  };

  const filteredPackages = detailedPackages.filter((pkg) => {
    if (categoryTab === 'essential') return ['pkg_basic', 'pkg_pro'].includes(pkg.id);
    if (categoryTab === 'growth') return ['pkg_reputation', 'pkg_reels', 'pkg_vip'].includes(pkg.id);
    if (categoryTab === 'enterprise') return ['pkg_smart_menu', 'pkg_annual_partner', 'pkg_corporate'].includes(pkg.id);
    return true;
  });

  const handleSelectPackage = (pkgId: string) => {
    setSelectedPkgId(pkgId);
    setTimeout(() => {
      detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleCategoryChange = (tab: 'all' | 'essential' | 'growth' | 'enterprise') => {
    setCategoryTab(tab);
    const tabPackages = detailedPackages.filter((pkg) => {
      if (tab === 'essential') return ['pkg_basic', 'pkg_pro'].includes(pkg.id);
      if (tab === 'growth') return ['pkg_reputation', 'pkg_reels', 'pkg_vip'].includes(pkg.id);
      if (tab === 'enterprise') return ['pkg_smart_menu', 'pkg_annual_partner', 'pkg_corporate'].includes(pkg.id);
      return true;
    });
    if (tabPackages.length > 0) {
      setSelectedPkgId(tabPackages[0].id);
    }
  };

  return (
    <div className="space-y-5 font-['Cairo',sans-serif] text-[var(--text-primary)]">
      {/* ========================================================================= */}
      {/* 1. ULTRA-COMPACT SLEEK HERO BANNER */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 text-slate-950 p-4 sm:p-5 rounded-2xl shadow-lg relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative z-10 space-y-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="bg-slate-950/20 text-slate-950 text-[10.5px] sm:text-xs font-black px-3 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
              <span>منظومة باقات دليلك المعتمدة في مصر</span>
              <span>💎</span>
            </span>
          </div>
          <h2 className="text-lg sm:text-2xl font-black tracking-tight leading-snug">
            دليل وشرح باقات خدمات منصة دليلك في مصر 🚀
          </h2>
          <p className="text-xs sm:text-xs font-bold text-slate-900/90 leading-relaxed">
            باقات وحملات تسويقية متكاملة تبدأ من التوثيق الأساسي وتصدر الخرائط، مروراً بباقات النمو والانتشار، وحتى حلول الشركات والمشاريع الكبرى. انقر على أي باقة لمعاينة تفاصيلها فوراً.
          </p>
        </div>

        <div className="relative z-10 shrink-0 self-end sm:self-center">
          <span className="bg-slate-950 text-amber-400 font-black text-xs px-3.5 py-1.5 rounded-xl shadow-md inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>8 باقات معتمدة</span>
          </span>
        </div>

        <div className="absolute -left-4 -bottom-6 opacity-15 pointer-events-none">
          <Crown className="w-36 h-36" />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1.5. STANDALONE FREE DIRECTORY LISTING NOTICE (خدمة عامة مشروطة وليست باقة) */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-[var(--bg-card)] to-teal-500/10 border-2 border-emerald-500/60 rounded-2xl p-4 sm:p-5 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[10.5px] font-black px-2.5 py-0.5 rounded-full border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>خدمة إدراج المنشأة مجاناً 100% (ليست ضمن الباقات التجارية)</span>
          </div>
          <h3 className="font-black text-sm sm:text-base text-[var(--text-primary)]">
            هل نشاطكم التجاري موثق بالفعل على خرائط Google؟
          </h3>
          <p className="text-xs text-[var(--text-secondary)] font-bold leading-relaxed">
            {FREE_DIRECTORY_SERVICE.condition} نوفر لكم ظهوراً وإدراجاً كاملاً في دليل المحافظة مجاناً وبدون أي رسوم.
          </p>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 text-xs text-amber-800 dark:text-amber-300 font-bold flex items-start gap-2">
            <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              <strong>إذا لم يكن لمنشأتكم موقع موثق على الخريطة:</strong> نقترح عليكم البدء بـ{' '}
              <button
                type="button"
                onClick={() => setSelectedPkgId('pkg_basic')}
                className="underline font-black text-blue-600 dark:text-blue-400 cursor-pointer"
              >
                «باقة التوثيق الأساسي» (250 ج.م)
              </button>{' '}
              لتفعيل وتثبيت موقعكم رسمياً أولاً.
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 w-full md:w-auto">
          <a
            href={`https://wa.me/201143888355?text=${encodeURIComponent('مرحباً دليلك 👋 نشاطنا موثق بالفعل على خرائط Google، ونود طلب إدراج وظهور المكان في الدليل مجاناً 100%.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>طلب الإدراج المجاني (للمواقع الموثقة)</span>
          </a>

          <button
            type="button"
            onClick={() => setSelectedPkgId('pkg_basic')}
            className="px-4 py-2.5 rounded-xl bg-blue-600/10 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-400 border border-blue-500/30 font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>معاينة باقة التوثيق الأساسي (250 ج)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CATEGORY TABS & INTERACTIVE PACKAGE CARDS */}
      {/* ========================================================================= */}
      <div ref={packagesGridRef} className="space-y-3">
        {/* Category Navigation Pills */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-2.5 sm:p-3 text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-black text-amber-600 dark:text-amber-400">
            <HelpCircle className="w-4 h-4 text-amber-500" />
            <span>اختر تصنيف الباقات المناسب لمرحلة مشروعك:</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-black">
            <button
              type="button"
              onClick={() => handleCategoryChange('all')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                categoryTab === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
                  : 'bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
              }`}
            >
              <span>جميع الباقات (8)</span>
            </button>
            <button
              type="button"
              onClick={() => handleCategoryChange('essential')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                categoryTab === 'essential'
                  ? 'bg-blue-600 text-white shadow-md scale-105'
                  : 'bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>التوثيق والتأسيس الأساسي (2)</span>
            </button>
            <button
              type="button"
              onClick={() => handleCategoryChange('growth')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                categoryTab === 'growth'
                  ? 'bg-emerald-600 text-white shadow-md scale-105'
                  : 'bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>النمو والتسويق والإدارة (3)</span>
            </button>
            <button
              type="button"
              onClick={() => handleCategoryChange('enterprise')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                categoryTab === 'enterprise'
                  ? 'bg-purple-600 text-white shadow-md scale-105'
                  : 'bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>الحلول المتقدمة والشركات (3)</span>
            </button>
          </div>
        </div>

        {/* Active Selection Indicator Banner */}
        {selectedPkg && (
          <div 
            onClick={() => detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="bg-gradient-to-r from-amber-500/15 via-amber-500/25 to-yellow-500/15 border-2 border-amber-500/60 rounded-2xl p-3 px-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-amber-500/20 transition-all shadow-sm group animate-fade-in"
            title="انقر للانتقال المباشر لتفاصيل هذه الباقة"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
              <div className="text-xs font-black text-[var(--text-primary)] truncate">
                <span className="text-amber-600 dark:text-amber-400">👇 تم فتح تفاصيل</span>
                {' '}
                <span className="text-[var(--text-primary)] font-black underline decoration-amber-500 underline-offset-4">
                  «{selectedPkg.shortName}»
                </span>
                {' '}
                <span className="text-[var(--text-muted)] font-normal text-[11px] hidden sm:inline">
                  ({selectedPkg.priceLabel || (selectedPkg.price === 0 ? 'مجاناً' : `${selectedPkg.price.toLocaleString('en-US')} ج.م`)})
                </span>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-1.5 text-xs font-black text-amber-600 dark:text-amber-400 group-hover:translate-y-0.5 transition-transform">
              <span>تصفح المميزات والاشتراك أدناه</span>
              <span className="text-base">⬇️</span>
            </div>
          </div>
        )}

        {/* Package Decision Cards Grid (Compact, Catchy & Uniform) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {filteredPackages.map((pkg) => {
            const IconComp = pkg.icon;
            const isSelected = selectedPkgId === pkg.id;
            const isPro = pkg.id === 'pkg_pro';

            return (
              <div
                key={pkg.id}
                onClick={() => handleSelectPackage(pkg.id)}
                className={`p-4 sm:p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-3.5 select-none relative group ${
                  isSelected
                    ? `${pkg.activeBorder} shadow-amber-500/20 shadow-xl scale-[1.01]`
                    : isPro
                      ? 'bg-gradient-to-b from-amber-500/10 via-[var(--bg-card)] to-[var(--bg-card)] border-amber-400 dark:border-amber-400 shadow-amber-500/20 shadow-md ring-2 ring-amber-400/40 hover:shadow-xl'
                      : `bg-[var(--bg-card)] border-[var(--border-color)] ${pkg.cardBorder} hover:shadow-md`
                }`}
              >
                <div className="space-y-2.5">
                  {/* Top Bar: Icon + Badge */}
                  <div className="flex items-center justify-between gap-1.5">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${pkg.iconBg} flex items-center justify-center font-black shadow-xs shrink-0 group-hover:scale-105 transition-transform`}>
                      <IconComp className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <span className={`text-[10.5px] font-black px-2.5 py-0.5 rounded-full border ${isPro ? 'bg-amber-400/20 text-amber-700 dark:text-amber-300 border-amber-400 font-black' : pkg.badgeColor} truncate`}>
                      {pkg.badge}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <div>
                    <h3 className="font-black text-sm sm:text-base text-[var(--text-primary)] leading-snug">
                      {pkg.shortName}
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)] font-mono font-bold mt-0.5 truncate">
                      {pkg.englishTitle}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="pt-2 border-t border-[var(--border-color)]">
                    {pkg.priceLabel ? (
                      <div className={`text-sm sm:text-base font-black ${pkg.id === 'pkg_corporate' ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {pkg.priceLabel}
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className={`text-2xl sm:text-3xl font-black font-mono ${pkg.price === 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {pkg.price === 0 ? '0' : pkg.price.toLocaleString('en-US')}
                        </span>
                        <span className="text-xs font-bold text-[var(--text-secondary)]">ج.م</span>
                      </div>
                    )}
                    <p className="text-[11px] text-[var(--text-muted)] font-bold mt-0.5">
                      {pkg.priceSubtext}
                    </p>
                  </div>

                  {/* 1-2 line Key Value Proposition */}
                  <p className="text-xs text-[var(--text-secondary)] font-bold leading-relaxed line-clamp-2 min-h-[2.5rem]">
                    {pkg.summary}
                  </p>
                </div>

                {/* Instant Decision Actions (Two Clear Buttons) */}
                <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-color)]">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPackage(pkg.id);
                    }}
                    className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 ${
                      isSelected
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md'
                        : 'bg-gradient-to-r from-amber-500/15 to-yellow-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/30'
                    }`}
                  >
                    <span>تفاصيل ومميزات الباقة 👁️</span>
                  </button>
                  <a
                    href={`https://wa.me/201143888355?text=${getWhatsAppMessage(pkg)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
                    title="طلب مباشر عبر واتساب"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>طلب واتساب 💬</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DETAILED VIEW FOR SELECTED PACKAGE (Dynamic Showcase Box) */}
      {/* ========================================================================= */}
      <div 
        ref={detailsRef}
        className={`bg-[var(--bg-card)] border-2 rounded-3xl p-4 sm:p-6 space-y-5 shadow-xl transition-all duration-300 scroll-mt-6 ${
          selectedPkg.isFlagship 
            ? 'border-amber-400 bg-gradient-to-br from-amber-500/5 via-[var(--bg-card)] to-yellow-500/5' 
            : 'border-amber-500/30'
        }`}
      >
        {/* Detail Box Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${selectedPkg.iconBg} flex items-center justify-center font-black shadow-md shrink-0`}>
              <selectedPkg.icon className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-base sm:text-xl text-[var(--text-primary)]">
                  {selectedPkg.title}
                </h3>
                <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${selectedPkg.badgeColor}`}>
                  {selectedPkg.badge}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-bold mt-1">
                الاستثمار:{' '}
                <span className={`font-black text-sm ${selectedPkg.id === 'pkg_corporate' ? 'text-amber-500' : selectedPkg.price === 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {selectedPkg.priceLabel || (selectedPkg.price === 0 ? 'مجاني تماماً 100%' : `${selectedPkg.price.toLocaleString('en-US')} ج.م`)}
                </span>
                {' '}| مدة التنفيذ: <span className="text-[var(--text-primary)] font-bold">{selectedPkg.deliveryTime}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <div className="bg-[var(--input-bg)] px-3 py-1.5 rounded-xl border border-[var(--border-color)] text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>التسليم: {selectedPkg.deliveryTime}</span>
            </div>
            <button
              type="button"
              onClick={() => packagesGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="bg-[var(--input-bg)] hover:bg-[var(--border-color)] px-3 py-1.5 rounded-xl border border-[var(--border-color)] text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-1 cursor-pointer transition-colors"
              title="العودة لأعلى شبكة الباقات"
            >
              <span>الباقات ⬆️</span>
            </button>
          </div>
        </div>

        {/* 2-Columns Grid: Deliverables & Audience */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Column 1: Deliverables */}
          <div className="bg-[var(--bg-surface)] p-4 sm:p-5 rounded-2xl border border-[var(--border-color)] space-y-3.5">
            <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>ما تتضمنه هذه الباقة بدقة:</span>
            </h4>
            
            <div className="space-y-2.5">
              {selectedPkg.featuresIncluded.map((feat, idx) => (
                <div key={idx} className="p-2.5 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] space-y-1 hover:border-amber-500/30 transition-colors">
                  <div className="flex items-center gap-2 font-black text-xs text-[var(--text-primary)]">
                    <span className="w-4 h-4 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-black shrink-0">
                      ✓
                    </span>
                    <span>{feat.name}</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] font-bold pr-6 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Target Audience & Best Practices & CTA */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-3.5">
              {/* Target Audience */}
              <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-2">
                <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)] flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-500" />
                  <span>الأنشطة والفئة المستهدفة:</span>
                </h4>
                <p className="text-xs text-[var(--text-secondary)] font-bold leading-relaxed">
                  {selectedPkg.targetAudience}
                </p>
              </div>

              {/* Best Practices */}
              <div className="bg-amber-500/5 p-4 rounded-2xl border border-amber-500/30 space-y-2.5">
                <h4 className="font-black text-xs sm:text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>إرشادات ونصائح النجاح:</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-[var(--text-secondary)] font-bold">
                  {selectedPkg.idealPractices.map((practice, idx) => (
                    <li key={idx} className="leading-relaxed bg-[var(--bg-card)] p-2.5 rounded-xl border border-[var(--border-color)]">
                      {practice}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Direct Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
              <a
                href={`https://wa.me/201143888355?text=${getWhatsAppMessage(selectedPkg)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full sm:flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
                  selectedPkg.id === 'pkg_corporate'
                    ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black shadow-amber-500/25'
                    : selectedPkg.price === 0
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                <span>
                  {selectedPkg.id === 'pkg_corporate'
                    ? 'طلب دراسة وعرض سعر مخصص عبر واتساب 💬'
                    : selectedPkg.price === 0
                      ? 'طلب الظهور المجاني عبر واتساب 💬'
                      : 'طلب هذه الباقة عبر واتساب 💬'}
                </span>
              </a>

              {onSelectPackage && (
                <button
                  type="button"
                  onClick={() => handleSelectForForm(selectedPkg.title)}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>تحديد هذه الباقة في استمارة التسجيل 📝</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3.5. ENTERPRISE & UNDER-CONSTRUCTION SOLUTIONS (باقة الشركات والمشاريع الكبرى) */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-amber-500/15 via-[var(--bg-card)] to-yellow-500/10 border-2 border-amber-400/60 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-amber-500/25 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
              <Building2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                  حلول مؤسسية 🏢
                </span>
                <h3 className="font-black text-base sm:text-lg text-[var(--text-primary)]">
                  باقة الشركات والمشاريع الكبرى والمحلات تحت التجهيز
                </h3>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-bold mt-0.5">
                تأسيس مؤسسي شامل: هوية بصرية، واجهات ومطبوعات، تأسيس رقمي متكامل لكافة الفروع، وإدارة حملات الانطلاق والافتتاح.
              </p>
            </div>
          </div>

          <a
            href="https://wa.me/201143888355?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20%D8%AF%D9%84%D9%8A%D9%84%D9%83%20%F0%9F%91%8B%20%D8%A3%D9%88%D8%AF%20%D8%B7%D9%84%D8%A8%20%D8%A7%D8%B3%D8%AA%D8%B4%D8%A7%D8%B1%D8%A9%20%D9%88%D8%AF%D8%B1%D8%A7%D8%B3%D8%A9%20%D8%B9%D8%B1%D8%B6%20%D8%B3%D8%B9%D8%B1%20%D9%85%D8%AE%D8%B5%D8%B5%20%D9%84%D9%80%20%22%D8%A8%D8%A7%D9%82%D8%A9%20%D8%A7%D9%84%D8%B4%D8%B1%D9%83%D8%A7%D8%AA%20%D9%88%D8%A7%D9%84%D9%85%D8%B4%D8%A7%D8%B1%D9%8A%D8%B9%20%D8%A7%D9%84%D9%83%D8%A8%D8%B1%D9%89%22%20%D9%84%D9%85%D9%86%D8%B4%D8%A3%D8%AA%D9%86%D8%A7."
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-transform active:scale-95 shrink-0 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>طلب استشارة ودراسة عرض سعر مخصص 💬</span>
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
          <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-amber-500/20 space-y-1">
            <span className="text-amber-500 font-black block">👑 هوية مؤسسية ولافتات</span>
            <p className="text-[11px] text-[var(--text-secondary)] font-medium">تصميم الشعار ودليل الهوية والمطبوعات واللافتات الميدانية.</p>
          </div>
          <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-amber-500/20 space-y-1">
            <span className="text-amber-500 font-black block">🌐 ربط وتوثيق الفروع</span>
            <p className="text-[11px] text-[var(--text-secondary)] font-medium">تأسيس وتوثيق موحد لكافة الفروع على الخرائط ومحركات البحث.</p>
          </div>
          <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-amber-500/20 space-y-1">
            <span className="text-amber-500 font-black block">📣 حملات افتتاح متكاملة</span>
            <p className="text-[11px] text-[var(--text-secondary)] font-medium">تخطيط وإدارة حملات الترويج الموجهة لإحداث زخم وانطلاق قوي.</p>
          </div>
          <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-amber-500/20 space-y-1">
            <span className="text-amber-500 font-black block">💎 برنامج ولاء وتدريب</span>
            <p className="text-[11px] text-[var(--text-secondary)] font-medium">بناء منظومات تكرار الشراء وتأهيل فريق التشغيل والمبيعات.</p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. COMPREHENSIVE COMPARISON MATRIX TABLE */}
      {/* ========================================================================= */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-6 space-y-4 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="font-black text-sm sm:text-lg text-[var(--text-primary)]">
              جدول المقارنة الشاملة بين باقات المنصة بالكامل 📊
            </h3>
            <p className="text-[11px] sm:text-xs text-[var(--text-muted)] font-bold mt-0.5">
              مقارنة تفصيلية دقيقة بين الباقات المعتمدة من باقة التوثيق الأساسي وحتى باقة الشركات والمشاريع الكبرى
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)]">
                <th className="py-3 px-3 font-black text-xs text-[var(--text-primary)]">الخدمة / الميزة</th>
                <th className="py-3 px-2 font-black text-xs text-center text-blue-600 dark:text-blue-400">
                  التوثيق الأساسي (250 ج) 📍
                </th>
                <th className="py-3 px-2 font-black text-xs text-center text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 rounded-t-xl">
                  التأسيس والربط (750 ج) ⭐
                </th>
                <th className="py-3 px-2 font-black text-xs text-center text-amber-600 dark:text-amber-400">
                  الإدارة VIP (2000 ج) 👑
                </th>
                <th className="py-3 px-2 font-black text-xs text-center text-amber-500 bg-amber-500/10 rounded-t-xl font-black">
                  باقة الشركات الكبرى 🏢
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {comparisonRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-[var(--bg-surface)] transition-colors">
                  <td className="py-2.5 px-3 font-bold text-[var(--text-primary)] text-xs">
                    {row.feature}
                  </td>

                  {/* Basic */}
                  <td className="py-2.5 px-2 text-center">
                    {typeof row.basic === 'boolean' ? (
                      row.basic ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold text-xs">✓</span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-500/10 text-slate-400 font-bold text-xs">—</span>
                      )
                    ) : (
                      <span className="font-extrabold text-blue-600 dark:text-blue-400 text-xs">{row.basic}</span>
                    )}
                  </td>

                  {/* Pro */}
                  <td className="py-2.5 px-2 text-center bg-emerald-500/5 font-bold">
                    {typeof row.pro === 'boolean' ? (
                      row.pro ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-black text-xs">✓</span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-500/10 text-slate-400 font-bold text-xs">—</span>
                      )
                    ) : (
                      <span className="font-black text-emerald-700 dark:text-emerald-300 text-xs">{row.pro}</span>
                    )}
                  </td>

                  {/* VIP */}
                  <td className="py-2.5 px-2 text-center font-bold">
                    {typeof row.vip === 'boolean' ? (
                      row.vip ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 font-black text-xs">✓</span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-500/10 text-slate-400 font-bold text-xs">—</span>
                      )
                    ) : (
                      <span className="font-black text-amber-700 dark:text-amber-400 text-xs">{row.vip}</span>
                    )}
                  </td>

                  {/* Enterprise / Corporate */}
                  <td className="py-2.5 px-2 text-center bg-amber-500/10 font-bold">
                    {typeof row.enterprise === 'boolean' ? (
                      row.enterprise ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-xs shadow-xs">✓</span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-500/10 text-slate-400 font-bold text-xs">—</span>
                      )
                    ) : (
                      <span className="font-black text-amber-600 dark:text-amber-400 text-xs">{row.enterprise}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
