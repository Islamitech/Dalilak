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
  Smartphone, 
  ShieldCheck, 
  Award, 
  Users, 
  Building2, 
  MessageCircle, 
  Rocket, 
  Gift, 
  Copy, 
  Search, 
  ChevronLeft, 
  ChevronDown, 
  ArrowRight,
  Target,
  BadgePercent,
  Compass,
  FileText
} from 'lucide-react';
import { FREE_DIRECTORY_SERVICE } from '../data/mockData';
import { Business } from '../types';

export interface PackagesHubProps {
  initialPackageId?: string;
  onSelectPackage?: (packageTitle: string) => void;
  onClose?: () => void;
  mode?: 'admin' | 'public';
  businesses?: Business[];
  onSendPackageBiz?: (biz: Business, packageId?: string) => void;
}

export interface DecisionPackage {
  id: string;
  track: 'foundational' | 'growth' | 'digital' | 'enterprise';
  trackName: string;
  shortName: string;
  functionalTitle: string;
  marketingBadge: string;
  price: number;
  priceLabel?: string;
  billingCadence: 'once' | 'monthly' | 'annually' | 'custom';
  billingCadenceLabel: string;
  isRecommended?: boolean;
  recommendedReason?: string;
  forWhom: string;
  deliveryTime: string;
  icon: any;
  coreDeliverables: string[];
  featuresIncluded: { name: string; desc: string }[];
  pitchGuide: {
    hook: string;
    need: string;
    objection: string;
  };
}

