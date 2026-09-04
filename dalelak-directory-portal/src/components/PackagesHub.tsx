import React, { useState } from 'react';
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
import { PACKAGES } from '../data/mockData';

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

  const detailedPackages = [
    {
      id: 'pkg_free',
      shortName: 'الظهور المجاني',
      title: 'باقة الظهور والإدراج المجاني',
      englishTitle: '100% Free Public Listing',
      price: 0,
      priceLabel: 'مجاناً 100%',
      priceSubtext: 'بدون أي رسوم مدى الحياة',
      badge: 'مجاني 100% 🎁',
      badgeColor: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40',
      cardBorder: 'hover:border-emerald-500/60',
      activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/30',
      icon: Gift,
      iconBg: 'from-emerald-600 to-teal-500 text-white',
      accentColor: 'text-emerald-500',
      summary: 'إدراج نشاطك التجاري بالكامل في دليل منصة دليلك مع بيانات التواصل والعنوان والخريطة وساعات العمل مجاناً.',
      deliveryTime: 'خلال 24 ساعة عمل',
      targetAudience: 'كافة المحلات والأنشطة التجارية في مصر بدون استثناء - حق أصيل لكل صاحب عمل للظهور للزبائن مجاناً.',
      highlights: [
        'ظهور اسم النشاط وتصنيفه التجاري في دليل المحافظة والمنطقة',
        'عرض أرقام الهواتف وروابط الواتساب للتواصل المباشر',
        'تثبيت العنوان وتحديد الموقع بدقة على الخريطة التفاعلية',
        'عرض مواعيد وساعات العمل الرسمية طوال أيام الأسبوع',
        'بدون أي رسوم تسجيل، وبدون أي اشتراكات خفية (مجاني 100%)'
      ],
      featuresIncluded: [
        { name: 'إدراج كامل في دليل المحافظة والمنطقة', desc: 'يظهر نشاطك في نتائج البحث والتصنيفات للمواطنين في منطقتك ومحافظتك.' },
        { name: 'أزرار الاتصال والمراسلة المباشرة', desc: 'إمكانية اتصال الزبون بك هاتفياً أو بدء محادثة واتساب بنقرة واحدة.' },
        { name: 'عرض الموقع على الخريطة التفاعلية المباشرة', desc: 'تحديد موقع المحل مع زر توجيه عبر خرائط جوجل لسهولة الوصول.' },
        { name: 'جدول مواعيد وساعات العمل الرسمية', desc: 'إبراز حالة النشاط (مفتوح الآن / مغلق) وتوقيتات العمل الرسمية.' },
        { name: 'إمكانية تحديث البيانات في أي وقت', desc: 'تعديل أرقام الهواتف أو المواعيد بكل سهولة عبر فريق خدمة العملاء.' }
      ],
      idealPractices: [
        '💡 الممارسة المثالية: تزويدنا بأرقام هواتف نشطة بها واتساب لضمان وصول طلبات الزبائن مباشرة.',
        '📍 نصيحة العنوان: كتابة أقرب علامة مميزة لتسهيل وصول الزبائن وسيارات التوصيل.'
      ]
    },
    {
      id: 'pkg_basic',
      shortName: 'التوثيق الأساسي',
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
      summary: 'التفعيل الميداني الرسمي لنشاطك التجاري على خرائط جوجل مع تثبيت الإحداثيات والبيانات الأساسية وملصق QR.',
      deliveryTime: '24 - 48 ساعة عمل',
      targetAudience: 'المحلات والأنشطة التي تحتاج لظهور رسمي فوري وموثق على خرائط جوجل لسهولة وصول الزبائن وتوصيل الطلبات.',
      highlights: [
        'تثبيت الموقع الجغرافي الدقيق بنظام GPS',
        'رفع اللوجو وصور الواجهة ومقر النشاط بجودة عالية',
        'إضافة أرقام الهواتف ومواعيد العمل الرسمية المعتمدة',
        'إصدار فاتورة إلكترونية معتمدة برمز QR مع مشاركة واتساب',
        '🎁 هدية خاصة: ملصق باركود QR Code احترافي جاهز للطباعة'
      ],
      featuresIncluded: [
        { name: 'التفعيل الميداني الرسمي على خرائط Google', desc: 'تثبيت مكان محلك بنقطة جغرافية دقيقة تظهر لجميع الباحثين في منطقتك ومحيطك.' },
        { name: 'ضبط بيانات التواصل وساعات العمل', desc: 'إضافة رقم التليفون، الواتساب، وأوقات الفتح والإغلاق طوال أيام الأسبوع.' },
        { name: 'رفع الشعار والواجهة والمنتجات', desc: 'إضافة صور عالية الجودة لواجهة المحل ومنتجاتك لجذب الزبائن.' },
        { name: 'فاتورة إلكترونية معتمدة ومشاركة WhatsApp', desc: 'إصدار رابط وفاتورة رسمية فورية يمكن مشاركتها وتنزيلها.' },
        { name: 'هدية خاصة: ملصق باركود QR Code', desc: 'تصميم ملصق باركود مخصص لموقع نشاطك جاهز للطباعة والتعليق في واجهة المحل.' }
      ],
      idealPractices: [
        '💡 الممارسة المثالية: تزويد المندوب بأرقام هواتف نشطة طوال اليوم وتحديد مواعيد العمل بدقة.',
        '📸 نصيحة الصور: تجهيز صورة واضحة للواجهة بدون عوائق مع لافتة المحل التجارية.'
      ]
    },
    {
      id: 'pkg_pro',
      shortName: 'التأسيس والربط الذكي',
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
        { name: 'تأسيس وبناء صفحات التواصل الاجتماعي', desc: 'إنشاء وضبط صفحات فيسبوك والمنصات باسم وهوية بصرية متناسقة مع نشاطك.' },
        { name: 'تصميم إعلان وطريقة عرض البضائع', desc: 'تصميمات إعلانية جذابة لعرض المنتجات بطريقة تشد انتباه الزبائن.' },
        { name: 'مرافقة وتوجيه لمدة 3 أيام', desc: 'فريق العمل يرافقك لمدة 3 أيام للرد على الاستفسارات ومساعدتك في نشر أولى العروض.' },
        { name: 'استشارات وزيادة اتصالات العملاء', desc: 'توجيهات عملية ونماذج فعالة لتحويل استفسارات المتصلين إلى مبيعات فورية.' }
      ],
      idealPractices: [
        '💡 الشرط الأساسي: معرفة صاحب النشاط أو من ينوب عنه باستخدام تطبيقات الموبايل لتحقيق أفضل نتائج.',
        '🎯 نصيحة المبيعات: الاستفادة من تصاميم الإعلانات لنشر عروض افتتاح أو خصومات موسمية.'
      ]
    },
    {
      id: 'pkg_vip',
      shortName: 'الدعم الميداني VIP',
      title: 'عرض الدعم الميداني والإدارة الشاملة VIP',
      englishTitle: 'VIP Field Support & Monthly Management',
      price: 2000,
      priceLabel: '2,000 جنيه',
      priceSubtext: 'إدارة شهرية + تصوير ميداني',
      badge: 'الإدارة VIP 👑',
      badgeColor: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40',
      cardBorder: 'hover:border-amber-500/60',
      activeBorder: 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-500/5 dark:bg-amber-950/30',
      icon: Crown,
      iconBg: 'from-amber-500 to-yellow-400 text-slate-950',
      accentColor: 'text-amber-500',
      summary: 'إدارة رقمية متكاملة وزيارات ميدانية للتصوير الاحترافي وتدريب عملي مع دعم واستشارات يومية مستمرة لمدة شهر كامل.',
      deliveryTime: 'شهر كامل (30 يوماً)',
      targetAudience: 'المبتدئين وأصحاب الأعمال المشغولين الذين يريدون من يتولى عنهم كل شيء من التصوير إلى النشر وإدارة التقييمات.',
      highlights: [
        'كل ميزات باقة التأسيس وتوثيق خرائط جوجل مع أولوية VIP',
        'زيارة ميدانية وتصوير احترافي فائق الجودة لمقر النشاط والبضائع',
        'خطة تسويقية وتصميم بوستات وإعلانات مخصصة طوال الشهر',
        'تدريب خطوة بخطوة لصناعة العروض وإدارة الصفحات باحترافية',
        'دعم يومي متواصل ومتابعة حية لمدة شهر كامل',
        'تجديد اختياري مخفض بـ 1000 ج فقط للشهور التالية'
      ],
      featuresIncluded: [
        { name: 'زيارة ميدانية وتصوير احترافي للمحل', desc: 'يقوم مندوب متخصص بزيارة مقرك والتقاط صور مميزة للمكان والمنتجات بجودة فائقة.' },
        { name: 'خطة تسويقية وبناء هوية رقمية كاملة', desc: 'إعداد خطة ترويجية للمحل، تصميم بنرات وبوستات إعلانية متجددة طوال الشهر.' },
        { name: 'تدريب عملي خطوة بخطوة لصاحب النشاط', desc: 'تعليمك كيفية إدارة الصفحات، الرد السريع، وعمل إعلانات ممولة ناجحة بنفسك.' },
        { name: 'دعم واستشارات يومية لمدة شهر كامل', desc: 'تواصل ومتابعة يومية للرد على أي استفسار وحل أي عقبات تسويقية فوراً.' },
        { name: 'إدارة التقييمات والرد على آراء الزبائن', desc: 'متابعة تقييمات العملاء على خرائط جوجل وحماية سمعة النشاط.' },
        { name: 'ميزة التجديد المخفض (1000 ج/شهر)', desc: 'بعد انتهاء الشهر الأول، يمكنك الاستمرار في خدمة الإدارة الشهرية بنصف السعر فقط.' }
      ],
      idealPractices: [
        '💡 الفئة المستهدفة: للمبتدئين ومن ليس لديهم وقت لإدارة السوشيال ميديا أو من يواجهون صعوبة تقنية.',
        '📈 أفضل استفادة: تحديد أوقات الزيارة الميدانية عندما يكون المحل جاهزاً بأفضل تشكيلة بضائع.'
      ]
    },
    {
      id: 'pkg_launch_from_scratch',
      shortName: 'الانطلاق الكبرى (20k)',
      title: 'باقة الانطلاق الكبرى والتأسيس من الصفر',
      englishTitle: 'Turnkey Launch (Under Construction)',
      price: 20000,
      priceLabel: '20,000 جنيه',
      priceSubtext: 'تأسيس شامل للأنشطة تحت الإنشاء',
      isFlagship: true,
      badge: 'تاج التأسيس 🚀',
      badgeColor: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black border-amber-300 shadow-md',
      cardBorder: 'hover:border-amber-400 border-amber-500/50',
      activeBorder: 'border-amber-400 ring-2 ring-amber-400/30 bg-gradient-to-br from-amber-500/10 via-[var(--bg-card)] to-yellow-500/5 shadow-2xl shadow-amber-500/20',
      icon: Rocket,
      iconBg: 'from-amber-500 via-yellow-400 to-amber-600 text-slate-950',
      accentColor: 'text-amber-500',
      summary: 'تكفل شامل من الصفر للأنشطة تحت الإنشاء: تصميم الهوية، اللافتة الخارجية، المطبوعات، تصوير سينمائي 4K، وحملة افتتاح ممولة.',
      deliveryTime: 'طوال فترة التأسيس + 30 يوماً بعد الافتتاح',
      targetAudience: 'المطاعم، الكافيهات، المعارض، والشركات الجديدة تحت الإنشاء التي تريد افتتاحاً مدوياً، وتصدر منطقتها، وبناء قاعدة زبائن دائمة.',
      highlights: [
        '👑 ابتكار وتصميم الشعار الرسمي ودليل الهوية البصرية الكامل (Vector)',
        '🏬 تصميم لافتة المحل الخارجية المتناسقة مع طابع المنطقة لتكون الأبرز',
        '📦 تصميمات التعبئة والمطبوعات الميدانية: منيو، كروت، أكياس، فواتير، وزي موحد',
        '🎬 تصوير فيديو إعلاني سينمائي بجودة 4K لمقر النشاط وتجهيزاته والافتتاح',
        '📣 إطلاق وإدارة حملة إعلانية ممولة مكثفة ومستهدفة جغرافياً لسكان المنطقة',
        '💎 بناء منظومة "الزبون المنتظم" (برنامج ولاء دائم لتكرار الشراء)',
        '👨‍💼 تدريب صاحب النشاط وفريق العمل على التشغيل والبيع الميداني'
      ],
      featuresIncluded: [
        { name: 'تصميم الشعار والهوية البصرية الكاملة', desc: 'ابتكار لوجو حصري بجميع الملفات المفتوحة الصالحة للطباعة على كافة المقاسات.' },
        { name: 'تصميم لافتة المحل الخارجية والمطبوعات', desc: 'تصور ثلاثي الأبعاد للافتة المحل، كروت العمل، الفواتير، الأكياس، والزي الموحد للعاملين.' },
        { name: 'تصوير سينمائي إعلاني بدقة 4K', desc: 'فيديو إعلاني احترافي يوثق المكان والتجهيزات والعروض بجودة استوديوهات التلفزيون.' },
        { name: 'تأسيس وضبط كافة المنصات الرقمية وواتساب الذكي', desc: 'إنشاء وضبط صفحات فيسبوك وإنستغرام وتيك توك مع نظام رد آلي وكتالوج رقمي.' },
        { name: 'إطلاق حملة إعلانية ممولة مكثفة', desc: 'استهداف مكثف لأهالي المنطقة المحيطة لتوليد زحام وطلب كبير منذ يوم الافتتاح الأول.' },
        { name: 'هندسة وصياغة عروض الافتتاح الساحقة', desc: 'صناعة عروض ترويجية تجعل الزبائن يفضلون تجربتك ويتحدثون عنك بين الأصدقاء.' },
        { name: 'بناء منظومة برنامج ولاء "الزبون المنتظم"', desc: 'نظام رقمي لتسجيل أرقام وبيانات العملاء وإرسال العروض الحصرية لضمان عودتهم الدائمة.' },
        { name: 'تدريب الموظفين وإدارة التشغيل', desc: 'تدريب فريق العمل على فنون الاستقبال، زيادة المبيعات (Cross-Selling)، والتعامل مع الزبائن.' },
        { name: 'مرافقة ودعم مستمر لمدة 30 يوماً بعد الافتتاح', desc: 'فريق التسويق يرافقك شهراً كاملاً بعد الافتتاح لضمان ثبات المبيعات واستقرار النشاط.' }
      ],
      idealPractices: [
        '💡 الممارسة المثالية: التواصل معنا في بداية مرحلة التجهيزات لتنسيق التصميمات واللافتة قبل بدء أعمال الديكور.',
        '🎯 نصيحة الافتتاح: تخصيص عينات تذوق أو هدايا مجانية لأول 100 زائر لمضاعفة الانتشار الشفهي.'
      ]
    }
  ];

  const selectedPkg = detailedPackages.find((p) => p.id === selectedPkgId) || detailedPackages[1];

  const comparisonRows = [
    {
      feature: 'ظهور النشاط في دليل المنصة والمحافظة',
      free: true,
      basic: true,
      pro: true,
      vip: true,
      enterprise: true,
    },
    {
      feature: 'عرض أرقام التواصل وروابط الواتساب المباشرة',
      free: true,
      basic: true,
      pro: true,
      vip: true,
      enterprise: true,
    },
    {
      feature: 'التفعيل والتوثيق الرسمي على خرائط Google',
      free: false,
      basic: true,
      pro: true,
      vip: true,
      enterprise: true,
    },
    {
      feature: 'تثبيت إحداثيات الموقع بدقة GPS مع ساعات العمل',
      free: 'أساسي',
      basic: true,
      pro: true,
      vip: true,
      enterprise: true,
    },
    {
      feature: 'ملصق باركود QR Code احترافي مخصص للمحل',
      free: false,
      basic: true,
      pro: true,
      vip: true,
      enterprise: true,
    },
    {
      feature: 'تحسين محركات البحث والكلمات المفتاحية (SEO)',
      free: false,
      basic: false,
      pro: true,
      vip: true,
      enterprise: true,
    },
    {
      feature: 'تأسيس صفحات المنصات الاجتماعية بهوية احترافية',
      free: false,
      basic: false,
      pro: true,
      vip: true,
      enterprise: true,
    },
    {
      feature: 'تصميم إعلانات وطريقة عرض البضائع والمنتجات',
      free: false,
      basic: false,
      pro: true,
      vip: true,
      enterprise: true,
    },
    {
      feature: 'زيارة ميدانية وتصوير احترافي لمقر النشاط',
      free: false,
      basic: false,
      pro: false,
      vip: 'تصوير فوتوغرافي',
      enterprise: 'فيديو سينمائي 4K',
    },
    {
      feature: 'تصميم الشعار واللافتة الخارجية والمطبوعات الميدانية',
      free: false,
      basic: false,
      pro: false,
      vip: false,
      enterprise: true,
    },
    {
      feature: 'إطلاق حملات إعلانية ممولة مستهدفة للمنطقة',
      free: false,
      basic: false,
      pro: false,
      vip: 'استشارات',
      enterprise: 'حملة ممولة كاملة',
    },
    {
      feature: 'منظومة "الزبون المنتظم" وبرنامج الولاء الدائم',
      free: false,
      basic: false,
      pro: false,
      vip: false,
      enterprise: true,
    },
    {
      feature: 'مدة المرافقة والدعم التسويقي المباشر',
      free: 'دعم فني',
      basic: 'تسليم 48 ساعة',
      pro: 'متابعة 3 أيام',
      vip: 'دعم يومي شهر كامل',
      enterprise: 'طوال التأسيس + شهر',
    },
    {
      feature: 'السعر الرسمي الإجمالي',
      free: 'مجاني (0 ج.م)',
      basic: '250 ج.م',
      pro: '750 ج.م',
      vip: '2,000 ج.م',
      enterprise: '20,000 ج.م',
    },
  ];

  const getWhatsAppMessage = (pkg: typeof selectedPkg) => {
    return encodeURIComponent(
      `مرحباً دليلك 👋 أود الاستفسار والاشتراك في "${pkg.title}" بقيمة ${pkg.price === 0 ? 'الظهور المجاني' : `${pkg.price.toLocaleString('en-US')} جنيه مصري`} لنشاطي التجاري.`
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
            حلول رقمية وميدانية تبدأ من الإدراج المجاني المفتوح، وحتى التأسيس الشامل من الصفر (20 ألف ج.م). انقر على أي باقة لمعاينة تفاصيلها فوراً.
          </p>
        </div>

        <div className="relative z-10 shrink-0 self-end sm:self-center">
          <span className="bg-slate-950 text-amber-400 font-black text-xs px-3.5 py-1.5 rounded-xl shadow-md inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>5 باقات معتمدة</span>
          </span>
        </div>

        <div className="absolute -left-4 -bottom-6 opacity-15 pointer-events-none">
          <Crown className="w-36 h-36" />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. THE 5-PACKAGE RESPONSIVE INTERACTIVE ROW (5 Columns Desktop | Snap Carousel Mobile) */}
      {/* ========================================================================= */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black text-[var(--text-muted)] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>اختر باقتك من الخيارات الخمسة التالية:</span>
          </span>
          <span className="text-[11px] text-[var(--text-muted)] font-bold sm:hidden">
            ← مرر أفقياً لتصفح كافة الباقات →
          </span>
        </div>

        <div className="flex sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 overflow-x-auto pb-2 sm:pb-0 pt-1 px-1 snap-x snap-mandatory scrollbar-none">
          {detailedPackages.map((pkg) => {
            const IconComp = pkg.icon;
            const isSelected = selectedPkgId === pkg.id;

            return (
              <div
                key={pkg.id}
                onClick={() => setSelectedPkgId(pkg.id)}
                className={`min-w-[215px] sm:min-w-0 p-3.5 sm:p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-3.5 shadow-xs shrink-0 snap-center select-none relative group ${
                  pkg.isFlagship
                    ? isSelected
                      ? `${pkg.activeBorder}`
                      : 'bg-gradient-to-br from-amber-500/10 via-[var(--bg-card)] to-yellow-500/5 border-amber-500/40 hover:border-amber-400'
                    : isSelected
                      ? `${pkg.activeBorder} shadow-amber-500/10 shadow-md`
                      : `bg-[var(--bg-card)] border-[var(--border-color)] ${pkg.cardBorder} hover:shadow-sm`
                }`}
              >
                {/* Header Icon & Badge */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${pkg.iconBg} flex items-center justify-center font-black shadow-xs shrink-0 group-hover:scale-105 transition-transform`}>
                      <IconComp className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${pkg.badgeColor} truncate max-w-[125px]`}>
                      {pkg.badge}
                    </span>
                  </div>

                  {/* Title & Price */}
                  <div>
                    <h3 className="font-black text-xs sm:text-sm text-[var(--text-primary)] leading-snug line-clamp-1">
                      {pkg.shortName}
                    </h3>
                    <p className="text-[10px] text-[var(--text-muted)] font-mono font-bold mt-0.5 truncate">
                      {pkg.englishTitle}
                    </p>
                  </div>

                  {/* Price Row */}
                  <div className="pt-1.5 border-t border-[var(--border-color)]">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-xl sm:text-2xl font-black font-mono ${pkg.price === 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {pkg.price === 0 ? '0' : pkg.price.toLocaleString('en-US')}
                      </span>
                      <span className="text-[10.5px] font-bold text-[var(--text-secondary)]">ج.م</span>
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] font-bold mt-0.5 truncate">
                      {pkg.priceSubtext}
                    </p>
                  </div>
                </div>

                {/* Selection Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPkgId(pkg.id);
                  }}
                  className={`w-full py-2 px-2.5 rounded-xl font-black text-[11px] transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-xs'
                      : 'bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-amber-500/10 border border-[var(--border-color)]'
                  }`}
                >
                  <span>{isSelected ? '✓ الباقة المعروضة' : 'عرض الشرح ←'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DETAILED VIEW FOR SELECTED PACKAGE (Dynamic Showcase Box) */}
      {/* ========================================================================= */}
      <div className={`bg-[var(--bg-card)] border-2 rounded-3xl p-4 sm:p-6 space-y-5 shadow-xl transition-all duration-300 ${
        selectedPkg.isFlagship 
          ? 'border-amber-400 bg-gradient-to-br from-amber-500/5 via-[var(--bg-card)] to-yellow-500/5' 
          : 'border-amber-500/30'
      }`}>
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
                <span className={`font-black text-sm ${selectedPkg.price === 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {selectedPkg.price === 0 ? 'مجاني تماماً 100%' : `${selectedPkg.price.toLocaleString('en-US')} ج.م`}
                </span>
                {' '}| مدة التنفيذ: <span className="text-[var(--text-primary)] font-bold">{selectedPkg.deliveryTime}</span>
              </p>
            </div>
          </div>

          <div className="bg-[var(--input-bg)] px-3 py-1.5 rounded-xl border border-[var(--border-color)] text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5 shrink-0 self-start sm:self-center">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>التسليم والمتابعة: {selectedPkg.deliveryTime}</span>
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
                  selectedPkg.price === 0
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                    : selectedPkg.isFlagship
                      ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black shadow-amber-500/25'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                <span>
                  {selectedPkg.price === 0
                    ? 'طلب الظهور المجاني عبر واتساب 💬'
                    : selectedPkg.isFlagship
                      ? 'طلب استشارة تأسيس للـ 20 ألف عبر واتساب 💬'
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
                  <span>اختيار هذه الباقة في النموذج</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. COMPREHENSIVE 5-PACKAGE COMPARISON MATRIX TABLE */}
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
              مقارنة تفصيلية دقيقة بين جميع الخيارات من الظهور المجاني وحتى باقة الانطلاق الكبرى (20 ألف ج.م)
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)]">
                <th className="py-3 px-3 font-black text-xs text-[var(--text-primary)]">الخدمة / الميزة</th>
                <th className="py-3 px-2 font-black text-xs text-center text-emerald-600 dark:text-emerald-400">
                  الظهور المجاني (0 ج) 🎁
                </th>
                <th className="py-3 px-2 font-black text-xs text-center text-blue-600 dark:text-blue-400">
                  التوثيق الأساسي (250 ج) 📍
                </th>
                <th className="py-3 px-2 font-black text-xs text-center text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 rounded-t-xl">
                  التأسيس والربط (750 ج) ⭐
                </th>
                <th className="py-3 px-2 font-black text-xs text-center text-amber-600 dark:text-amber-400">
                  الإدارة VIP (2000 ج) 👑
                </th>
                <th className="py-3 px-2 font-black text-xs text-center text-yellow-500 bg-amber-500/10 rounded-t-xl font-black">
                  الانطلاق الكبرى (20,000 ج) 🚀
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {comparisonRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-[var(--bg-surface)] transition-colors">
                  <td className="py-2.5 px-3 font-bold text-[var(--text-primary)] text-xs">
                    {row.feature}
                  </td>
                  
                  {/* Free */}
                  <td className="py-2.5 px-2 text-center">
                    {typeof row.free === 'boolean' ? (
                      row.free ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs">✓</span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-500/10 text-slate-400 font-bold text-xs">—</span>
                      )
                    ) : (
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">{row.free}</span>
                    )}
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

                  {/* Enterprise 20k */}
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
