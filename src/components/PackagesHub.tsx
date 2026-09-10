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
  ChevronRight,
  Copy,
  Search,
  Phone,
  Send
} from 'lucide-react';
import { PACKAGES, FREE_DIRECTORY_SERVICE } from '../data/mockData';
import { Business } from '../types';

export interface PackagesHubProps {
  initialPackageId?: string;
  onSelectPackage?: (packageTitle: string) => void;
  onClose?: () => void;
  mode?: 'admin' | 'public';
  businesses?: Business[];
  onSendPackageBiz?: (biz: Business, packageId?: string) => void;
}

export const PackagesHub: React.FC<PackagesHubProps> = ({
  initialPackageId = 'pkg_basic',
  onSelectPackage,
  onClose,
  mode = 'admin',
  businesses = [],
  onSendPackageBiz
}) => {
  const [selectedPkgId, setSelectedPkgId] = useState<string>(initialPackageId || 'pkg_basic');
  const [categoryTab, setCategoryTab] = useState<'all' | 'essential' | 'growth' | 'enterprise'>('all');
  const [copiedPkgId, setCopiedPkgId] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [showBizPickerModal, setShowBizPickerModal] = useState<boolean>(false);
  const [bizPickerSearch, setBizPickerSearch] = useState<string>('');

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
      pitchGuide: {
        hook: 'مكانك مش ظاهر على الخريطة؟ بتخسر زباين ومناديب دليفري كل يوم! في 24 ساعة هنثبت محلك رسمي على جوجل مع ملصق QR هدية للواجهة.',
        need: 'للأنشطة التي ليس لها موقع جغرافي موثق على خرائط Google أو موقعها غير دقيق أو أرقامها غير محدثة.',
        objection: 'لو قال: "أنا معروف في منطقتي مش محتاج خريطة" ⬅️ وضّح له: "الزبون الجديد أو المغترب بيبحث بالموبايل أولاً، وشركات الدليفري بتعتمد تماماً على نقطة GPS الدقيقة".'
      },
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
      pitchGuide: {
        hook: 'الباقة الأكثر طلباً ومبيعاً: توثيق رسمي + صفحات سوشيال ميديا باسمك وهوية مميزة + إعلان احترافي يشد الزبائن + مرافقة ودعم 3 أيام.',
        need: 'للمحلات والشركات التي تبحث عن بداية قوية ومبيعات فورية دون إضاعة الوقت وتشتيت الجهد.',
        objection: 'لو قال: "أنا هعمل فيسبوك بنفسي" ⬅️ وضّح له: "تأسيس الصفحات محتاج SEO وهوية بصرية متناسقة مع الخريطة وإعلان منظم يضمن نتائج حقيقية من أول أسبوع".'
      },
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
      pitchGuide: {
        hook: 'سمعة محلك هي اللي بتجيب الزبون أو تطفشه: زيادة تقييمات 5 نجوم حقيقية وحماية المكان من التقييمات الكيدية والردود المهنية الراقية.',
        need: 'للأنشطة الخدمية والمطاعم والعيادات التي تعتمد على التقييمات وثقة العملاء على خرائط جوجل.',
        objection: 'لو قال: "التقييمات مش فارقة معايا" ⬅️ وضّح له: "أكثر من 90% من الزبائن يقرأون التقييمات قبل زيارة أي مكان جديد، وأي نجمة إضافية ترفع مبيعاتك 9%".'
      },
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
      pitchGuide: {
        hook: 'الفيديو هو أسرع وسيلة بيع اليوم: إنتاج مقاطع ريلز احترافية تعرض منتجاتك بجودة سينمائية تشد أهالي منطقتك للشراء.',
        need: 'للأنشطة التي تعتمد على الإبهار البصري مثل الكافيهات، المطاعم، صالونات التجميل، ومحلات الأزياء.',
        objection: 'لو قال: "بصور بالموبايل عادي" ⬅️ وضّح له: "المونتاج الاحترافي والموسيقى والهاشتاجات المدروسة بتضاعف المشاهدات وتبرز فخامة المحل".'
      },
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
      pitchGuide: {
        hook: 'إدارة تسويقية ورقمية متكاملة لمدة شهر كامل: تصميمات، إعلانات، ومتابعة يومية كأن عندك قسم تسويق كامل شغال لنشاطك بـ 2,000 ج بس.',
        need: 'لأصحاب الأنشطة المشغولين الذين لا يملكون وقتاً لإدارة الصفحات والإعلانات بأنفسهم.',
        objection: 'لو قال: "التكلفة كبيرة" ⬅️ وضّح له: "راتب موظف تسويق واحد يتجاوز 5,000 ج، وهنا بتستفيد من فريق كامل: مصمم، كاتب محتوى، ومسؤول إعلانات متفرغين لك شهرياً، مع إمكانية التجديد بـ 1,000 ج فقط".'
      },
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
      pitchGuide: {
        hook: 'منيو رقمي ومتجر واتساب ذكي بـ QR Code: الزبون يطلب أونلاين والطلب يوصلك جاهز على الواتساب بدون عمولات تطبيقات التوصيل.',
        need: 'للمطاعم، الكافيهات، الحلويات، والمحلات التي تستقبل طلبات وتوصيل للمنازل.',
        objection: 'لو قال: "عندي منيو ورقي كفاية" ⬅️ وضّح له: "المنيو الورقي بيتبهدل وبيكلف طباعة عند كل تغيير سعر، بينما الرقمي أسرع وأشيك وأسهل في التعديل ويوفر عمولات تطبيقات التوصيل".'
      },
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
      pitchGuide: {
        hook: 'شراكة استراتيجية سنوية مستمرة: توثيق دائم، وتصدر نتائج البحث، وحملات موسمية في الأعياد والمناسبات طوال 12 شهراً.',
        need: 'للشركات والمؤسسات المستقرة الراغبة في حماية وتنمية تواجدها الرقمي طوال العام بتكلفة اقتصادية مخفضة.',
        objection: 'لو قال: "الدفع السنوي مقدماً كتير" ⬅️ وضّح له: "التكلفة السنوية توفر أكثر من 50% مقارنة بالاشتراكات الشهرية وتضمن لك شارة الشريك المعتمد وتصدر نتائج البحث طوال العام".'
      },
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
      pitchGuide: {
        hook: 'حلول مؤسسية شاملة للمصانع والشركات وسلاسل الفروع والمحلات تحت التجهيز: هوية بصرية كاملة، لافتات، وتأسيس رقمي لجميع الفروع.',
        need: 'لسلاسل الفروع، الشركات الكبرى، والمحلات الضخمة في مرحلة ما قبل الافتتاح والإنشاء.',
        objection: 'لو قال: "محتاج دراسة سعر خاصة" ⬅️ وضّح له: "فريق الإدارة العليا يجهز دراسة مخصصة بحسب عدد الفروع ونطاق التجهيز المطلوب مع جلسة استشارية فنية".'
      },
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
        '💡 الممارسة المثالية: بدء التنسيق مع فريق العمل قبل موعد الافتتاح الرسمي بشهر على الأقل لضبط الخطة الإعلانية.',
        '🏢 نصيحة الشركات: توحيد وسائل التواصل والربط الإلكتروني بين جميع الفروع لضمان تجربة عميل موحدة.'
      ]
    }
  ];

  const selectedPkg = detailedPackages.find((p) => p.id === selectedPkgId) || detailedPackages[0];

  const comparisonRows = [
    { feature: 'التفعيل الرسمي على خرائط Google', basic: true, pro: true, vip: true, enterprise: true },
    { feature: 'تحديث بيانات وساعات العمل والاتصال', basic: true, pro: true, vip: true, enterprise: true },
    { feature: 'ملصق وكارت QR Code للخريطة', basic: true, pro: true, vip: true, enterprise: true },
    { feature: 'تحسين الكلمات المفتاحية (Local SEO)', basic: false, pro: true, vip: true, enterprise: true },
    { feature: 'تأسيس وتنسيق صفحات السوشيال ميديا', basic: false, pro: true, vip: true, enterprise: true },
    { feature: 'تصميم إعلانات وعرض البضائع', basic: false, pro: true, vip: true, enterprise: true },
    { feature: 'مرافقة ودعم تشغيلي مباشر', basic: '24-48 ساعة', pro: '3 أيام', vip: 'شهر كامل (30 يوم)', enterprise: 'فريق متفرغ' },
    { feature: 'إدارة وتوجيه التقييمات الإيجابية', basic: false, pro: false, vip: true, enterprise: true },
    { feature: 'إدارة وضبط الحملات الإعلانية الممولة', basic: false, pro: false, vip: true, enterprise: true },
    { feature: 'تصميم الهوية واللافتات الميدانية والفروع', basic: false, pro: false, vip: false, enterprise: true },
    { feature: 'ميزة التجديد المخفض للشهور التالية', basic: false, pro: false, vip: '1,000 ج فقط', enterprise: 'عقود رعاية' }
  ];

  // Copy complete package pitch to clipboard
  const copyPackagePitch = (pkg: (typeof detailedPackages)[0]) => {
    const priceText = pkg.priceLabel ? pkg.priceLabel : `${pkg.price.toLocaleString('en-US')} ج.م`;
    const featuresList = pkg.featuresIncluded
      .map((f, i) => `${i + 1}. *${f.name}*: ${f.desc}`)
      .join('\n');
    const highlightsList = pkg.highlights
      .map(h => `• ${h}`)
      .join('\n');
    const practicesList = pkg.idealPractices
      .map(p => `• ${p}`)
      .join('\n');

    const text = `*عرض رسمي معتمد من منصة دليلك 💎*
━━━━━━━━━━━━━━━━━━━━━
📌 *الباقة:* ${pkg.title}
💰 *قيمة الاستثمار:* ${priceText}
⏱️ *مدة التنفيذ والاستلام:* ${pkg.deliveryTime}
👥 *الفئة المستهدفة:* ${pkg.targetAudience}

📋 *ما تتضمنه الباقة بدقة:*
${featuresList}

🎁 *أبرز المزايا والهدايا المشمولة:*
${highlightsList}

💡 *إرشادات المنصة للنشاط:*
${practicesList}

━━━━━━━━━━━━━━━━━━━━━
✨ *منظومة دليلك - التوثيق الميداني والتأسيس الرقمي الشامل في مصر*
📞 *للتأكيد والبدء الفوري تواصل معنا عبر واتساب*`;

    navigator.clipboard.writeText(text);
    setCopiedPkgId(pkg.id);
    setCopyToast(`✓ تم نسخ تفاصيل وعرض «${pkg.shortName}» بنجاح! جاهزة للمشاركة مع التاجر.`);
    setTimeout(() => setCopiedPkgId(null), 2500);
    setTimeout(() => setCopyToast(null), 4000);
  };

  // Copy free listing conditions
  const copyFreeListingConditions = () => {
    const text = `*إشعار وسياسة الإدراج المجاني في دليل دليلك 📍*
━━━━━━━━━━━━━━━━━━━━━
✨ ترحب منصة دليلك بإدراج نشاطكم التجاري في دليل المحافظة مجاناً وبدون أي مقابل مالي!

📌 *الشرط الأساسي الوحيد للإدراج المجاني:*
${FREE_DIRECTORY_SERVICE.condition}

💡 *إذا لم يكن لمنشأتكم موقع موثق على الخريطة:*
${FREE_DIRECTORY_SERVICE.unverifiedNote}

📋 *المميزات المتاحة في الإدراج المجاني:*
• ظهور اسم المنشأة وتصنيفها للجمهور.
• عرض أرقام التواصل وروابط الواتساب المباشرة.
• ربط وتوجيه العنوان لموقعكم المعتمد على الخريطة.
• عرض مواعيد وساعات العمل طوال الأسبوع.
• بدون أي رسوم تسجيل وبدون أي اشتراكات دورية (مجاني 100%).
━━━━━━━━━━━━━━━━━━━━━
منظومة دليلك - دليل المحافظة المعتمد 🇪🇬`;

    navigator.clipboard.writeText(text);
    setCopyToast('✓ تم نسخ شروط وسياسة الإدراج المجاني بنجاح! جاهزة للمشاركة مع التاجر.');
    setTimeout(() => setCopyToast(null), 4000);
  };

  // Copy corporate pitch
  const copyCorporatePitch = () => {
    const text = `*باقة الشركات والمشاريع الكبرى والمحلات تحت التجهيز 🏢*
━━━━━━━━━━━━━━━━━━━━━
✨ حلول مؤسسية متكاملة مقدمة من منصة دليلك للشركات والمصانع وسلاسل الفروع:

👑 *محاور الخدمة المؤسسية:*
1. *الهوية البصرية واللافتات الميدانية:* تصميم الشعار، دليل الهوية، المطبوعات، ولوحات الفروع.
2. *ربط وتوثيق الفروع الموحد:* تأسيس مركزي لجميع الفروع على Google Maps ومحركات البحث.
3. *حملات الافتتاح والانتشار:* تخطيط وإدارة حملات الترويج الموجهة لانطلاقة قوية وزيادة الزبائن.
4. *برامج الولاء والأنظمة الذكية:* بناء منظومات تكرار الشراء والربط مع خدمة العملاء والمناديب.

💼 *يتم تحديد التكلفة والعرض المالي بناءً على عدد الفروع ونطاق التجهيز المطلوب.*
━━━━━━━━━━━━━━━━━━━━━
منظومة دليلك - شريك التأسيس والتطوير المؤسسي 🇪🇬`;

    navigator.clipboard.writeText(text);
    setCopyToast('✓ تم نسخ محاور عرض الشركات والمشاريع الكبرى بنجاح!');
    setTimeout(() => setCopyToast(null), 4000);
  };

  // Direct WhatsApp proposal launcher for a specific business
  const sendPackageToBusinessDirectly = (biz: Business, pkg: (typeof detailedPackages)[0]) => {
    const phone = (biz.ownerPhone || biz.phone || '').replace(/[^0-9]/g, '');
    let formattedPhone = phone;
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '2' + formattedPhone;
    } else if (!formattedPhone.startsWith('20') && formattedPhone.length === 10) {
      formattedPhone = '20' + formattedPhone;
    }

    const priceText = pkg.priceLabel ? pkg.priceLabel : `${pkg.price.toLocaleString('en-US')} ج.م`;
    const ownerName = biz.ownerName ? `أستاذ/ة ${biz.ownerName}` : 'أصحاب وإدارة المنشأة';
    const bizName = biz.name || 'نشاطكم التجاري';

    const msg = `السلام عليكم ورحمة الله وبركاته، تحياتنا لكم ${ownerName} 🌸
بخصوص منشأتكم الكريمة: *«${bizName}»*

يسر فريق العمل بمنظومة دليلك تقديم هذا المقترح لتطوير ومضاعفة ظهور نشاطكم:

💎 *«${pkg.title}»*
💰 *قيمة الاستثمار:* ${priceText}
⏱️ *مدة التنفيذ والتسليم:* ${pkg.deliveryTime}

📋 *أبرز ما تشمله الباقة لنشاطكم:*
${pkg.highlights.map(h => `• ${h}`).join('\n')}

💡 *لماذا هذه الباقة بالذات لنشاطكم؟*
${pkg.targetAudience}

جاهزون للبدء والتنفيذ الفوري بمجرد تأكيدكم، ويسعدنا الإجابة على أي استفسار.
━━━━━━━━━━━━━━━━━━━━━
*منظومة دليلك - الإدارة والتوثيق الميداني الرسمي*`;

    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`, '_blank');
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

  // Filtered businesses for picker
  const searchFilteredBiz = businesses.filter(b => 
    b.name?.toLowerCase().includes(bizPickerSearch.toLowerCase()) ||
    b.ownerName?.toLowerCase().includes(bizPickerSearch.toLowerCase()) ||
    b.ownerPhone?.includes(bizPickerSearch) ||
    b.phone?.includes(bizPickerSearch) ||
    b.governorate?.toLowerCase().includes(bizPickerSearch.toLowerCase())
  );

  return (
    <div className="space-y-5 font-['Cairo',sans-serif] text-[var(--text-primary)]">
      {/* ========================================================================= */}
      {/* 1. HERO OPERATIONAL BANNER */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 text-slate-950 p-4 sm:p-5 rounded-2xl shadow-lg relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative z-10 space-y-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="bg-slate-950/20 text-slate-950 text-[10.5px] sm:text-xs font-black px-3 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
              <span>المرجع التشغيلي والتسويقي للمناديب والإداريين</span>
              <span>💎</span>
            </span>
          </div>
          <h2 className="text-lg sm:text-2xl font-black tracking-tight leading-snug">
            دليل وشرح باقات خدمات منصة دليلك في مصر 🚀
          </h2>
          <p className="text-xs sm:text-xs font-bold text-slate-900/90 leading-relaxed">
            المرجع الكامل لتوجيه وإقناع أصحاب الأنشطة التجارية؛ يتضمن مميزات كل باقة بدقة، وأسلوب الشرح في دقيقة، والردود على الاعتراضات، مع إمكانية نسخ تفاصيل العرض أو إرساله مباشرة للمنشأة عبر واتساب.
          </p>
        </div>

        <div className="relative z-10 shrink-0 self-end sm:self-center flex items-center gap-2">
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
      {/* 1.5. STANDALONE FREE DIRECTORY LISTING POLICY (سياسة وإشعار الإدراج المجاني) */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-[var(--bg-card)] to-teal-500/10 border-2 border-emerald-500/60 rounded-2xl p-4 sm:p-5 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[10.5px] font-black px-2.5 py-0.5 rounded-full border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>سياسة إدراج المنشأة مجاناً 100% (توجيه إداري وتشغيلي)</span>
          </div>
          <h3 className="font-black text-sm sm:text-base text-[var(--text-primary)]">
            شرط الظهور المجاني في الدليل: وجود موقع موثق مسبقاً على Google Maps
          </h3>
          <p className="text-xs text-[var(--text-secondary)] font-bold leading-relaxed">
            {FREE_DIRECTORY_SERVICE.condition} نوفر للنشاط ظهوراً وإدراجاً كاملاً في دليل المحافظة مجاناً وبدون أي رسوم تسجيل.
          </p>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 text-xs text-amber-800 dark:text-amber-300 font-bold flex items-start gap-2">
            <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              <strong>💡 توجيه المندوب إذا لم يكن للمكان موقع موثق:</strong> لا يتم إدراجه مجاناً ويتم توجيهه إلى{' '}
              <button
                type="button"
                onClick={() => setSelectedPkgId('pkg_basic')}
                className="underline font-black text-blue-600 dark:text-blue-400 cursor-pointer"
              >
                «باقة التوثيق الأساسي» (250 ج.م)
              </button>{' '}
              لتفعيل وتثبيت موقعه الجغرافي رسمياً أولاً.
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 w-full md:w-auto">
          <button
            type="button"
            onClick={copyFreeListingConditions}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
            title="نسخ نص شروط وسياسة الإدراج المجاني لمشاركتها مع التاجر"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>نسخ شروط وسياسة الإدراج المجاني للعميل 📋</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPkgId('pkg_basic')}
            className="px-4 py-2.5 rounded-xl bg-blue-600/10 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-400 border border-blue-500/30 font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>معاينة باقة التوثيق (250 ج)</span>
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
            <span>اختر تصنيف الباقات المناسب لمرحلة مشروع العميل:</span>
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
            title="انقر للانتقال المباشر لتفاصيل هذه الباقة ودليل شرحها"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
              <div className="text-xs font-black text-[var(--text-primary)] truncate">
                <span className="text-amber-600 dark:text-amber-400">👇 تفاصيل ودليل شرح</span>
                {' '}
                <span className="text-[var(--text-primary)] font-black underline decoration-amber-500 underline-offset-4">
                  «{selectedPkg.shortName}»
                </span>
                {' '}
                <span className="text-[var(--text-muted)] font-normal text-[11px] hidden sm:inline">
                  ({selectedPkg.priceLabel || (selectedPkg.price === 0 ? 'تسعير مخصص' : `${selectedPkg.price.toLocaleString('en-US')} ج.م`)})
                </span>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-1.5 text-xs font-black text-amber-600 dark:text-amber-400 group-hover:translate-y-0.5 transition-transform">
              <span>تصفح المميزات ودليل التوجيه أدناه</span>
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

                {/* Instant Decision Actions (Two Clear Buttons: Details + Copy) */}
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

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyPackagePitch(pkg);
                    }}
                    className="px-3 py-2.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300 font-black text-xs flex items-center justify-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer shrink-0 border border-emerald-500/30"
                    title="نسخ تفاصيل وعرض الباقة للتاجر"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedPkgId === pkg.id ? 'تم النسخ ✓' : 'نسخ 📋'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DETAILED VIEW FOR SELECTED PACKAGE (Dynamic Operational Showcase Box) */}
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
                  {selectedPkg.priceLabel || (selectedPkg.price === 0 ? 'تسعير مخصص' : `${selectedPkg.price.toLocaleString('en-US')} ج.م`)}
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

        {/* 2-Columns Grid: Deliverables & Rep Sales Guidance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Column 1: Deliverables & Target Audience */}
          <div className="space-y-4">
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
          </div>

          {/* Column 2: Rep Sales Guide (Pitching Hook & Objection Handling) */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-3.5">
              {/* Sales Guidance for Reps */}
              <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-yellow-500/10 p-4 sm:p-5 rounded-2xl border-2 border-amber-500/40 space-y-3.5 shadow-sm">
                <div className="flex items-center justify-between border-b border-amber-500/25 pb-2.5">
                  <h4 className="font-black text-xs sm:text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>🎯 دليل توجيه وشرح الباقة للتاجر (خاص بالمناديب والإداريين):</span>
                  </h4>
                  <span className="text-[10.5px] bg-amber-500 text-slate-950 font-black px-2.5 py-0.5 rounded-md shadow-xs">
                    دليل المبيعات 💼
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border-color)] space-y-1">
                    <span className="font-black text-amber-600 dark:text-amber-400 block text-[11px]">
                      ⚡ كيف تشرح الباقة لصاحب المحل في 30 ثانية؟
                    </span>
                    <p className="text-[var(--text-primary)] font-bold leading-relaxed">
                      "{selectedPkg.pitchGuide?.hook || selectedPkg.summary}"
                    </p>
                  </div>

                  <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border-color)] space-y-1">
                    <span className="font-black text-blue-600 dark:text-blue-400 block text-[11px]">
                      🎯 متى تقترح هذه الباقة تحديداً على التاجر؟
                    </span>
                    <p className="text-[var(--text-secondary)] font-bold leading-relaxed">
                      {selectedPkg.pitchGuide?.need || selectedPkg.targetAudience}
                    </p>
                  </div>

                  <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border-color)] space-y-1">
                    <span className="font-black text-emerald-600 dark:text-emerald-400 block text-[11px]">
                      🛡️ الرد الاحترافي على اعتراضات العميل الشائعة:
                    </span>
                    <p className="text-[var(--text-secondary)] font-bold leading-relaxed">
                      {selectedPkg.pitchGuide?.objection}
                    </p>
                  </div>
                </div>
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

            {/* Direct Operational Action Buttons (No External WA Order Button) */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
              {/* Button 1: Copy Pitch */}
              <button
                type="button"
                onClick={() => copyPackagePitch(selectedPkg)}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                title="نسخ صيغة العرض والمميزات الكاملة لمشاركتها مع التاجر"
              >
                <Copy className="w-4 h-4" />
                <span>
                  {copiedPkgId === selectedPkg.id ? 'تم نسخ تفاصيل الباقة بنجاح ✓' : 'نسخ تفاصيل ومميزات الباقة للتاجر 📋'}
                </span>
              </button>

              {/* Button 2: Send to Specific Business */}
              <button
                type="button"
                onClick={() => {
                  if (businesses && businesses.length === 1 && onSendPackageBiz) {
                    onSendPackageBiz(businesses[0], selectedPkg.id);
                  } else {
                    setShowBizPickerModal(true);
                  }
                }}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 shadow-md shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer font-black"
                title="اختيار منشأة وإرسال هذا العرض لها مباشرة"
              >
                <Sparkles className="w-4 h-4 stroke-[2.5]" />
                <span>إرسال الباقة لنشاط محدد 💎</span>
              </button>

              {/* Button 3: Select for Form (if provided) */}
              {onSelectPackage && (
                <button
                  type="button"
                  onClick={() => handleSelectForForm(selectedPkg.title)}
                  className="w-full sm:w-auto py-3 px-4 rounded-xl font-black text-xs bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-primary)] border border-[var(--border-color)] flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>تحديد في الاستمارة 📝</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3.5. ENTERPRISE SOLUTIONS (باقة الشركات والمشاريع الكبرى) */}
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

          <button
            type="button"
            onClick={copyCorporatePitch}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-transform active:scale-95 shrink-0 cursor-pointer"
          >
            <Copy className="w-4 h-4" />
            <span>نسخ محاور عرض الشركات والمشاريع الكبرى 📋</span>
          </button>
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
              مقارنة تفصيلية دقيقة بين الباقات المعتمدة لتوضيح الفروقات للعملاء والأنشطة
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

      {/* ========================================================================= */}
      {/* 5. BUSINESS SELECTOR MODAL (نافذة اختيار النشاط لإرسال العرض المخصص) */}
      {/* ========================================================================= */}
      {showBizPickerModal && (
        <div className="fixed inset-0 z-[10001] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-[var(--modal-bg)] border-2 border-amber-500/50 rounded-3xl max-w-xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col text-[var(--text-primary)]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-black">
                  <Sparkles className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-[var(--text-primary)]">
                    إرسال عرض «{selectedPkg.shortName}» إلى منشأة 💎
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] font-bold">
                    اختر النشاط التجاري لإرسال هذا العرض المخصص له فوراً عبر واتساب
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBizPickerModal(false)}
                className="w-8 h-8 rounded-full bg-[var(--input-bg)] hover:text-rose-500 flex items-center justify-center cursor-pointer border border-[var(--border-color)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={bizPickerSearch}
                onChange={(e) => setBizPickerSearch(e.target.value)}
                placeholder="ابحث باسم النشاط، اسم المالك، رقم الهاتف، أو المحافظة..."
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl py-2.5 pr-10 pl-4 text-xs font-bold focus:outline-none focus:border-amber-500 text-[var(--text-primary)]"
                autoFocus
              />
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute top-3 right-3.5" />
            </div>

            {/* List of Businesses */}
            <div className="overflow-y-auto flex-1 space-y-2 pr-1 custom-scrollbar">
              {(!businesses || businesses.length === 0) ? (
                <div className="p-6 text-center text-xs text-[var(--text-muted)] font-bold bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)] space-y-2">
                  <p>لا توجد أنشطة مسجلة محملة حالياً في هذه القائمة.</p>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400">
                    يمكنك استخدام زر «نسخ تفاصيل ومميزات الباقة للتاجر» ولصقها مباشرة في محادثة واتساب الخاصة بالعميل.
                  </p>
                </div>
              ) : searchFilteredBiz.length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--text-muted)] font-bold bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)]">
                  لا توجد منشأة مطابقة للبحث "{bizPickerSearch}"
                </div>
              ) : (
                searchFilteredBiz.slice(0, 20).map((biz) => {
                  const phone = biz.ownerPhone || biz.phone || '';
                  return (
                    <div
                      key={biz.id}
                      className="p-3 bg-[var(--bg-surface)] hover:bg-amber-500/5 rounded-2xl border border-[var(--border-color)] hover:border-amber-500/40 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <h4 className="font-black text-xs text-[var(--text-primary)] truncate">
                          {biz.name}
                        </h4>
                        <div className="text-[10.5px] text-[var(--text-muted)] font-bold flex items-center gap-2 flex-wrap">
                          {biz.ownerName && <span>المالك: {biz.ownerName}</span>}
                          {phone && <span className="font-mono text-emerald-600 dark:text-emerald-400">{phone}</span>}
                          {biz.governorate && <span>📍 {biz.governorate}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {onSendPackageBiz ? (
                          <button
                            type="button"
                            onClick={() => {
                              setShowBizPickerModal(false);
                              onSendPackageBiz(biz, selectedPkg.id);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow-xs cursor-pointer transition-all active:scale-95"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>تجهيز العرض</span>
                          </button>
                        ) : null}

                        {phone ? (
                          <button
                            type="button"
                            onClick={() => {
                              sendPackageToBusinessDirectly(biz, selectedPkg);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1 shadow-xs cursor-pointer transition-all active:scale-95"
                            title="إرسال مباشر عبر واتساب"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>واتساب 💬</span>
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-[var(--border-color)] flex justify-between items-center text-[11px] text-[var(--text-muted)] font-bold">
              <span>إجمالي المنشآت: {businesses.length}</span>
              <button
                type="button"
                onClick={() => setShowBizPickerModal(false)}
                className="px-4 py-1.5 rounded-xl bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-primary)] font-bold cursor-pointer transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Copy Feedback Toast Banner */}
      {copyToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10002] bg-slate-950 text-emerald-400 border-2 border-emerald-500 shadow-2xl rounded-2xl px-5 py-3 text-xs sm:text-sm font-black flex items-center gap-2.5 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{copyToast}</span>
        </div>
      )}
    </div>
  );
};
