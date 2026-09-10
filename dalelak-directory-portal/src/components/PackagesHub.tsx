import React, { useState } from 'react';
import { 
  Check, 
  Copy, 
  MessageCircle, 
  X, 
  Sparkles, 
  Building2, 
  MapPin, 
  Zap, 
  ShieldCheck, 
  Camera, 
  Crown, 
  Smartphone, 
  Award,
  Search,
  CheckCircle2,
  ArrowLeft,
  ChevronDown
} from 'lucide-react';
import { Business } from '../types';

export interface PackagesHubProps {
  initialPackageId?: string;
  onSelectPackage?: (packageTitle: string) => void;
  onClose?: () => void;
  mode?: 'admin' | 'public';
  businesses?: Business[];
  onSendPackageBiz?: (biz: Business, packageId?: string) => void;
}

export interface GoogleStylePackage {
  id: string;
  track: 'foundational' | 'growth' | 'digital';
  name: string;
  badge?: string;
  price: number;
  priceText: string;
  billingCadence: string;
  isPopular?: boolean;
  shortDesc: string;
  forWhom: string;
  deliveryTime: string;
  icon: any;
  deliverables: string[];
  fullFeatures: { title: string; desc: string }[];
  pitchGuide: {
    hook: string;
    need: string;
    objection: string;
  };
}

