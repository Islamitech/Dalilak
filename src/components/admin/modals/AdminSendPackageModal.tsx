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
    name: 'باقة التوثيق الأساسي لخرائط Google',
    priceText: '250 جنيه',
    subtext: 'سداد لمرة واحدة + هدية QR',
    icon: MapPin,
    badge: 'توثيق رسمي 📍',
    color: 'blue',
    delivery: '24 - 48 ساعة',
    highlights: [
      'تثبيت الموقع الجغرافي الدقيق بنظام GPS على Google Maps',
      'رفع اللوجو وصور الواجهة وساعات العمل وأرقام التواصل الرسمية',
      'تهيئة الكلمات المفتاحية للبحث المحلي (Local SEO)',
      'فاتورة إلكترونية رسمية معتمدة برمز QR لمشاركتها فوراً',
      'هدية خاصة: تصميم ملصق باركود QR احترافي لموقعكم جاهز للطباعة'
    ]
  },
  {
    id: 'pkg_pro',
    name: 'عرض التأسيس والربط الذكي والإعلانات',
    priceText: '750 جنيه',
    subtext: 'الأكثر طلباً ⭐ (توثيق + سوشيال ميديا + 3 أيام دعم)',
    icon: Zap,
    badge: 'الأكثر طلباً ⭐',
    color: 'emerald',
    delivery: '3 أيام عمل مع مرافقة حية',
    highlights: [
      'كل مميزات التوثيق الأساسي الميداني على خرائط Google',
      'تأسيس وضبط صفحات فيسبوك والمنصات بهوية بصرية متناسقة',
      'صياغة وصف تسويقي احترافي وهندسة الكلمات المفتاحية لجذب الزبائن',
      'تصميم إعلان تسويقي احترافي وطريقة عرض متميزة للمنتجات',
      'مرافقة وتوجيه ودعم تسويقي خطوة بخطوة لمدة 3 أيام لزيادة الاتصالات'
    ]
  },
  {
    id: 'pkg_reputation',
    name: 'باقة درع السمعة والمراجعات الموثقة',
    priceText: '950 جنيه',
    subtext: 'حماية السمعة + تقييمات 5 نجوم',
    icon: ShieldCheck,
    badge: 'حماية السمعة 🛡️',
    color: 'indigo',
    delivery: '5 - 7 أيام عمل',
    highlights: [
      'فحص شامل لملف النشاط على Google وحل الملاحظات وحماية التقييم العام',
      'منظومة ذكية لتوجيه الزبائن الراضين لكتابة تقييمات إيجابية حقيقية',
      'معالجة الشكاوى بهدوء عبر قنوات داخلية قبل تحولها لتقييمات سلبية عامة',
      'كروت وملصقات ذكية لتسهيل كتابة التقييم من هاتف العميل في ثوانٍ',
      'صياغة قوالب ردود رسمية ومهنية تعكس رقي واحترافية الإدارة'
    ]
  },
  {
    id: 'pkg_reels',
    name: 'باقة فيديو ريلز والانتشار السريع',
    priceText: '1,250 جنيه',
    subtext: 'فيديوهات ريلز + إعلان جغرافي',
    icon: Camera,
    badge: 'انتشار سريع 🎬',
    color: 'rose',
    delivery: '3 - 5 أيام عمل',
    highlights: [
      'إنتاج مقطعي فيديو قصيرين (2 Reels / TikTok) بمونتاج احترافي وموسيقى جذابة',
      'سيناريو وفكرة بمقدمة خاطفة تمنع تخطي الفيديو وتشد الانتباه',
      'تصميم أغلفة لافتة واختيار الكلمات والهاشتاجات الأكثر انتشاراً',
      'تجهيز وضبط الحملة الإعلانية للفيديو لاستهداف النطاق الجغرافي للمحل',
      'خطة فنية لاستغلال الفيديوهات في حالات الواتساب لتعظيم المبيعات'
    ]
  },
  {
    id: 'pkg_vip',
    name: 'باقة الدعم والإدارة التسويقية الشاملة VIP',
    priceText: '2,000 جنيه / شهر',
    subtext: 'فريق تسويق متكامل + تجديد بنصف السعر',
    icon: Crown,
    badge: 'الإدارة الكاملة 👑',
    color: 'amber',
    delivery: 'شهر كامل (30 يوماً متواصلة)',
    highlights: [
      'تصميم منشورات وبانرات إعلانية احترافية متجددة طوال الشهر',
      'معالجة وإعادة إخراج صور وفيديوهات المنتجات بأعلى جودة',
      'جدولة ونشر المحتوى بانتظام لإبقاء المنصات نشطة أمام الزبائن',
      'تجهيز وضبط الحملات الممولة جغرافياً لتقليل تكلفة الرسالة (ميزانية التمويل يسددها العميل للمنصات مباشرة)',
      'إدارة التقييمات وصياغة الردود المهنية واستشارات يومية لتطوير المبيعات',
      'تجديد اختياري مخفض: إمكانية الاستمرار بعد الشهر الأول بـ 1,000 ج فقط'
    ]
  },
  {
    id: 'pkg_smart_menu',
    name: 'باقة المنيو التفاعلي ومتجر الواتساب الذكي',
    priceText: '3,500 جنيه',
    subtext: 'كتالوج رقمي + سلة طلبات مباشرة للواتساب',
    icon: Store,
    badge: 'متجر ذكي 📱',
    color: 'cyan',
    delivery: '5 - 7 أيام عمل',
    highlights: [
      'منيو أو متجر رقمي سريع وسلس متوافق مع كافة الهواتف بدون تحميل تطبيقات',
      'سلة طلبات ذكية ترسل تفاصيل أصناف الطلب والعنوان لواتساب المحل فوراً',
      'توفير عمولات تطبيقات التوصيل الخارجية وامتلاك علاقة مباشرة مع العميل',
      'تصميم ستاندات ولافتات باركود QR جاهزة للوضع على الطاولات والكاونتر',
      'ربط المتجر بصفحة المنشأة في دليل منصة دليلك لتدفق مستمر للزبائن'
    ]
  },
  {
    id: 'pkg_annual_partner',
    name: 'باقة الشريك الماسي والظهور السنوي',
    priceText: '6,000 جنيه / سنوياً',
    subtext: 'تصدر نتائج البحث + شارة التوثيق الذهبية',
    icon: Sparkles,
    badge: 'شريك ماسي 💎',
    color: 'yellow',
    delivery: '12 شهراً متواصلة',
    highlights: [
      'تثبيت وظهور دائم في صدارة نتائج بحث الدليل بالمحافظة طوال 12 شهراً',
      'منح المنشأة شارة التوثيق الذهبية المعتمدة (Gold Certified)',
      'ظهور مميز لشعار المكان على الخريطة التفاعلية لسكان وزوار المنطقة',
      'تحديث موسمي للصور والعروض كل 3 أشهر لمواكبة المناسبات والمواسم',
      'أولوية قصوى في الدعم الفني والمتابعة على مدار العام'
    ]
  },
  {
    id: 'pkg_corporate',
    name: 'باقة الشركات والمشاريع الكبرى والمحلات تحت التجهيز',
    priceText: 'تسعير مخصص حسب المشروع',
    subtext: 'هوية بصرية + واجهات ومطبوعات + تأسيس رقمي شامل',
    icon: Building2,
    badge: 'حلول مؤسسية 🏢',
    color: 'purple',
    delivery: 'حسب متطلبات المشروع',
    highlights: [
      'تصميم الهوية المؤسسية الكاملة والشعار وملفات الطباعة واللافتات الميدانية',
      'تأسيس وتوثيق رقمي موحد لكافة الفروع والمواقع على الخرائط والمنصات',
      'تخطيط وإدارة حملات الافتتاح والانطلاق الكبرى لضمان أعلى تفاعل من اليوم الأول',
      'بناء منظومة ولاء العملاء وتدريب فريق المبيعات والتشغيل',
      'جلسة استشارية وتصميم عرض فني ومالي مفصل بناءً على دراسة احتياجات النشاط'
    ]
  },
  {
    id: 'pkg_free_notice',
    name: 'خدمة الإدراج والظهور في الدليل مجاناً 100%',
    priceText: 'مجاناً (0 ج.م)',
    subtext: 'خدمة عامة مشروطة بوجود موقع موثق على Google',
    icon: Check,
    badge: 'إدراج مجاني 🎁',
    color: 'emerald',
    delivery: 'فوري خلال 24 ساعة',
    highlights: [
      'ظهور اسم المنشأة وتصنيفها في دليل المحافظة للجمهور مجاناً 100%',
      'عرض أرقام الهواتف وروابط الواتساب المباشرة للوصول السريع',
      'تثبيت وتوجيه العنوان لموقعكم المعتمد على الخريطة التفاعلية',
      'عرض مواعيد العمل طوال أيام الأسبوع',
      'شرط الاستفادة: يشترط أن يكون للنشاط موقع موثق بالفعل على Google Maps (وإذا لم يتوفر يُقترح البدء بباقة التوثيق 250 ج)'
    ]
  }
];

