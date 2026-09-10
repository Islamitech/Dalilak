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
  Compass
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
  functionalTitle: string; // الاسم الوظيفي الصريح
  marketingBadge: string;  // الشارة التسويقية
  price: number;
  priceLabel?: string;
  billingCadence: 'once' | 'monthly' | 'annually' | 'custom';
  billingCadenceLabel: string;
  isRecommended?: boolean;
  recommendedReason?: string;
  forWhom: string; // 🎯 تناسب مين بالظبط؟
  deliveryTime: string;
  icon: any;
  coreDeliverables: string[]; // 4 نقاط فقط للمسح السريع (Scannable)
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

  // 8 Decision-Oriented Packages Classified Across 4 Tracks
  const PACKAGES_LIST: DecisionPackage[] = [
    // -------------------------------------------------------------
    // ① مسار التوثيق والتأسيس الأساسي (Foundational Track)
    // -------------------------------------------------------------
    {
      id: 'pkg_basic',
      track: 'foundational',
      trackName: 'التوثيق والتأسيس',
      shortName: 'التوثيق الأساسي (250 ج)',
      functionalTitle: 'توثيق وتثبيت مكانك على Google Maps',
      marketingBadge: 'توثيق رسمي 📍',
      price: 250,
      priceLabel: '250 جنيه',
      billingCadence: 'once',
      billingCadenceLabel: 'سداد لمرة واحدة',
      forWhom: 'للأنشطة والمحلات اللي مكانها مش مسجل على الخريطة أو مكانه غلط، ومحتاجة الزبائن ومندوب الدليفري يوصلوا بسهولة.',
      deliveryTime: '24 - 48 ساعة عمل',
      icon: MapPin,
      coreDeliverables: [
        'تثبيت لوكيشن المحل بنقطة GPS دقيقة بالمللي على خرائط Google',
        'إضافة اسم المحل وأرقام التليفونات ومواعيد العمل الرسمية طوال الأسبوع',
        'رفع صور واجهة المحل والشعار والبضاعة بجودة واضحة تشد عين الزبون',
        '🎁 هدية: تصميم استيكر باركود QR Code شيك جاهز للتعليق على باب المحل'
      ],
      featuresIncluded: [
        { name: 'تثبيت نقطة اللوكيشن الرسمية على خريطة Google', desc: 'تثبيت مكان محلك بنقطة جغرافية دقيقة تظهر مباشرة لأي حد بيبحث في منطقتك ومحيطك على الموبايل.' },
        { name: 'ضبط أرقام التواصل وساعات العمل', desc: 'إضافة رقم التليفون المباشر، والواتساب، ومواعيد الفتح والإغلاق طوال أيام الأسبوع عشان الزبون يعرف إمتى يجيلك.' },
        { name: 'رفع صور الواجهة والمنتجات بدقة', desc: 'إضافة صور واضحة لواجهة المحل ومنتجاتك تفتح النفس وتدي انطباع محترم وثقة تامة للزبائن الجدد.' },
        { name: 'إصدار فاتورة إلكترونية معتمدة', desc: 'إصدار رابط وفاتورة رسمية معتمدة برمز QR فوري يمكن مشاركتها وتنزيلها في أي وقت.' },
        { name: 'هدية ملصق باركود QR Code للواجهة', desc: 'تصميم استيكر باركود احترافي مخصص لموقع محلك تطبعه وتعلقه على الباب، الزبون يمسحه بالموبايل يدخل على مكانك فوراً.' }
      ],
      pitchGuide: {
        hook: 'مكانك مش ظاهر على الخريطة؟ بتخسر زباين ومناديب دليفري كل يوم! في 24 ساعة هنثبت محلك رسمي على جوجل بنقطة مظبوطة بالمللي، ومعاها ملصق باركود QR هدية تطبعه وتعلقه على مدخل المحل.',
        need: 'للأنشطة التي ليس لها موقع جغرافي موثق على خرائط Google أو مكانها متسجل غلط أو أرقامها غير محدثة.',
        objection: 'لو قال: "أنا معروف في منطقتي ومش محتاج خريطة" ⬅️ وضّح له: "الزبون الجديد أو المغترب عن المنطقة بيبحث بالموبايل أولاً، وشركات الدليفري بتعتمد تماماً على نقطة GPS الدقيقة عشان توصل بدون ما تقعد ترن عليك توصف الطريق".'
      }
    },
    {
      id: 'pkg_pro',
      track: 'foundational',
      trackName: 'التوثيق والتأسيس',
      shortName: 'التأسيس والربط (750 ج)',
      functionalTitle: 'التأسيس الرقمي وصفحات التواصل وإعلان المبيعات',
      marketingBadge: 'الأكثر طلباً ومبيعاً ⭐',
      price: 750,
      priceLabel: '750 جنيه',
      billingCadence: 'once',
      billingCadenceLabel: 'سداد لمرة واحدة',
      isRecommended: true,
      recommendedReason: 'الخيار الموصى به لـ 80% من الأنشطة التجارية الجديدة لبدء الحضور الرقمي وتحقيق مبيعات سريعة.',
      forWhom: 'للمحلات والأنشطة اللي عايزة واجهة رقمية محترمة: صفحات فيسبوك + إعلان شيك يجيب زباين + ربط الواتساب مباشرة بالتليفون.',
      deliveryTime: '3 أيام عمل مع مرافقة حية',
      icon: Zap,
      coreDeliverables: [
        'تأسيس وضبط صفحات فيسبوك والمنصات باسم وشعار متناسق يعكس فخامة محلك',
        'ربط زرار الواتساب المباشر بالصفحة لتلقي طلبات الزبائن فوراً على تليفونك',
        'تصميم إعلان ترويجي شيك وجذاب لبضاعتك يجذب أهالي منطقتك ومحيطك',
        'مرافقة وتوجيه ودعم مباشر لمدة 3 أيام خطوة بخطوة للرد على الزبائن ونشر العروض'
      ],
      featuresIncluded: [
        { name: 'تأسيس وبناء صفحات التواصل الاجتماعي', desc: 'إنشاء وضبط صفحات فيسبوك والمنصات باسم وهوية بصرية منسقة مع نشاطك ومقرك التجاري.' },
        { name: 'ربط المحادثات برقم الواتساب المباشر', desc: 'وضع زر تواصل مباشر وسريع؛ الزبون يضغط ضغطة واحدة يلاقي نفسه بيكلمك على الواتساب وتتفق معاه علطول.' },
        { name: 'تصميم إعلان وعرض جذاب للمنتجات', desc: 'تصميم إعلان بصري شيك لعرض بضاعتك أو أطباقك بطريقة تجذب العين وتفتح النفس للشراء.' },
        { name: 'صياغة نصوص إعلانية محفزة للبيع', desc: 'كتابة كلام إعلاني مفهوم وقريب لأهالي منطقتك يوضح ميزاتك وعروضك ويشجعهم على التجربة فوراً.' },
        { name: 'مرافقة وتدريب لمدة 3 أيام', desc: 'فريق العمل يرافقك خطوة بخطوة لمدة 3 أيام للرد على تساؤلاتك ومساعدتك في نشر أولى العروض واستقبال الطلبات.' }
      ],
      pitchGuide: {
        hook: 'الباقة الأكثر طلباً ومبيعاً: بنأسس لك صفحات مظبوطة على فيسبوك باسم محلك وشعارك، وبنصمم لك إعلان شيك يجيب زباين جداد من منطقتك، وبنربط تليفونك والواتساب بالصفحة، ومعاها دعم 3 أيام نعلمك فيهم كل حاجة.',
        need: 'للمحلات والشركات التي ترغب في حضور قوي على السوشيال ميديا وتلقي طلبات مباشرة على الواتساب دون تعقيد.',
        objection: 'لو قال: "أنا هعمل صفحة فيسبوك بنفسي" ⬅️ وضّح له: "عمل الصفحة بنفسك مش كفاية؛ الصفحة محتاجة هوية متناسقة، وربط زرار الواتساب المباشر، وإعلان متصمم بطريقة بيعية تشد الزبون، ومرافقة 3 أيام نضمن بيهم وصول إعلانك للزبائن الصح في منطقتك".'
      }
    },

    // -------------------------------------------------------------
    // ② مسار النمو والتسويق الرقمي (Growth & Marketing Track)
    // -------------------------------------------------------------
    {
      id: 'pkg_reputation',
      track: 'growth',
      trackName: 'التسويق والنمو',
      shortName: 'درع السمعة (950 ج)',
      functionalTitle: 'حماية السمعة ورفع التقييمات لـ 5 نجوم',
      marketingBadge: 'حماية السمعة 🛡️',
      price: 950,
      priceLabel: '950 جنيه',
      billingCadence: 'once',
      billingCadenceLabel: 'سداد لمرة واحدة',
      forWhom: 'للعيادات، المطاعم، المتاجر والأنشطة الخدمية التي تعتمد على ثقة الزبائن ومراجعات جوجل قبل الشراء أو الزيارة.',
      deliveryTime: '5 - 7 أيام عمل',
      icon: ShieldCheck,
      coreDeliverables: [
        'فحص شامل لملف نشاطك على جوجل وحل الملاحظات وحماية التقييم العام',
        'طريقة سهلة لتشجيع الزبائن الراضين إنهم يكتبوا تقييمات 5 نجوم حقيقية',
        'كروت واستيكرات باركود ذكية شيك للتقييم بكاميرا الموبايل في 5 ثواني',
        'معالجة شكاوى العملاء داخلياً على واتساب خاص بدلاً من التقييم السلبي العام'
      ],
      featuresIncluded: [
        { name: 'فحص ملف جوجل وحماية التقييم العام', desc: 'مراجعة كافة تقييمات العملاء وحماية التقييم العام للمكان ومعالجة الملاحظات بهدوء واحترافية.' },
        { name: 'منظومة جمع التقييمات الإيجابية السريعة', desc: 'آلية مخصصة تيسر على عملائك الفعليين ترك تجاربهم الإيجابية بسهولة وسرعة بدون أي خطوات معقدة.' },
        { name: 'كروت وملصقات باركود ذكية للتقييم', desc: 'تصميم ملصق وكارت مخصص للمحل يوجه كاميرا هاتف العميل مباشرة لكتابة التقييم بضغطة زر واحدة.' },
        { name: 'صياغة قوالب الردود المهنية الراقية', desc: 'نماذج جاهزة ومهذبة للرد على مراجعات واستفسارات العملاء بأسلوب يعكس رقي واحترافية إدارتكم.' },
        { name: 'تقرير سمعة ومصداقية المكان', desc: 'تقرير مفصل بتطور مستوى رضا العملاء وأبرز الإيجابيات لتعزيزها وتطوير المبيعات.' }
      ],
      pitchGuide: {
        hook: 'الزبون الجديد قبل ما يدخل محلك بيفتح يشوف التقييمات؛ الباقة دي بتخلي تقييمك يرفع لـ 5 نجوم بكروت واستيكرات باركود سريعة بيمسحها الزبون وهو مبسوط يكتب لك تقييم ممتاز في 5 ثواني، وتصلح أي ملاحظات قديمة.',
        need: 'للأنشطة الخدمية والمطاعم والعيادات التي تعاني من قلة التقييمات أو وجود ملاحظات سلبية ترغب في تصحيحها.',
        objection: 'لو قال: "التقييمات مش فارقة معايا أوي" ⬅️ وضّح له: "أكثر من 90% من الزبائن بيبصوا على عدد النجوم وآراء الناس قبل ما يجربوا أي محل جديد، والنجمة الواحدة الإضافية بترفع مبيعاتك 9% على الأقل".'
      }
    },
    {
      id: 'pkg_reels',
      track: 'growth',
      trackName: 'التسويق والنمو',
      shortName: 'فيديو ريلز (1,250 ج)',
      functionalTitle: 'إنتاج فيديوهات ريلز وإعلان محلي لمنطقتك',
      marketingBadge: 'انتشار سريع 🎬',
      price: 1250,
      priceLabel: '1,250 جنيه',
      billingCadence: 'once',
      billingCadenceLabel: 'سداد لمرة واحدة',
      forWhom: 'للمطاعم، الكافيهات، محلات الملابس، صالونات التجميل وكل نشاط يعتمد على الجاذبية البصرية ورؤية المنتجات على الطبيعة.',
      deliveryTime: '3 - 5 أيام عمل',
      icon: Camera,
      coreDeliverables: [
        'إنتاج مقطعي فيديو قصيرين (2 Reels / TikTok) بمونتاج عصري خاطف للأنظار',
        'صياغة فكرة وسيناريو بمقدمة سريعة في أول 3 ثوانٍ تمنع الزبون من تقليب الفيديو',
        'تصميم أغلفة لافتة واختيار أنسب الموسيقى والهاشتاجات الرائجة في منطقتك',
        'تجهيز وضبط حملة إعلانية ممولة للفيديو تستهدف سكان منطقتك والمدن القريبة'
      ],
      featuresIncluded: [
        { name: 'إنتاج ومونتاج مقاطع ريلز احترافية قصيرة', desc: 'مونتاج عالي الجودة متوافق مع إنستجرام وفيسبوك وتيك توك يعرض منتجاتك بأوضح شكل ممكن.' },
        { name: 'صياغة السيناريو والعرض الترويجي', desc: 'كتابة فكرة وسيناريو جذاب يركز على العرض والميزة اللي بتميز محلك عن أي منافس تاني.' },
        { name: 'تصميم بوسترات وأغلفة الفيديو', desc: 'أغلفة مخصصة تجعل الفيديو بارزاً وتزيد نسبة النقر والمشاهدة من المستخدمين.' },
        { name: 'ضبط الحملة الإعلانية الترويجية جغرافياً', desc: 'تحديد النطاق الجغرافي والاهتمامات لسكان المنطقة لتحقيق أعلى نسبة مشاهدات وطلبات للمحل.' },
        { name: 'تسليم الملفات بدقة عالية كاملة', desc: 'استلام الفيديوهات بجودتها الأصلية كاملة جاهزة للاستخدام الدائم في أي وقت على كافة منصاتك.' }
      ],
      pitchGuide: {
        hook: 'الناس في مصر بتموت في الفيديوهات وبتصدق اللي بتشوفه بعينها: بنعملك فيديوهات ريلز قصيرة بمونتاج شيك تعرض أكلك أو بضاعتك بطريقة تفتح النفس، ونعملك إعلان موجه لسكان منطقتك يشوفوه على الموبايل ويجولك مخصوص.',
        need: 'للأنشطة التي تعتمد على الإبهار البصري وترغب في إظهار جودة منتجاتها على الطبيعة لجذب زبائن جدد.',
        objection: 'لو قال: "أنا بصور بالموبايل وخلاص" ⬅️ وضّح له: "المونتاج الاحترافي والزوايا المدروسة والموسيقى والألوان بتنقل انطباع البراند الفخم، وبتخلي الزبون يحس بجودة المكان ويثق فيك قبل ما يجي".'
      }
    },
    {
      id: 'pkg_vip',
      track: 'growth',
      trackName: 'التسويق والنمو',
      shortName: 'الإدارة والتسويق VIP (2,000 ج)',
      functionalTitle: 'إدارة تسويقية ورقمية كاملة وتصاميم دورية',
      marketingBadge: 'إدارة كاملة VIP 👑',
      price: 2000,
      priceLabel: '2,000 جنيه',
      billingCadence: 'monthly',
      billingCadenceLabel: 'شهرياً (تجديد بـ 1,000 ج)',
      forWhom: 'لأصحاب الأنشطة المشغولين بإدارة وتجهيز الشغل، ومحتاجين فريق تسويق متكامل يتولى إدارة المنصات وضبط الإعلانات وزيادة المبيعات.',
      deliveryTime: 'شهر كامل (30 يوماً متواصلة)',
      icon: Crown,
      coreDeliverables: [
        'تصميم منشورات وبانرات إعلانية احترافية متجددة طوال أيام الشهر',
        'معالجة وإعادة إخراج صور وفيديوهات المنتجات المرسلة من المحل بأعلى شياكة',
        'إعداد وضبط الحملات الإعلانية الممولة جغرافياً لتقليل تكلفة الرسالة',
        'متابعة يومية واستشارات لتطوير المبيعات + تجديد اختياري للشهر التالي بنصف السعر'
      ],
      featuresIncluded: [
        { name: 'تصميم المنشورات والبانرات التسويقية الدورية', desc: 'تصميمات جرافيكية متناسقة مع هوية المحل لعرض المنتجات والعروض طوال أيام الشهر بدون توقف.' },
        { name: 'إعداد واستهداف الحملات الإعلانية الممولة', desc: 'ضبط الإعلانات واستهداف سكان النطاق الجغرافي بأقل تكلفة للرسالة (ميزانية الإعلانات يحددها ويسددها العميل للمنصات مباشرة حسب قدرته).' },
        { name: 'إعادة إنتاج مواد العرض البصرية ومعالجتها', desc: 'تحسين ومعالجة صور وفيديوهات منتجاتكم وإبراز تفاصيلها للمشترين بطريقة مغرية وجذابة.' },
        { name: 'إدارة التقييمات ومراجعات العملاء', desc: 'متابعة تقييمات Google وصفحات التواصل والردود المهنية لحماية وتنمية سمعة المكان أمام الجميع.' },
        { name: 'دعم واستشارات تسويقية يومية مباشرة', desc: 'تواصل ومتابعة يومية مع صاحب المكان لمراجعة حركة الزبائن وتقديم أفكار وحلول سريعة لتنشيط البيع.' },
        { name: 'ميزة التجديد بنصف السعر (1000 ج/شهر)', desc: 'بعد انتهاء الشهر الأول، يمكنك الاستمرار في إدارة المنظومة بـ 1000 ج فقط شهرياً.' }
      ],
      pitchGuide: {
        hook: 'بدل ما تشيل هم النشر والتصميم وتظبيط الإعلانات الممولة: بنمسك لك صفحاتك بالكامل لمدة شهر كامل، بنصمم بوستات جديدة، وبنظبط لك الإعلانات، وبنتابع رسايل وتقييمات زباينك، وكل ده بـ 2,000 ج بس، والتجديد للشهر التاني بـ 1,000 ج بس.',
        need: 'لأصحاب الأنشطة المشغولين الذين لا يملكون وقتاً لإدارة الصفحات ومتابعة الحملات بأنفسهم ويريدون نتائج بيعية حقيقية.',
        objection: 'لو قال: "التكلفة كبيرة" ⬅️ وضّح له: "راتب مسوق مبتدئ واحد يتجاوز 4,000 أو 5,000 ج شهرياً، وهنا بتستفيد من فريق عمل متكامل: مصمم جرافيك، كاتب محتوى، وخبير إعلانات متفرغين لمحلك لمدة شهر كامل، وبـ 2,000 ج بس، ومع إمكانية التجديد بنصف السعر (1,000 ج) بعد كده".'
      }
    },

    // -------------------------------------------------------------
    // ③ مسار الحلول والمنتجات الرقمية (Digital Products Track)
    // -------------------------------------------------------------
    {
      id: 'pkg_smart_menu',
      track: 'digital',
      trackName: 'الحلول الرقمية',
      shortName: 'المنيو والمتجر الذكي (3,500 ج)',
      functionalTitle: 'المنيو الإلكتروني التفاعلي ومتجر الواتساب الفوري',
      marketingBadge: 'متجر ذكي 📱',
      price: 3500,
      priceLabel: '3,500 جنيه',
      billingCadence: 'once',
      billingCadenceLabel: 'سداد لمرة واحدة',
      forWhom: 'للمطاعم، الكافيهات، محلات الحلويات، والسوبرماركت التي تتلقى طلبات توصيل مستمرة وتريد توفير عمولات تطبيقات الدليفري الباهظة.',
      deliveryTime: '5 - 7 أيام عمل',
      icon: Smartphone,
      coreDeliverables: [
        'منيو وكتالوج إلكتروني سريع جداً وسلس يفتح بكاميرا الموبايل بدون أي تطبيقات',
        'سلة مشتريات ذكية ترسل تفاصيل أصناف الطلب والعنوان لواتساب المحل فوراً وبدون عمولات',
        'لوحة تحكم سهلة جداً لتحديث وتغيير الأسعار والأصناف من تليفونك في أي وقت',
        'تصميم ستاندات وكروت QR شيك جداً لوضعها على الطاولات والكاونتر لتسريع الطلبات'
      ],
      featuresIncluded: [
        { name: 'منيو إلكتروني سريع متوافق مع كل الهواتف', desc: 'تصفح سلس وسريع جداً بدون الحاجة لتحميل أي تطبيقات من العميل، يفتح بكاميرا الهاتف في ثانية واحدة.' },
        { name: 'نظام سلة طلبات الواتساب الفورية المباشرة', desc: 'العميل يختار أصنافه وتصله رسالة منظمة بتفاصيل طلبه وسعره وعنوانه على واتساب المحل بنقرة واحدة.' },
        { name: 'لوحة تحكم وتعديل مرنة للأسعار والأصناف', desc: 'إمكانية تحديث الأسعار، إضافة أصناف جديدة، أو إخفاء أي صنف خلص بكل سهولة من تليفونك.' },
        { name: 'تصميم ستاندات وكروت QR للطاولات والكاونتر', desc: 'تصميمات بصرية أنيقة لوضع الباركود على الطاولات وكاونتر المكان لتقليل وقت انتظار الزبائن.' },
        { name: 'توفير تكاليف وعمولات شركات وتطبيقات التوصيل', desc: 'البيع المباشر لزبائنك يرفع أرباحك الصافية ويحافظ على ولاء عملائك لمحلك مباشرة.' }
      ],
      pitchGuide: {
        hook: 'منيو رقمي ومتجر واتساب ذكي بـ QR Code: الزبون يمسح الباركود، يختار أصنافه، والطلب يوصلك جاهز ومنظم ومحسوب حسابه على الواتساب بنقرة واحدة، ومن غير ما تدفع مليم عمولة لأي تطبيق توصيل.',
        need: 'للمطاعم والكافيهات ومحلات الأكل والمشروبات والمتاجر التي تعاني من تكاليف طباعة المنيو الورقي وعمولات شركات التوصيل.',
        objection: 'لو قال: "عندي منيو ورقي وشغال بيه" ⬅️ وضّح له: "المنيو الورقي بيتكلف فلوس كل ما الأسعار تتغير، وبيتبهدل مع الاستخدام، بينما المنيو الرقمي بيتعدل في ثواني بضغطة زر، وأشيك في عين الزبون، وبيخلي طلب الدليفري أسرع 3 مرات".'
      }
    },
    {
      id: 'pkg_annual_partner',
      track: 'digital',
      trackName: 'الحلول الرقمية',
      shortName: 'الشريك السنوي (6,000 ج)',
      functionalTitle: 'الرعاية السنوية وتصدر نتائج البحث المعتمد',
      marketingBadge: 'شريك ماسي سنوي 💎',
      price: 6000,
      priceLabel: '6,000 جنيه',
      billingCadence: 'annually',
      billingCadenceLabel: 'سنوياً (يوفر 50%)',
      forWhom: 'للبراندات والمراكز الكبرى والأنشطة المستقرة التي ترغب في تصدر نتائج البحث بمحافظتها طوال العام بشارة التوثيق الذهبية.',
      deliveryTime: 'سنة كاملة (12 شهراً رعاية مستمرة)',
      icon: Award,
      coreDeliverables: [
        'تثبيت وظهور دائم في صدارة نتائج بحث الدليل بالمحافظة طوال 12 شهراً',
        'منح المنشأة شارة التوثيق الذهبية المعتمدة (Gold Certified) كعلامة ثقة رسمية',
        'تمييز علامة وشعار المكان على الخريطة التفاعلية للدليل للمستخدمين القريبين',
        'تحديث موسمي شامل للصور والعروض كل 3 أشهر لمواكبة الأعياد والمواسم'
      ],
      featuresIncluded: [
        { name: 'تصدر دائم لنتائج البحث في الدليل', desc: 'يظهر مكانكم كأول نتيجة موصى بها في منطقتكم وتصنيفكم التجاري على مدار العام أمام آلاف الباحثين.' },
        { name: 'شارة الشريك الذهبي المعتمد رسمياً', desc: 'علامة توثيق ذهبية تمنح الثقة التامة للعملاء وتضاعف معدل الاتصال والتواصل المباشر.' },
        { name: 'إبراز العلامة والشعار على الخريطة التفاعلية', desc: 'أيقونة مميزة وبارزة تلفت أنظار الباحثين على خريطة المحافظة والمنطقة للمستخدمين القريبين.' },
        { name: 'تحديثات ربع سنوية موسمية (4 مرات بالعام)', desc: 'تجديد صور الواجهة، المنتجات، والعروض الخاصة في المواسم والأعياد لضمان مواكبة كل جديد.' },
        { name: 'دعم فني وتحديث بيانات فوري ذو أولوية قصوى', desc: 'خط دعم مباشر لتعديل ومتابعة أي بيانات في أي وقت خلال دقائق معدودة.' }
      ],
      pitchGuide: {
        hook: 'شراكة استراتيجية سنوية مستمرة: بنحط محلك في صدارة نتائج البحث في محافظتك كأول اختيار موصى به، وبنديلك شارة التوثيق الذهبية المعتمدة، وبنحدث لك صورك وعروضك في كل موسم وعيد طوال 12 شهراً.',
        need: 'للشركات والمؤسسات المستقرة الراغبة في حماية وتنمية تواجدها الرقمي طوال العام بتكلفة اقتصادية مخفضة وثابتة.',
        objection: 'لو قال: "المبلغ السنوي كبير مرة واحدة" ⬅️ وضّح له: "التكلفة السنوية بتوفر عليك أكثر من 50% مقارنة بأي اشتراكات شهرية متقطعة، وبتضمن لك التثبيت في صدارة النتائج وشارة التوثيق الذهبية اللي بتدي هيبة ومصداقية للمكان طوال السنة".'
      }
    },

    // -------------------------------------------------------------
    // ④ مسار حلول الشركات والفروع (Enterprise Track)
    // -------------------------------------------------------------
    {
      id: 'pkg_corporate',
      track: 'enterprise',
      trackName: 'حلول الشركات',
      shortName: 'الشركات والمشاريع الكبرى',
      functionalTitle: 'الهوية المؤسسية الكاملة وتأسيس سلاسل الفروع',
      marketingBadge: 'حلول مؤسسية 🏢',
      price: 0,
      priceLabel: 'تسعير مخصص حسب المشروع',
      billingCadence: 'custom',
      billingCadenceLabel: 'دراسة مخصصة للمشروع',
      forWhom: 'للشركات والمصانع وسلاسل الفروع والمحلات الضخمة في مرحلة التجهيز والإنشاء وما قبل الافتتاح الرسمي.',
      deliveryTime: 'وفق الجدول الزمني المحدد للمشروع',
      icon: Building2,
      coreDeliverables: [
        'تصميم الهوية البصرية الكاملة والشعار وملفات الطباعة واللافتات الميدانية',
        'تأسيس وتوثيق رقمي موحد لكافة الفروع والمواقع على الخرائط والمنصات',
        'تخطيط وإدارة حملات الافتتاح والانطلاق الكبرى لضمان أعلى تفاعل من اليوم الأول',
        'جلسة استشارية متخصصة مع الإدارة العليا وتصميم عرض فني ومالي مفصل'
      ],
      featuresIncluded: [
        { name: 'بناء وتطوير الهوية البصرية والمؤسسية الكاملة', desc: 'تصميم الشعار، دليل استخدام الهوية، والألوان والخطوط بجميع صيغ التصميم والطباعة الأصلية عالية الدقة.' },
        { name: 'تصميم الواجهات الخارجية والمطبوعات الميدانية', desc: 'تصورات واضحة للافتات المحل، المطبوعات الترويجية، كروت العمل، والأكياس والزي الموحد للعاملين.' },
        { name: 'التأسيس الرقمي الموحد لجميع الفروع', desc: 'ربط وتوثيق كافة الفروع والمواقع على خرائط جوجل وحسابات المنصات الرسمية بنقاط موحدة ودقيقة.' },
        { name: 'تخطيط وإدارة حملات الإطلاق والافتتاح الكبرى', desc: 'خطة ترويجية متكاملة لضمان حضور وتفاعل قوي وزحام مبيعات متصاعد من أول يوم تشغيل.' },
        { name: 'بناء أنظمة ولاء العملاء وتكرار الشراء', desc: 'تأسيس آليات رقمية لحفظ بيانات العملاء وتقديم العروض التفضيلية لهم لضمان تكرار الشراء باستمرار.' },
        { name: 'تدريب فريق التشغيل وخدمة العملاء', desc: 'تأهيل وتدريب كوادر العمل على أساليب استقبال العملاء وزيادة متوسط حجم الفاتورة ورضا الزبائن.' },
        { name: 'جلسة استشارية وعرض فني ومالي مخصص', desc: 'تحليل دقيق لمتطلبات المنشأة وتقديم خطة تنفيذية مخصصة تلائم ميزانية وأهداف النشاط بدقة.' }
      ],
      pitchGuide: {
        hook: 'تأسيس مؤسسي متكامل للشركات والمصانع وسلاسل الفروع: بنصمم الهوية واللافتات، وبنوثق كل الفروع، وبنعمل حملة افتتاح ضخمة تضمن زحام ومبيعات من أول يوم تشغيل.',
        need: 'لسلاسل الفروع، الشركات الكبرى، والمحلات الضخمة في مرحلة التجهيز والإنشاء وما قبل الافتتاح.',
        objection: 'لو قال: "محتاج دراسة سعر خاصة على حسب حجم الشغل" ⬅️ وضّح له: "بالتأكيد، بنقعد مع حضرتك في جلسة استشارية فنية، وبنعمل دراسة مخصصة بتغطي كل الفروع ونطاق التجهيز المطلوب مع عرض مالي مفصل".'
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

  // Track Pills metadata
  const TRACKS = [
    { id: 'all', label: 'جميع الحلول (8)', icon: Layers },
    { id: 'foundational', label: 'التوثيق والتأسيس (2)', icon: MapPin },
    { id: 'growth', label: 'التسويق والنمو (3)', icon: TrendingUp },
    { id: 'digital', label: 'الحلول الرقمية (2)', icon: Smartphone },
    { id: 'enterprise', label: 'حلول الشركات (1)', icon: Building2 },
  ];

  // Helper to copy pitch in friendly Egyptian-Arabic
  const copyPackagePitch = (pkg: DecisionPackage) => {
    const priceText = pkg.priceLabel ? pkg.priceLabel : `${pkg.price.toLocaleString('en-US')} جنيه`;
    const featuresList = pkg.featuresIncluded
      .map((f, i) => `${i + 1}. *${f.name}*:\n   ${f.desc}`)
      .join('\n\n');
    const coreList = pkg.coreDeliverables
      .map(h => `• ${h}`)
      .join('\n');

    const text = `السلام عليكم ورحمة الله وبركاته 🌸
تحياتنا لحضرتك، يسعدنا في «منظومة دليلك» تقديم تفاصيل وعرض:

💎 *«${pkg.functionalTitle}»*
🏷️ *اللقب الرسمي:* ${pkg.marketingBadge}
💰 *التكلفة:* *${priceText}* (${pkg.billingCadenceLabel})
⏱️ *مدة التنفيذ والاستلام:* *${pkg.deliveryTime}*

🎯 *الباقة دي مناسبة لمين بالظبط؟*
${pkg.forWhom}

━━━━━━━━━━━━━━━━━━━━━
📋 *إيه اللي هيتعمل لنشاطك في الباقة دي بالتفصيل وبشكل مبسط؟*
${featuresList}

⭐ *أبرز المميزات الأساسية:*
${coreList}

━━━━━━━━━━━━━━━━━━━━━
🤝 *هدفنا نساعدك محلك يتعرف ويكبر وتزيد زباينك بدون أي تعقيدات تقنية.*
✨ *جاهزون للبدء والتنفيذ الفوري بمجرد تأكيدك، ويشرفنا الإجابة على أي استفسار لحضرتك.*
📞 *منظومة دليلك - في ضهر كل تاجر ونشاط في مصر 🇪🇬*`;

    navigator.clipboard.writeText(text);
    setCopiedPkgId(pkg.id);
    setCopyToast(`✓ تم نسخ تفاصيل وعرض «${pkg.shortName}» بنجاح! جاهزة للمشاركة مع التاجر.`);
    setTimeout(() => setCopiedPkgId(null), 2500);
    setTimeout(() => setCopyToast(null), 4000);
  };

  const copyFreeListingConditions = () => {
    const text = `السلام عليكم ورحمة الله وبركاته 🌸
تحياتنا لحضرتك من «منظومة دليلك» الدليل التجاري الشامل في مصر 🇪🇬

✨ يسرنا نبلغ حضرتك إننا بنوفر *إدراج وظهور كامل لنشاطك التجاري في دليل المحافظة مجاناً 100% وبدون أي مصاريف أو اشتراكات!*

📌 *الشرط الأساسي الوحيد للاستفادة من الظهور المجاني:*
${FREE_DIRECTORY_SERVICE.condition}

💡 *لو المحل مش متسجل على الخريطة أو مكانه مش مظبوط:*
${FREE_DIRECTORY_SERVICE.unverifiedNote}

📋 *المميزات المتاحة في الإدراج المجاني:*
• ظهور اسم المنشأة وتصنيفها للجمهور.
• أرقام التليفونات وزرار الواتساب المباشر عشان الزبون يوصلك ويتصل بيك علطول.
• توجيه العنوان لموقعك المعتمد على الخريطة التفاعلية.
• مواعيد وساعات العمل طوال أيام الأسبوع وتوضيح حالة المكان.
• بدون أي رسوم تسجيل وبدون أي اشتراكات دورية (مجاني 100%).

━━━━━━━━━━━━━━━━━━━━━
منظومة دليلك - دليل المحافظة المعتمد في مصر 🇪🇬`;

    navigator.clipboard.writeText(text);
    setCopyToast('✓ تم نسخ شروط وسياسة الإدراج المجاني بنجاح! جاهزة للمشاركة مع التاجر.');
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
    const ownerName = biz.ownerName ? `أستاذ/ة ${biz.ownerName}` : 'أصحاب وإدارة المنشأة';
    const bizName = biz.name || 'نشاطكم التجاري';

    const msg = `السلام عليكم ورحمة الله وبركاته 🌸
تحياتنا لحضرتك ${ownerName}، بخصوص نشاطكم الكريم: *«${bizName}»*

يسر فريق العمل بمنظومة دليلك تقديم هذا المقترح لتطوير ومضاعفة ظهور نشاطكم وزيادة زبائنكم:

💎 *«${pkg.functionalTitle}»*
💰 *التكلفة:* *${priceText}* (${pkg.billingCadenceLabel})
⏱️ *مدة التنفيذ والتسليم:* *${pkg.deliveryTime}*

🎯 *ليه الباقة دي بالذات هتناسب نشاطكم؟*
${pkg.forWhom}

📋 *أبرز ما تشمله الباقة بدقة:*
${pkg.coreDeliverables.map(h => `• ${h}`).join('\n')}

جاهزون للبدء والتنفيذ الفوري بمجرد تأكيد حضرتك، ويشرفنا الإجابة على أي استفسار.
━━━━━━━━━━━━━━━━━━━━━
*منظومة دليلك - في ضهر كل تاجر ونشاط في مصر 🇪🇬*`;

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

    if (t === 'corporate' || b === 'high') {
      setWizardResultPkgId('pkg_corporate');
    } else if (g === 'menu' || t === 'food') {
      setWizardResultPkgId('pkg_smart_menu');
    } else if (g === 'reels') {
      setWizardResultPkgId('pkg_reels');
    } else if (g === 'reputation') {
      setWizardResultPkgId('pkg_reputation');
    } else if (g === 'vip' || b === 'vip') {
      setWizardResultPkgId('pkg_vip');
    } else if (g === 'maps_only' || b === 'low') {
      setWizardResultPkgId('pkg_basic');
    } else {
      // Default recommended
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
              باقات وحلول منصة دليلك 💎
            </h2>
            <span className="text-[10.5px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md">
              أسعار معتمدة رسمياً
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] font-medium">
            اختر الحل المناسب لمرحلة مشروعك، أو دعنا نساعدك في تحديد الباقة الأنسب لنشاطك في 30 ثانية.
          </p>
        </div>

        {/* Wizard Trigger Button (Decision Engine Assistant) */}
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
          <span>{showWizard ? 'إغلاق المساعد ✕' : '🎯 ساعدني في اختيار الباقة'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. INTERACTIVE DECISION WIZARD (3-CLICK RECOMMENDATION ENGINE) */}
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
                  {wizardResultPkgId ? '🎉 النتيجة المقترحة لنشاطك' : 'مساعد دليلك الذكي لاختيار الباقة المناسبة'}
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] font-medium">
                  {wizardResultPkgId ? 'بناءً على إجاباتك، هذا هو الحل الأمثل لمرحلة نشاطك الحالية' : `الخطوة ${wizardStep} من 3: أجب عن هذا السؤال فقط`}
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

          {/* Wizard Step 1: Business Nature */}
          {!wizardResultPkgId && wizardStep === 1 && (
            <div className="space-y-2.5">
              <p className="text-xs font-black text-[var(--text-primary)]">
                1. ما هي طبيعة ومرحلة نشاطك التجاري حالياً؟
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { id: 'new', label: 'محل أو نشاط جديد لسه بيبدأ وبنبني وجوده', desc: 'محتاج توثيق وصفحات وبداية قوية' },
                  { id: 'existing', label: 'نشاط شغال بالفعل في منطقته وعاوز يزيد', desc: 'محتاج زباين جدد ومبيعات متصاعدة' },
                  { id: 'food', label: 'مطعم أو كافيه أو محل حلويات ومأكولات', desc: 'توصيل ودليفري ومنيو يومي' },
                  { id: 'corporate', label: 'شركة، مصنع، أو سلسلة فروع متعددة', desc: 'حلول مؤسسية وتأسيس شامل' }
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

          {/* Wizard Step 2: Primary Goal */}
          {!wizardResultPkgId && wizardStep === 2 && (
            <div className="space-y-2.5">
              <p className="text-xs font-black text-[var(--text-primary)]">
                2. ما هو الهدف الأهم الذي تحتاجه لنشاطك الآن؟
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { id: 'maps_only', label: 'الظهور على خرائط Google فقط وتوصيل الدليفري', desc: 'لوكيشن رسمي وتثبيت الموقع للزبائن' },
                  { id: 'growth_leads', label: 'صفحات سوشيال وإعلان شيك يجيب زباين على الواتساب', desc: 'حضور رقمي متكامل واتصالات مبيعات' },
                  { id: 'reputation', label: 'رفع التقييمات لـ 5 نجوم وحماية سمعة المكان', desc: 'كروت باركود واستيكرات ذكية للمحل' },
                  { id: 'reels', label: 'فيديوهات ريلز تشد الناس وإعلان محلي لمنطقتي', desc: 'انتشار بصري خاطف ومبيعات سريعة' },
                  { id: 'menu', label: 'منيو إلكتروني وسلة طلبات واتساب بدون عمولات', desc: 'توفير عمولات تطبيقات التوصيل الباهظة' },
                  { id: 'vip', label: 'فريق تسويق يدير لي كل حاجة شهرياً وأرتاح من المتابعة', desc: 'إدارة كاملة للمنصات والإعلانات' }
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
                3. ما هو نطاق الميزانية التي ترغب بالبدء بها؟
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'low', label: 'ميزانية بسيطة (حوالي 250 ج)', desc: 'تثبيت اللوكيشن والتواجد الرسمي' },
                  { id: 'mid', label: 'ميزانية متوسطة (750 - 1250 ج)', desc: 'تأسيس متكامل أو ريلز أو سمعة' },
                  { id: 'high', label: 'إدارة شهرية أو حلول كبرى (2,000 ج+)', desc: 'إدارة متكاملة أو منيو متقدم' }
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
                      الحل الموصى به لمشروعك:
                    </span>
                    <h4 className="text-sm sm:text-base font-black text-[var(--text-primary)]">
                      {resPkg.functionalTitle} ({resPkg.priceLabel || resPkg.price + ' ج.م'})
                    </h4>
                  </div>
                  <span className="text-xs bg-amber-500 text-slate-950 font-black px-2.5 py-1 rounded-lg shrink-0">
                    {resPkg.billingCadenceLabel}
                  </span>
                </div>

                <p className="text-xs text-[var(--text-secondary)] font-bold leading-relaxed">
                  🎯 {resPkg.forWhom}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-[var(--text-primary)] font-bold">
                  {resPkg.coreDeliverables.map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="text-emerald-500 font-black">✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-color)]">
                  {mode === 'public' ? (
                    <a
                      href={`https://wa.me/201143888355?text=${encodeURIComponent(`مرحباً دليلك 👋 قمت باستخدام مساعد الباقات واقترح لي «${resPkg.functionalTitle}» وأود البدء فوراً.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>طلب هذه الباقة الآن عبر واتساب 💬</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => copyPackagePitch(resPkg)}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Copy className="w-4 h-4" />
                      <span>نسخ تفاصيل الباقة المقترحة للتاجر 📋</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleSelectPackage(resPkg.id)}
                    className="py-2.5 px-4 rounded-xl bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-xs font-black text-amber-600 dark:text-amber-400 cursor-pointer"
                  >
                    عرض الشرح والتفاصيل ⬇️
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWizardStep(1);
                      setWizardResultPkgId(null);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-[var(--input-bg)] hover:bg-slate-200 dark:hover:bg-slate-800 text-[11px] font-bold text-[var(--text-muted)] cursor-pointer"
                  >
                    إعادة 🔄
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TRACK FILTER NAVIGATION PILLS (Organized into 4 Clean Paths) */}
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
      {/* 4. THE ANCHOR HERO RECOMMENDED PLAN (⭐ الخيار الأكثر طلباً ومبيعاً) */}
      {/* Baymard Principle: Visual Hierarchy & Decision Anchor */}
      {/* ========================================================================= */}
      {(selectedTrack === 'all' || selectedTrack === 'foundational') && (
        <div className="bg-gradient-to-br from-amber-500/15 via-[var(--bg-card)] to-yellow-500/10 border-2 border-amber-400 rounded-2xl p-4 sm:p-5 shadow-xl shadow-amber-500/10 space-y-3.5 relative overflow-hidden ring-2 ring-amber-400/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/30 pb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[11px] font-black px-3 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>الخيار الأكثر طلباً ومبيعاً لـ 80% من الأنشطة</span>
                </span>
              </div>
              <h3 className="text-base sm:text-xl font-black text-[var(--text-primary)]">
                {recommendedPkg.functionalTitle}
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-300 font-bold">
                🎯 {recommendedPkg.forWhom}
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
                href={`https://wa.me/201143888355?text=${encodeURIComponent(`مرحباً دليلك 👋 أود الاشتراك في باقة التأسيس والربط الذكي الأكثر طلباً (750 ج).`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>ابدأ بهذه الباقة الآن عبر واتساب 💬</span>
              </a>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => copyPackagePitch(recommendedPkg)}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copiedPkgId === recommendedPkg.id ? 'تم نسخ العرض بنجاح ✓' : 'نسخ عرض التأسيس للتاجر 📋'}</span>
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
                  <span>إرسال لنشاط 💎</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => handleSelectPackage(recommendedPkg.id)}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline py-2 px-3 cursor-pointer"
            >
              عرض الشرح ودليل التوجيه ⬇️
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SCANNABLE PACKAGE DECISION CARDS (Uniform Height & Cognitive Scan) */}
      {/* ========================================================================= */}
      <div ref={packagesGridRef} className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)] px-1">
          <span>تصفح خيارات ومسارات الباقات (انقر على أي باقة لمعاينة تفاصيلها ودليلها):</span>
          <span>{filteredPackages.length} باقة متاحة</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredPackages.map((pkg) => {
            const IconComp = pkg.icon;
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

                  {/* Crisp "For Whom?" Line (Persona Fit) */}
                  <div className="bg-[var(--bg-surface)] p-2 rounded-xl border border-[var(--border-color)] min-h-[3.2rem] flex items-center">
                    <p className="text-[11px] text-[var(--text-secondary)] font-bold line-clamp-2 leading-relaxed">
                      <strong className="text-amber-600 dark:text-amber-400">🎯 تناسب مين:</strong> {pkg.forWhom}
                    </p>
                  </div>

                  {/* 4 Crisp Checkmark Bullets (Scanning) */}
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
                        href={`https://wa.me/201143888355?text=${encodeURIComponent(`مرحباً دليلك 👋 أود الاستفسار والاشتراك في «${pkg.functionalTitle}» (${pkg.priceLabel || pkg.price + ' ج.م'}).`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>طلب عبر واتساب 💬</span>
                      </a>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPackage(pkg.id);
                        }}
                        className="w-full text-center text-[10.5px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer pt-0.5"
                      >
                        عرض التفاصيل الكاملة ⬇️
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
                        <span>{copiedPkgId === pkg.id ? 'تم النسخ بنجاح ✓' : 'نسخ العرض للتاجر 📋'}</span>
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
                          دليل الشرح 👁️
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
                          إرسال لنشاط 💎
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
      {/* 6. COMPACT FREE DIRECTORY LISTING NOTICE (خدمة عامة مجانية مشروطة) */}
      {/* ========================================================================= */}
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-0.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-black px-2.5 py-0.5 rounded-full text-[10px]">
              خدمة عامة مجانية 100% 📍
            </span>
            <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
              هل نشاطك موثق بالفعل على خرائط Google؟
            </h4>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] font-medium leading-relaxed">
            {FREE_DIRECTORY_SERVICE.condition} نوفر لك ظهوراً كاملاً في دليل المحافظة مجاناً 100% وبدون أي اشتراكات دورية.
          </p>
        </div>

        <div className="shrink-0 w-full sm:w-auto">
          {mode === 'public' ? (
            <a
              href={`https://wa.me/201143888355?text=${encodeURIComponent('مرحباً دليلك 👋 نشاطنا موثق بالفعل على خرائط Google، ونود طلب الإدراج المجاني في الدليل.')}`}
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
              <span>نسخ شروط الإدراج المجاني 📋</span>
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
            العودة لشبكة الباقات ⬆️
          </button>
        </div>

        {/* 2-Columns: Deliverables & Rep Sales Guidance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Column 1: Detailed Deliverables */}
          <div className="bg-[var(--bg-surface)] p-3.5 sm:p-4 rounded-xl border border-[var(--border-color)] space-y-2.5">
            <h4 className="font-black text-xs text-[var(--text-primary)] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>ما تتضمنه هذه الباقة بالتفصيل وبشكل مبسط:</span>
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

          {/* Column 2: Sales Pitch & Objection Handling (للمشغلين والمناديب) */}
          <div className="space-y-3 flex flex-col justify-between">
            <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-yellow-500/10 p-3.5 sm:p-4 rounded-xl border border-amber-500/40 space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-amber-500/25 pb-1.5">
                <span className="font-black text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>دليل توجيه وإقناع التاجر (خاص بالمشغلين والمناديب)</span>
                </span>
                <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded">
                  دليل المبيعات 💼
                </span>
              </div>

              <div className="space-y-2">
                <div className="bg-[var(--bg-card)] p-2.5 rounded-lg border border-[var(--border-color)]">
                  <span className="font-black text-amber-600 dark:text-amber-400 block text-[11px]">
                    ⚡ كيف تشرح الباقة لصاحب المحل في 30 ثانية؟
                  </span>
                  <p className="text-[11px] text-[var(--text-primary)] font-bold mt-0.5 leading-relaxed">
                    "{selectedPkg.pitchGuide.hook}"
                  </p>
                </div>

                <div className="bg-[var(--bg-card)] p-2.5 rounded-lg border border-[var(--border-color)]">
                  <span className="font-black text-blue-600 dark:text-blue-400 block text-[11px]">
                    🎯 متى تقترح هذه الباقة تحديداً على التاجر؟
                  </span>
                  <p className="text-[11px] text-[var(--text-secondary)] font-bold mt-0.5 leading-relaxed">
                    {selectedPkg.pitchGuide.need}
                  </p>
                </div>

                <div className="bg-[var(--bg-card)] p-2.5 rounded-lg border border-[var(--border-color)]">
                  <span className="font-black text-emerald-600 dark:text-emerald-400 block text-[11px]">
                    🛡️ الرد الاحترافي على اعتراضات العميل الشائعة:
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
                  href={`https://wa.me/201143888355?text=${encodeURIComponent(`مرحباً دليلك 👋 أود الاستفسار والاشتراك في «${selectedPkg.functionalTitle}» (${selectedPkg.priceLabel || selectedPkg.price + ' ج.م'}).`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>طلب هذه الباقة عبر واتساب 💬</span>
                </a>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => copyPackagePitch(selectedPkg)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{copiedPkgId === selectedPkg.id ? 'تم النسخ بنجاح ✓' : 'نسخ تفاصيل الباقة للتاجر 📋'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBizPickerModal(true);
                    }}
                    className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>إرسال لنشاط 💎</span>
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
                  إرسال عرض «{selectedPkg.shortName}» إلى منشأة 💎
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] font-bold">
                  اختر النشاط التجاري لإرسال هذا العرض المخصص له فوراً عبر واتساب
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
                placeholder="ابحث باسم النشاط، اسم المالك، رقم الهاتف، أو المحافظة..."
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl py-2.5 pr-10 pl-4 text-xs font-bold focus:outline-none focus:border-amber-500 text-[var(--text-primary)]"
                autoFocus
              />
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute top-3 right-3.5" />
            </div>

            <div className="overflow-y-auto flex-1 space-y-2 pr-1 custom-scrollbar">
              {(!businesses || businesses.length === 0) ? (
                <div className="p-6 text-center text-xs text-[var(--text-muted)] font-bold bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)] space-y-2">
                  <p>لا توجد أنشطة مسجلة محملة حالياً في هذه القائمة.</p>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400">
                    يمكنك استخدام زر «نسخ تفاصيل الباقة للتاجر» ولصقها مباشرة في محادثة واتساب الخاصة بالعميل.
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
                            <span>واتساب 💬</span>
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
