import React from 'react';
import { Business, VerificationStatus, AdminFollowUpCategory } from '../../types';
import { sanitizeExternalUrl } from '../../utils/urlSanitizer';
import { getPublicDirectoryUrl, getDisplayDirectoryUrl } from '../../utils/directoryUrl';
import {
  generateTrendingFreeInvitationWhatsAppMessage,
  formatWhatsAppPhone,
  safeWhatsAppEncode,
  cleanWhatsAppText,
  OFFICIAL_PLATFORM_HEADER,
  getVenueContextLabel,
} from '../../utils/whatsappMessages';
import { ContextualFollowUpStrip } from './ContextualFollowUpStrip';
import {
  Store,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  Heart,
  Share2,
  MessageCircle,
  Sparkles,
  ShieldCheck,
  BarChart2,
  Link2,
  RotateCcw,
} from 'lucide-react';

interface EditDirectoryTabProps {
  formData: Business;
  setFormData: React.Dispatch<React.SetStateAction<Business | null>>;
  isEditMode: boolean;
  isAdminOrFinancial: boolean;
  handleSetVerificationStatus: (status: VerificationStatus) => void;
  onSave: (biz: Business) => void;
  copiedField: string | null;
  handleCopyText: (text: string, fieldKey: string) => void;
  currentUserName?: string;
  currentUserId?: string;
  userRole?: string;
  onOpenMasterDrawer?: (category?: AdminFollowUpCategory) => void;
  onShowNotification?: (msg: string) => void;
}