function generatePackageWhatsAppMessage(pkg: PackageOptionItem, biz: Business): string {
  const ownerSalutation = biz.ownerName ? `أستاذ / ${biz.ownerName} المحترم،` : 'حضرة المسؤول المحترم،';
  const bizName = biz.nameAr ? `«${biz.nameAr}»` : 'منشأتكم الكريمة';
  const locationInfo = biz.governorate && biz.city ? ` (${biz.governorate} - ${biz.city})` : '';

  if (pkg.id === 'pkg_free_notice') {
    return (
      `السلام عليكم ورحمة الله وبركاته 🌸\n` +
      `تحياتنا لإدارة ${bizName}${locationInfo}\n` +
      `${ownerSalutation}\n` +
      `-----------------------------------------\n` +
      `يسعدنا من إدارة منصة دليلك (Dalelak) تقديم تفاصيل:\n` +
      `🎁 *خدمة إدراج المنشأة والظهور في الدليل مجاناً 100%*\n\n` +
      `💰 *الاستثمار:* مجاني تماماً بدون أي رسوم أو اشتراكات (0 ج.م)\n` +
      `⏱️ *سرعة التنفيذ:* تفعيل فوري خلال 24 ساعة عمل\n` +
      `📌 *شرط الاستفادة الأساسي:* أن يكون لنشاطكم موقع جغرافي موثق بالفعل على خرائط Google.\n\n` +
      `⭐ *ما تتضمنه الخدمة لمنشأتكم:*\n` +
      pkg.highlights.map(h => `• ${h}`).join('\n') +
      `\n\n` +
      `💡 *ملاحظة:* إذا لم يكن للمكان موقع موثق على الخريطة، نقترح البدء بـ «باقة التوثيق الأساسي» (250 ج) لتثبيت مكانكم على Google أولاً.\n\n` +
      `للتفعيل الفوري والبدء، يرجى الرد بـ «تأكيد الإدراج» لإتمام تسجيل المكان.\n` +
      `-----------------------------------------\n` +
      `منصة دليلك لإدارة وتوثيق الأنشطة الميدانية 🇪🇬\n` +
      `خدمة العملاء والواتساب: 01143888355`
    );
  }

  return (
    `السلام عليكم ورحمة الله وبركاته 🌸\n` +
    `تحياتنا لإدارة ${bizName}${locationInfo}\n` +
    `${ownerSalutation}\n` +
    `-----------------------------------------\n` +
    `يسعدنا من إدارة منصة دليلك (Dalelak) تقديم عرض تفاصيل:\n` +
    `💎 *${pkg.name}*\n\n` +
    `💰 *الاستثمار / السعر الرسمي:* *${pkg.priceText}* (${pkg.subtext})\n` +
    `⏱️ *مدة التنفيذ والمتابعة:* *${pkg.delivery}*\n\n` +
    `⭐ *أبرز ما تتضمنه الباقة بدقة:*\n` +
    pkg.highlights.map(h => `✓ ${h}`).join('\n') +
    `\n\n` +
    `🤝 نوفر لكم عقداً وفاتورة رسمية معتمدة مع مرافقة خطوة بخطوة لضمان أعلى عائد وظهور متميز لـ ${bizName}.\n\n` +
    `لبدء التنفيذ وحجز الموعد، يرجى الرد بكلمة «موافق» أو طلب استفسار للبدء فوراً.\n` +
    `-----------------------------------------\n` +
    `منصة دليلك لإدارة وتوثيق الأنشطة الميدانية 🇪🇬\n` +
    `للتواصل والدعم: 01143888355`
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
