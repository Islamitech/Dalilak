import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Business, User, AdminFollowUpNote } from '../../../types';
import { formatWhatsAppPhone } from '../../../utils/whatsappMessages';
import { triggerHaptic } from '../../../utils/haptics';
import { 
  X, 
  Sparkles, 
  MessageCircle, 
  Copy, 
  Check, 
  MapPin, 
  Building2,
  Zap,
  Crown,
  ShieldCheck,
  Camera,
  Store,
  Clock,
  ClipboardList
} from 'lucide-react';

export interface AdminSendPackageModalProps {
  business: Business;
  isOpen: boolean;
  onClose: () => void;
  onUpdateBusiness?: (updated: Business) => void;
  currentUser?: User | null;
}

interface PackageOptionItem {
  id: string;
  name: string;
  priceText: string;
  subtext: string;
  icon: any;
  badge: string;
  color: string;
  delivery: string;
  highlights: string[];
}

const PACKAGES_OPTIONS: PackageOptionItem[] = [
  {
    id: 'pkg_basic',
    name: 'باقة التوثيق الأساسي وتثبيت خريطة Google',
    priceText: '250 جنيه',
    subtext: 'سداد لمرة واحدة + هدية ملصق QR للواجهة',
    icon: MapPin,
    badge: 'توثيق رسمي 📍',
    color: 'blue',
    delivery: '24 - 48 ساعة',
    highlights: [
      'تثبيت لوكيشن المحل بنقطة جغرافية دقيقة ومظبوطة بنظام GPS على خرائط Google',
      'إضافة اسم محلك وتليفوناتك ومواعيد الفتح والقفل طوال الأسبوع',
      'رفع الشعار وصور واجهة المحل والبضاعة بجودة واضحة تشد عين الزبون',
      'تظبيط بيانات النشاط عشان تظهر في أوائل نتائج البحث لما حد يبحث في منطقتك',
      'فاتورة إلكترونية رسمية معتمدة برمز QR لمشاركتها فوراً',
      'هدية خاصة: تصميم ملصق باركود QR Code شيك جاهز للطباعة والتعليق على باب المحل'
    ]
  },
  {
    id: 'pkg_pro',
    name: 'عرض التأسيس والربط الذكي والإعلانات',
    priceText: '750 جنيه',
    subtext: 'الأكثر طلباً ومبيعاً ⭐ (صفحات + إعلانات + ربط واتساب + 3 أيام دعم)',
    icon: Zap,
    badge: 'الأكثر طلباً ⭐',
    color: 'emerald',
    delivery: '3 أيام عمل مع مرافقة حية',
    highlights: [
      'تأسيس وضبط صفحات فيسبوك والمنصات باسم وشعار متناسق يعكس فخامة محلك',
      'ربط زرار الواتساب المباشر بالصفحة لتلقي رسائل وطلبات الزبائن فوراً على تليفونك',
      'تصميم إعلان ترويجي احترافي جذاب لبضاعتك أو أكلك بطريقة تشد عين الزبون',
      'صياغة كلام تسويقي بيّاع بلهجة مفهومة ومحفزة تشجع أهالي المنطقة على الشراء',
      'مرافقة وتوجيه ودعم مباشر لمدة 3 أيام خطوة بخطوة للرد على الزبائن ونشر العروض'
    ]
  },
  {
    id: 'pkg_reputation',
    name: 'باقة درع السمعة وزيادة التقييمات الإيجابية',
    priceText: '950 جنيه',
    subtext: 'رفع التقييم لـ 5 نجوم + كروت واستيكرات باركود للعملاء',
    icon: ShieldCheck,
    badge: 'حماية السمعة 🛡️',
    color: 'indigo',
    delivery: '5 - 7 أيام عمل',
    highlights: [
      'فحص شامل لملف نشاطك على جوجل ومعالجة الملاحظات وحماية التقييم العام',
      'طريقة ذكية وسهلة لتشجيع الزبائن الراضين إنهم يكتبوا تقييمات ممتازة من 5 نجوم',
      'معالجة الشكاوى بهدوء وسرية عبر قنوات داخلية قبل ما تتحول لتقييم سلبي يضر المكان',
      'تصميم كروت وملصقات باركود ذكية شيك للتقييم بمسحة واحدة بكاميرا الموبايل في 5 ثواني',
      'صياغة نماذج ردود شيك ومهذبة تعكس رقي تعاملك وتكبر مكانك في عين الزوار الجدد'
    ]
  },
  {
    id: 'pkg_reels',
    name: 'باقة فيديو ريلز وصناعة المحتوى المرئي الخاطف',
    priceText: '1,250 جنيه',
    subtext: '2 فيديو ريلز احترافي + تجهيز إعلان لمنطقتك',
    icon: Camera,
    badge: 'انتشار سريع 🎬',
    color: 'rose',
    delivery: '3 - 5 أيام عمل',
    highlights: [
      'إنتاج مقطعي فيديو قصيرين (2 Reels / TikTok) بمونتاج عصري خاطف للأنظار',
      'صياغة فكرة وسيناريو بمقدمة سريعة في أول 3 ثوانٍ تمنع الزبون إنه يقلب الفيديو',
      'تصميم أغلفة لافتة واختيار أنسب الموسيقى والهاشتاجات الرائجة في منطقتك',
      'إعداد وتجهيز حملة إعلانية ممولة للفيديو تستهدف سكان منطقتك والمدن القريبة منك',
      'تسليم الفيديوهات بجودتها الأصلية لاستخدامها الدائم في حالات الواتساب وصفحاتك'
    ]
  },
  {
    id: 'pkg_vip',
    name: 'باقة الدعم والإدارة التسويقية الشاملة VIP',
    priceText: '2,000 جنيه / شهر',
    subtext: 'إدارة متكاملة شهر كامل (30 يوماً) + تجديد بـ 1,000 ج فقط',
    icon: Crown,
    badge: 'الإدارة الكاملة 👑',
    color: 'amber',
    delivery: 'شهر كامل (30 يوماً متواصلة)',
    highlights: [
      'تصميم منشورات وبانرات إعلانية احترافية متجددة طوال الشهر لعرض منتجاتك وعروضك',
      'معالجة وتطوير صور وفيديوهات المنتجات المرسلة من المحل وإخراجها بقوالب شيك تفتح النفس',
      'جدولة ونشر المحتوى بانتظام عشان صفحتك تفضل نشطة وحاضرة قدام الزباين باستمرار',
      'تجهيز وضبط الحملات الإعلانية الممولة جغرافياً لتقليل تكلفة الرسالة',
      'إدارة التقييمات وصياغة الردود المهنية لتعزيز سمعة المنشأة ومصداقيتها أمام الجمهور',
      'دعم وتوجيه واستشارات تسويقية يومية مع صاحب العمل لتطوير المبيعات وطريقة إغلاق الطلبات',
      'ميزة التجديد المخفض: بعد انتهاء الشهر الأول، تقدر تكمل معانا إدارة بـ 1,000 ج بس شهرياً'
    ]
  },
  {
    id: 'pkg_smart_menu',
    name: 'باقة المنيو التفاعلي ومتجر الواتساب الذكي السريع',
    priceText: '3,500 جنيه',
    subtext: 'منيو إلكتروني تفاعلي + سلة طلبات واتساب بدون أي عمولات',
    icon: Store,
    badge: 'متجر ذكي 📱',
    color: 'cyan',
    delivery: '5 - 7 أيام عمل',
    highlights: [
      'تصميم وبرمجة منيو وكتالوج إلكتروني فائق السرعة يفتح على كافة الهواتف بدون أي تطبيقات',
      'سلة مشتريات ذكية ترسل تفاصيل أصناف الطلب والأسعار والعنوان لواتساب المحل فوراً وبدون عمولات',
      'لوحة تحكم سهلة جداً لتحديث الأسعار وتغيير الأصناف وإضافة عروض بضغطة زر من الموبايل',
      'تصميم ستاندات ولافتات كود QR شيك جداً لوضعها على الطاولات وكاونتر المحل لتسريع الطلب',
      'توفير عمولات تطبيقات التوصيل الوسيطة (15% إلى 25%) والاحتفاظ بكامل أرباحك الصافية لنفسك'
    ]
  },
  {
    id: 'pkg_annual_partner',
    name: 'باقة الشريك الماسي والظهور والتوثيق السنوي',
    priceText: '6,000 جنيه / سنوياً',
    subtext: 'صدارة دائم لمدة عام + شارة التوثيق الذهبية + تحديثات موسمية',
    icon: Sparkles,
    badge: 'شريك ماسي 💎',
    color: 'yellow',
    delivery: '12 شهراً متواصلة',
    highlights: [
      'ظهور مثبت في صدارة نتائج البحث (Featured Top Result) بتصنيف المحافظة طوال العام',
      'منح شارة التوثيق الذهبية المعتمدة (Gold Certified) كأحد أبرز الخيارات الموصى بها',
      'تمييز علامة وشعار المكان على الخريطة التفاعلية للدليل للمستخدمين والباحثين القريبين',
      'تحديث ربع سنوي شامل للصور، العروض، والمحتوى لمواكبة مواسم التسوق والأعياد (4 مرات سنوياً)',
      'أولوية استثنائية في الدعم الفني وتحديث البيانات السريع على مدار العام'
    ]
  },
  {
    id: 'pkg_corporate',
    name: 'باقة الشركات والمشاريع الكبرى والمحلات تحت التجهيز',
    priceText: 'تسعير مخصص حسب المشروع',
    subtext: 'دراسة مخصصة للمشاريع والفروع والأنشطة تحت التجهيز والإنشاء',
    icon: Building2,
    badge: 'حلول مؤسسية 🏢',
    color: 'purple',
    delivery: 'حسب متطلبات المشروع',
    highlights: [
      'تصميم وتطوير الهوية البصرية والمؤسسية المتكاملة والشعار بالملفات المفتوحة الكاملة للطباعة فوراً',
      'تصميم الواجهات الخارجية واللافتات والبانرات الميدانية وباقات التعبئة والتغليف والزي الموحد',
      'تأسيس وتوثيق رقمي موحد لكافة الفروع والمواقع على الخرائط والمنصات لسهولة وصول الزبائن لأقرب فرع',
      'تخطيط وإدارة حملات الإطلاق والافتتاح الكبرى لضمان أعلى تفاعل ومبيعات متصاعدة من اليوم الأول',
      'بناء منظومات ولاء العملاء وتكرار الشراء وتدريب فرق العمل والتشغيل على أساليب البيع',
      'جلسة استشارية متخصصة مع الإدارة العليا وتصميم عرض فني ومالي مفصل بناءً على دراسة احتياجات النشاط'
    ]
  },
  {
    id: 'pkg_free_notice',
    name: 'خدمة الإدراج والظهور في الدليل مجاناً 100%',
    priceText: 'مجاناً (0 ج.م)',
    subtext: 'خدمة عامة مشروطة بوجود موقع موثق على Google Maps',
    icon: Check,
    badge: 'إدراج مجاني 🎁',
    color: 'emerald',
    delivery: 'فوري خلال 24 ساعة',
    highlights: [
      'ظهور اسم المنشأة وتصنيفها في دليل المحافظة للجمهور مجاناً وبدون أي رسوم تسجيل',
      'عرض أرقام الهواتف وزرار الواتساب المباشر عشان الزبون يوصلك ويتصل بيك علطول',
      'تثبيت وتوجيه العنوان لموقعكم المعتمد على الخريطة التفاعلية للدليل',
      'عرض مواعيد وساعات العمل طوال أيام الأسبوع وتوضيح حالة المكان',
      'شرط الاستفادة: يشترط أن يكون للنشاط موقع موثق بالفعل على Google Maps (وإذا لم يتوفر يُقترح البدء بباقة التوثيق 250 ج)'
    ]
  }
];