export const PackagesHub: React.FC<PackagesHubProps> = ({
  initialPackageId = 'pkg_pro',
  onSelectPackage,
  onClose,
  mode = 'admin',
  businesses = [],
  onSendPackageBiz
}) => {
  const [selectedPkgId, setSelectedPkgId] = useState<string>(initialPackageId || 'pkg_pro');
  const [selectedTrack, setSelectedTrack] = useState<'all' | 'foundational' | 'growth' | 'digital' | 'enterprise'>('all');
  const [copiedPkgId, setCopiedPkgId] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [showBizPickerModal, setShowBizPickerModal] = useState<boolean>(false);
  const [bizPickerSearch, setBizPickerSearch] = useState<string>('');
  
  // Wizard State (3-Click Package Finder)
  const [showWizard, setShowWizard] = useState<boolean>(false);
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [wizardAnswers, setWizardAnswers] = useState<{
    businessType?: string;
    primaryGoal?: string;
    budget?: string;
  }>({});
  const [wizardResultPkgId, setWizardResultPkgId] = useState<string | null>(null);

  const detailsRef = useRef<HTMLDivElement>(null);
  const packagesGridRef = useRef<HTMLDivElement>(null);

  // 8 Packages Classified Across 4 Tracks - Universal and Inclusive for All Sectors
  const PACKAGES_LIST: DecisionPackage[] = [
    // -------------------------------------------------------------
    // مسار التوثيق والتأسيس الأساسي (Foundational Track)
    // -------------------------------------------------------------
    {
      id: 'pkg_basic',
      track: 'foundational',
      trackName: 'التوثيق والتأسيس',
      shortName: 'التوثيق الأساسي (250 ج)',
      functionalTitle: 'توثيق وتثبيت الموقع على خرائط Google',
      marketingBadge: 'توثيق رسمي',
      price: 250,
      priceLabel: '250 جنيه',
      billingCadence: 'once',
      billingCadenceLabel: 'سداد لمرة واحدة',
      forWhom: 'للعيادات، الصيدليات، المكاتب المهنية، الشركات، والمتاجر التي ليس لها موقع مسجل بدقة على خرائط Google، لتسهيل وصول المراجعين والعملاء مباشرة دون عناء.',
      deliveryTime: '24 - 48 ساعة عمل',
      icon: MapPin,
      coreDeliverables: [
        'تثبيت الموقع الجغرافي للمنشأة بدقة GPS معتمدة على خرائط Google',
        'تسجيل الاسم الرسمي والنشاط وأرقام التواصل وقنوات الاتصال وساعات العمل',
        'رفع الصور الرسمية للمقر والواجهة والخدمات بجودة عالية تعزز الموثوقية',
        'إصدار فاتورة إلكترونية معتمدة برمز QR مع ملصق باركود تفاعلي للمقر'
      ],
      featuresIncluded: [
        { name: 'التثبيت الجغرافي المعتمد', desc: 'ربط مقر المنشأة بإحداثيات دقيقة تظهر مباشرة للباحثين في محيطكم الجغرافي عبر الهواتف الذكية.' },
        { name: 'تحديث قنوات التواصل وساعات العمل', desc: 'إدراج أرقام الهواتف، رابط الواتساب، وأوقات العمل الرسمية لتسهيل تواصل المراجعين والعملاء.' },
        { name: 'معالجة الهوية البصرية وصور المقر', desc: 'عرض الواجهة والشعار الداخلي وتجهيزات المكان بجودة واضحة تعكس جاهزية واحترافية المنشأة.' },
        { name: 'فاتورة رسمية وملصق تفاعلي', desc: 'إصدار مستند إلكتروني رسمي للخدمة مع تصميم رمز QR تفاعلي لتوجيه الزوار مباشرة إلى موقعكم.' }
      ],
      pitchGuide: {
        hook: 'عدم دقة موقع المنشأة على خرائط Google يسبب صعوبة وصول المراجعين والعملاء؛ في 24 ساعة نثبت مقركم رسمياً بإحداثيات دقيقة وبيانات معتمدة وفاتورة رسمية.',
        need: 'لأي منشأة طبية، مهنية، خدمية، أو تجارية غير مسجلة على الخرائط أو ذات بيانات غير محدثة.',
        objection: 'لو ذكر العميل أنه معروف محلياً: توضيح أن المراجعين الجدد والباحثين عبر الهواتف الذكية يعتمدون كلياً على خرائط Google لحساب المسافة وساعات العمل والوصول المباشر.'
      }
    },
    {
      id: 'pkg_pro',
      track: 'foundational',
      trackName: 'التوثيق والتأسيس',
      shortName: 'التأسيس والربط (750 ج)',
      functionalTitle: 'التأسيس الرقمي وإطلاق الحملة التعريفية',
      marketingBadge: 'الأكثر طلباً',
      price: 750,
      priceLabel: '750 جنيه',
      billingCadence: 'once',
      billingCadenceLabel: 'سداد لمرة واحدة',
      isRecommended: true,
      recommendedReason: 'الخيار الموصى به لـ 80% من المنشآت والأنشطة لبناء حضور رقمي رسمي وإطلاق أولى قنوات التواصل المباشر.',
      forWhom: 'للمنشآت الطبية، المكاتب الاستشارية، الشركات، والأنشطة التجارية التي ترغب في تأسيس حضور رقمي متكامل على منصات التواصل وربط قنوات الحجز والاستفسار المباشرة.',
      deliveryTime: '3 أيام عمل مع مرافقة تنفيذية',
      icon: Zap,
      coreDeliverables: [
        'إنشاء وتنسيق المنصات الرسمية بهوية متناسقة تعبر عن التخصص ومكانة المنشأة',
        'ربط زر المحادثة الفورية بالواتساب وقنوات الاتصال لتلقي الاستفسارات والحجوزات مباشرة',
        'تصميم إعلان تعريفي احترافي يبرز خدمات أو منتجات المنشأة بمظهر راقٍ',
        'مرافقة واستشارات تنفيذية لمدة 3 أيام لضبط التفاعل واستقبال أولى الاستفسارات'
      ],
      featuresIncluded: [
        { name: 'تأسيس المنصات الرقمية الرسمية', desc: 'تهيئة الحسابات بهوية بصرية متناسقة مع الشعار والنشاط الرسمي تعزز الثقة لدى المراجعين والعملاء.' },
        { name: 'تفعيل قنوات الاستفسار المباشر', desc: 'توجيه الراغبين بالاستفسار والحجز فوراً إلى واتساب المنشأة دون أي حواجز تقنية.' },
        { name: 'تصميم إعلان تعريفي عالي الدقة', desc: 'إخراج مواد ترويجية تعكس جودة الخدمات المقدمة وتبرز القيمة التنافسية لنشاطكم.' },
        { name: 'صياغة محتوى مهني وترويجي موجه', desc: 'كتابة نصوص تعريفية رصينة ومحفزة تخاطب الشريحة المستهدفة في نطاقكم الجغرافي.' },
        { name: 'مرافقة ودعم تنفيذي مباشر', desc: 'فريق العمل يرافقكم خطوة بخطوة لمدة 3 أيام للإرشاد حول آليات استقبال الطلبات ونشر التحديثات.' }
      ],
      pitchGuide: {
        hook: 'الخيار الأساسي للمنشآت لتأسيس واجهة رقمية رسمية: ننشئ المنصات بهوية موحدة، ونربط التواصل المباشر لتلقي الحجوزات، مع تصميم إعلان تعريفي ومرافقة تنفيذية لـ 3 أيام.',
        need: 'للعيادات، المكاتب المهنية، والشركات والمتاجر التي تحتاج لانطلاقة رقمية منظمة وموثوقة دون تعقيدات تقنية.',
        objection: 'لو ذكر العميل قدرته على إنشاء الصفحات بنفسه: توضيح أن القيمة تكمن في تناسق الهوية، والربط الفني الصحيح مع قنوات الحجز، والتصميم الإعلاني الاحترافي، والدعم التنفيذي المباشر.'
      }
    },

    // -------------------------------------------------------------
    // مسار النمو والتسويق الرقمي (Growth & Marketing Track)
    // -------------------------------------------------------------
    {
      id: 'pkg_reputation',
      track: 'growth',
      trackName: 'التسويق والنمو',
      shortName: 'درع السمعة (950 ج)',
      functionalTitle: 'إدارة السمعة وتنمية التقييمات الإيجابية',
      marketingBadge: 'حماية السمعة والتقييمات',
      price: 950,
      priceLabel: '950 جنيه',
      billingCadence: 'once',
      billingCadenceLabel: 'سداد لمرة واحدة',
      forWhom: 'للمراكز الطبية والعيادات، الصيدليات، مكاتب المحاماة والاستشارات، والمنشآت الخدمية والتجارية التي تمثل تقييمات وآراء العملاء حجر الزاوية في بناء الثقة واختيار خدماتها.',
      deliveryTime: '5 - 7 أيام عمل',
      icon: ShieldCheck,
      coreDeliverables: [
        'فحص شامل لملف المنشأة الرقمي ومعالجة الملاحظات لتحسين التقييم العام',
        'منظومة تفاعلية لتشجيع العملاء والمراجعين الراضين على توثيق تجاربهم الإيجابية بسهولة',
        'تصميم بطاقات وملصقات باركود ذكية (QR) لتقييم المنشأة فورياً بكاميرا الهاتف في ثوانٍ',
        'توجيه الشكاوى الحساسة إلى قنوات تواصل داخلية لمعالجتها باحترافية وسرية'
      ],
      featuresIncluded: [
        { name: 'التدقيق الرقمي لملف المنشأة', desc: 'مراجعة كافة التقييمات السابقة وحماية المتوسط العام للمنشأة وصياغة حلول للملاحظات القائمة.' },
        { name: 'منظومة التقييم السريع عبر QR', desc: 'تيسير كتابة التقييمات على المراجعين والعملاء الفعليين بمسح رمز الاستجابة السريعة دون خطوات معقدة.' },
        { name: 'تجهيز بطاقات التقييم المكتبية والميدانية', desc: 'تصميم مواد أنيقة توضع على مكاتب الاستقبال أو بطاقات المتابعة لحث الزوار على دعم المنشأة.' },
        { name: 'قوالب الردود المهنية المعتمدة', desc: 'صياغة نماذج ردود راقية ومنهجية على المراجعات تعكس احترام إدارة المنشأة لمراجعيها.' },
        { name: 'نظام إدارة الملاحظات الاستباقي', desc: 'امتصاص أي استياء للعملاء عبر قناة دعم مباشرة قبل تحوله إلى تقييم سلبي علني.' }
      ],
      pitchGuide: {
        hook: 'أكثر من 85% من المراجعين والعملاء يراجعون تقييمات المنشأة على Google قبل حجز موعد أو زيارة المقر؛ هذه الباقة ترفع متوسط تقييمكم وتوفر بطاقات QR سريعة لجمع آراء عملائكم الراضين باحترافية.',
        need: 'للمراكز الصحية والعيادات والمكاتب الاستشارية والمنشآت التي ترغب في تعزيز مصداقيتها وتنمية تقييماتها الإيجابية.',
        objection: 'لو استبعد العميل أهمية التقييمات: توضيح أن ارتفاع التقييم بنجمة واحدة ينعكس بزيادة مباشرة في ثقة المراجعين بنسبة تزيد عن 10%، ويعطي تفوقاً واضحاً على المنافسين في نتائج البحث المحلي.'
      }
    },
    {
      id: 'pkg_reels',
      track: 'growth',
      trackName: 'التسويق والنمو',
      shortName: 'فيديو ريلز (1,250 ج)',
      functionalTitle: 'الإنتاج المرئي القصير وإعلانات الفيديو',
      marketingBadge: 'إنتاج مرئي وترويج',
      price: 1250,
      priceLabel: '1,250 جنيه',
      billingCadence: 'once',
      billingCadenceLabel: 'سداد لمرة واحدة',
      forWhom: 'للعيادات والمراكز المتخصصة، مكاتب الخدمات، معارض المنتجات، والمطاعم التي تستفيد من إبراز المقر، التجهيزات، بيئة العمل، أو المنتجات بمحتوى مرئي حديث وجذاب.',
      deliveryTime: '3 - 5 أيام عمل',
      icon: Camera,
      coreDeliverables: [
        'إنتاج مقطعي فيديو قصيرين (2 Reels / Short Videos) بمونتاج وإخراج احترافي حديث',
        'صياغة سيناريو مركز يبرز نقاط التميز والتجهيزات في الثواني الأولى للمشاهد',
        'تصميم أغلفة مميزة وإدراج هوية المنشأة ومعلومات التواصل بوضوح',
        'إعداد وإطلاق حملة إعلانية ممولة تستهدف الجمهور المهتم في نطاقكم الجغرافي'
      ],
      featuresIncluded: [
        { name: 'المونتاج والإخراج المرئي الاحترافي', desc: 'تنفيذ مقاطع مرئية بدقة عالية متوافقة مع منصات إنستجرام وفيسبوك وتيك توك تبرز تفاصيل منشأتكم.' },
        { name: 'صياغة الرسالة التسويقية والسيناريو', desc: 'هيكلة الفكرة لتقديم خدمات المنشأة وميزاتها بأسلوب شيق وواضح يحفز المشاهد على التواصل.' },
        { name: 'التصميم الفني للأغلفة والشاشات التمهيدية', desc: 'تصميم بوسترات مخصصة للواجهة تزيد من معدل المشاهدة والنقر.' },
        { name: 'إعداد الحملة الإعلانية الجغرافية', desc: 'ضبط الاستهداف لضمان وصول المقطع للجمهور والعملاء المحتملين في نطاق نشاطكم.' },
        { name: 'تسليم المواد بجودة كاملة', desc: 'إتاحة الفيديوهات بجودتها الأصلية لاستخدامها في كافة قنواتكم الرسمية وحالات التواصل.' }
      ],
      pitchGuide: {
        hook: 'المحتوى المرئي القصير هو الأسرع إقناعاً وبناءً للمصداقية: ننتج مقطعي فيديو احترافيين يبرزان مقركم وتجهيزاتكم وخدماتكم مع حملة إعلانية ممولة موجهة لنطاقكم الجغرافي.',
        need: 'للمنشآت الطبية والمهنية والتجارية التي ترغب في إظهار تميز مقراتها وخدماتها على الواقع للجمهور.',
        objection: 'لو اعتمد العميل على التصوير الذاتي البسيط: توضيح أن المونتاج الاحترافي وضبط الإضاءة والصوت والألوان ينقل انطباعاً راقياً يعزز مكانة المنشأة في أعين المراجعين والعملاء.'
      }
    },
    {
      id: 'pkg_vip',
      track: 'growth',
      trackName: 'التسويق والنمو',
      shortName: 'الإدارة والتسويق VIP (2,000 ج)',
      functionalTitle: 'الإدارة التسويقية والرقمية المتكاملة (VIP)',
      marketingBadge: 'إدارة تسويقية شاملة',
      price: 2000,
      priceLabel: '2,000 جنيه',
      billingCadence: 'monthly',
      billingCadenceLabel: 'شهرياً (تجديد بـ 1,000 ج)',
      forWhom: 'لأصحاب ومسؤولي المراكز الطبية، المكاتب الاستشارية، مديري الشركات، والأنشطة المشغولة بالتشغيل اليومي، والراغبة في تفويض الإدارة التسويقية بالكامل لفريق متخصص.',
      deliveryTime: 'شهر كامل (30 يوماً متواصلة)',
      icon: Crown,
      coreDeliverables: [
        'تصميم ونشر محتوى دوري منتظم يعكس هوية وتخصص المنشأة طوال الشهر (30 يوماً)',
        'إعداد وإدارة الحملات الإعلانية الممولة جغرافياً للوصول للعملاء المستهدفين بأفضل تكلفة',
        'تحسين ومعالجة المواد التعريفية وصور المنشأة وإخراجها بقوالب بصرية متناسقة',
        'استشارات تسويقية دورية مع إمكانية التجديد للشهر التالي بنصف التكلفة (1,000 ج)'
      ],
      featuresIncluded: [
        { name: 'التصميم والنشر الدوري المتخصص', desc: 'إعداد تصاميم ومواد تعريفية تتناسب مع طبيعة تخصص المنشأة وتبرز خدماتها بانتظام.' },
        { name: 'إدارة الحملات الإعلانية الرقمية', desc: 'ضبط الإعلانات واستهداف الجمهور المناسب جغرافياً ومهنياً لتقليل تكلفة الاستفسار والحجز.' },
        { name: 'إدارة السمعة والتفاعل المهني', desc: 'متابعة المراجعات وصياغة الردود المهنية التي تعكس اهتمام المنشأة بعملائها ومراجعيها.' },
        { name: 'تطوير المواد الترويجية التعريفية', desc: 'معالجة وإعادة صياغة الصور والفيديوهات المرسلة من المقر لتظهر بأرقى معايير العرض.' },
        { name: 'استشارات ومتابعة مستمرة', desc: 'تواصل دوري لمراجعة النتائج وتقديم اقتراحات عملية لتطوير الحضور الرقمي وزيادة الإقبال.' },
        { name: 'ميزة التجديد التفضيلية (1,000 ج/شهرياً)', desc: 'إمكانية الاستمرار في الإدارة التسويقية للشهر الثاني وما بعده بنصف القيمة فقط.' }
      ],
      pitchGuide: {
        hook: 'بدلاً من تكبد أعباء المتابعة والتصميم وإدارة الإعلانات: يتولى فريق متخصص إدارة منصاتكم وحملاتكم الإعلانية طوال الشهر بتكلفة 2,000 ج، مع إمكانية التجديد بـ 1,000 ج شهرياً.',
        need: 'للأطباء والمحامين والاستشاريين ومديري الشركات المشغولين بإدارة العمل اليومي والراغبين في إدارة تسويقية متكاملة.',
        objection: 'لو قارن العميل بين الخدمة وتوظيف مسوق دائم: توضيح أن توظيف مسوق أو مصمم يتطلب رواتب وتكاليف تشغيلية تفوق هذا المبلغ بأضعاف، بينما تقدم الباقة فريقاً متكاملاً من مصمم ومحرر محتوى وخبير إعلانات بمرونة تامة وتكلفة تفضيلية.'
      }
    },

    // -------------------------------------------------------------
    // مسار الحلول والمنتجات الرقمية (Digital Products Track)
    // -------------------------------------------------------------
    {
      id: 'pkg_smart_menu',
      track: 'digital',
      trackName: 'الحلول الرقمية',
      shortName: 'المنيو والمتجر الذكي (3,500 ج)',
      functionalTitle: 'القائمة والكتالوج الرقمي التفاعلي (Smart QR)',
      marketingBadge: 'قائمة رقمية ومتجر ذكي',
      price: 3500,
      priceLabel: '3,500 جنيه',
      billingCadence: 'once',
      billingCadenceLabel: 'سداد لمرة واحدة',
      forWhom: 'للعيادات والمراكز (قائمة الخدمات والكشوفات والأسعار)، ومكاتب الاستشارات والتدريب، ومعارض التجزئة، والمطاعم والكافيهات، لتوفير استعراض تفاعلي سريع مع حجز وطلب مباشر.',
      deliveryTime: '5 - 7 أيام عمل',
      icon: Smartphone,
      coreDeliverables: [
        'كتالوج وقائمة رقمية تفاعلية تفتح بمسح الباركود بكاميرا الهاتف دون تحميل تطبيقات',
        'نظام سلة وحجز فوري يرسل تفاصيل الخدمة أو الطلب مباشرة إلى واتساب المنشأة دون وسيط',
        'لوحة تحكم سهلة من الهاتف لتعديل الأسعار والخدمات والأصناف المتاحة في أي وقت',
        'تصميم ستاندات وبطاقات QR فاخرة للاستقبال والمكاتب لتيسير استعراض الخدمات والطلب'
      ],
      featuresIncluded: [
        { name: 'منظومة العرض الرقمي السريع', desc: 'تصفح انسيابي وسريع متوافق مع كافة الهواتف والشاشات يفتح فوراً بمسح رمز الاستجابة السريعة (QR).' },
        { name: 'نظام الاستفسار والطلب المباشر', desc: 'يتيح للعميل أو المراجع تحديد الخدمات المطلوبة وإرسالها مرتبة مباشرة إلى واتساب المنشأة.' },
        { name: 'لوحة إدارة الخدمات والأسعار الفورية', desc: 'تحديث الأسعار وإضافة خدمات جديدة أو تعديل العروض بكل مرونة دون الحاجة لأي برمجة.' },
        { name: 'تصميم مواد العرض الميدانية (QR Stands)', desc: 'تصميمات أنيقة لوضع الرموز التفاعلية على مكاتب الاستقبال أو نقاط العرض.' },
        { name: 'التواصل المباشر والاستقلالية التامة', desc: 'البيع والاستفسار المباشر يضمن سرعة التواصل ويلغي أي عمولات وسيطة للمنصات الأخرى.' }
      ],
      pitchGuide: {
        hook: 'قائمة رقمية وكتالوج تفاعلي بـ QR Code: يتيح لعملائكم ومراجعيكم استعراض الخدمات، التخصصات، والأسعار، وإرسال طلب الحجز فوراً عبر واتساب المنشأة بمرونة تامة وتحديث فوري للأسعار.',
        need: 'للمراكز الطبية والمكاتب الاستشارية ومعارض المنتجات والمطاعم التي ترغب في تجربة استعراض حديثة توفر تكاليف المطبوعات الورقية.',
        objection: 'لو أشار العميل إلى اعتماده على المطبوعات الورقية: توضيح أن المطبوعات تصبح ملغاة وتتطلب إعادة طباعة مكلفة مع أي تعديل في الأسعار أو الخدمات، بينما يتيح الكتالوج الرقمي التعديل فوراً ويقدم تجربة عصرية للعملاء.'
      }
    },
    {
      id: 'pkg_annual_partner',
      track: 'digital',
      trackName: 'الحلول الرقمية',
      shortName: 'الشريك السنوي (6,000 ج)',
      functionalTitle: 'الرعاية السنوية وتصدر نتائج البحث المعتمدة',
      marketingBadge: 'رعاية سنوية معتمدة',
      price: 6000,
      priceLabel: '6,000 جنيه',
      billingCadence: 'annually',
      billingCadenceLabel: 'سنوياً (توفير 50%)',
      forWhom: 'للمنشآت المستقرة، الصروح والمراكز الطبية، مكاتب الاستشارات الكبرى، والشركات التي تسعى لترسيخ موقعها وتصدر نتائج البحث في المحافظة طوال العام.',
      deliveryTime: 'سنة كاملة (12 شهراً رعاية مستمرة)',
      icon: Award,
      coreDeliverables: [
        'تثبيت وظهور دائم في صدارة نتائج البحث في دليل المحافظة على مدار 12 شهراً',
        'منح المنشأة شارة التوثيق الذهبية المعتمدة كعلامة ثقة رسمية معلنة للجمهور',
        'تمييز موقع وشعار المنشأة على الخريطة التفاعلية للدليل للمستخدمين في النطاق المحيط',
        'تحديثات دورية ربع سنوية (4 مرات بالعام) للبيانات والصور والخدمات لمواكبة التطورات'
      ],
      featuresIncluded: [
        { name: 'التصدر الدائم لنتائج البحث', desc: 'ظهور المنشأة كأبرز نتيجة موصى بها في تصنيفها ونطاقها الجغرافي أمام آلاف الباحثين شهرياً.' },
        { name: 'شارة الشريك المعتمد رسمياً', desc: 'علامة توثيق ذهبية تمنح الثقة التامة للعملاء والمراجعين وترفع معدلات التواصل المباشر.' },
        { name: 'إبراز العلامة على الخريطة التفاعلية', desc: 'أيقونة مميزة تلفت أنظار الباحثين في المحافظة والمدن المجاورة.' },
        { name: 'التحديثات الدورية الموسمية', desc: 'مراجعة وتحديث الصور والمواد التعريفية والعروض كل 3 أشهر لمواكبة كافة الفترات والمناسبات.' },
        { name: 'أولوية الدعم الفني وتحديث البيانات', desc: 'قناة دعم مباشرة لتحديث أي بيانات أو فروع بصورة فورية وذات أولوية قصوى.' }
      ],
      pitchGuide: {
        hook: 'رعاية سنوية استراتيجية تضمن ظهور منشأتكم في صدارة نتائج البحث بالمحافظة كأول اختيار موصى به، مع شارة التوثيق الذهبية المعتمدة وتحديثات دورية طوال 12 شهراً.',
        need: 'للجهات والمؤسسات الطبية والمهنية والتجارية الراغبة في حماية وتنمية ريادتها الرقمية بثبات واقتصادية عالية.',
        objection: 'لو ناقش العميل التكلفة السنوية: توضيح أن القيمة السنوية توفر أكثر من 50% مقارنة بالاشتراكات الشهرية المنفصلة، وتضمن استقرار الصدارة وشارة الثقة الرسمية طوال العام.'
      }
    },

    // -------------------------------------------------------------
    // مسار حلول الشركات والفروع (Enterprise Track)
    // -------------------------------------------------------------
    {
      id: 'pkg_corporate',
      track: 'enterprise',
      trackName: 'حلول الشركات',
      shortName: 'الشركات والمشاريع الكبرى',
      functionalTitle: 'التأسيس المؤسسي المتكامل وسلاسل الفروع',
      marketingBadge: 'حلول مؤسسية متكاملة',
      price: 0,
      priceLabel: 'تسعير مخصص حسب المشروع',
      billingCadence: 'custom',
      billingCadenceLabel: 'دراسة مخصصة للمشروع',
      forWhom: 'للشركات والمصانع، المجمعات والمراكز الطبية الكبرى، ومكاتب الاستشارات والأنشطة متعددة الفروع في مرحلة التأسيس أو التوسع الميداني والرقمي.',
      deliveryTime: 'وفق الجدول الزمني المحدد للمشروع',
      icon: Building2,
      coreDeliverables: [
        'تطوير الهوية المؤسسية الكاملة (الشعار، دليل الهوية البصرية، والمطبوعات الرسمية)',
        'تأسيس وتوثيق رقمي موحد لكافة الفروع والمواقع على الخرائط والمنصات الرسمية',
        'تخطيط وإدارة حملات الإطلاق والافتتاح الكبرى لتحقيق أعلى تفاعل وحضور ميداني ورقمي',
        'جلسة استشارية متخصصة مع الإدارة التنفيذية وتقديم دراسة فنية ومالية مفصلة'
      ],
      featuresIncluded: [
        { name: 'بناء وتطوير الهوية المؤسسية الكاملة', desc: 'تصميم الشعار ودليل استخدام الهوية والألوان بجميع الصيغ الأصلية المعدة للطباعة والوسائط الرقمية.' },
        { name: 'تصميم المطبوعات واللافتات الميدانية', desc: 'تصميم واجهات الفروع، اللوحات الإرشادية، المطبوعات الرسمية، وبطاقات العمل لكوادر المنشأة.' },
        { name: 'التأسيس الرقمي الموحد لشبكة الفروع', desc: 'ربط وتوثيق كافة الفروع والمواقع على خرائط Google والمنصات لسهولة وصول المراجعين لأقرب فرع.' },
        { name: 'تخطيط وإدارة حملات الافتتاح الكبرى', desc: 'خطة إطلاق ترويجية تضمن حضوراً قوياً وتفاعلاً متصاعداً من أول يوم تشغيل رسمي.' },
        { name: 'بناء آليات ولاء ومتابعة العملاء', desc: 'تأسيس قنوات منظمة للتواصل الدوري مع المراجعين والعملاء لتعزيز الارتباط المؤسسي.' },
        { name: 'استشارة فنية ودراسة تسعير مخصصة', desc: 'تحليل دقيق لاحتياجات المنشأة وتقديم خطة تنفيذية تلائم حجم المشروع ونطاق العمل المطلوب.' }
      ],
      pitchGuide: {
        hook: 'تأسيس مؤسسي شامل لسلاسل الفروع والشركات والمجمعات الكبرى: نطور الهوية الموحدة، ونوثق كافة المواقع، ونضع خطة إطلاق شاملة تضمن حضوراً قوياً من أول يوم.',
        need: 'للشركات متعددة الفروع، المجمعات الطبية، والصروح المهنية في مرحلة التجهيز أو التوسع الإقليمي.',
        objection: 'لو طلب العميل دراسة مخصصة للميزانية: توضيح أن الجلسة الاستشارية تهدف لتحديد نطاق العمل الدقيق وتقديم عرض مالي وفني مفصل يلائم متطلبات المشروع الفعلية.'
      }
    }
  ];

  const recommendedPkg = PACKAGES_LIST.find(p => p.isRecommended) || PACKAGES_LIST[1];
  const selectedPkg = PACKAGES_LIST.find(p => p.id === selectedPkgId) || recommendedPkg;

  // Filter packages based on selected track
  const filteredPackages = PACKAGES_LIST.filter(pkg => {
    if (selectedTrack === 'all') return true;
    return pkg.track === selectedTrack;
  });

  const TRACKS = [
    { id: 'all', label: 'جميع الباقات (8)', icon: Layers },
    { id: 'foundational', label: 'التوثيق والتأسيس (2)', icon: MapPin },
    { id: 'growth', label: 'التسويق والنمو (3)', icon: TrendingUp },
    { id: 'digital', label: 'الحلول الرقمية (2)', icon: Smartphone },
    { id: 'enterprise', label: 'حلول الشركات (1)', icon: Building2 },
  ];

  // Helper to copy executive proposal
  const copyPackagePitch = (pkg: DecisionPackage) => {
    const priceText = pkg.priceLabel ? pkg.priceLabel : `${pkg.price.toLocaleString('en-US')} جنيه`;
    const deliverablesList = pkg.coreDeliverables
      .map(h => `• ${h}`)
      .join('\n');

    const text = `السلام عليكم ورحمة الله وبركاته،
تحياتنا لكم، يسعدنا في «منظومة دليلك» تقديم تفاصيل العرض التنفيذي المقترح:

*«${pkg.functionalTitle}»*
- التصنيف: ${pkg.marketingBadge}
- التكلفة: *${priceText}* (${pkg.billingCadenceLabel})
- مدة التنفيذ والتسليم: *${pkg.deliveryTime}*

نطاق الفئة المستهدفة:
${pkg.forWhom}

━━━━━━━━━━━━━━━━━━━━━
المخرجات والخدمات التنفيذية المشمولة:
${deliverablesList}

━━━━━━━━━━━━━━━━━━━━━
نحرص على تعزيز الحضور المهني والرقمي لمنشأتكم وتيسير وصول العملاء والمراجعين، مع توفير فاتورة إلكترونية معتمدة برمز QR ومتابعة مستمرة.
جاهزون للبدء والتنفيذ الفوري بمجرد تأكيدكم، ويشرفنا الإجابة على أي استفسار.
منظومة دليلك - شريك التوثيق والتطوير الرقمي المعتمد في مصر`;

    navigator.clipboard.writeText(text);
    setCopiedPkgId(pkg.id);
    setCopyToast(`تم نسخ تفاصيل عرض «${pkg.shortName}» بنجاح.`);
    setTimeout(() => setCopiedPkgId(null), 2500);
    setTimeout(() => setCopyToast(null), 4000);
  };

  const copyFreeListingConditions = () => {
    const text = `السلام عليكم ورحمة الله وبركاته،
تحياتنا لكم من «منظومة دليلك» - الدليل المعتمد في مصر.

يسرنا إحاطتكم بتوفير إدراج وظهور كامل لمنشأتكم في دليل المحافظة مجاناً 100% وبدون أي مصاريف أو اشتراكات دورية.

الشرط الأساسي للاستفادة من الإدراج المجاني:
${FREE_DIRECTORY_SERVICE.condition}

في حال كان الموقع غير مسجل بدقة على الخريطة:
${FREE_DIRECTORY_SERVICE.unverifiedNote}

المزايا المتاحة في الإدراج المجاني:
• ظهور اسم وتصنيف المنشأة للجمهور والباحثين.
• عرض أرقام التواصل وزر الواتساب المباشر للاتصال الفوري.
• ربط العنوان بالموقع المعتمد على الخريطة التفاعلية.
• عرض مواعيد العمل الرسمية طوال أيام الأسبوع.
• إدراج مجاني مدى الحياة بدون أي رسوم تسجيل أو اشتراك دوري.

━━━━━━━━━━━━━━━━━━━━━
منظومة دليلك - شريك التوثيق والتطوير الرقمي المعتمد في مصر`;

    navigator.clipboard.writeText(text);
    setCopyToast('تم نسخ شروط وسياسة الإدراج المجاني بنجاح.');
    setTimeout(() => setCopyToast(null), 4000);
  };

  const sendPackageToBusinessDirectly = (biz: Business, pkg: DecisionPackage) => {
    const phone = (biz.ownerPhone || biz.phone || '').replace(/[^0-9]/g, '');
    let formattedPhone = phone;
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '2' + formattedPhone;
    } else if (!formattedPhone.startsWith('20') && formattedPhone.length === 10) {
      formattedPhone = '20' + formattedPhone;
    }

    const priceText = pkg.priceLabel ? pkg.priceLabel : `${pkg.price.toLocaleString('en-US')} جنيه`;
    const ownerSalutation = biz.ownerName ? `أستاذ/ة ${biz.ownerName} المحترم/ة` : 'أصحاب وإدارة المنشأة المحترمين';
    const bizName = biz.name || 'منشأتكم الكريمة';

    const msg = `السلام عليكم ورحمة الله وبركاته،
تحياتنا لكم ${ownerSalutation}، بخصوص منشأتكم الكريمة: *«${bizName}»*

يسر فريق العمل بمنظومة دليلك تقديم هذا المقترح لتطوير الحضور الرقمي والمهني لمنشأتكم وتيسير وصول المراجعين والعملاء:

*«${pkg.functionalTitle}»*
- التكلفة: *${priceText}* (${pkg.billingCadenceLabel})
- مدة التنفيذ والتسليم: *${pkg.deliveryTime}*

لماذا تناسب هذه الباقة منشأتكم:
${pkg.forWhom}

━━━━━━━━━━━━━━━━━━━━━
المخرجات التنفيذية المشمولة:
${pkg.coreDeliverables.map(h => `• ${h}`).join('\n')}

جاهزون للبدء والتنفيذ الفوري فور تأكيدكم، ويشرفنا الإجابة على أي استفسار لحضرتكم.
━━━━━━━━━━━━━━━━━━━━━
منظومة دليلك - شريك التوثيق والتطوير الرقمي المعتمد في مصر`;

    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleSelectPackage = (pkgId: string) => {
    setSelectedPkgId(pkgId);
    setTimeout(() => {
      detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  // Run Wizard Evaluation
  const evaluateWizard = (goal?: string, budget?: string, bType?: string) => {
    const g = goal || wizardAnswers.primaryGoal;
    const b = budget || wizardAnswers.budget;
    const t = bType || wizardAnswers.businessType;

    if (t === 'corporate' || b === 'high' && g === 'corporate') {
      setWizardResultPkgId('pkg_corporate');
    } else if (g === 'menu') {
      setWizardResultPkgId('pkg_smart_menu');
    } else if (g === 'reels') {
      setWizardResultPkgId('pkg_reels');
    } else if (g === 'reputation') {
      setWizardResultPkgId('pkg_reputation');
    } else if (g === 'vip') {
      setWizardResultPkgId('pkg_vip');
    } else if (g === 'maps_only' || b === 'low') {
      setWizardResultPkgId('pkg_basic');
    } else {
      setWizardResultPkgId('pkg_pro');
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
    <div className="space-y-4 font-['Cairo',sans-serif] text-[var(--text-primary)]">
      {/* ========================================================================= */}
      {/* 1. ULTRA-CLEAN 2-LINE EXECUTIVE HEADER (Baymard Principle: No Bloated Hero) */}
      {/* ========================================================================= */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="text-base sm:text-lg font-black text-[var(--text-primary)] tracking-tight">
              باقات وحلول منصة دليلك
            </h2>
            <span className="text-[10.5px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md">
              أسعار معتمدة رسمياً
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] font-medium">
            اختر الحل المناسب لمرحلة منشأتكم، أو استعن بالمساعد الذكي لتحديد الباقة الأكثر ملاءمة لنشاطكم وميزانيتكم.
          </p>
        </div>

        {/* Wizard Trigger Button */}
        <button
          type="button"
          onClick={() => {
            setShowWizard(!showWizard);
            if (!showWizard) {
              setWizardStep(1);
              setWizardResultPkgId(null);
            }
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-sm ${
            showWizard
              ? 'bg-amber-500 text-slate-950 shadow-amber-500/20'
              : 'bg-gradient-to-r from-amber-500/15 to-yellow-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/30'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>{showWizard ? 'إغلاق المساعد' : 'مساعد اختيار الباقة المناسبة'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. INTERACTIVE DECISION WIZARD (Universal For All Sectors) */}
      {/* ========================================================================= */}
      {showWizard && (
        <div className="bg-gradient-to-br from-amber-500/10 via-[var(--bg-card)] to-yellow-500/5 border-2 border-amber-400/80 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3.5 animate-fade-in">
          <div className="flex items-center justify-between border-b border-amber-500/25 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs">
                {wizardResultPkgId ? '✓' : wizardStep}
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-[var(--text-primary)]">
                  {wizardResultPkgId ? 'النتيجة المقترحة لمنشأتكم' : 'مساعد اختيار الباقة الأنسب لنشاطكم'}
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] font-medium">
                  {wizardResultPkgId ? 'بناءً على خياراتكم، هذا هو الحل الأمثل لنشاطكم وميزانيتكم الحالية' : `الخطوة ${wizardStep} من 3: حدد الخيار الأنسب لمنشأتكم`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowWizard(false);
                setWizardStep(1);
                setWizardResultPkgId(null);
              }}
              className="text-xs text-[var(--text-muted)] hover:text-rose-500 cursor-pointer font-bold"
            >
              إلغاء
            </button>
          </div>

          {/* Wizard Step 1: Business Nature (Universal) */}
          {!wizardResultPkgId && wizardStep === 1 && (
            <div className="space-y-2.5">
              <p className="text-xs font-black text-[var(--text-primary)]">
                1. ما هو قطاع وطبيعة نشاط منشأتكم؟
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { id: 'medical', label: 'المراكز والعيادات الطبية والصيدليات', desc: 'خدمات رعاية صحية، استشارات، مراجعين، وثقة معتمدة' },
                  { id: 'professional', label: 'المكاتب المهنية والاستشارية', desc: 'محاماة، محاسبة، استشارات إدارية، مكاتب هندسية، وتدريب' },
                  { id: 'commercial', label: 'المعارض والمتاجر والأنشطة التجارية', desc: 'تجارة تجزئة، معارض أثاث وأجهزة، بضائع، ومنافذ بيع' },
                  { id: 'hospitality', label: 'المطاعم والكافيهات وقطاع الأغذية', desc: 'مأكولات، مشروبات، توصيل، وقوائم طعام وطلبات' },
                  { id: 'corporate', label: 'الشركات والمصانع وسلاسل الفروع', desc: 'مؤسسات متعددة الفروع، مصانع، ومشاريع كبرى' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setWizardAnswers({ ...wizardAnswers, businessType: item.id });
                      setWizardStep(2);
                    }}
                    className="p-3 text-right rounded-xl bg-[var(--bg-surface)] hover:bg-amber-500/10 border border-[var(--border-color)] hover:border-amber-500/50 transition-all cursor-pointer group"
                  >
                    <span className="text-xs font-black text-[var(--text-primary)] group-hover:text-amber-600 dark:group-hover:text-amber-400 block">
                      {item.label}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] font-medium">
                      {item.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Wizard Step 2: Primary Goal (Universal) */}
          {!wizardResultPkgId && wizardStep === 2 && (
            <div className="space-y-2.5">
              <p className="text-xs font-black text-[var(--text-primary)]">
                2. ما هو الهدف الأساسي الذي تسعون لتحقيقه حالياً؟
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { id: 'maps_only', label: 'تثبيت وتوثيق الموقع على Google Maps', desc: 'تسهيل وصول المراجعين والعملاء والاتصال المباشر' },
                  { id: 'growth_leads', label: 'تأسيس الحضور الرقمي وإطلاق حملة تعريفية', desc: 'صفحات رسمية بهوية متناسقة وتلقي الحجوزات على الواتساب' },
                  { id: 'reputation', label: 'إدارة السمعة وتنمية التقييمات الإيجابية', desc: 'رفع التقييمات لـ 5 نجوم وبطاقات QR ذكية لثقة المراجعين' },
                  { id: 'reels', label: 'إنتاج محتوى مرئي وإعلانات فيديو للمقر', desc: 'فيديوهات احترافية تبرز التجهيزات والخدمات بصرياً' },
                  { id: 'menu', label: 'قائمة أو كتالوج رقمي تفاعلي (Smart QR)', desc: 'استعراض الخدمات أو المنتجات والطلب والحجز المباشر' },
                  { id: 'vip', label: 'إدارة تسويقية متكاملة شهرية', desc: 'فريق متخصص يتولى التصميم والمحتوى والحملات الإعلانية' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setWizardAnswers({ ...wizardAnswers, primaryGoal: item.id });
                      setWizardStep(3);
                    }}
                    className="p-3 text-right rounded-xl bg-[var(--bg-surface)] hover:bg-amber-500/10 border border-[var(--border-color)] hover:border-amber-500/50 transition-all cursor-pointer group"
                  >
                    <span className="text-xs font-black text-[var(--text-primary)] group-hover:text-amber-600 dark:group-hover:text-amber-400 block">
                      {item.label}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] font-medium">
                      {item.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Wizard Step 3: Budget Scope */}
          {!wizardResultPkgId && wizardStep === 3 && (
            <div className="space-y-2.5">
              <p className="text-xs font-black text-[var(--text-primary)]">
                3. ما هو نطاق الميزانية التقديرية المتاحة للبدء؟
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'low', label: 'ميزانية تأسيسية أولية (250 ج)', desc: 'توثيق الموقع الجغرافي والظهور الرسمي' },
                  { id: 'mid', label: 'ميزانية متوسطة (750 - 1250 ج)', desc: 'تأسيس رقمي متكامل، إنتاج مرئي، أو إدارة سمعة' },
                  { id: 'high', label: 'إدارة شهرية أو حلول متقدمة (2,000 ج+)', desc: 'إدارة تسويقية شاملة أو كتالوج رقمي متطور' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      evaluateWizard(wizardAnswers.primaryGoal, item.id, wizardAnswers.businessType);
                    }}
                    className="p-3 text-right rounded-xl bg-[var(--bg-surface)] hover:bg-amber-500/10 border border-[var(--border-color)] hover:border-amber-500/50 transition-all cursor-pointer group"
                  >
                    <span className="text-xs font-black text-[var(--text-primary)] group-hover:text-amber-600 dark:group-hover:text-amber-400 block">
                      {item.label}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] font-medium">
                      {item.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Wizard Result Card */}
          {wizardResultPkgId && (() => {
            const resPkg = PACKAGES_LIST.find(p => p.id === wizardResultPkgId) || PACKAGES_LIST[1];
            return (
              <div className="bg-[var(--bg-surface)] border-2 border-amber-500 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-color)] pb-2.5">
                  <div>
                    <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 block">
                      الحل المقترح الأنسب لاحتياجاتكم:
                    </span>
                    <h4 className="font-black text-base text-[var(--text-primary)]">
                      {resPkg.functionalTitle}
                    </h4>
                  </div>
                  <div className="text-right sm:text-left">
                    <span className="text-lg font-black text-amber-500 font-mono">
                      {resPkg.price === 0 ? 'تسعير مخصص' : `${resPkg.price.toLocaleString('en-US')} ج.م`}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] font-bold block">
                      {resPkg.billingCadenceLabel}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
                  {resPkg.forWhom}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                  {resPkg.coreDeliverables.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px] text-[var(--text-primary)] font-bold">
                      <span className="text-emerald-500 font-black">✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-color)]">
                  {mode === 'public' ? (
                    <a
                      href={`https://wa.me/201143888355?text=${encodeURIComponent(`مرحباً دليلك، قمت باستخدام مساعد الباقات واقترح لي «${resPkg.functionalTitle}» وأود البدء بالتنفيذ.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>طلب هذه الباقة عبر واتساب</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => copyPackagePitch(resPkg)}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Copy className="w-4 h-4" />
                      <span>نسخ تفاصيل العرض للعميل</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleSelectPackage(resPkg.id)}
                    className="py-2.5 px-4 rounded-xl bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-xs font-black text-amber-600 dark:text-amber-400 cursor-pointer"
                  >
                    عرض التفاصيل والمخرجات
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWizardStep(1);
                      setWizardResultPkgId(null);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-[var(--input-bg)] hover:bg-slate-200 dark:hover:bg-slate-800 text-[11px] font-bold text-[var(--text-muted)] cursor-pointer"
                  >
                    إعادة التقييم
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TRACK FILTER NAVIGATION PILLS */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {TRACKS.map((t) => {
          const IconC = t.icon;
          const isActive = selectedTrack === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTrack(t.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-[1.02]'
                  : 'bg-[var(--bg-card)] hover:bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
              }`}
            >
              <IconC className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 4. THE ANCHOR HERO RECOMMENDED PLAN */}
      {/* ========================================================================= */}
      {(selectedTrack === 'all' || selectedTrack === 'foundational') && (
        <div className="bg-gradient-to-br from-amber-500/15 via-[var(--bg-card)] to-yellow-500/10 border-2 border-amber-400 rounded-2xl p-4 sm:p-5 shadow-xl shadow-amber-500/10 space-y-3.5 relative overflow-hidden ring-2 ring-amber-400/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/30 pb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[11px] font-black px-3 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>الخيار الأكثر طلباً واختياراً للبدء</span>
                </span>
              </div>
              <h3 className="text-base sm:text-xl font-black text-[var(--text-primary)]">
                {recommendedPkg.functionalTitle}
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-300 font-bold">
                {recommendedPkg.forWhom}
              </p>
            </div>

            <div className="text-right sm:text-left bg-[var(--bg-card)] border border-amber-500/40 p-3 rounded-2xl shrink-0">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black font-mono text-amber-500">
                  {recommendedPkg.price.toLocaleString('en-US')}
                </span>
                <span className="text-xs font-bold text-[var(--text-secondary)]">جنيه</span>
              </div>
              <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 block mt-0.5">
                {recommendedPkg.billingCadenceLabel}
              </span>
            </div>
          </div>

          {/* 4 Core Scannable Deliverables */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {recommendedPkg.coreDeliverables.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-[var(--bg-card)] rounded-xl border border-amber-500/20">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-black shrink-0">
                  ✓
                </span>
                <span className="font-bold text-[var(--text-primary)]">{item}</span>
              </div>
            ))}
          </div>

          {/* Hero Plan Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1 border-t border-amber-500/25">
            {mode === 'public' ? (
              <a
                href={`https://wa.me/201143888355?text=${encodeURIComponent(`مرحباً دليلك، أود الاشتراك في باقة التأسيس والربط الذكي (750 ج).`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>طلب هذه الباقة عبر واتساب</span>
              </a>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => copyPackagePitch(recommendedPkg)}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copiedPkgId === recommendedPkg.id ? 'تم نسخ العرض بنجاح ✓' : 'نسخ عرض التأسيس للعميل'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPkgId(recommendedPkg.id);
                    setShowBizPickerModal(true);
                  }}
                  className="w-full sm:w-auto py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>إرسال لمنشأة محددة</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => handleSelectPackage(recommendedPkg.id)}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline py-2 px-3 cursor-pointer"
            >
              عرض الشرح ودليل التوجيه
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SCANNABLE PACKAGE DECISION CARDS */}
      {/* ========================================================================= */}
      <div ref={packagesGridRef} className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)] px-1">
          <span>تصفح خيارات ومسارات الباقات (انقر على أي باقة لمعاينة تفاصيلها ومخرجاتها):</span>
          <span>{filteredPackages.length} باقة متاحة</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredPackages.map((pkg) => {
            const isSelected = selectedPkgId === pkg.id;
            const isRec = pkg.isRecommended;

            return (
              <div
                key={pkg.id}
                onClick={() => handleSelectPackage(pkg.id)}
                className={`p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 select-none ${
                  isSelected
                    ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-500/5 shadow-md'
                    : isRec
                      ? 'border-amber-400/80 bg-gradient-to-b from-amber-500/5 via-[var(--bg-card)] to-[var(--bg-card)] shadow-xs'
                      : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-amber-500/40 hover:shadow-xs'
                }`}
              >
                <div className="space-y-2">
                  {/* Top Bar: Functional Title + Badge */}
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[10.5px] font-black px-2.5 py-0.5 rounded-full border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-secondary)] truncate">
                      {pkg.trackName}
                    </span>
                    <span className={`text-[10.5px] font-black px-2 py-0.5 rounded-md ${
                      isRec ? 'bg-amber-500 text-slate-950' : 'bg-[var(--input-bg)] text-amber-600 dark:text-amber-400 border border-amber-500/30'
                    }`}>
                      {pkg.marketingBadge}
                    </span>
                  </div>

                  {/* Function-First Name */}
                  <div>
                    <h4 className="font-black text-sm text-[var(--text-primary)] leading-snug line-clamp-1">
                      {pkg.functionalTitle}
                    </h4>
                    <span className="text-[11px] font-bold text-[var(--text-muted)]">
                      {pkg.shortName}
                    </span>
                  </div>

                  {/* Price & Cadence Tag */}
                  <div className="pt-1.5 border-t border-[var(--border-color)] flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl sm:text-2xl font-black font-mono text-[var(--text-primary)]">
                        {pkg.price === 0 ? 'مخصص' : pkg.price.toLocaleString('en-US')}
                      </span>
                      {pkg.price > 0 && <span className="text-[11px] font-bold text-[var(--text-secondary)]">ج.م</span>}
                    </div>
                    <span className={`text-[10.5px] font-black px-2 py-0.5 rounded-md ${
                      pkg.billingCadence === 'monthly'
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                        : pkg.billingCadence === 'annually'
                          ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300'
                          : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                    }`}>
                      {pkg.billingCadenceLabel}
                    </span>
                  </div>

                  {/* Target Audience Line */}
                  <div className="bg-[var(--bg-surface)] p-2 rounded-xl border border-[var(--border-color)] min-h-[3.2rem] flex items-center">
                    <p className="text-[11px] text-[var(--text-secondary)] font-bold line-clamp-2 leading-relaxed">
                      <strong className="text-amber-600 dark:text-amber-400">الفئة المستهدفة:</strong> {pkg.forWhom}
                    </p>
                  </div>

                  {/* 4 Crisp Checkmark Bullets */}
                  <div className="space-y-1 pt-1 text-[11px] text-[var(--text-primary)] font-bold">
                    {pkg.coreDeliverables.map((d, i) => (
                      <div key={i} className="flex items-start gap-1.5 leading-snug">
                        <span className="text-emerald-500 font-black shrink-0 mt-0.5">✓</span>
                        <span className="truncate">{d}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Single Primary Action per card */}
                <div className="pt-2 border-t border-[var(--border-color)] space-y-1.5">
                  {mode === 'public' ? (
                    <>
                      <a
                        href={`https://wa.me/201143888355?text=${encodeURIComponent(`مرحباً دليلك، أود الاستفسار والاشتراك في «${pkg.functionalTitle}» (${pkg.priceLabel || pkg.price + ' ج.م'}).`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>طلب عبر واتساب</span>
                      </a>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPackage(pkg.id);
                        }}
                        className="w-full text-center text-[10.5px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer pt-0.5"
                      >
                        عرض التفاصيل والمخرجات
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyPackagePitch(pkg);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-600/15 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-black text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedPkgId === pkg.id ? 'تم النسخ بنجاح ✓' : 'نسخ العرض للعميل'}</span>
                      </button>
                      <div className="flex items-center justify-between text-[10.5px] font-bold pt-0.5 px-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectPackage(pkg.id);
                          }}
                          className="text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                        >
                          دليل المبيعات
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPkgId(pkg.id);
                            setShowBizPickerModal(true);
                          }}
                          className="text-[var(--text-muted)] hover:text-amber-500 cursor-pointer"
                        >
                          إرسال لمنشأة
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. COMPACT FREE DIRECTORY LISTING NOTICE */}
      {/* ========================================================================= */}
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-0.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-black px-2.5 py-0.5 rounded-full text-[10px]">
              خدمة عامة مجانية 100%
            </span>
            <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
              هل موقع منشأتكم موثق بالفعل على خرائط Google؟
            </h4>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] font-medium leading-relaxed">
            {FREE_DIRECTORY_SERVICE.condition} نوفر لكم ظهوراً كاملاً في دليل المحافظة مجاناً 100% وبدون أي اشتراكات دورية.
          </p>
        </div>

        <div className="shrink-0 w-full sm:w-auto">
          {mode === 'public' ? (
            <a
              href={`https://wa.me/201143888355?text=${encodeURIComponent('مرحباً دليلك، موقع منشأتنا موثق بالفعل على خرائط Google، ونود طلب الإدراج المجاني في الدليل.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>طلب الإدراج المجاني</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={copyFreeListingConditions}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>نسخ شروط الإدراج المجاني</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. PROGRESSIVE DISCLOSURE: DETAILED VIEW FOR SELECTED PACKAGE */}
      {/* ========================================================================= */}
      <div 
        ref={detailsRef}
        className="bg-[var(--bg-card)] border-2 border-amber-500/40 rounded-2xl p-4 sm:p-5 space-y-4 shadow-md scroll-mt-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-amber-500 text-slate-950 font-black px-2.5 py-0.5 rounded-md">
                تفاصيل ودليل الباقة المحددة
              </span>
              <h3 className="text-base sm:text-lg font-black text-[var(--text-primary)]">
                {selectedPkg.functionalTitle}
              </h3>
            </div>
            <p className="text-xs text-[var(--text-muted)] font-bold mt-0.5">
              التكلفة: <span className="text-amber-500 font-black">{selectedPkg.priceLabel || selectedPkg.price + ' ج.م'}</span> ({selectedPkg.billingCadenceLabel}) | مدة التنفيذ: {selectedPkg.deliveryTime}
            </p>
          </div>

          <button
            type="button"
            onClick={() => packagesGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer shrink-0"
          >
            العودة لشبكة الباقات
          </button>
        </div>

        {/* 2-Columns: Deliverables & Rep Sales Guidance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Column 1: Detailed Deliverables */}
          <div className="bg-[var(--bg-surface)] p-3.5 sm:p-4 rounded-xl border border-[var(--border-color)] space-y-2.5">
            <h4 className="font-black text-xs text-[var(--text-primary)] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>ما تتضمنه هذه الباقة من خدمات ومخرجات تنفيذية:</span>
            </h4>
            <div className="space-y-2 text-xs">
              {selectedPkg.featuresIncluded.map((feat, idx) => (
                <div key={idx} className="p-2.5 bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] space-y-0.5">
                  <span className="font-black text-[var(--text-primary)] block">✓ {feat.name}</span>
                  <p className="text-[11px] text-[var(--text-secondary)] font-medium leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Sales Guidance & Objection Handling */}
          <div className="space-y-3 flex flex-col justify-between">
            <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-yellow-500/10 p-3.5 sm:p-4 rounded-xl border border-amber-500/40 space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-amber-500/25 pb-1.5">
                <span className="font-black text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>دليل التوجيه والاستشارة (خاص بالمشغلين والمناديب)</span>
                </span>
                <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded">
                  دليل المبيعات
                </span>
              </div>

              <div className="space-y-2">
                <div className="bg-[var(--bg-card)] p-2.5 rounded-lg border border-[var(--border-color)]">
                  <span className="font-black text-amber-600 dark:text-amber-400 block text-[11px]">
                    كيف تشرح الباقة لصاحب المنشأة بإيجاز؟
                  </span>
                  <p className="text-[11px] text-[var(--text-primary)] font-bold mt-0.5 leading-relaxed">
                    "{selectedPkg.pitchGuide.hook}"
                  </p>
                </div>

                <div className="bg-[var(--bg-card)] p-2.5 rounded-lg border border-[var(--border-color)]">
                  <span className="font-black text-blue-600 dark:text-blue-400 block text-[11px]">
                    متى تقترح هذه الباقة تحديداً؟
                  </span>
                  <p className="text-[11px] text-[var(--text-secondary)] font-bold mt-0.5 leading-relaxed">
                    {selectedPkg.pitchGuide.need}
                  </p>
                </div>

                <div className="bg-[var(--bg-card)] p-2.5 rounded-lg border border-[var(--border-color)]">
                  <span className="font-black text-emerald-600 dark:text-emerald-400 block text-[11px]">
                    الرد المهني على استفسارات واعتراضات العميل:
                  </span>
                  <p className="text-[11px] text-[var(--text-secondary)] font-bold mt-0.5 leading-relaxed">
                    {selectedPkg.pitchGuide.objection}
                  </p>
                </div>
              </div>
            </div>

            {/* Direct Action Area */}
            <div className="flex items-center gap-2 pt-1">
              {mode === 'public' ? (
                <a
                  href={`https://wa.me/201143888355?text=${encodeURIComponent(`مرحباً دليلك، أود الاستفسار والاشتراك في «${selectedPkg.functionalTitle}» (${selectedPkg.priceLabel || selectedPkg.price + ' ج.م'}).`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>طلب هذه الباقة عبر واتساب</span>
                </a>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => copyPackagePitch(selectedPkg)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{copiedPkgId === selectedPkg.id ? 'تم النسخ بنجاح ✓' : 'نسخ تفاصيل الباقة للعميل'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBizPickerModal(true);
                    }}
                    className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>إرسال لمنشأة</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 8. BUSINESS SELECTOR MODAL (للمناديب والإداريين) */}
      {/* ========================================================================= */}
      {showBizPickerModal && (
        <div className="fixed inset-0 z-[10001] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-[var(--modal-bg)] border-2 border-amber-500/50 rounded-3xl max-w-xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col text-[var(--text-primary)]">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div>
                <h3 className="font-black text-sm sm:text-base text-[var(--text-primary)]">
                  إرسال عرض «{selectedPkg.shortName}» إلى منشأة
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] font-bold">
                  حدد المنشأة لإرسال المقترح المخصص لها مباشرة عبر واتساب
                </p>
              </div>
              <button
                onClick={() => setShowBizPickerModal(false)}
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
                placeholder="ابحث باسم المنشأة، اسم المالك، رقم الهاتف، أو المحافظة..."
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl py-2.5 pr-10 pl-4 text-xs font-bold focus:outline-none focus:border-amber-500 text-[var(--text-primary)]"
                autoFocus
              />
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute top-3 right-3.5" />
            </div>

            <div className="overflow-y-auto flex-1 space-y-2 pr-1 custom-scrollbar">
              {(!businesses || businesses.length === 0) ? (
                <div className="p-6 text-center text-xs text-[var(--text-muted)] font-bold bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)] space-y-2">
                  <p>لا توجد منشآت مسجلة محملة حالياً في هذه القائمة.</p>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400">
                    يمكنك استخدام زر «نسخ تفاصيل الباقة للعميل» ولصقها مباشرة في محادثة العميل.
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
                          {biz.governorate && <span>{biz.governorate}</span>}
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
                            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow-xs cursor-pointer"
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
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>واتساب</span>
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-[var(--border-color)] flex justify-between items-center text-[11px] text-[var(--text-muted)] font-bold">
              <span>إجمالي المنشآت: {businesses.length}</span>
              <button
                type="button"
                onClick={() => setShowBizPickerModal(false)}
                className="px-4 py-1.5 rounded-xl bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-primary)] font-bold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {copyToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10002] bg-slate-950 text-emerald-400 border-2 border-emerald-500 shadow-2xl rounded-2xl px-5 py-3 text-xs sm:text-sm font-black flex items-center gap-2.5 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{copyToast}</span>
        </div>
      )}
    </div>
  );
};
