import React, { useState } from 'react';
import { Business, AdminFollowUpCategory } from '../../types';
import { EGYPT_GOVERNORATES } from '../../data/mockData';
import { sanitizeExternalUrl } from '../../utils/urlSanitizer';
import {
  CloudUpload,
  Copy,
  Check,
  Download,
  MapPin,
  Building,
  Navigation,
  ExternalLink,
  CheckCircle2,
  MessageCircle,
  Send,
  Eye,
  EyeOff,
  KeyRound,
  Star,
  Zap,
  Loader2,
} from 'lucide-react';
import { extractGooglePlaceData } from '../../utils/googlePlaceExtractor';
import {
  generateGoogleVerificationOtpWhatsAppMessage,
  getGoogleVerificationOtpWhatsAppUrl,
  generateGoogleOtpSentAlertWhatsAppMessage,
  getGoogleOtpSentAlertWhatsAppUrl,
  generateGoogleMapsVerifiedWhatsAppMessage,
  getGoogleMapsVerifiedWhatsAppUrl,
} from '../../utils/whatsappMessages';
import { ContextualFollowUpStrip } from './ContextualFollowUpStrip';

interface EditLocationTabProps {
  formData: Business;
  setFormData: React.Dispatch<React.SetStateAction<Business | null>>;
  isEditMode: boolean;
  isAdminOrFinancial: boolean;
  googleBadge: { label: string; cls: string };
  handleCopyGoogleDetails: () => void;
  handleDownloadAllPhotos: () => void;
  copiedField: string | null;
  handleCopyText?: (text: string, fieldName: string) => void;
  isDownloadingPhotos: boolean;
  onSave?: (biz: Business) => void;
  currentUserName?: string;
  currentUserId?: string;
  userRole?: string;
  onOpenMasterDrawer?: (category?: AdminFollowUpCategory) => void;
  onShowNotification?: (msg: string) => void;
}