function generatePackageWhatsAppMessage(pkg: PackageOptionItem, biz: Business): string {
  const ownerSalutation = biz.ownerName ? `أستاذ/ة ${biz.ownerName} المحترم/ة 🌸` : 'أصحاب وإدارة المنشأة المحترمين 🌸';
  const bizName = biz.nameAr || biz.name || 'نشاطكم الكريم';
  const locationInfo = biz.governorate && biz.city ? ` (${biz.governorate} - ${biz.city})` : (biz.governorate ? ` (${biz.governorate})` : '');

  if (pkg.id === 'pkg_free_notice') {
    return (
      `السلام عليكم ورحمة الله وبركاته 🌸\n` +
      `تحياتنا لحضرتك ${ownerSalutation} بخصوص نشاطكم الكريم: *«${bizName}»*${locationInfo}\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `يسعدنا في «منظومة دليلك» نوضح لحضرتك تفاصيل:\n` +
      `🎁 *خدمة إدراج وظهور المنشأة في دليل المحافظة مجاناً 100%*\n\n` +
      `💰 *التكلفة:* مجاني تماماً وبدون أي اشتراكات دورية (0 ج.م)\n` +
      `⏱️ *وقت التفعيل:* خلال 24 ساعة بمجرد التأكيد\n` +
      `📌 *الشرط الأساسي الوحيد:* أن يكون للنشاط موقع جغرافي موثق بالفعل على خرائط Google.\n\n` +
      `📋 *المميزات اللي هتاخدها في الإدراج المجاني:*\n` +
      pkg.highlights.map(h => `• ${h}`).join('\n') +
      `\n\n` +
      `💡 *ملحوظة:* لو المحل مش متسجل على الخريطة أو مكانه مش مظبوط، بنقترح تبدأ بـ «باقة التوثيق الأساسي» (250 ج) عشان نثبت مكانك على جوجل الأول.\n\n` +
      `للتأكيد والبدء فوراً، يرجى الرد بكلمة «تأكيد الإدراج» لإتمام التسجيل في الدليل.\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `منظومة دليلك - دليل المحافظة المعتمد في مصر 🇪🇬`
    );
  }

  return (
    `السلام عليكم ورحمة الله وبركاته 🌸\n` +
    `تحياتنا لحضرتك ${ownerSalutation} بخصوص نشاطكم الكريم: *«${bizName}»*${locationInfo}\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `يسعدنا في «منظومة دليلك» نوضح لحضرتك تفاصيل وعرض:\n` +
    `💎 *«${pkg.name}»*\n\n` +
    `💰 *التكلفة الرسمية:* *${pkg.priceText}* (${pkg.subtext})\n` +
    `⏱️ *مدة التنفيذ والمتابعة:* *${pkg.delivery}*\n\n` +
    `📋 *إيه اللي هيتعمل لنشاطك في الباقة دي بالظبط وبشكل مبسط؟*\n` +
    pkg.highlights.map(h => `✓ ${h}`).join('\n') +
    `\n\n` +
    `🤝 هدفنا نساعد محلك يتعرف ويزيد زباينه بشكل عملي وبسيط بدون أي تعقيدات تقنية، وبنوفر لحضرتك فاتورة معتمدة ومتابعة خطوة بخطوة.\n\n` +
    `لبدء التنفيذ وحجز الموعد، يرجى الرد بكلمة «موافق» أو إرسال استفسارك للبدء فوراً.\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `منظومة دليلك - في ضهر كل تاجر ونشاط في مصر 🇪🇬`
  );
}

