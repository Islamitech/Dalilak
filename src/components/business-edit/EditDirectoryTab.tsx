import React from 'react';
import { Business, VerificationStatus, AdminFollowUpCategory } from '../../types';
import { sanitizeExternalUrl } from '../../utils/urlSanitizer';
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

  // Build public directory URL
  const publicDirectoryUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?biz=${encodeURIComponent(formData.id)}`
    : `https://www.dalilaak.com/?biz=${encodeURIComponent(formData.id)}`;

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
      `يسعدنا إعلامكم بأنه تم نشر وتفعيل صفحة المكان رسمياً على دليل المنصة، ويمكنكم والزبائن معاينتها ومشاركتها عبر الرابط التالي:\n` +
      `🔗 ${publicDirectoryUrl}\n\n` +
      `*مزايا الصفحة بالدليل:*\n` +
      `1. توثيق رقم التواصل ومواعيد العمل والاتصال المباشر.\n` +
      `2. إمكانية مشاركة الرابط مع عملائكم لكتابة التقييمات ومشاهدة الصور.\n` +
      `3. الظهور المباشر أمام الزوار والباحثين في نطاق منطقتكم.\n\n` +
      `نتشرف بوجودكم معنا ونسعد دائماً بخدمتكم 🤝`;

    const encoded = safeWhatsAppEncode(cleanWhatsAppText(rawMsg));
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  };

  // WhatsApp Message: Review Request on Directory
  const handleSendDirectoryReviewRequestWa = () => {
    const venueLabel = getVenueContextLabel(formData.category);
    const venueName = formData.nameAr ? `«${formData.nameAr}»` : venueLabel;
    const phone = formatWhatsAppPhone(formData.ownerPhone || formData.phone);
    if (!phone) {
      onShowNotification?.('⚠️ لا يوجد رقم هاتف متاح للعميل');
      return;
    }

    const rawMsg =
      `*دعوة للمشاركة والتقييم — ${OFFICIAL_PLATFORM_HEADER}*\n` +
      `-----------------------------------------\n` +
      `أهلاً بحضرتك يا فندم مع ${venueName} 🌿\n\n` +
      `تقدر دلوقتي تشارك رابط صفحتكم الرسمية على دليل المنصة مع عملائكم علشان يقيموا تجربتهم ويكتبوا رأيهم المميز:\n` +
      `🔗 ${publicDirectoryUrl}\n\n` +
      `التقييمات الإيجابية بتزود ثقة الزبائن الجدد وبترفع ترتيب المكان في محركات البحث وقوائم الدليل ⭐\n` +
      `شاكرين جداً لذوقكم ووقتكم 🤝`;

    const encoded = safeWhatsAppEncode(cleanWhatsAppText(rawMsg));
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  };

  // WhatsApp Message: Trending Venue Honorary Invitation
  const handleSendTrendingInvitationWa = () => {
    const phone = formatWhatsAppPhone(formData.ownerPhone || formData.phone);
    if (!phone) {
      onShowNotification?.('⚠️ لا يوجد رقم هاتف متاح للعميل');
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
          ? 'bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-emerald-950/40 border-emerald-500/40'
          : isRejected
          ? 'bg-gradient-to-r from-rose-950/40 via-red-950/30 to-rose-950/40 border-rose-500/40'
          : 'bg-gradient-to-r from-amber-950/40 via-yellow-950/30 to-amber-950/40 border-amber-500/40'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black shrink-0 shadow-md ${
              isApproved
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : isRejected
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
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
                    ? 'المكان معتمد ومنشور رسمياً على الدليل العام 🟢'
                    : isRejected
                    ? 'المكان مرفوض ومحجوب عن الدليل العام 🔴'
                    : 'المكان بانتظار مراجعة واعتماد المسؤول ⏳'}
                </h4>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                  isApproved
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : isRejected
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {isApproved ? 'ظاهر للجمهور ✓' : isRejected ? 'محجوب تماماً 🔒' : 'قيد الفحص'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-bold mt-1">
                {isApproved
                  ? 'يظهر المكان في نتائج بحث الدليل، شبكة الكروت، الفئات، والتطبيق العام، ويمكن للجمهور زيارة صفحته والتواصل معه.'
                  : isRejected
                  ? 'تم حجب المكان تماماً عن الظهور في الدليل العام، وتظهر شاشة الحجب المؤسسية الصارمة عند محاولة فتح رابطه المباشر.'
                  : 'تم تسجيل بيانات المكان ومرفوعاته بنجاح، وهو بانتظار مراجعة الإدارة وتدقيق المحتوى لاعتماده ونشره للجمهور.'}
              </p>
            </div>
          </div>
        </div>

        {/* ── ADMIN DIRECTORY APPROVAL CONTROLS ── */}
        {isAdminOrFinancial && (
          <div className="mt-3 pt-3 border-t border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-amber-400 block">
                🏛️ أزرار اعتماد ونشر الدليل العام (صلاحيات المسؤول المباشرة):
              </label>
              <span className="text-[10px] text-slate-400 font-bold">
                (مستقل تماماً عن حالة خرائط Google)
              </span>
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
                <span>⏳ قيد المراجعة</span>
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
                <span>🟢 اعتماد ونشر</span>
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
                <span>🔴 حجب ورفض</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 2. LIVE DIRECTORY URL & PREVIEW CARD ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-amber-500" />
            <h5 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
              رابط صفحة المكان الرسمية على الدليل العام
            </h5>
          </div>
          <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--input-bg)] px-2 py-0.5 rounded-lg border border-[var(--border-color)]">
            ID: {formData.id}
          </span>
        </div>

        <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-2.5 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1 flex items-center gap-2 text-xs font-mono text-amber-600 dark:text-amber-400 truncate dir-ltr">
            <span className="truncate">{publicDirectoryUrl}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => handleCopyText(publicDirectoryUrl, 'directory_url')}
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
            <span className="text-xs font-black text-amber-600 dark:text-amber-400 truncate block">
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
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            تواصل مباشر بنقرة واحدة
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          {/* Action 1: Send Published Link */}
          <button
            type="button"
            onClick={handleSendDirectoryPublishedWa}
            className="p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold text-xs transition-all flex flex-col items-center text-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
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
            className="p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-bold text-xs transition-all flex flex-col items-center text-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
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
            className="p-3 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-800 dark:text-teal-300 border border-teal-500/30 font-bold text-xs transition-all flex flex-col items-center text-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
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
