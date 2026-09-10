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
    name: 'باقة التوثيق وتثبيت الموقع على Google Maps',
    priceText: '250 جنيه',
    subtext: 'سداد لمرة واحدة + فاتورة معتمدة وملصق QR تفاعلي',
    icon: MapPin,
    badge: 'توثيق رسمي',
    color: 'blue',
    delivery: '24 - 48 ساعة',
    highlights: [
      'تثبيت الموقع الجغرافي للمنشأة بدقة GPS معتمدة على خرائط Google',
      'تسجيل الاسم الرسمي والنشاط وأرقام التواصل وقنوات الاتصال وساعات العمل',
      'رفع الصور الرسمية للمقر والواجهة والخدمات بجودة عالية تعزز الموثوقية',
      'فاتورة إلكترونية معتمدة برمز QR مع ملصق باركود تفاعلي للمقر'
    ]
  },
  {
    id: 'pkg_pro',
    name: 'عرض التأسيس الرقمي وإطلاق الحملة التعريفية',
    priceText: '750 جنيه',
    subtext: 'الأكثر طلباً (تأسيس منصات + ربط قنوات الحجز + إعلان تعريفي + 3 أيام دعم)',
    icon: Zap,
    badge: 'الأكثر طلباً',
    color: 'emerald',
    delivery: '3 أيام عمل مع مرافقة تنفيذية',
    highlights: [
      'إنشاء وتنسيق المنصات الرسمية بهوية متناسقة تعبر عن التخصص ومكانة المنشأة',
      'ربط زر المحادثة الفورية بالواتساب وقنوات الاتصال لتلقي الاستفسارات والحجوزات مباشرة',
      'تصميم إعلان تعريفي احترافي يبرز خدمات أو منتجات المنشأة بمظهر راقٍ',
      'مرافقة واستشارات تنفيذية لمدة 3 أيام لضبط التفاعل واستقبال أولى الاستفسارات'
    ]
  },
  {
    id: 'pkg_reputation',
    name: 'باقة إدارة السمعة وتنمية التقييمات الإيجابية',
    priceText: '950 جنيه',
    subtext: 'رفع التقييمات لـ 5 نجوم + بطاقات وملصقات QR ذكية',
    icon: ShieldCheck,
    badge: 'حماية السمعة والتقييمات',
    color: 'indigo',
    delivery: '5 - 7 أيام عمل',
    highlights: [
      'فحص شامل لملف المنشأة الرقمي ومعالجة الملاحظات لتحسين التقييم العام',
      'منظومة تفاعلية لتشجيع العملاء والمراجعين الراضين على توثيق تجاربهم الإيجابية بسهولة',
      'تصميم بطاقات وملصقات باركود ذكية (QR) لتقييم المنشأة فورياً بكاميرا الهاتف في ثوانٍ',
      'توجيه الشكاوى الحساسة إلى قنوات تواصل داخلية لمعالجتها باحترافية وسرية'
    ]
  },
  {
    id: 'pkg_reels',
    name: 'باقة الإنتاج المرئي القصير وإعلانات الفيديو',
    priceText: '1,250 جنيه',
    subtext: 'إنتاج مقطعي ريلز احترافيين + إطلاق حملة إعلانية ممولة',
    icon: Camera,
    badge: 'إنتاج مرئي وترويج',
    color: 'rose',
    delivery: '3 - 5 أيام عمل',
    highlights: [
      'إنتاج مقطعي فيديو قصيرين (2 Reels / Short Videos) بمونتاج وإخراج احترافي حديث',
      'صياغة سيناريو مركز يبرز نقاط التميز والتجهيزات في الثواني الأولى للمشاهد',
      'تصميم أغلفة مميزة وإدراج هوية المنشأة ومعلومات التواصل بوضوح',
      'إعداد وإطلاق حملة إعلانية ممولة تستهدف الجمهور المهتم في نطاقكم الجغرافي'
    ]
  },
  {
    id: 'pkg_vip',
    name: 'باقة الإدارة التسويقية والرقمية الشاملة (VIP)',
    priceText: '2,000 جنيه / شهرياً',
    subtext: 'إدارة متكاملة لمدة شهر (30 يوماً) + إمكانية التجديد بـ 1,000 ج',
    icon: Crown,
    badge: 'إدارة تسويقية شاملة',
    color: 'amber',
    delivery: 'شهر كامل (30 يوماً متواصلة)',
    highlights: [
      'تصميم ونشر محتوى دوري منتظم يعكس هوية وتخصص المنشأة طوال الشهر (30 يوماً)',
      'إعداد وإدارة الحملات الإعلانية الممولة جغرافياً للوصول للعملاء المستهدفين بأفضل تكلفة',
      'تحسين ومعالجة المواد التعريفية وصور المنشأة وإخراجها بقوالب بصرية متناسقة',
      'استشارات تسويقية دورية مع إمكانية التجديد للشهر التالي بنصف التكلفة (1,000 ج)'
    ]
  },
  {
    id: 'pkg_smart_menu',
    name: 'باقة القائمة والكتالوج الرقمي التفاعلي (Smart QR)',
    priceText: '3,500 جنيه',
    subtext: 'كتالوج وقائمة رقمية تفاعلية + نظام سلة وطلب مباشر بدون عمولات',
    icon: Store,
    badge: 'قائمة رقمية ومتجر ذكي',
    color: 'cyan',
    delivery: '5 - 7 أيام عمل',
    highlights: [
      'كتالوج وقائمة رقمية تفاعلية تفتح بمسح الباركود بكاميرا الهاتف دون تحميل تطبيقات',
      'نظام سلة وحجز فوري يرسل تفاصيل الخدمة أو الطلب مباشرة إلى واتساب المنشأة دون وسيط',
      'لوحة تحكم سهلة من الهاتف لتعديل الأسعار والخدمات والأصناف المتاحة في أي وقت',
      'تصميم ستاندات وبطاقات QR فاخرة للاستقبال والمكاتب لتيسير استعراض الخدمات والطلب'
    ]
  },
  {
    id: 'pkg_annual_partner',
    name: 'باقة الرعاية السنوية وتصدر نتائج البحث المعتمدة',
    priceText: '6,000 جنيه / سنوياً',
    subtext: 'صدارة نتائج البحث بالمحافظة + شارة التوثيق الذهبية + تحديثات دورية',
    icon: Sparkles,
    badge: 'رعاية سنوية معتمدة',
    color: 'yellow',
    delivery: '12 شهراً متواصلة',
    highlights: [
      'تثبيت وظهور دائم في صدارة نتائج البحث في دليل المحافظة على مدار 12 شهراً',
      'منح المنشأة شارة التوثيق الذهبية المعتمدة كعلامة ثقة رسمية معلنة للجمهور',
      'تمييز موقع وشعار المنشأة على الخريطة التفاعلية للدليل للمستخدمين في النطاق المحيط',
      'تحديثات دورية ربع سنوية (4 مرات بالعام) للبيانات والصور والخدمات لمواكبة التطورات'
    ]
  },
  {
    id: 'pkg_corporate',
    name: 'باقة التأسيس المؤسسي المتكامل وسلاسل الفروع',
    priceText: 'تسعير مخصص حسب المشروع',
    subtext: 'دراسة مخصصة للمشاريع الكبرى والشركات وسلاسل الفروع',
    icon: Building2,
    badge: 'حلول مؤسسية متكاملة',
    color: 'purple',
    delivery: 'حسب متطلبات المشروع',
    highlights: [
      'تطوير الهوية المؤسسية الكاملة (الشعار، دليل الهوية البصرية، والمطبوعات الرسمية)',
      'تأسيس وتوثيق رقمي موحد لكافة الفروع والمواقع على الخرائط والمنصات الرسمية',
      'تخطيط وإدارة حملات الإطلاق والافتتاح الكبرى لتحقيق أعلى تفاعل وحضور ميداني ورقمي',
      'جلسة استشارية متخصصة مع الإدارة التنفيذية وتقديم دراسة فنية ومالية مفصلة'
    ]
  },
  {
    id: 'pkg_free_notice',
    name: 'خدمة الإدراج والظهور في الدليل مجاناً 100%',
    priceText: 'مجاناً (0 ج.م)',
    subtext: 'خدمة عامة مشروطة بوجود موقع موثق على Google Maps',
    icon: Check,
    badge: 'إدراج وظهور مجاني',
    color: 'emerald',
    delivery: 'فوري خلال 24 ساعة',
    highlights: [
      'ظهور اسم وتصنيف المنشأة في دليل المحافظة للجمهور مجاناً وبدون أي رسوم تسجيل',
      'عرض أرقام الهواتف وزر الواتساب المباشر لتسهيل تواصل المراجعين والعملاء',
      'تثبيت وتوجيه العنوان لموقعكم المعتمد على الخريطة التفاعلية للدليل',
      'عرض مواعيد وساعات العمل طوال أيام الأسبوع وتوضيح حالة المكان',
      'شرط الاستفادة: يشترط أن يكون للمنشأة موقع جغرافي موثق بالفعل على Google Maps'
    ]
  }
];