export const EditDirectoryTab: React.FC<EditDirectoryTabProps> = ({
  formData,
  setFormData,
  isEditMode,
  isAdminOrFinancial,
  handleSetVerificationStatus,
  onSave,
  copiedField,
  handleCopyText,
  currentUserName,
  currentUserId,
  userRole,
  onOpenMasterDrawer,
  onShowNotification,
}) => {
  const isApproved = formData.verificationStatus === 'verified';
  const isRejected = formData.verificationStatus === 'rejected';
  const isPending = !isApproved && !isRejected;

  // Build official public directory URLs with Arabic semantic slug
  const publicDirectoryUrl = getPublicDirectoryUrl(formData);
  const displayDirectoryUrl = getDisplayDirectoryUrl(formData);

  // WhatsApp Message: Directory Publication Congratulations
  const handleSendDirectoryPublishedWa = () => {
    const venueLabel = getVenueContextLabel(formData.category);
    const venueName = formData.nameAr ? `«${formData.nameAr}»` : venueLabel;
    const phone = formatWhatsAppPhone(formData.ownerPhone || formData.phone);
    if (!phone) {
      onShowNotification?.('⚠️ لا يوجد رقم هاتف متاح للعميل');
      return;
    }

    const rawMsg =
      `*مرحباً بكم في ${OFFICIAL_PLATFORM_HEADER}*\n` +
      `-----------------------------------------\n` +
      `• *اسم المكان:* ${venueName}\n` +
      `• *المسؤول / العميل:* ${formData.ownerName || 'المحترم'}\n` +
      `• *رقم الملف:* ${formData.invoiceNumber || ''}\n` +
      `• *حالة الدليل:* معتمد ومنشور رسمياً على الدليل العام 🟢\n\n` +
      `• *حالة الدليل:* معتمد ومنشور رسمياً على الدليل العام\n\n` +
      `🔗 *رابط صفحة المكان المباشر:*\n${displayDirectoryUrl}\n\n` +
      `نسعد بوجودكم ونتمنى لكم دوام التوفيق والانتشار!`;

    const encoded = safeWhatsAppEncode(cleanWhatsAppText(rawMsg));
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  };

  // WhatsApp Message: Review Request on Directory
  const handleSendDirectoryReviewRequestWa = () => {
    const venueLabel = getVenueContextLabel(formData.category);
    const venueName = formData.nameAr ? `«${formData.nameAr}»` : venueLabel;
    const phone = formatWhatsAppPhone(formData.ownerPhone || formData.phone);
    if (!phone) {
      onShowNotification?.('لا يوجد رقم هاتف متاح للعميل');
      return;
    }

    const rawMsg =
      `*دعوة للمشاركة والتقييم — ${OFFICIAL_PLATFORM_HEADER}*\n` +
      `-----------------------------------------\n` +
      `تحياتنا لإدارة ${venueName} الكرام،\n\n` +
      `يسرنا تزويدكم برابط صفحتكم الرسمية على دليل المنصة لإتاحته لعملائكم وإضافة التقييمات والآراء:\n` +
      `🔗 ${displayDirectoryUrl}\n\n` +
      `تساهم تقييمات العملاء في تعزيز ثقة الزوار الجدد ورفع ظهور المنشأة في قوائم الدليل ومحركات البحث.\n` +
      `شاكرين حسن تعاونكم،\n` +
      `إدارة منصة دليلك`;

    const encoded = safeWhatsAppEncode(cleanWhatsAppText(rawMsg));
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  };

  // WhatsApp Message: Trending Venue Honorary Invitation
  const handleSendTrendingInvitationWa = () => {
    const phone = formatWhatsAppPhone(formData.ownerPhone || formData.phone);
    if (!phone) {
      onShowNotification?.('لا يوجد رقم هاتف متاح للعميل');
      return;
    }

    const text = generateTrendingFreeInvitationWhatsAppMessage(formData);
    const encoded = safeWhatsAppEncode(text);
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-4 text-right">
      {/* ── 1. DIRECTORY LIVE STATUS HERO BANNER ── */}
      <div className={`rounded-2xl p-4 border transition-all shadow-xs ${
        isApproved
          ? 'bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/60 border-emerald-500/50'
          : isRejected
          ? 'bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/60 border-rose-500/50'
          : 'bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/60 border-amber-500/50'
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shadow-md shrink-0 border ${
              isApproved
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : isRejected
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
            }`}>
              {isApproved ? (
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              ) : isRejected ? (
                <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              ) : (
                <Clock className="w-6 h-6 stroke-[2.5]" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-black text-sm sm:text-base text-white">
                  {isApproved
                    ? 'المنشأة معتمدة ومنشورة رسمياً على الدليل العام'
                    : isRejected
                    ? 'المنشأة محجوبة عن العرض في الدليل العام'
                    : 'المنشأة بانتظار المراجعة والاعتماد'}
                </h4>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                  isApproved
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : isRejected
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {isApproved ? 'منشور للجمهور' : isRejected ? 'محجوب' : 'قيد الفحص'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-bold mt-1">
                {isApproved
                  ? 'الصفحة نشطة ومتاحة لجميع الزوار على الدليل العام مع روابط المشاركة والتقييم.'
                  : isRejected
                  ? 'تم حجب هذه الصفحة بقرار إداري؛ والروابط مقفلة ولا يمكن للجمهور فتح تفاصيل المنشأة.'
                  : 'الصفحة قيد الفحص الإداري؛ ويمكن للعميل فتحها مؤقتاً عبر رابط المعاينة لحين الاعتماد.'}
              </p>
            </div>
          </div>
        </div>

        {/* ── ADMIN DIRECTORY APPROVAL CONTROLS ── */}
        {isAdminOrFinancial && (
          <div className="mt-3 pt-3 border-t border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-amber-400 block">
                حالة النشر والاعتماد بالدليل العام:
              </label>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSetVerificationStatus('in_progress')}
                className={`p-2.5 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                  isPending
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                    : 'bg-slate-900/80 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>قيد المراجعة</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetVerificationStatus('verified')}
                className={`p-2.5 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                  isApproved
                    ? 'bg-emerald-500 text-white border-emerald-400 shadow-md font-black'
                    : 'bg-slate-900/80 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>اعتماد ونشر</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetVerificationStatus('rejected')}
                className={`p-2.5 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                  isRejected
                    ? 'bg-rose-600 text-white border-rose-400 shadow-md font-black'
                    : 'bg-slate-900/80 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>حجب ورفض</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 2. LIVE DIRECTORY URL & MANUAL OVERRIDE CARD ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-amber-500" />
            <h5 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
              رابط صفحة المكان الرسمية على الدليل العام
            </h5>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
              formData.customDirectoryUrl
                ? 'bg-purple-500/15 text-purple-600 border-purple-500/30'
                : 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
            }`}>
              {formData.customDirectoryUrl ? 'رابط يدوي مخصص' : 'رابط تلقائي معتمد'}
            </span>
            <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--input-bg)] px-2 py-0.5 rounded-lg border border-[var(--border-color)]">
              ID: {formData.id}
            </span>
          </div>
        </div>

        {/* ── Effective Active Link Display with Quick Actions ── */}
        <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-2.5 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1 flex items-center gap-2 text-xs font-mono text-amber-600 truncate dir-ltr">
            <span className="truncate" title={displayDirectoryUrl}>{displayDirectoryUrl}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => handleCopyText(displayDirectoryUrl, 'directory_url')}
              className="bg-[var(--bg-card)] hover:bg-amber-500/15 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold px-2.5 py-1.5 rounded-lg transition-transform active:scale-95 flex items-center gap-1 cursor-pointer shadow-2xs"
              title="نسخ الرابط المباشر"
            >
              {copiedField === 'directory_url' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500">تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-amber-500" />
                  <span>نسخ</span>
                </>
              )}
            </button>

            <a
              href={sanitizeExternalUrl(publicDirectoryUrl)}
              target="_blank"
              rel="noreferrer"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-3 py-1.5 rounded-lg shadow-xs transition-transform active:scale-95 flex items-center gap-1"
              title="فتح ومعاينة الصفحة بالدليل في نافذة جديدة"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>معاينة</span>
            </a>
          </div>
        </div>

        {/* ── Manual Custom Link Input Field ── */}
        <div className="pt-2 border-t border-[var(--border-color)]/60 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label className="text-[11px] font-black text-[var(--text-primary)] flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-amber-500" />
              <span>إدخال الرابط يدوياً (اختياري):</span>
            </label>
            {formData.customDirectoryUrl && (
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => (prev ? { ...prev, customDirectoryUrl: undefined } : null));
                  onShowNotification?.('تمت استعادة الرابط التلقائي المعتمد للمكان');
                }}
                className="text-[10px] text-amber-600 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                title="مسح الرابط المخصص والعودة للرابط التلقائي المعتمد"
              >
                <RotateCcw className="w-3 h-3" />
                <span>استعادة الرابط التلقائي</span>
              </button>
            )}
          </div>

          <div className="relative">
            <input
              type="text"
              value={formData.customDirectoryUrl || ''}
              onChange={(e) => {
                const val = e.target.value;
                setFormData((prev) => (prev ? { ...prev, customDirectoryUrl: val } : null));
              }}
              placeholder="مثال: https://www.dalilaak.com/biz/... (أو اتركه فارغاً للاعتماد التلقائي)"
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-mono text-[var(--text-primary)] dir-ltr outline-none transition-all placeholder:text-[var(--text-muted)]/60"
            />
          </div>

          <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
            {formData.customDirectoryUrl ? (
              <span className="text-purple-600 font-bold">
                ✓ تم تعيين رابط يدوي مخصص؛ يُعتمد مباشرة في المعاينة والمشاركة ورسائل الواتساب.
              </span>
            ) : (
              <span>
                يمكنك كتابة أو لصق أي رابط مخصص تفضله هنا، أو تركه فارغاً ليعمل الرابط التلقائي المعتمد.
              </span>
            )}
          </p>
        </div>

        {/* ── DIRECTORY ENGAGEMENT METRICS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="bg-[var(--input-bg)]/80 border border-[var(--border-color)] p-2.5 rounded-xl text-center space-y-0.5">
            <span className="text-[10px] text-[var(--text-muted)] font-bold block flex items-center justify-center gap-1">
              <Eye className="w-3 h-3 text-blue-400" />
              المشاهدات
            </span>
            <span className="text-sm font-mono font-black text-[var(--text-primary)]">
              {(formData.viewsCount || 0).toLocaleString()}
            </span>
          </div>

          <div className="bg-[var(--input-bg)]/80 border border-[var(--border-color)] p-2.5 rounded-xl text-center space-y-0.5">
            <span className="text-[10px] text-[var(--text-muted)] font-bold block flex items-center justify-center gap-1">
              <Heart className="w-3 h-3 text-rose-400" />
              المفضلة
            </span>
            <span className="text-sm font-mono font-black text-[var(--text-primary)]">
              {(formData.favoriteCount || 0).toLocaleString()}
            </span>
          </div>

          <div className="bg-[var(--input-bg)]/80 border border-[var(--border-color)] p-2.5 rounded-xl text-center space-y-0.5">
            <span className="text-[10px] text-[var(--text-muted)] font-bold block flex items-center justify-center gap-1">
              <BarChart2 className="w-3 h-3 text-emerald-400" />
              التصنيف
            </span>
            <span className="text-xs font-black text-amber-600 truncate block">
              {formData.category || 'عام'}
            </span>
          </div>

          <div className="bg-[var(--input-bg)]/80 border border-[var(--border-color)] p-2.5 rounded-xl text-center space-y-0.5">
            <span className="text-[10px] text-[var(--text-muted)] font-bold block flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-purple-400" />
              الاعتماد
            </span>
            <span className="text-xs font-black text-[var(--text-primary)] truncate block">
              {isApproved ? 'معتمد رسمي' : isRejected ? 'محجوب' : 'قيد التدقيق'}
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. DIRECTORY WHATSAPP COMMUNICATIONS HUB ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-emerald-500" />
            <h5 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
              رسائل واتساب المخصصة لخدمات وتوثيق الدليل العام
            </h5>
          </div>
          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            تواصل مباشر بنقرة واحدة
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          {/* Action 1: Send Published Link */}
          <button
            type="button"
            onClick={handleSendDirectoryPublishedWa}
            className="p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 border border-emerald-500/30 font-bold text-xs transition-all flex flex-col items-center text-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
          >
            <Share2 className="w-4 h-4 text-emerald-500" />
            <span className="font-black">إرسال رابط النشر بالدليل</span>
            <span className="text-[9.5px] text-slate-400 font-medium leading-tight">
              تهنئة العميل وتزويده برابط صفحته المعتمدة
            </span>
          </button>

          {/* Action 2: Review Request */}
          <button
            type="button"
            onClick={handleSendDirectoryReviewRequestWa}
            className="p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 border border-amber-500/30 font-bold text-xs transition-all flex flex-col items-center text-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="font-black">طلب التقييمات على الدليل</span>
            <span className="text-[9.5px] text-slate-400 font-medium leading-tight">
              دعوة زبائن المكان لتقييم الصفحة بالدليل
            </span>
          </button>

          {/* Action 3: Free Honorary Trending Invitation */}
          <button
            type="button"
            onClick={handleSendTrendingInvitationWa}
            className="p-3 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-800 border border-teal-500/30 font-bold text-xs transition-all flex flex-col items-center text-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
          >
            <Store className="w-4 h-4 text-teal-500" />
            <span className="font-black">دعوة الإدراج الشرفي (رائج)</span>
            <span className="text-[9.5px] text-slate-400 font-medium leading-tight">
              استئذان المكان المميز للعرض مجاناً بدون رسوم
            </span>
          </button>
        </div>
      </div>

      {/* ── 4. CONTEXTUAL CRM FOLLOW-UP STRIP FOR DIRECTORY ── */}
      <ContextualFollowUpStrip
        category="directory"
        categoryLabel="الدليل العام"
        categoryIcon={<Store className="w-3.5 h-3.5 text-amber-500" />}
        business={formData}
        onSave={onSave}
        setFormData={setFormData}
        currentUserName={currentUserName}
        currentUserId={currentUserId}
        userRole={userRole}
        onOpenMasterDrawer={onOpenMasterDrawer}
        onShowNotification={onShowNotification}
      />
    </div>
  );
};
