import React, { useState } from 'react';
import { Business, VerificationStatus } from '../../types';
import { getPublicDirectoryUrl, getDisplayDirectoryUrl } from '../../utils/directoryUrl';
import {
  generateTrendingFreeInvitationWhatsAppMessage,
  formatWhatsAppPhone,
  safeWhatsAppEncode,
  cleanWhatsAppText,
  OFFICIAL_PLATFORM_HEADER,
  getVenueContextLabel,
} from '../../utils/whatsapp';
import {
  Store,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageCircle,
  Share2,
  Sparkles,
  Link2,
  Star,
  MapPin,
  Eye,
} from 'lucide-react';

interface DrawerDirectoryTabProps {
  business: Business;
  canEdit: boolean;
  onUpdateStatus?: (status: VerificationStatus) => void;
  onUpdateCustomUrl?: (url: string) => void;
  onShowNotification?: (msg: string) => void;
}

export const DrawerDirectoryTab: React.FC<DrawerDirectoryTabProps> = ({
  business,
  canEdit,
  onUpdateStatus,
  onUpdateCustomUrl,
  onShowNotification,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditingCustomUrl, setIsEditingCustomUrl] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState(business.customDirectoryUrl || '');

  const isApproved = business.verificationStatus === 'verified';
  const isRejected = business.verificationStatus === 'rejected';
  const isPending = !isApproved && !isRejected;

  const publicDirectoryUrl = getPublicDirectoryUrl(business);
  const displayDirectoryUrl = getDisplayDirectoryUrl(business);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(displayDirectoryUrl);
    setCopied(true);
    onShowNotification?.('تم نسخ رابط الدليل بنجاح');
    setTimeout(() => setCopied(false), 2500);
  };

  // WhatsApp Message: Congratulations on publication
  const handleSendPublishedWa = () => {
    const venueLabel = getVenueContextLabel(business.category);
    const venueName = business.nameAr ? `«${business.nameAr}»` : venueLabel;
    const phone = formatWhatsAppPhone(business.ownerPhone || business.phone);
    if (!phone) {
      onShowNotification?.('⚠️ لا يوجد رقم هاتف مسجل للمنشأة');
      return;
    }

    const rawMsg =
      `*مرحباً بكم في ${OFFICIAL_PLATFORM_HEADER}*\n` +
      `-----------------------------------------\n` +
      `• *اسم المكان:* ${venueName}\n` +
      `• *المسؤول / العميل:* ${business.ownerName || 'المحترم'}\n` +
      `• *حالة الدليل:* معتمد ومنشور رسمياً على الدليل العام 🟢\n\n` +
      `🔗 *رابط صفحة المكان المباشر:*\n${displayDirectoryUrl}\n\n` +
      `نسعد بوجودكم ونتمنى لكم دوام التوفيق والانتشار!`;

    const encoded = safeWhatsAppEncode(cleanWhatsAppText(rawMsg));
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  };

  // WhatsApp Message: Review Request
  const handleSendReviewRequestWa = () => {
    const venueLabel = getVenueContextLabel(business.category);
    const venueName = business.nameAr ? `«${business.nameAr}»` : venueLabel;
    const phone = formatWhatsAppPhone(business.ownerPhone || business.phone);
    if (!phone) {
      onShowNotification?.('⚠️ لا يوجد رقم هاتف مسجل للمنشأة');
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

  // WhatsApp Message: Trending Honorary Invitation
  const handleSendTrendingWa = () => {
    const phone = formatWhatsAppPhone(business.ownerPhone || business.phone);
    if (!phone) {
      onShowNotification?.('⚠️ لا يوجد رقم هاتف مسجل للمنشأة');
      return;
    }

    const text = generateTrendingFreeInvitationWhatsAppMessage(business);
    const encoded = safeWhatsAppEncode(text);
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  };

  const handleSaveCustomUrl = () => {
    if (onUpdateCustomUrl) {
      onUpdateCustomUrl(customUrlInput.trim());
    }
    setIsEditingCustomUrl(false);
    onShowNotification?.('تم تحديث الرابط المخصص بنجاح');
  };

  return (
    <div className="space-y-4 animate-fade-in font-['Cairo',sans-serif]">
      {/* ── 1. DIRECTORY STATUS HERO BANNER ── */}
      <div
        className={`p-4 rounded-2xl border transition-all ${
          isApproved
            ? 'bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/60 border-emerald-500/40'
            : isRejected
            ? 'bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/60 border-rose-500/40'
            : 'bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/60 border-amber-500/40'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center font-black shrink-0 border ${
                isApproved
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : isRejected
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
              }`}
            >
              {isApproved ? (
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              ) : isRejected ? (
                <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
              ) : (
                <Clock className="w-5 h-5 stroke-[2.5]" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-extrabold text-sm sm:text-base text-white">
                  {isApproved
                    ? 'المنشأة معتمدة ومنشورة رسمياً على الدليل العام'
                    : isRejected
                    ? 'المنشأة محجوبة عن العرض في الدليل العام'
                    : 'المنشأة بانتظار المراجعة والاعتماد'}
                </h4>
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                    isApproved
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : isRejected
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {isApproved ? 'منشور للجمهور 🟢' : isRejected ? 'محجوب 🛑' : 'قيد الفحص ⏳'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium mt-1">
                {isApproved
                  ? 'الصفحة نشطة ومتاحة لجميع الزوار على الدليل العام مع روابط المشاركة والتقييم.'
                  : isRejected
                  ? 'تم حجب هذه الصفحة بقرار إداري؛ والروابط مقفلة ولا يمكن للجمهور تصفح المكان.'
                  : 'الصفحة قيد الفحص والتدقيق الميداني؛ تظهر بعد المراجعة والاعتماد.'}
              </p>
            </div>
          </div>
        </div>

        {/* Status Action Buttons for Admins / Managers */}
        {canEdit && onUpdateStatus && (
          <div className="mt-3 pt-3 border-t border-slate-700/60">
            <p className="text-[11px] font-bold text-amber-300 mb-2">تحديث حالة النشر المباشر:</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onUpdateStatus('in_progress')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                  isPending
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-sm'
                    : 'bg-slate-900/80 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>قيد المراجعة</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateStatus('verified')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                  isApproved
                    ? 'bg-emerald-500 text-white border-emerald-400 font-extrabold shadow-sm'
                    : 'bg-slate-900/80 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>اعتماد ونشر</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateStatus('rejected')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                  isRejected
                    ? 'bg-rose-600 text-white border-rose-400 font-extrabold shadow-sm'
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

      {/* ── 2. OFFICIAL PUBLIC DIRECTORY URL ── */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-indigo-600" />
            <h5 className="font-extrabold text-xs sm:text-sm text-slate-900">
              رابط صفحة المكان الرسمية على الدليل العام
            </h5>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
            {business.customDirectoryUrl ? 'رابط مخصص' : 'رابط معتمد'}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
          <span className="text-xs font-mono text-slate-700 truncate select-all" dir="ltr">
            {displayDirectoryUrl}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleCopyLink}
              className="py-1.5 px-2.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
              title="نسخ رابط الدليل"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>نسخ</span>
                </>
              )}
            </button>

            <a
              href={publicDirectoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1.5 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs"
              title="فتح صفحة الدليل في نافذة جديدة"
            >
              <span>فتح الدليل</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Custom URL Editor Toggle for Admins */}
        {canEdit && onUpdateCustomUrl && (
          <div className="pt-1">
            {!isEditingCustomUrl ? (
              <button
                type="button"
                onClick={() => setIsEditingCustomUrl(true)}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Link2 className="w-3 h-3" />
                <span>تخصيص رابط يدوي للمنشأة</span>
              </button>
            ) : (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-[11px] font-bold text-slate-700 block">
                  الرابط أو المعرف المخصص (Custom Slug):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="مثال: el-mabrouk-supermarket"
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCustomUrl}
                    className="py-1.5 px-3 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 cursor-pointer"
                  >
                    حفظ
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingCustomUrl(false)}
                    className="py-1.5 px-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 3. DIRECTORY WHATSAPP DISPATCH CARDS ── */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-emerald-600" />
          <h5 className="font-extrabold text-xs sm:text-sm text-slate-900">
            رسائل WhatsApp المرتبطة بالدليل العام
          </h5>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Card 1: Congratulations */}
          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/70 flex flex-col justify-between gap-2.5">
            <div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md inline-block mb-1">
                تهنئة النشر
              </span>
              <h6 className="font-extrabold text-xs text-slate-900">تهنئة باعتماد ونشر المنشأة</h6>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                إرسال رسالة رسمية للعميل مع رابط صفحته المباشر لتهنئته بالنشر على دليل المنصة.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSendPublishedWa}
              className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-98"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>إرسال تهنئة عبر WhatsApp</span>
            </button>
          </div>

          {/* Card 2: Review & Rating Request */}
          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 flex flex-col justify-between gap-2.5">
            <div>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md inline-block mb-1">
                زيادة التقييمات
              </span>
              <h6 className="font-extrabold text-xs text-slate-900">طلب تقييم ومشاركة الرابط</h6>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                دعوة العميل لمشاركة رابطه مع زبائنه لجمع التقييمات والآراء ورفع ترتيبه بالدليل.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSendReviewRequestWa}
              className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-98"
            >
              <Star className="w-3.5 h-3.5" />
              <span>إرسال طلب التقييم</span>
            </button>
          </div>

          {/* Card 3: Trending Venue Invitation */}
          <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-200/70 flex flex-col justify-between gap-2.5 sm:col-span-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-md inline-block mb-1">
                  دعوة فخرية
                </span>
                <h6 className="font-extrabold text-xs text-slate-900">دعوة الأنشطة الرائجة الفخرية</h6>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  دعوة النشاط للانضمام الفخري لقائمة المنشآت الرائجة مع استعراض مميزات الظهور والتوثيق الميداني.
                </p>
              </div>
              <Sparkles className="w-5 h-5 text-indigo-500 shrink-0 mt-1" />
            </div>
            <button
              type="button"
              onClick={handleSendTrendingWa}
              className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-98"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>إرسال دعوة الرواج الفخرية عبر WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 4. LIVE DIRECTORY CARD VISUAL PREVIEW ── */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <h5 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-slate-500" />
            <span>معاينة ظهور المكان في الدليل العام للجمهور</span>
          </h5>
          <span className="text-[10px] text-slate-400 font-medium">نمط بطاقة العرض</span>
        </div>

        <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-3">
          {business.coverPhoto ? (
            <img
              src={business.coverPhoto}
              alt={business.nameAr}
              className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-2xl shrink-0">
              🏢
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                {business.category}
              </span>
              {isApproved && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  موثق ومعتمد ✓
                </span>
              )}
            </div>
            <h6 className="font-extrabold text-sm text-slate-900 truncate mt-1">
              {business.nameAr}
            </h6>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">
                {business.governorate} - {business.city}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