export const EditLocationTab: React.FC<EditLocationTabProps> = ({
  formData,
  setFormData,
  isEditMode,
  isAdminOrFinancial,
  googleBadge,
  handleCopyGoogleDetails,
  handleDownloadAllPhotos,
  copiedField,
  handleCopyText,
  isDownloadingPhotos,
  onSave,
  currentUserName,
  currentUserId,
  userRole,
  onOpenMasterDrawer,
  onShowNotification,
}) => {
  const [expandedMapWaPreview, setExpandedMapWaPreview] = useState<string | null>(null);
  const [isSyncingFromGoogle, setIsSyncingFromGoogle] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const handleSyncFromGoogleUrl = async () => {
    const url = formData.googleMapsUrl?.trim();
    if (!url) {
      if (onShowNotification) onShowNotification('يرجى إدخال رابط خرائط Google أولاً');
      else alert('يرجى إدخال رابط خرائط Google أولاً');
      return;
    }
    setIsSyncingFromGoogle(true);
    setSyncNotice('جاري فك الرابط ومزامنة بيانات المكان من خرائط Google...');
    try {
      const data = await extractGooglePlaceData(url);
      if (data) {
        setFormData((prev) => {
          if (!prev) return prev;
          const existingPhotos = prev.photos || [];
          const rawIncoming = (data.photos && data.photos.length > 0) ? data.photos : (data.photo ? [data.photo] : []);
          const incomingPhotos = rawIncoming.slice(0, 5);
          const mergedPhotos = Array.from(new Set([...existingPhotos, ...incomingPhotos])).slice(0, 10);
          return {
            ...prev,
            category: data.category || prev.category,
            googleMapsUrl: data.resolvedUrl || prev.googleMapsUrl,
            lat: data.lat ?? prev.lat,
            lng: data.lng ?? prev.lng,
            governorate: data.governorate || prev.governorate,
            city: data.city || prev.city,
            street: data.street || prev.street,
            phone: data.phone || prev.phone,
            workingHours: data.workingHours || prev.workingHours,
            photos: mergedPhotos.length > 0 ? mergedPhotos : prev.photos,
          };
        });
        const photoNotice = (data.photos && data.photos.length > 0) ? ` وسحب ${Math.min(data.photos.length, 5)} صور` : (data.photo ? ' وسحب صورة الغلاف' : '');
        const hoursNotice = data.workingHours ? ' وتحديث مواعيد وساعات العمل' : '';
        const catNotice = data.category ? ` وتصنيفها (${data.category})` : '';
        const msg = `✅ تم تحديث بيانات المنشأة ومطابقة الإحداثيات${catNotice}${hoursNotice}${photoNotice} بنجاح من خرائط Google!`;
        setSyncNotice(msg);
        if (onShowNotification) onShowNotification(msg);
        setTimeout(() => setSyncNotice(null), 6000);
      } else {
        const msg = '⚠️ تعذر استخراج تفاصيل إضافية من الرابط.';
        setSyncNotice(msg);
        setTimeout(() => setSyncNotice(null), 4000);
      }
    } catch {
      const msg = '⚠️ فشل الاتصال بمحرك استخراج خرائط Google.';
      setSyncNotice(msg);
      setTimeout(() => setSyncNotice(null), 4000);
    } finally {
      setIsSyncingFromGoogle(false);
    }
  };
  return (
    <div className="space-y-3.5 text-right">
      {/* Google Maps Smart Verification & Sync Hub */}
      <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-blue-950/40 border border-blue-500/40 rounded-2xl p-3.5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black shrink-0">
              <CloudUpload className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-black text-xs sm:text-sm text-blue-300">
                مركز اعتماد وتوثيق خرائط Google Maps
              </h4>
              <p className="text-[10px] text-slate-400 font-bold">
                أدوات إرسال البيانات إلى Google Business Profile واعتماد التوثيق
              </p>
            </div>
          </div>

          <span className={`text-[9.5px] font-black px-2.5 py-1 rounded-full border ${googleBadge.cls}`}>
            {googleBadge.label}
          </span>
        </div>

        {/* Fast Action Tools */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleCopyGoogleDetails}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs p-2.5 rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedField === 'google_details' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-blue-400" />}
            <span>{copiedField === 'google_details' ? 'تم نسخ البيانات كاملة!' : 'نسخ بيانات المنشأة لخرائط Google 📋'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadAllPhotos}
            disabled={isDownloadingPhotos || !formData.photos || formData.photos.length === 0}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs p-2.5 rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isDownloadingPhotos ? 'جاري تنزيل الصور...' : `تحميل حزمة صور المنشأة (${formData.photos?.length || 0}) 📥`}</span>
          </button>
        </div>
      </div>

      {/* Location Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* المحافظة */}
        <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3 space-y-1">
          <span className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-500" />
            <span>المحافظة</span>
          </span>
          {isEditMode ? (
            <select
              value={formData.governorate || EGYPT_GOVERNORATES[0]}
              onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] font-black text-xs rounded-xl p-2 focus:outline-none focus:border-amber-500 cursor-pointer mt-1"
            >
              {EGYPT_GOVERNORATES.map((gov) => (
                <option key={gov} value={gov}>
                  {gov}
                </option>
              ))}
            </select>
          ) : (
            <div className="font-black text-sm text-[var(--text-primary)] pt-0.5">{formData.governorate}</div>
          )}
        </div>

        {/* المدينة / الحي */}
        <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3 space-y-1">
          <span className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-amber-500" />
            <span>المدينة / المركز / الحي</span>
          </span>
          {isEditMode ? (
            <input
              type="text"
              value={formData.city || ''}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-amber-500 text-[var(--text-primary)] font-black text-xs rounded-xl p-2 focus:outline-none shadow-inner mt-1"
            />
          ) : (
            <div className="font-black text-sm text-[var(--text-primary)] pt-0.5">{formData.city || formData.governorate}</div>
          )}
        </div>

        {/* الشارع والعنوان بالتفصيل */}
        <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3 space-y-1 sm:col-span-2">
          <span className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-blue-500" />
            <span>الشارع والعنوان التفصيلي</span>
          </span>
          {isEditMode ? (
            <input
              type="text"
              value={formData.street || ''}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-amber-500 text-[var(--text-primary)] font-bold text-xs rounded-xl p-2 focus:outline-none shadow-inner mt-1"
              placeholder="اسم الشارع ورقم العقار"
            />
          ) : (
            <div className="font-bold text-xs sm:text-sm text-[var(--text-primary)] pt-0.5">
              {formData.street || 'الموقع الجغرافي المسجل على الخريطة'}
            </div>
          )}
        </div>

        {/* 1. رابط الموقع الميداني (من المندوب - غير موثق) */}
        {!formData.isAlreadyOnGoogle && formData.packageId !== 'pkg_already_on_google' && (
          <div className="bg-amber-500/5 border border-amber-500/30 rounded-2xl p-3.5 space-y-2 sm:col-span-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black text-amber-600 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-500" />
                <span>1. الموقع الميداني المسجل (من المندوب - غير موثق)</span>
              </span>
              <span className="text-[9.5px] bg-amber-500/20 text-amber-700 font-bold px-2 py-0.5 rounded-full border border-amber-500/40">
                {isEditMode ? 'قابل للتعديل للمندوب' : 'للمراجعة الإدارية فقط'}
              </span>
            </div>

            {isEditMode ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2" dir="ltr">
                  <div>
                    <label className="text-[10.5px] font-bold text-[var(--text-muted)] block mb-1 text-right">
                      خط العرض (Lat)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.lat || ''}
                      onChange={(e) => {
                        const newLat = parseFloat(e.target.value) || 0;
                        setFormData({
                          ...formData,
                          lat: newLat,
                          repLocationUrl: `https://www.google.com/maps?q=${newLat},${formData.lng}`,
                        });
                      }}
                      className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-amber-500 text-[var(--text-primary)] font-mono text-xs rounded-xl p-2 focus:outline-none shadow-inner text-left"
                      placeholder="29.xxxxxx"
                    />
                  </div>
                  <div>
                    <label className="text-[10.5px] font-bold text-[var(--text-muted)] block mb-1 text-right">
                      خط الطول (Lng)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.lng || ''}
                      onChange={(e) => {
                        const newLng = parseFloat(e.target.value) || 0;
                        setFormData({
                          ...formData,
                          lng: newLng,
                          repLocationUrl: `https://www.google.com/maps?q=${formData.lat},${newLng}`,
                        });
                      }}
                      className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-amber-500 text-[var(--text-primary)] font-mono text-xs rounded-xl p-2 focus:outline-none shadow-inner text-left"
                      placeholder="31.xxxxxx"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10.5px] font-bold text-[var(--text-muted)] block mb-1">
                    رابط المعاينة الميدانية (Google Maps Coordinates Link)
                  </label>
                  <input
                    type="url"
                    dir="ltr"
                    value={formData.repLocationUrl || (formData.lat && formData.lng ? `https://www.google.com/maps?q=${formData.lat},${formData.lng}` : '')}
                    onChange={(e) => setFormData({ ...formData, repLocationUrl: e.target.value })}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-amber-500 text-[var(--text-primary)] font-mono text-xs rounded-xl p-2 focus:outline-none shadow-inner text-right"
                    placeholder="https://maps.google.com/?q=lat,lng"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={sanitizeExternalUrl(formData.repLocationUrl || (formData.lat && formData.lng ? `https://www.google.com/maps?q=${formData.lat},${formData.lng}` : '#'))}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl shadow-sm inline-flex items-center gap-1.5 transition-transform active:scale-95"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>🗺️ فتح موقع المعاينة الميدانية للإدارة (غير موثق)</span>
                  </a>
                  <span className="font-mono text-[10px] text-[var(--text-muted)] bg-[var(--bg-card)] px-2 py-1 rounded-lg border border-[var(--border-color)]">
                    {formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}
                  </span>
                </div>
                <p className="text-[10px] text-[var(--text-muted)] font-medium leading-relaxed">
                  📍 إحداثيات موقع المندوب الميدانية (GPS): تُفعّل زر الخريطة والتوجيه للنشاط في الدليل لتسهيل التحصيل الفوري، ولا تمنح النشاط حالة "موثق" ولا تقييمات حتى اعتماد الرابط الرسمي.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 2. رابط خرائط Google المعتمد والموثق */}
        <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-2xl p-3.5 space-y-2 sm:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-black text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>2. رابط خرائط Google الرسمي الموثق (تضيفه الإدارة بعد التوثيق والظهور)</span>
            </span>
            <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${formData.googleMapsUrl ? 'bg-emerald-500/20 text-emerald-700 border-emerald-500/40' : 'bg-slate-500/15 text-slate-400 border-slate-500/30'}`}>
              {formData.googleMapsUrl ? 'مفعل على الدليل ✅' : 'معطل بانتظار التوثيق ⏳'}
            </span>
          </div>

          {isEditMode ? (
            isAdminOrFinancial ? (
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    dir="ltr"
                    value={formData.googleMapsUrl || ''}
                    onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })}
                    className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-emerald-500 text-[var(--text-primary)] font-mono text-xs rounded-xl p-2.5 focus:outline-none shadow-inner text-right"
                    placeholder="https://maps.app.goo.gl/... أو https://www.google.com/maps/place/..."
                  />
                  <button
                    type="button"
                    disabled={isSyncingFromGoogle || !formData.googleMapsUrl?.trim()}
                    onClick={handleSyncFromGoogleUrl}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-xs px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 shrink-0 shadow-sm transition-transform active:scale-95 cursor-pointer"
                  >
                    {isSyncingFromGoogle ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>جاري المزامنة...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        <span>مزامنة واستيراد ⚡</span>
                      </>
                    )}
                  </button>
                </div>
                {syncNotice && (
                  <div className="text-[11px] font-bold p-2 rounded-xl bg-blue-500/15 text-blue-900 border border-blue-500/30 flex items-center gap-2 animate-fade-in">
                    {isSyncingFromGoogle && <Loader2 className="w-3 h-3 animate-spin text-blue-500 shrink-0" />}
                    <span>{syncNotice}</span>
                  </div>
                )}
                {Boolean(formData.googleMapsUrl && (formData.googleMapsUrl.includes('maps?q=') || formData.googleMapsUrl.includes('search/?api=1&query='))) && (
                  <p className="text-[10.5px] font-bold text-rose-500 flex items-center gap-1">
                    ⚠️ تنبيه: الرابط المدخل إحداثيات ميدانية خام (GPS) وليس رابط نشاط معتمد من خرائط Google.
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-muted)] space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[var(--text-primary)]">رابط خرائط Google المعتمد:</span>
                  <span className="text-[10px] text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 font-black">
                    🔒 تعديل الرابط مقتصر على الإدارة فقط
                  </span>
                </div>
                <div className="font-mono text-xs text-[var(--text-secondary)] pt-0.5 truncate" dir="ltr">
                  {formData.googleMapsUrl || 'لم يُضف رابط رسمي بعد (قيد اعتماد الإدارة)'}
                </div>
              </div>
            )
          ) : (
            <div className="space-y-1.5">
              {formData.googleMapsUrl ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={sanitizeExternalUrl(formData.googleMapsUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-3.5 py-1.5 rounded-xl shadow-sm inline-flex items-center gap-1.5 transition-transform active:scale-95"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>فتح المكان المعتمد على خرائط Google 🗺️</span>
                  </a>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                    متاح للجمهور والزوار على الدليل
                  </span>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-muted)] space-y-1">
                  <span className="font-bold text-amber-600 block">
                    ⏳ لم يتم إدخال رابط خرائط Google الموثق بعد.
                  </span>
                  <span className="text-[10.5px] block leading-relaxed">
                    🔒 عند إدخال هذا الرابط المعتمد، يتحول المكان تلقائياً إلى "موثق ومعتمد" ويحل محل موقع المندوب الميداني في كارت الدليل العام.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── قسم تقييم ونجوم خرائط Google ── */}
      <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black shrink-0">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
                تقييم ونجوم خرائط Google الرسمية
              </h4>
              <p className="text-[10px] text-[var(--text-muted)] font-bold">
                عرض التقييم وعدد المراجعات الحقيقية للمكان على كروت وصفحة الدليل
              </p>
            </div>
          </div>

          {isEditMode ? (
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.googleRatingEnabled ?? false}
                onChange={(e) => setFormData({ ...formData, googleRatingEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              <span className="mr-2 text-xs font-bold text-[var(--text-primary)]">
                {formData.googleRatingEnabled ? 'مُفعّل' : 'مُعطّل'}
              </span>
            </label>
          ) : (
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                formData.googleRatingEnabled
                  ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
                  : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
              }`}
            >
              {formData.googleRatingEnabled ? '⭐ التقييم مُفعّل' : 'معطّل'}
            </span>
          )}
        </div>

        {formData.googleRatingEnabled ? (
          <div className="space-y-3 pt-2 border-t border-[var(--border-color)]/60">
            {isEditMode ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[var(--text-muted)] block">
                    التقييم من 5 نجوم (مثال: 4.8)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="5"
                      step="0.1"
                      value={formData.googleRating ?? ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setFormData({ ...formData, googleRating: isNaN(val) ? undefined : Math.min(5, Math.max(1, val)) });
                      }}
                      className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-amber-500 text-[var(--text-primary)] font-black text-sm rounded-xl p-2 pl-8 focus:outline-none shadow-inner text-right"
                      placeholder="4.8"
                    />
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[var(--text-muted)] block">
                    إجمالي عدد التقييمات في Google (مثال: 128)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.googleReviewsCount ?? ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setFormData({ ...formData, googleReviewsCount: isNaN(val) ? undefined : Math.max(0, val) });
                    }}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-amber-500 text-[var(--text-primary)] font-black text-sm rounded-xl p-2 focus:outline-none shadow-inner text-right"
                    placeholder="128"
                  />
                </div>
              </div>
            ) : null}

            {/* معاينة حية لشكل تقييم Google */}
            {formData.googleRating !== undefined && formData.googleRating > 0 && (() => {
              const rating = Math.min(5, Math.max(1, formData.googleRating));
              const reviewsCount = formData.googleReviewsCount || 0;
              const s5 = Math.min(95, Math.max(15, Math.round((rating >= 4.5 ? 0.65 + (rating - 4.5) * 0.6 : rating / 5 * 0.7) * 100)));
              const s4 = Math.min(100 - s5, Math.max(2, Math.round((100 - s5) * 0.65)));
              const s3 = Math.min(100 - s5 - s4, Math.max(1, Math.round((100 - s5 - s4) * 0.5)));
              const s2 = Math.min(100 - s5 - s4 - s3, Math.max(1, Math.round((100 - s5 - s4 - s3) * 0.5)));
              const s1 = Math.max(1, 100 - s5 - s4 - s3 - s2);
              const breakdown = [
                { stars: 5, pct: s5 },
                { stars: 4, pct: s4 },
                { stars: 3, pct: s3 },
                { stars: 2, pct: s2 },
                { stars: 1, pct: s1 },
              ];

              return (
                <div className="bg-[var(--bg-card)] border border-amber-500/20 rounded-xl p-3 space-y-2">
                  <span className="text-[10.5px] font-bold text-[var(--text-muted)] block">
                    معاينة حية لشكل التقييم في الدليل العام ومعاينة الرابط:
                  </span>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-black text-[var(--text-primary)]">{rating.toFixed(1)}</span>
                      <div>
                        <div className="flex items-center gap-0.5" dir="ltr">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= Math.floor(rating)
                                  ? 'text-amber-400 fill-amber-400'
                                  : s === Math.ceil(rating) && rating % 1 >= 0.3
                                  ? 'text-amber-400 fill-amber-400/60'
                                  : 'text-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)] font-bold">
                          ({reviewsCount} تقييم ومراجعة على Google)
                        </span>
                      </div>
                    </div>

                    <div className="w-full sm:w-44 space-y-1" dir="ltr">
                      {breakdown.map((item) => (
                        <div key={item.stars} className="flex items-center gap-1.5 text-[9px] font-bold">
                          <span className="w-2 text-slate-400 text-center">{item.stars}</span>
                          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full"
                              style={{ width: `${item.pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <p className="text-[10.5px] text-[var(--text-muted)] font-medium pt-1 border-t border-[var(--border-color)]/60">
            💡 تفعيل هذا الخيار يسمح بإظهار تقييم ونجوم المكان كما هي ظاهرة على خرائط Google الرسمية في واجهة الدليل العام وفي رسائل مشاركة الروابط.
          </p>
        )}
      </div>

      {/* ── 🗺️ قسم رسائل وتنبيهات WhatsApp لرحلة توثيق الخريطة ── */}
      {isAdminOrFinancial && (
        <div className="bg-[var(--bg-card)] border border-blue-500/30 rounded-2xl p-3.5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center font-black shrink-0">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
                  رسائل وتنبيهات WhatsApp لتوثيق الخريطة 🗺️
                </h4>
                <p className="text-[10px] text-[var(--text-muted)] font-bold">
                  رسائل التواصل السريع لطلب كود تفعيل Google SMS والتهنئة باعتماد التوثيق
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {/* 1. رسالة استئذان وتنسيق مسبق (طلب متاح 🤝) */}
            <div className="bg-[var(--input-bg)]/80 border border-blue-500/30 rounded-xl p-3 space-y-2 transition-all">
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <div className="flex items-center gap-1.5 font-black text-xs text-[var(--text-primary)]">
                  <KeyRound className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>1. استئذان وتنسيق مسبق لكود Google (طلب متاح 🤝)</span>
                </div>
                <span className="text-[9.5px] bg-blue-500/20 text-blue-700 font-bold px-2 py-0.5 rounded-md">
                  قبل طلب الكود
                </span>
              </div>

              {expandedMapWaPreview === 'map_otp' && (
                <div className="bg-[var(--bg-card)] p-2.5 rounded-xl border border-blue-500/20 text-[11px] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto animate-fade-in font-sans">
                  {generateGoogleVerificationOtpWhatsAppMessage(formData)}
                </div>
              )}

              <div className="flex items-center gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setExpandedMapWaPreview(expandedMapWaPreview === 'map_otp' ? null : 'map_otp')}
                  className="bg-[var(--bg-card)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold py-1.5 px-2.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  title="معاينة نص الرسالة"
                >
                  {expandedMapWaPreview === 'map_otp' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span className="text-[10px] hidden sm:inline">{expandedMapWaPreview === 'map_otp' ? 'إخفاء' : 'معاينة'}</span>
                </button>
                {handleCopyText && (
                  <button
                    type="button"
                    onClick={() => handleCopyText(generateGoogleVerificationOtpWhatsAppMessage(formData), 'map_otp')}
                    className="bg-[var(--bg-card)] hover:bg-blue-500/15 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
                    title="نسخ نص الرسالة"
                  >
                    {copiedField === 'map_otp' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-blue-500" />}
                  </button>
                )}
                <a
                  href={getGoogleVerificationOtpWhatsAppUrl(formData)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white font-black text-xs py-1.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 text-center"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال استئذان (متاح؟) 🤝</span>
                </a>
              </div>
            </div>

            {/* 2. إشعار فوري بعد إرسال كود Google مباشرة (الكود وصل 📲) */}
            <div className="bg-[var(--input-bg)]/80 border border-amber-500/30 rounded-xl p-3 space-y-2 transition-all">
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <div className="flex items-center gap-1.5 font-black text-xs text-[var(--text-primary)]">
                  <KeyRound className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>2. إشعار فوري لحظة طلب الكود (الكود وصل 📲)</span>
                </div>
                <span className="text-[9.5px] bg-amber-500/20 text-amber-700 font-bold px-2 py-0.5 rounded-md">
                  بمجرد إرسال SMS
                </span>
              </div>

              {expandedMapWaPreview === 'map_otp_sent' && (
                <div className="bg-[var(--bg-card)] p-2.5 rounded-xl border border-amber-500/20 text-[11px] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto animate-fade-in font-sans">
                  {generateGoogleOtpSentAlertWhatsAppMessage(formData)}
                </div>
              )}

              <div className="flex items-center gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setExpandedMapWaPreview(expandedMapWaPreview === 'map_otp_sent' ? null : 'map_otp_sent')}
                  className="bg-[var(--bg-card)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold py-1.5 px-2.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  title="معاينة إشعار الكود"
                >
                  {expandedMapWaPreview === 'map_otp_sent' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span className="text-[10px] hidden sm:inline">{expandedMapWaPreview === 'map_otp_sent' ? 'إخفاء' : 'معاينة'}</span>
                </button>
                {handleCopyText && (
                  <button
                    type="button"
                    onClick={() => handleCopyText(generateGoogleOtpSentAlertWhatsAppMessage(formData), 'map_otp_sent')}
                    className="bg-[var(--bg-card)] hover:bg-amber-500/15 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
                    title="نسخ نص الإشعار"
                  >
                    {copiedField === 'map_otp_sent' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-amber-500" />}
                  </button>
                )}
                <a
                  href={getGoogleOtpSentAlertWhatsAppUrl(formData)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 text-white font-black text-xs py-1.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 text-center"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال تم طلب الكود للعميل 📲</span>
                </a>
              </div>
            </div>

            {/* 3. رسالة التهنئة بالتوثيق وظهور المكان على الخريطة */}
            <div className={`border rounded-xl p-3 space-y-2 transition-all ${
              formData.googleMapsUrl
                ? 'bg-[var(--input-bg)]/80 border-emerald-500/40 shadow-xs'
                : 'bg-[var(--input-bg)]/40 border-[var(--border-color)] opacity-60'
            }`}>
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <div className="flex items-center gap-1.5 font-black text-xs text-[var(--text-primary)]">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>3. إشعار التوثيق وظهور المكان على Google Maps 🗺️</span>
                </div>
                <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md ${
                  formData.googleMapsUrl
                    ? 'bg-emerald-500/20 text-emerald-700'
                    : 'bg-slate-500/20 text-slate-500'
                }`}>
                  {formData.googleMapsUrl ? 'جاهز للإرسال ✓' : 'بانتظار الرابط ⏳'}
                </span>
              </div>

              {expandedMapWaPreview === 'map_verified' && (
                <div className="bg-[var(--bg-card)] p-2.5 rounded-xl border border-emerald-500/20 text-[11px] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto animate-fade-in font-sans">
                  {generateGoogleMapsVerifiedWhatsAppMessage(formData)}
                </div>
              )}

              <div className="flex items-center gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setExpandedMapWaPreview(expandedMapWaPreview === 'map_verified' ? null : 'map_verified')}
                  className="bg-[var(--bg-card)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold py-1.5 px-2.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  title="معاينة نص الرسالة"
                >
                  {expandedMapWaPreview === 'map_verified' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span className="text-[10px] hidden sm:inline">{expandedMapWaPreview === 'map_verified' ? 'إخفاء' : 'معاينة'}</span>
                </button>
                {handleCopyText && (
                  <button
                    type="button"
                    onClick={() => handleCopyText(generateGoogleMapsVerifiedWhatsAppMessage(formData), 'map_verified')}
                    className="bg-[var(--bg-card)] hover:bg-emerald-500/15 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
                    title="نسخ نص الرسالة"
                  >
                    {copiedField === 'map_verified' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-emerald-500" />}
                  </button>
                )}
                {formData.googleMapsUrl ? (
                  <a
                    href={getGoogleMapsVerifiedWhatsAppUrl(formData)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black text-xs py-1.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 text-center"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>إرسال إشعار التوثيق للعميل</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="flex-1 bg-slate-800/60 text-slate-400 font-bold text-xs py-1.5 px-3 rounded-xl border border-slate-700/50 cursor-not-allowed text-center"
                    title="يتطلب إضافة رابط خرائط Google المعتمد أولاً"
                  >
                    <span>🔒 يتاح فور إدخال رابط خرائط Google المعتمد</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CONTEXTUAL CRM FOLLOW-UP STRIP FOR MAPS & LOCATION ── */}
      {onSave && (
        <ContextualFollowUpStrip
          category="maps"
          categoryLabel="خرائط Google والبيانات الجغرافية"
          categoryIcon={<MapPin className="w-3.5 h-3.5 text-blue-500" />}
          business={formData}
          onSave={onSave}
          setFormData={setFormData}
          currentUserName={currentUserName}
          currentUserId={currentUserId}
          userRole={userRole}
          onOpenMasterDrawer={onOpenMasterDrawer}
          onShowNotification={onShowNotification}
        />
      )}
    </div>
  );
};