function generatePackageWhatsAppMessage(pkg: PackageOptionItem, biz: Business): string {
  const ownerSalutation = biz.ownerName ? `أستاذ/ة ${biz.ownerName} المحترم/ة` : 'أصحاب وإدارة المنشأة المحترمين';
  const bizName = biz.nameAr || biz.name || 'منشأتكم الكريمة';
  const locationInfo = biz.governorate && biz.city ? ` (${biz.governorate} - ${biz.city})` : (biz.governorate ? ` (${biz.governorate})` : '');

  if (pkg.id === 'pkg_free_notice') {
    return (
      `السلام عليكم ورحمة الله وبركاته،\n` +
      `تحياتنا لكم ${ownerSalutation} بخصوص منشأتكم الكريمة: *«${bizName}»*${locationInfo}\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `يسرنا في «منظومة دليلك» إحاطتكم بتفاصيل:\n` +
      `*خدمة إدراج وظهور المنشأة في دليل المحافظة مجاناً 100%*\n\n` +
      `- التكلفة: مجاني تماماً وبدون أي اشتراكات دورية (0 ج.م)\n` +
      `- وقت التفعيل: خلال 24 ساعة بمجرد التأكيد\n` +
      `- الشرط الأساسي الوحيد: أن يكون للمنشأة موقع جغرافي موثق بالفعل على خرائط Google.\n\n` +
      `المزايا المتاحة في الإدراج المجاني:\n` +
      pkg.highlights.map(h => `• ${h}`).join('\n') +
      `\n\n` +
      `ملاحظة: في حال لم يكن موقع المنشأة مسجلاً بدقة على الخريطة، نقترح البدء بـ «باقة التوثيق الأساسي» (250 ج) لتثبيت الموقع الجغرافي أولاً.\n\n` +
      `للتأكيد والبدء فوراً، يرجى الرد بكلمة «تأكيد الإدراج» لإتمام التسجيل في الدليل.\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `منظومة دليلك - شريك التوثيق والتطوير الرقمي المعتمد في مصر`
    );
  }

  return (
    `السلام عليكم ورحمة الله وبركاته،\n` +
    `تحياتنا لكم ${ownerSalutation} بخصوص منشأتكم الكريمة: *«${bizName}»*${locationInfo}\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `يسعدنا في «منظومة دليلك» تقديم تفاصيل العرض التنفيذي المقترح:\n` +
    `*«${pkg.name}»*\n\n` +
    `- التكلفة: *${pkg.priceText}* (${pkg.subtext})\n` +
    `- مدة التنفيذ والتسليم: *${pkg.delivery}*\n\n` +
    `المخرجات والخدمات التنفيذية المشمولة:\n` +
    pkg.highlights.map(h => `• ${h}`).join('\n') +
    `\n\n` +
    `نحرص على تعزيز الحضور الرقمي والمهني لمنشأتكم وتيسير وصول العملاء والمراجعين باحترافية، مع توفير فاتورة رسمية معتمدة برمز QR ومتابعة مستمرة.\n\n` +
    `لبدء التنفيذ أو الاستفسار، يسعدنا تواصلكم والرد بكلمة «تأكيد» للبدء الفوري.\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `منظومة دليلك - شريك التوثيق والتطوير الرقمي المعتمد في مصر`
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
  const formattedPhone = formatWhatsAppPhone(rawPhone);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      triggerHaptic();
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleSendWhatsApp = () => {
    triggerHaptic();
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank');

    // Automatically append follow-up note if handler available
    if (onUpdateBusiness && !loggedNote) {
      const now = new Date().toISOString();
      const newNote: AdminFollowUpNote = {
        id: 'pkg_note_' + Date.now(),
        createdAt: now,
        date: now,
        authorId: currentUser?.id || 'admin',
        authorName: currentUser?.name || 'مشغل دليلك',
        author: currentUser?.name || 'مشغل دليلك',
        type: 'general',
        category: 'whatsapp',
        text: `تم إرسال تفاصيل «${currentPkg.name}» عبر واتساب إلى المنشأة.`
      };
      const existingNotes = business.adminFollowUpNotes || business.adminFollowUps || [];
      const updatedNotes = [newNote, ...existingNotes];
      onUpdateBusiness({
        ...business,
        adminFollowUps: updatedNotes,
        adminFollowUpNotes: updatedNotes,
        updatedAt: now
      });
      setLoggedNote(true);
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      style={{ direction: 'rtl' }}
    >
      <div 
        className="bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4 text-[var(--text-primary)] relative animate-fade-in my-auto max-h-[92vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-[var(--text-primary)]">
                إرسال تفاصيل الباقة للمنشأة
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-bold">
                المنشأة: <span className="text-amber-500">{business.name}</span>
                {business.ownerName && <span> • المالك: {business.ownerName}</span>}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-rose-500 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 space-y-4 pr-1 pl-1 custom-scrollbar">
          {/* Select Package Segment */}
          <div className="space-y-2">
            <label className="text-xs font-black text-[var(--text-muted)] block">
              1. اختر الباقة أو العرض المراد إرساله:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PACKAGES_OPTIONS.map((pkg) => {
                const isSelected = selectedPkgId === pkg.id;
                const IconComp = pkg.icon;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => {
                      setSelectedPkgId(pkg.id);
                      setLoggedNote(false);
                      triggerHaptic();
                    }}
                    className={`p-2.5 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 shadow-md ring-1 ring-amber-500/50'
                        : 'border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-amber-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
                        isSelected ? 'bg-amber-500 text-slate-950' : 'bg-[var(--input-bg)] text-amber-500'
                      }`}>
                        <IconComp className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[9.5px] font-black px-1.5 py-0.5 rounded bg-[var(--input-bg)] text-[var(--text-muted)]">
                        {pkg.badge}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-black text-[var(--text-primary)] leading-tight line-clamp-1">
                        {pkg.name}
                      </div>
                      <div className="text-[11px] font-mono font-bold text-amber-500 mt-0.5">
                        {pkg.priceText}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Package Highlights Review */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-black text-[var(--text-primary)]">
              <span>المخرجات التنفيذية للباقة المختارة:</span>
              <span className="text-amber-500 text-[11px]">مدة التنفيذ: {currentPkg.delivery}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-[var(--text-secondary)] font-bold">
              {currentPkg.highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-black shrink-0 mt-0.5">✓</span>
                  <span className="leading-snug">{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* WhatsApp Message Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-black text-[var(--text-muted)]">
              <span>2. معاينة نص الرسالة الموجهة لمنشأة العميل:</span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] text-amber-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>{copied ? 'تم النسخ بنجاح ✓' : 'نسخ النص'}</span>
              </button>
            </div>
            <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3.5 text-xs text-[var(--text-primary)] font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto custom-scrollbar select-all">
              {messageText}
            </div>
          </div>

          {/* Phone verification check */}
          {!formattedPhone && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs font-bold flex items-center gap-2">
              <X className="w-4 h-4 shrink-0" />
              <span>تنبيه: لا يوجد رقم هاتف صالح مسجل لهذه المنشأة للإرسال المباشر. يمكنك نسخ الرسالة يدوياً.</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[var(--input-bg)] hover:bg-slate-200 text-[var(--text-primary)] font-black text-xs sm:text-sm border border-[var(--border-color)] flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Copy className="w-4 h-4" />
            <span>{copied ? 'تم نسخ الرسالة ✓' : 'نسخ نص العرض'}</span>
          </button>

          <button
            type="button"
            disabled={!formattedPhone}
            onClick={handleSendWhatsApp}
            className={`w-full sm:flex-1 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
              formattedPhone
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 cursor-pointer'
                : 'bg-slate-700 text-slate-400 opacity-50 cursor-not-allowed'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>إرسال العرض فوراً عبر واتساب ({formattedPhone || 'بدون رقم'})</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