export const AdminSendPackageModal: React.FC<AdminSendPackageModalProps> = ({
  business,
  isOpen,
  onClose,
  onUpdateBusiness,
  currentUser,
}) => {
  const [selectedPkgId, setSelectedPkgId] = useState<string>('pkg_pro');
  const [copied, setCopied] = useState<boolean>(false);
  const [loggedNote, setLoggedNote] = useState<boolean>(false);

  if (!isOpen || !business) return null;

  const currentPkg = PACKAGES_OPTIONS.find(p => p.id === selectedPkgId) || PACKAGES_OPTIONS[1];
  const messageText = generatePackageWhatsAppMessage(currentPkg, business);

  const rawPhone = business.ownerPhone || business.phone || '';
  const cleanPhone = formatWhatsAppPhone(rawPhone);
  const waUrl = cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`
    : `https://wa.me/?text=${encodeURIComponent(messageText)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    triggerHaptic('success');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleLogFollowUp = () => {
    if (!onUpdateBusiness) return;
    const authorName = currentUser?.name || 'مدير النظام';
    const authorRole = currentUser?.role || 'admin';

    const newNote: AdminFollowUpNote = {
      id: `fu_pkg_${Date.now()}`,
      authorId: currentUser?.id || 'admin',
      authorName,
      authorRole,
      type: 'general',
      status: 'completed',
      text: `تم إرسال تفاصيل «${currentPkg.name}» بقيمة (${currentPkg.priceText}) للمنشأة عبر واتساب.`,
      createdAt: new Date().toISOString()
    };

    const existingFollowUps = business.adminFollowUps || [];
    const updatedBiz: Business = {
      ...business,
      adminFollowUps: [newNote, ...existingFollowUps]
    };

    onUpdateBusiness(updatedBiz);
    triggerHaptic('success');
    setLoggedNote(true);
    setTimeout(() => setLoggedNote(false), 3000);
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-hidden modal-overlay animate-fade-in font-['Cairo']"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ direction: 'rtl' }}
    >
      <div 
        className="bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl space-y-4 text-[var(--text-primary)] relative modal-content transition-all duration-300 my-auto max-h-[92vh] flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-rose-500 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border border-[var(--border-color)] cursor-pointer transition-colors shadow-sm z-20 hover:scale-105 active:scale-95"
          aria-label="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3 pl-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20 shrink-0">
              <Sparkles className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-[var(--text-primary)] flex items-center gap-2">
                <span>إرسال تفاصيل باقة تسويقية للمنشأة</span>
                <span>💎</span>
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] font-bold">
                توليد عرض مخصص وإرساله مباشرة لواتساب صاحب المكان
              </p>
            </div>
          </div>

          {/* Business Meta Pill */}
          <div className="bg-[var(--input-bg)] border border-amber-500/30 rounded-2xl px-3 py-1.5 flex items-center gap-2 shrink-0 self-start sm:self-center">
            <Building2 className="w-4 h-4 text-amber-500 shrink-0" />
            <div className="text-right">
              <p className="font-black text-xs text-[var(--text-primary)] leading-tight">{business.nameAr}</p>
              <p className="text-[10px] text-[var(--text-muted)] font-mono">
                {business.ownerName || 'صاحب المنشأة'} • {business.ownerPhone || business.phone || 'بدون هاتف'}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 pr-1 pl-1 space-y-4 custom-scrollbar">
          {/* 1. Package Selector Grid */}
          <div className="space-y-2">
            <label className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <span>اختر الباقة المراد إرسال تفاصيلها:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2">
              {PACKAGES_OPTIONS.map((pkg) => {
                const isSelected = selectedPkgId === pkg.id;
                const IconComp = pkg.icon;
                const isPro = pkg.id === 'pkg_pro';

                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => {
                      setSelectedPkgId(pkg.id);
                      triggerHaptic('light');
                    }}
                    className={`p-2.5 sm:p-3 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-2 relative ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-950/30 ring-2 ring-amber-500/30 shadow-sm scale-[1.01]'
                        : isPro
                        ? 'bg-[var(--input-bg)] border-amber-400/50 hover:border-amber-400'
                        : 'bg-[var(--input-bg)] border-[var(--border-color)] hover:border-amber-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 w-full">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                        isSelected ? 'bg-amber-500 text-slate-950 font-black' : 'bg-[var(--bg-card)] text-amber-500'
                      }`}>
                        <IconComp className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 truncate max-w-[110px]">
                        {pkg.badge}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-black text-xs text-[var(--text-primary)] leading-snug line-clamp-1">
                        {pkg.name}
                      </h4>
                      <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                        {pkg.priceText}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Selected Package Deliverables Summary */}
          <div className="bg-[var(--input-bg)] border border-[var(--border-color)] p-3.5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="font-black text-xs text-[var(--text-primary)]">
                  {currentPkg.name}
                </span>
                <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  ({currentPkg.priceText})
                </span>
              </div>
              <div className="text-[10px] text-[var(--text-muted)] font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-500" />
                <span>مدة التنفيذ: {currentPkg.delivery}</span>
              </div>
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-[var(--text-secondary)] font-bold pt-1">
              {currentPkg.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-1.5 leading-snug">
                  <span className="text-emerald-500 font-black shrink-0">✓</span>
                  <span className="text-[11px]">{h}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. WhatsApp Message Preview Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span>معاينة نص الرسالة الصادرة للواتساب:</span>
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                    <span className="text-emerald-500 font-black">تم النسخ بنجاح!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>نسخ النص فقط</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-950 text-slate-200 p-3.5 sm:p-4 rounded-2xl font-mono text-xs leading-relaxed whitespace-pre-wrap border border-slate-800 select-all max-h-56 overflow-y-auto custom-scrollbar">
              {messageText}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="pt-3 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onUpdateBusiness && (
              <button
                type="button"
                onClick={handleLogFollowUp}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 w-full sm:w-auto ${
                  loggedNote
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 font-black'
                    : 'bg-[var(--input-bg)] hover:bg-amber-500/15 text-[var(--text-secondary)] border-[var(--border-color)]'
                }`}
                title="تسجيل ملاحظة في سجل المتابعات الإدارية للنشاط"
              >
                <ClipboardList className="w-3.5 h-3.5 text-amber-500" />
                <span>{loggedNote ? 'تم التدوين في المتابعات ✓' : 'تسجيل كمتابعة إدارية 📝'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-[var(--input-bg)] hover:bg-amber-500/15 text-[var(--text-secondary)] border border-[var(--border-color)] transition-all cursor-pointer flex items-center justify-center gap-1.5 w-full sm:w-auto"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'تم النسخ' : 'نسخ النص'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] border border-[var(--border-color)] transition-all cursor-pointer w-1/3 sm:w-auto text-center"
            >
              إلغاء
            </button>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                triggerHaptic('success');
                if (onUpdateBusiness && !loggedNote) {
                  handleLogFollowUp();
                }
              }}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 transition-all active:scale-95 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>إرسال عبر واتساب للمنشأة 💬</span>
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