export const PackagesHub: React.FC<PackagesHubProps> = ({
  initialPackageId,
  onSelectPackage,
  onClose,
  mode = 'public',
  businesses = [],
  onSendPackageBiz
}) => {
  const [activeTrack, setActiveTrack] = useState<'foundational' | 'growth' | 'digital'>('foundational');
  const [detailModalPkg, setDetailModalPkg] = useState<GoogleStylePackage | null>(null);
  const [copiedPkgId, setCopiedPkgId] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [showBizPicker, setShowBizPicker] = useState<boolean>(false);
  const [bizPickerSearch, setBizPickerSearch] = useState<string>('');
  const [selectedBizPkg, setSelectedBizPkg] = useState<GoogleStylePackage | null>(null);
  const [expandedPkgIds, setExpandedPkgIds] = useState<Record<string, boolean>>({});
  const [isCorporateExpanded, setIsCorporateExpanded] = useState<boolean>(false);

  const toggleExpand = (pkgId: string) => {
    setExpandedPkgIds(prev => ({
      ...prev,
      [pkgId]: !prev[pkgId]
    }));
  };

  // 3 Primary Categories (No Bloat, Google Minimalist Standard)
  const TRACKS: { id: 'foundational' | 'growth' | 'digital'; label: string }[] = [
    { id: 'foundational', label: 'التوثيق والتأسيس' },
    { id: 'growth', label: 'التسويق والنمو' },
    { id: 'digital', label: 'الحلول الرقمية' },
  ];

  // The 7 Standard Packages in the 3 Tracks
  const PACKAGES: GoogleStylePackage[] = [
    // -----------------------------------------------------------------
    // المسار 1: التوثيق والتأسيس (Foundational)
    // -----------------------------------------------------------------
    {
      id: 'pkg_basic',
      track: 'foundational',
      name: 'توثيق الموقع على Google Maps',
      badge: 'توثيق رسمي',
      price: 250,
      priceText: '250 ج.م',
      billingCadence: 'سداد لمرة واحدة',
      shortDesc: 'تثبيت الموقع الجغرافي للمنشأة بدقة معتمدة وتحديث قنوات التواصل.',
      forWhom: 'للعيادات، الصيدليات، المكاتب المهنية، الشركات، والمتاجر التي ليس لها موقع جغرافي موثق بدقة على الخريطة.',
      deliveryTime: '24 - 48 ساعة عمل',
      icon: MapPin,
      deliverables: [
        'تثبيت الموقع الجغرافي للمنشأة بدقة GPS معتمدة على خرائط Google',
        'تسجيل الاسم الرسمي والنشاط وأرقام التواصل وقنوات الاتصال وساعات العمل',
        'رفع الصور الرسمية للمقر والواجهة والخدمات بجودة عالية تعزز الموثوقية',
        'فاتورة إلكترونية معتمدة برمز QR مع ملصق باركود تفاعلي للمقر'
      ],
      fullFeatures: [
        { title: 'التثبيت الجغرافي المعتمد', desc: 'ربط مقر المنشأة بإحداثيات دقيقة تظهر مباشرة للباحثين في محيطكم الجغرافي عبر الهواتف الذكية.' },
        { title: 'تحديث قنوات التواصل وساعات العمل', desc: 'إدراج أرقام الهواتف، رابط الواتساب، وأوقات العمل الرسمية لتسهيل وصول ومراجعة العملاء.' },
        { title: 'معالجة الهوية البصرية وصور المقر', desc: 'عرض الواجهة والشعار الداخلي وتجهيزات المكان بجودة واضحة تعكس جاهزية المنشأة.' },
        { title: 'فاتورة رسمية وملصق تفاعلي', desc: 'إصدار مستند إلكتروني رسمي للخدمة مع تصميم رمز QR تفاعلي لتوجيه الزوار مباشرة لموقعكم.' }
      ],
      pitchGuide: {
        hook: 'عدم دقة موقع المنشأة على خرائط Google يسبب صعوبة وصول المراجعين والعملاء؛ في 24 ساعة نثبت مقركم رسمياً بإحداثيات دقيقة وبيانات معتمدة وفاتورة رسمية.',
        need: 'لأي منشأة طبية، مهنية، خدمية، أو تجارية غير مسجلة على الخرائط أو ذات بيانات غير محدثة.',
        objection: 'توضيح أن المراجعين الجدد والباحثين عبر الهواتف الذكية يعتمدون كلياً على خرائط Google لحساب المسافة وساعات العمل والوصول المباشر.'
      }
    },
    {
      id: 'pkg_pro',
      track: 'foundational',
      name: 'التأسيس الرقمي وإطلاق الحملة',
      badge: 'الأكثر طلباً',
      isPopular: true,
      price: 750,
      priceText: '750 ج.م',
      billingCadence: 'سداد لمرة واحدة',
      shortDesc: 'تأسيس المنصات الرسمية وربط قنوات الحجز المباشر وإطلاق إعلان تعريفي.',
      forWhom: 'للمنشآت الطبية، المكاتب الاستشارية، الشركات، والأنشطة التجارية التي ترغب في تأسيس واجهة رقمية متكاملة.',
      deliveryTime: '3 أيام عمل مع مرافقة تنفيذية',
      icon: Zap,
      deliverables: [
        'إنشاء وتنسيق المنصات الرسمية بهوية متناسقة تعبر عن مكانة المنشأة',
        'ربط زر المحادثة الفورية بالواتساب وقنوات الاتصال لتلقي الاستفسارات والحجوزات',
        'تصميم إعلان تعريفي احترافي يبرز خدمات أو منتجات المنشأة بمظهر راقٍ',
        'مرافقة واستشارات تنفيذية لمدة 3 أيام لضبط التفاعل واستقبال أولى الاستفسارات'
      ],
      fullFeatures: [
        { title: 'تأسيس المنصات الرقمية الرسمية', desc: 'تهيئة الحسابات بهوية بصرية متناسقة مع الشعار والنشاط الرسمي تعزز الثقة لدى المراجعين والعملاء.' },
        { title: 'تفعيل قنوات الاستفسار المباشر', desc: 'توجيه الراغبين بالاستفسار والحجز فوراً إلى واتساب المنشأة دون أي حواجز تقنية.' },
        { title: 'تصميم إعلان تعريفي عالي الدقة', desc: 'إخراج مواد ترويجية تعكس جودة الخدمات المقدمة وتبرز القيمة التنافسية لنشاطكم.' },
        { title: 'صياغة محتوى مهني موجه', desc: 'كتابة نصوص تعريفية رصينة ومحفزة تخاطب الشريحة المستهدفة في نطاقكم الجغرافي.' },
        { title: 'مرافقة ودعم تنفيذي مباشر', desc: 'فريق العمل يرافقكم خطوة بخطوة لمدة 3 أيام للإرشاد حول استقبال الطلبات ونشر التحديثات.' }
      ],
      pitchGuide: {
        hook: 'الخيار الأساسي للمنشآت لتأسيس واجهة رقمية رسمية: ننشئ المنصات بهوية موحدة، ونربط التواصل المباشر لتلقي الحجوزات، مع تصميم إعلان تعريفي ومرافقة تنفيذية لـ 3 أيام.',
        need: 'للعيادات، المكاتب المهنية، والشركات والمتاجر التي تحتاج لانطلاقة رقمية منظمة وموثوقة دون تعقيدات تقنية.',
        objection: 'توضيح أن القيمة تكمن في تناسق الهوية، والربط الفني الصحيح مع قنوات الحجز، والتصميم الإعلاني الاحترافي، والدعم التنفيذي المباشر.'
      }
    },

    // -----------------------------------------------------------------
    // المسار 2: التسويق والنمو (Growth)
    // -----------------------------------------------------------------
    {
      id: 'pkg_reputation',
      track: 'growth',
      name: 'إدارة السمعة والتقييمات',
      badge: 'حماية الموثوقية',
      price: 950,
      priceText: '950 ج.م',
      billingCadence: 'سداد لمرة واحدة',
      shortDesc: 'رفع التقييمات الإيجابية وبطاقات QR ذكية لتقييم المراجعين فورياً.',
      forWhom: 'للمراكز الطبية والعيادات، مكاتب المحاماة والاستشارات، والأنشطة التي تمثل التقييمات ركيزة ثقة عملائها.',
      deliveryTime: '5 - 7 أيام عمل',
      icon: ShieldCheck,
      deliverables: [
        'فحص شامل لملف المنشأة الرقمي ومعالجة الملاحظات لتحسين التقييم العام',
        'منظومة تفاعلية لتشجيع المراجعين والعملاء الراضين على كتابة تقييمات إيجابية',
        'تصميم بطاقات وملصقات باركود ذكية (QR) لتقييم المنشأة فورياً بكاميرا الهاتف',
        'توجيه الشكاوى الحساسة إلى قنوات تواصل داخلية خاصة لمعالجتها باحترافية'
      ],
      fullFeatures: [
        { title: 'التدقيق الرقمي لملف المنشأة', desc: 'مراجعة كافة التقييمات السابقة وحماية المتوسط العام للمنشأة وصياغة حلول للملاحظات القائمة.' },
        { title: 'منظومة التقييم السريع عبر QR', desc: 'تيسير كتابة التقييمات على المراجعين والعملاء الفعليين بمسح رمز الاستجابة السريعة دون خطوات معقدة.' },
        { title: 'تجهيز بطاقات التقييم الميدانية', desc: 'تصميم مواد أنيقة توضع على مكاتب الاستقبال لحث الزوار على تقييم المنشأة.' },
        { title: 'قوالب الردود المهنية المعتمدة', desc: 'صياغة نماذج ردود راقية ومنهجية على المراجعات تعكس احترام إدارة المنشأة لمراجعيها.' }
      ],
      pitchGuide: {
        hook: 'أكثر من 85% من المراجعين والعملاء يراجعون تقييمات المنشأة على Google قبل حجز موعد أو زيارة المقر؛ هذه الباقة ترفع متوسط تقييمكم وتوفر بطاقات QR سريعة لجمع آراء عملائكم باحترافية.',
        need: 'للمراكز الصحية والعيادات والمكاتب الاستشارية والمنشآت التي ترغب في تعزيز مصداقيتها وتنمية تقييماتها الإيجابية.',
        objection: 'توضيح أن ارتفاع التقييم ينعكس بزيادة مباشرة في ثقة المراجعين ويعطي تفوقاً واضحاً على المنافسين في نتائج البحث المحلي.'
      }
    },
    {
      id: 'pkg_reels',
      track: 'growth',
      name: 'الإنتاج المرئي وإعلانات الفيديو',
      badge: 'إنتاج مرئي',
      price: 1250,
      priceText: '1,250 ج.م',
      billingCadence: 'سداد لمرة واحدة',
      shortDesc: 'إنتاج فيديوهات قصيرة احترافية (Reels) مع إطلاق حملة إعلانية جغرافية.',
      forWhom: 'للعيادات، المراكز المتخصصة، المكاتب، معارض المنتجات، والمطاعم التي تستفيد من إبراز بيئة العمل والتجهيزات بصرياً.',
      deliveryTime: '3 - 5 أيام عمل',
      icon: Camera,
      deliverables: [
        'إنتاج مقطعي فيديو قصيرين (2 Reels / Videos) بمونتاج وإخراج احترافي حديث',
        'صياغة سيناريو مركز يبرز نقاط التميز والتجهيزات في الثواني الأولى للمشاهد',
        'تصميم أغلفة مميزة وإدراج هوية المنشأة ومعلومات التواصل بوضوح',
        'إعداد وإطلاق حملة إعلانية ممولة تستهدف الجمهور المهتم في نطاقكم الجغرافي'
      ],
      fullFeatures: [
        { title: 'المونتاج والإخراج المرئي الاحترافي', desc: 'تنفيذ مقاطع مرئية بدقة عالية متوافقة مع كافة المنصات تبرز تفاصيل منشأتكم.' },
        { title: 'صياغة الرسالة التسويقية والسيناريو', desc: 'هيكلة الفكرة لتقديم خدمات المنشأة وميزاتها بأسلوب شيق وواضح يحفز المشاهد على التواصل.' },
        { title: 'إعداد الحملة الإعلانية الجغرافية', desc: 'ضبط الاستهداف لضمان وصول المقطع للجمهور والعملاء المحتملين في نطاق نشاطكم.' },
        { title: 'تسليم المواد بجودة كاملة', desc: 'إتاحة الفيديوهات بجودتها الأصلية لاستخدامها في كافة قنواتكم الرسمية.' }
      ],
      pitchGuide: {
        hook: 'المحتوى المرئي القصير هو الأسرع إقناعاً وبناءً للمصداقية: ننتج مقطعي فيديو احترافيين يبرزان مقركم وتجهيزاتكم وخدماتكم مع حملة إعلانية ممولة موجهة لنطاقكم الجغرافي.',
        need: 'للمنشآت الطبية والمهنية والتجارية التي ترغب في إظهار تميز مقراتها وخدماتها على الواقع للجمهور.',
        objection: 'توضيح أن المونتاج الاحترافي وضبط الصوت والألوان ينقل انطباعاً راقياً يعزز مكانة المنشأة في أعين المراجعين والعملاء.'
      }
    },
    {
      id: 'pkg_vip',
      track: 'growth',
      name: 'الإدارة التسويقية الشاملة (VIP)',
      badge: 'إدارة متكاملة',
      price: 2000,
      priceText: '2,000 ج.م',
      billingCadence: 'شهرياً (تجديد بـ 1,000 ج)',
      shortDesc: 'إدارة رقمية متكاملة: تصميم محتوى دوري، إدارة الحملات الإعلانية، ومتابعة مستمرة.',
      forWhom: 'لأصحاب المراكز الطبية، المكاتب الاستشارية، والشركات المشغولة بالتشغيل، والراغبة في تفويض التسويق لفريق متخصص.',
      deliveryTime: 'شهر كامل (30 يوماً متواصلة)',
      icon: Crown,
      deliverables: [
        'تصميم ونشر محتوى دوري منتظم يعكس هوية وتخصص المنشأة طوال الشهر (30 يوماً)',
        'إعداد وإدارة الحملات الإعلانية الممولة جغرافياً للوصول للعملاء المستهدفين بأفضل تكلفة',
        'تحسين ومعالجة المواد التعريفية وصور المنشأة وإخراجها بقوالب بصرية متناسقة',
        'استشارات تسويقية دورية مع إمكانية التجديد للشهر التالي بنصف التكلفة (1,000 ج)'
      ],
      fullFeatures: [
        { title: 'التصميم والنشر الدوري المتخصص', desc: 'إعداد تصاميم ومواد تعريفية تتناسب مع طبيعة تخصص المنشأة وتبرز خدماتها بانتظام.' },
        { title: 'إدارة الحملات الإعلانية الرقمية', desc: 'ضبط الإعلانات واستهداف الجمهور المناسب جغرافياً ومهنياً لتقليل تكلفة الاستفسار والحجز.' },
        { title: 'إدارة السمعة والتفاعل المهني', desc: 'متابعة المراجعات وصياغة الردود المهنية التي تعكس اهتمام المنشأة بعملائها ومراجعيها.' },
        { title: 'ميزة التجديد التفضيلية', desc: 'إمكانية الاستمرار في الإدارة التسويقية للشهر الثاني وما بعده بنصف القيمة فقط (1,000 ج).' }
      ],
      pitchGuide: {
        hook: 'بدلاً من تكبد أعباء المتابعة والتصميم وإدارة الإعلانات: يتولى فريق متخصص إدارة منصاتكم وحملاتكم الإعلانية طوال الشهر بتكلفة 2,000 ج، مع إمكانية التجديد بـ 1,000 ج شهرياً.',
        need: 'للأطباء والمحامين والاستشاريين ومديري الشركات المشغولين بإدارة العمل اليومي والراغبين في إدارة تسويقية متكاملة.',
        objection: 'توضيح أن توظيف مسوق أو مصمم يتطلب رواتب تفوق هذا المبلغ بأضعاف، بينما تقدم الباقة فريقاً متكاملاً بمرونة تامة وتكلفة تفضيلية.'
      }
    },

    // -----------------------------------------------------------------
    // المسار 3: الحلول الرقمية (Digital)
    // -----------------------------------------------------------------
    {
      id: 'pkg_smart_menu',
      track: 'digital',
      name: 'القائمة والكتالوج الرقمي (Smart QR)',
      badge: 'كتالوج ذكي',
      price: 3500,
      priceText: '3,500 ج.م',
      billingCadence: 'سداد لمرة واحدة',
      shortDesc: 'قائمة وكتالوج تفاعلي بمسح الباركود، مع حجز واستفسار فوري عبر الواتساب.',
      forWhom: 'للعيادات والمراكز (قائمة الخدمات والأسعار)، ومكاتب الاستشارات، ومعارض التجزئة، والمطاعم والكافيهات.',
      deliveryTime: '5 - 7 أيام عمل',
      icon: Smartphone,
      deliverables: [
        'كتالوج وقائمة رقمية تفاعلية تفتح بمسح الباركود بكاميرا الهاتف دون تحميل تطبيقات',
        'نظام سلة وحجز فوري يرسل تفاصيل الخدمة أو الطلب مباشرة إلى واتساب المنشأة دون وسيط',
        'لوحة تحكم سهلة من الهاتف لتعديل الأسعار والخدمات والأصناف المتاحة في أي وقت',
        'تصميم ستاندات وبطاقات QR فاخرة للاستقبال والمكاتب لتيسير استعراض الخدمات والطلب'
      ],
      fullFeatures: [
        { title: 'منظومة العرض الرقمي السريع', desc: 'تصفح انسيابي وسريع متوافق مع كافة الهواتف والشاشات يفتح فوراً بمسح رمز الاستجابة السريعة (QR).' },
        { title: 'نظام الاستفسار والطلب المباشر', desc: 'يتيح للعميل أو المراجع تحديد الخدمات المطلوبة وإرسالها مرتبة مباشرة إلى واتساب المنشأة.' },
        { title: 'لوحة إدارة الخدمات والأسعار الفورية', desc: 'تحديث الأسعار وإضافة خدمات جديدة أو تعديل العروض بكل مرونة دون الحاجة لأي برمجة.' },
        { title: 'تصميم مواد العرض الميدانية', desc: 'تصميمات أنيقة لوضع الرموز التفاعلية على مكاتب الاستقبال أو نقاط العرض.' }
      ],
      pitchGuide: {
        hook: 'قائمة رقمية وكتالوج تفاعلي بـ QR Code: يتيح لعملائكم ومراجعيكم استعراض الخدمات، التخصصات، والأسعار، وإرسال طلب الحجز فوراً عبر واتساب المنشأة بمرونة تامة وتحديث فوري للأسعار.',
        need: 'للمراكز الطبية والمكاتب الاستشارية ومعارض المنتجات والمطاعم التي ترغب في تجربة استعراض حديثة توفر تكاليف المطبوعات الورقية.',
        objection: 'توضيح أن المطبوعات تتطلب إعادة طباعة مكلفة مع أي تعديل، بينما يتيح الكتالوج الرقمي التعديل فوراً ويقدم تجربة عصرية للعملاء.'
      }
    },
    {
      id: 'pkg_annual_partner',
      track: 'digital',
      name: 'الرعاية والتوثيق السنوي المعتمد',
      badge: 'رعاية سنوية',
      price: 6000,
      priceText: '6,000 ج.م',
      billingCadence: 'سنوياً (توفير 50%)',
      shortDesc: 'تصدر دائم لنتائج البحث بدليل المحافظة وشارة التوثيق الذهبية وتحديثات دورية.',
      forWhom: 'للمنشآت المستقرة، الصروح الطبية، مكاتب الاستشارات، والشركات التي تسعى لترسيخ موقعها في المحافظة طوال العام.',
      deliveryTime: 'سنة كاملة (12 شهراً)',
      icon: Award,
      deliverables: [
        'تثبيت وظهور دائم في صدارة نتائج البحث في دليل المحافظة على مدار 12 شهراً',
        'منح المنشأة شارة التوثيق الذهبية المعتمدة كعلامة ثقة رسمية معلنة للجمهور',
        'تمييز موقع وشعار المنشأة على الخريطة التفاعلية للدليل للمستخدمين في النطاق المحيط',
        'تحديثات دورية ربع سنوية (4 مرات بالعام) للبيانات والصور والخدمات لمواكبة التطورات'
      ],
      fullFeatures: [
        { title: 'التصدر الدائم لنتائج البحث', desc: 'ظهور المنشأة كأبرز نتيجة موصى بها في تصنيفها ونطاقها الجغرافي أمام آلاف الباحثين شهرياً.' },
        { title: 'شارة الشريك المعتمد رسمياً', desc: 'علامة توثيق ذهبية تمنح الثقة التامة للعملاء والمراجعين وترفع معدلات التواصل المباشر.' },
        { title: 'إبراز العلامة على الخريطة التفاعلية', desc: 'أيقونة مميزة تلفت أنظار الباحثين في المحافظة والمدن المجاورة.' },
        { title: 'التحديثات الدورية الموسمية', desc: 'مراجعة وتحديث الصور والمواد التعريفية والعروض كل 3 أشهر لمواكبة كافة الفترات.' }
      ],
      pitchGuide: {
        hook: 'رعاية سنوية استراتيجية تضمن ظهور منشأتكم في صدارة نتائج البحث بالمحافظة كأول اختيار موصى به، مع شارة التوثيق الذهبية المعتمدة وتحديثات دورية طوال 12 شهراً.',
        need: 'للجهات والمؤسسات الطبية والمهنية والتجارية الراغبة في حماية وتنمية ريادتها الرقمية بثبات واقتصادية عالية.',
        objection: 'توضيح أن القيمة السنوية توفر أكثر من 50% مقارنة بالاشتراكات الشهرية المنفصلة، وتضمن استقرار الصدارة وشارة الثقة الرسمية طوال العام.'
      }
    }
  ];

  // Enterprise Solution (Placed cleanly at bottom)
  const CORPORATE_PACKAGE: GoogleStylePackage = {
    id: 'pkg_corporate',
    track: 'digital',
    name: 'حلول الشركات وسلاسل الفروع الكبرى',
    badge: 'حلول مؤسسية',
    price: 0,
    priceText: 'تسعير مخصص حسب المشروع',
    billingCadence: 'دراسة مخصصة للمشروع',
    shortDesc: 'الهوية المؤسسية الكاملة وتأسيس رقمي وميداني موحد لكافة الفروع وحملات إطلاق كبرى.',
    forWhom: 'للشركات والمصانع، المجمعات والمراكز الطبية الكبرى، ومكاتب الاستشارات والأنشطة متعددة الفروع.',
    deliveryTime: 'حسب الجدول الزمني للمشروع',
    icon: Building2,
    deliverables: [
      'تطوير الهوية المؤسسية الكاملة (الشعار، دليل الهوية البصرية، والمطبوعات الرسمية)',
      'تأسيس وتوثيق رقمي موحد لكافة الفروع والمواقع على الخرائط والمنصات الرسمية',
      'تخطيط وإدارة حملات الإطلاق والافتتاح الكبرى لتحقيق أعلى تفاعل وحضور ميداني ورقمي',
      'جلسة استشارية متخصصة مع الإدارة التنفيذية وتقديم دراسة فنية ومالية مفصلة'
    ],
    fullFeatures: [
      { title: 'بناء وتطوير الهوية المؤسسية الكاملة', desc: 'تصميم الشعار ودليل استخدام الهوية والألوان بجميع الصيغ الأصلية المعدة للطباعة والوسائط الرقمية.' },
      { title: 'تصميم المطبوعات واللافتات الميدانية', desc: 'تصميم واجهات الفروع، اللوحات الإرشادية، المطبوعات الرسمية، وبطاقات العمل لكوادر المنشأة.' },
      { title: 'التأسيس الرقمي الموحد لشبكة الفروع', desc: 'ربط وتوثيق كافة الفروع والمواقع على خرائط Google والمنصات لسهولة وصول المراجعين لأقرب فرع.' },
      { title: 'تخطيط وإدارة حملات الافتتاح الكبرى', desc: 'خطة إطلاق ترويجية تضمن حضوراً قوياً وتفاعلاً متصاعداً من أول يوم تشغيل رسمي.' }
    ],
    pitchGuide: {
      hook: 'تأسيس مؤسسي شامل لسلاسل الفروع والشركات والمجمعات الكبرى: نطور الهوية الموحدة، ونوثق كافة المواقع، ونضع خطة إطلاق شاملة تضمن حضوراً قوياً من أول يوم.',
      need: 'للشركات متعددة الفروع، المجمعات الطبية، والصروح المهنية في مرحلة التجهيز أو التوسع الإقليمي.',
      objection: 'توضيح أن الجلسة الاستشارية تهدف لتحديد نطاق العمل الدقيق وتقديم عرض مالي وفني مفصل يلائم متطلبات المشروع الفعلية.'
    }
  };

  const currentTrackPackages = PACKAGES.filter(p => p.track === activeTrack);

  // Proposal Copy for Admin
  const copyProposal = (pkg: GoogleStylePackage) => {
    const text = `السلام عليكم ورحمة الله وبركاته،
تحياتنا لكم، يسعدنا في «منظومة دليلك» تقديم تفاصيل العرض المقترح:

*«${pkg.name}»*
- التصنيف: ${pkg.badge || 'معتمد'}
- التكلفة: *${pkg.priceText}* (${pkg.billingCadence})
- مدة التنفيذ والتسليم: *${pkg.deliveryTime}*

الفئة المستهدفة:
${pkg.forWhom}

━━━━━━━━━━━━━━━━━━━━━
المخرجات والخدمات التنفيذية:
${pkg.deliverables.map(d => `• ${d}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━
نوفر فاتورة رسمية معتمدة برمز QR ومتابعة مستمرة.
يسعدنا الإجابة على استفساراتكم والبدء الفوري فور تأكيدكم.
منظومة دليلك - شريك التوثيق والتطوير الرقمي المعتمد في مصر`;

    navigator.clipboard.writeText(text);
    setCopiedPkgId(pkg.id);
    setCopyToast(`تم نسخ تفاصيل عرض «${pkg.name}» بنجاح.`);
    setTimeout(() => setCopiedPkgId(null), 2500);
    setTimeout(() => setCopyToast(null), 4000);
  };

  const sendDirectToBiz = (biz: Business, pkg: GoogleStylePackage) => {
    const phone = (biz.ownerPhone || biz.phone || '').replace(/[^0-9]/g, '');
    let formattedPhone = phone;
    if (formattedPhone.startsWith('0')) formattedPhone = '2' + formattedPhone;
    else if (!formattedPhone.startsWith('20') && formattedPhone.length === 10) formattedPhone = '20' + formattedPhone;

    const owner = biz.ownerName ? `أستاذ/ة ${biz.ownerName} المحترم/ة` : 'أصحاب وإدارة المنشأة المحترمين';
    const bizName = biz.name || 'منشأتكم الكريمة';

    const msg = `السلام عليكم ورحمة الله وبركاته،
تحياتنا لكم ${owner}، بخصوص منشأتكم الكريمة: *«${bizName}»*

يسر فريق العمل بمنظومة دليلك تقديم هذا المقترح لتطوير الحضور الرقمي والمهني لمنشأتكم:

*«${pkg.name}»*
- التكلفة: *${pkg.priceText}* (${pkg.billingCadence})
- مدة التنفيذ والتسليم: *${pkg.deliveryTime}*

أبرز المخرجات التنفيذية:
${pkg.deliverables.map(d => `• ${d}`).join('\n')}

جاهزون للبدء والتنفيذ فور تأكيدكم، ويشرفنا تواصلكم.
━━━━━━━━━━━━━━━━━━━━━
منظومة دليلك - شريك التوثيق والتطوير الرقمي المعتمد في مصر`;

    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const filteredBiz = businesses.filter(b =>
    b.name?.toLowerCase().includes(bizPickerSearch.toLowerCase()) ||
    b.ownerName?.toLowerCase().includes(bizPickerSearch.toLowerCase()) ||
    b.ownerPhone?.includes(bizPickerSearch) ||
    b.phone?.includes(bizPickerSearch)
  );

  return (
    <div className="space-y-6 font-['Cairo',sans-serif] text-[var(--text-primary)] max-w-6xl mx-auto py-2">
      {/* 1. Ultra-Clean Minimal Title (Zero Clutter, No Helper Wizard) */}
      <div className="text-center space-y-1">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          باقات وحلول منصة دليلك
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 font-medium">
          اختر المسار المناسب لاحتياج منشأتكم بأسعار معتمدة وتنفيذ فوري
        </p>
      </div>

      {/* 2. Three Main Category Tabs (Clean & Focused) */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 rounded-2xl bg-[var(--input-bg)] border border-[var(--border-color)] gap-1">
          {TRACKS.map((t) => {
            const isActive = activeTrack === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTrack(t.id)}
                className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Google-Style Clean Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch pt-2">
        {currentTrackPackages.map((pkg) => {
          const isPro = pkg.isPopular;

          return (
            <div
              key={pkg.id}
              className={`bg-[var(--bg-card)] rounded-2xl p-5 sm:p-6 border flex flex-col justify-between transition-all duration-200 ${
                isPro
                  ? 'border-amber-400 ring-1 ring-amber-400/40 shadow-md'
                  : 'border-[var(--border-color)] hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="space-y-4">
                {/* Header: Badge & Title */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-[var(--input-bg)] text-amber-700 border border-amber-400/30">
                      {pkg.badge}
                    </span>
                    {isPro && (
                      <span className="text-[10.5px] font-black text-amber-600 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>الأكثر طلباً</span>
                      </span>
                    )}
                  </div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900 leading-snug">
                    {pkg.name}
                  </h3>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {pkg.shortDesc}
                  </p>
                </div>

                {/* Price & Cadence */}
                <div className="pt-2 pb-1 border-t border-[var(--border-color)]">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
                      {pkg.priceText}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 block mt-0.5">
                    {pkg.billingCadence}
                  </span>
                </div>

                {/* Primary Action Button (Like Google AI Subscription Page) */}
                <div className="pt-1">
                  {mode === 'public' ? (
                    <a
                      href={`https://wa.me/201143888355?text=${encodeURIComponent(`مرحباً دليلك، أود الاستفسار والاشتراك في «${pkg.name}» (${pkg.priceText}).`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer ${
                        isPro
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      <MessageCircle className={`w-4 h-4 ${isPro ? 'text-slate-950' : 'text-emerald-400'}`} />
                      <span>طلب الباقة عبر واتساب</span>
                    </a>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copyProposal(pkg)}
                        className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer ${
                          isPro
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedPkgId === pkg.id ? 'تم النسخ ✓' : 'نسخ العرض للعميل'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBizPkg(pkg);
                          setShowBizPicker(true);
                        }}
                        className="py-2.5 px-3 rounded-xl bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-primary)] font-bold text-xs border border-[var(--border-color)] cursor-pointer"
                        title="إرسال لمنشأة محددة"
                      >
                        إرسال
                      </button>
                    </div>
                  )}
                </div>

                {/* Deliverables Checklist (Concise points like Google) */}
                <div className="space-y-2 pt-2 border-t border-[var(--border-color)] text-xs text-slate-700 font-medium">
                  {pkg.deliverables.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 leading-relaxed">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 stroke-[2.5]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

                {/* In-Card Accordion Dropdown (تنسدل البطاقة كنموذج Google) */}
                {expandedPkgIds[pkg.id] && (
                  <div className="pt-3.5 mt-2 border-t border-[var(--border-color)] space-y-3 animate-fade-in text-xs">
                    {/* Target Persona */}
                    <div className="p-3 bg-[var(--input-bg)] rounded-xl border border-[var(--border-color)]">
                      <span className="font-black text-amber-700 block mb-1 text-[11px]">
                        الفئة المستهدفة:
                      </span>
                      <p className="text-[11.5px] text-slate-700 font-medium leading-relaxed">
                        {pkg.forWhom}
                      </p>
                    </div>

                    {/* Detailed Features Breakdown */}
                    <div className="space-y-2">
                      <span className="font-black text-slate-900 block text-[11.5px]">
                        تفاصيل الخدمات والمخرجات المشمولة:
                      </span>
                      <div className="space-y-1.5">
                        {pkg.fullFeatures.map((feat, idx) => (
                          <div key={idx} className="p-2.5 bg-[var(--input-bg)] rounded-xl border border-[var(--border-color)] space-y-0.5">
                            <span className="font-bold text-slate-900 block text-xs">✓ {feat.title}</span>
                            <p className="text-[11px] text-slate-600 leading-relaxed">{feat.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Time */}
                    <div className="flex items-center justify-between p-2.5 bg-[var(--input-bg)] rounded-xl border border-[var(--border-color)] text-[11px]">
                      <span className="font-bold text-slate-500">مدة التنفيذ والتسليم:</span>
                      <span className="font-black text-amber-600">{pkg.deliveryTime}</span>
                    </div>

                    {mode === 'admin' && (
                      <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/30 space-y-1 text-[11px]">
                        <span className="font-black text-amber-700 block">دليل مندوب المبيعات:</span>
                        <p className="text-slate-700 leading-relaxed">{pkg.pitchGuide.hook}</p>
                      </div>
                    )}
                  </div>
                )}

              {/* Accordion Toggle (انزلاق وانسدال البطاقة) */}
              <div className="pt-3 mt-3 border-t border-[var(--border-color)] text-center">
                <button
                  type="button"
                  onClick={() => toggleExpand(pkg.id)}
                  className="text-xs font-bold text-amber-600 hover:text-amber-500 cursor-pointer inline-flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <span>{expandedPkgIds[pkg.id] ? 'عرض تفاصيل أقل' : 'عرض التفاصيل الكاملة والمخرجات'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedPkgIds[pkg.id] ? 'rotate-180 text-amber-500' : ''}`} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Bottom Discrete Enterprise Section (Zero Extra Explanations) */}
      <div className="pt-6 border-t border-[var(--border-color)]">
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-right space-y-1">
              <span className="text-[10.5px] font-black text-amber-600 uppercase">
                حلول الشركات والمشاريع الكبرى
              </span>
              <h4 className="font-black text-sm sm:text-base text-slate-900">
                الهوية المؤسسية الكاملة وتأسيس سلاسل الفروع
              </h4>
              <p className="text-xs text-slate-600 font-medium">
                دراسة مخصصة للشركات والمجمعات والمصانع وسلاسل الفروع تحت الإنشاء والتوسع.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsCorporateExpanded(!isCorporateExpanded)}
                className="px-3.5 py-2 rounded-xl bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-slate-700 font-bold text-xs border border-[var(--border-color)] cursor-pointer inline-flex items-center gap-1 transition-all"
              >
                <span>{isCorporateExpanded ? 'عرض أقل' : 'المخرجات والتفاصيل'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isCorporateExpanded ? 'rotate-180 text-amber-500' : ''}`} />
              </button>

              {mode === 'public' ? (
                <a
                  href="https://wa.me/201143888355?text=مرحباً%20دليلك،%20نود%20الاستفسار%20عن%20باقة%20الشركات%20والمشاريع%20الكبرى."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-sm transition-all"
                >
                  طلب استشارة وعرض سعر
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => setDetailModalPkg(CORPORATE_PACKAGE)}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-sm transition-all cursor-pointer"
                >
                  تفاصيل حلول الشركات
                </button>
              )}
            </div>
          </div>

          {/* Corporate In-Card Expansion */}
          {isCorporateExpanded && (
            <div className="pt-4 border-t border-[var(--border-color)] space-y-3 animate-fade-in text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CORPORATE_PACKAGE.deliverables.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-slate-700 font-medium">
                    <Check className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 stroke-[2.5]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. Package Detail Modal (Clean & Focused on Click) */}
      {detailModalPkg && (
        <div className="fixed inset-0 z-[10001] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fade-in">
          <div className="bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[88vh] flex flex-col text-[var(--text-primary)] relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div>
                <span className="text-[10px] font-black text-amber-600 bg-[var(--input-bg)] px-2 py-0.5 rounded border border-amber-500/20">
                  {detailModalPkg.badge || 'تفاصيل الباقة'}
                </span>
                <h3 className="font-black text-base sm:text-lg text-slate-900 mt-1">
                  {detailModalPkg.name}
                </h3>
                <p className="text-xs text-slate-600 font-bold">
                  التكلفة: <span className="text-amber-600">{detailModalPkg.priceText}</span> ({detailModalPkg.billingCadence}) | مدة التنفيذ: {detailModalPkg.deliveryTime}
                </p>
              </div>
              <button
                onClick={() => setDetailModalPkg(null)}
                className="w-8 h-8 rounded-full bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-rose-500 flex items-center justify-center cursor-pointer border border-[var(--border-color)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 space-y-4 pr-1 custom-scrollbar text-xs">
              {/* Target Persona */}
              <div className="p-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-color)]">
                <span className="font-black text-amber-700 block mb-0.5">
                  الفئة المستهدفة:
                </span>
                <p className="text-[11.5px] text-slate-700 font-medium leading-relaxed">
                  {detailModalPkg.forWhom}
                </p>
              </div>

              {/* Detailed Breakdown */}
              <div className="space-y-2">
                <span className="font-black text-slate-900 block text-xs">
                  الخدمات والمخرجات التنفيذية المشمولة:
                </span>
                <div className="space-y-2">
                  {detailModalPkg.fullFeatures.map((feat, idx) => (
                    <div key={idx} className="p-2.5 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-color)] space-y-0.5">
                      <span className="font-black text-slate-900 block">✓ {feat.title}</span>
                      <p className="text-[11px] text-slate-700 font-medium leading-relaxed">{feat.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Guide (Only in Admin Mode) */}
              {mode === 'admin' && (
                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 space-y-2">
                  <span className="font-black text-amber-700 block text-[11px]">
                    دليل توجيه العميل والرد على الاعتراضات:
                  </span>
                  <p className="text-[11px] text-[var(--text-secondary)] font-medium leading-relaxed">
                    <strong>الرسالة السريعة:</strong> "{detailModalPkg.pitchGuide.hook}"
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)] font-medium leading-relaxed">
                    <strong>الرد على الاعتراض:</strong> {detailModalPkg.pitchGuide.objection}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between gap-2">
              {mode === 'public' ? (
                <a
                  href={`https://wa.me/201143888355?text=${encodeURIComponent(`مرحباً دليلك، أود الاستفسار والاشتراك في «${detailModalPkg.name}» (${detailModalPkg.priceText}).`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>طلب الباقة عبر واتساب</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    copyProposal(detailModalPkg);
                    setDetailModalPkg(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>نسخ تفاصيل العرض للعميل</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setDetailModalPkg(null)}
                className="px-4 py-2.5 rounded-xl bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold text-xs cursor-pointer border border-[var(--border-color)]"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Admin Business Selector Modal */}
      {mode === 'admin' && showBizPicker && selectedBizPkg && (
        <div className="fixed inset-0 z-[10002] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-3xl max-w-xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col text-[var(--text-primary)]">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div>
                <h3 className="font-black text-sm sm:text-base text-[var(--text-primary)]">
                  إرسال عرض «{selectedBizPkg.name}» لمنشأة
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] font-bold">
                  اختر المنشأة لإرسال المقترح إليها عبر واتساب
                </p>
              </div>
              <button
                onClick={() => setShowBizPicker(false)}
                className="w-8 h-8 rounded-full bg-[var(--input-bg)] hover:text-rose-500 flex items-center justify-center cursor-pointer border border-[var(--border-color)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                value={bizPickerSearch}
                onChange={(e) => setBizPickerSearch(e.target.value)}
                placeholder="ابحث باسم المنشأة، المالك، أو الهاتف..."
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl py-2.5 pr-10 pl-4 text-xs font-bold focus:outline-none focus:border-amber-500 text-[var(--text-primary)]"
                autoFocus
              />
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute top-3 right-3.5" />
            </div>

            <div className="overflow-y-auto flex-1 space-y-2 pr-1 custom-scrollbar">
              {(!businesses || businesses.length === 0) ? (
                <div className="p-6 text-center text-xs text-[var(--text-muted)] font-bold bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)]">
                  لا توجد منشآت مسجلة محملة حالياً.
                </div>
              ) : filteredBiz.length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--text-muted)] font-bold bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)]">
                  لا توجد منشأة مطابقة للبحث.
                </div>
              ) : (
                filteredBiz.slice(0, 20).map((biz) => {
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
                        <div className="text-[10.5px] text-[var(--text-muted)] font-bold flex items-center gap-2">
                          {biz.ownerName && <span>المالك: {biz.ownerName}</span>}
                          {phone && <span className="font-mono text-emerald-600">{phone}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {phone && (
                          <button
                            type="button"
                            onClick={() => {
                              sendDirectToBiz(biz, selectedBizPkg);
                              setShowBizPicker(false);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>واتساب</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-[var(--border-color)] flex justify-end">
              <button
                type="button"
                onClick={() => setShowBizPicker(false)}
                className="px-4 py-1.5 rounded-xl bg-[var(--input-bg)] text-[var(--text-primary)] font-bold text-xs cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {copyToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10002] bg-slate-950 text-emerald-400 border border-emerald-500 shadow-2xl rounded-2xl px-5 py-3 text-xs sm:text-sm font-black flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{copyToast}</span>
        </div>
      )}
    </div>
  );
};
