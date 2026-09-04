import React from 'react';
import { Business, VerificationStatus } from '../../types';
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
} from 'lucide-react';

interface EditLocationTabProps {
  formData: Business;
  setFormData: React.Dispatch<React.SetStateAction<Business | null>>;
  isEditMode: boolean;
  isAdminOrFinancial: boolean;
  googleBadge: { label: string; cls: string };
  handleCopyGoogleDetails: () => void;
  handleDownloadAllPhotos: () => void;
  handleSetVerificationStatus: (status: VerificationStatus) => void;
  copiedField: string | null;
  isDownloadingPhotos: boolean;
}

export const EditLocationTab: React.FC<EditLocationTabProps> = ({
  formData,
  setFormData,
  isEditMode,
  isAdminOrFinancial,
  googleBadge,
  handleCopyGoogleDetails,
  handleDownloadAllPhotos,
  handleSetVerificationStatus,
  copiedField,
  isDownloadingPhotos,
}) => {
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
            <span>{copiedField === 'google_details' ? 'تم نسخ البيانات كاملة!' : 'نسخ بيانات النشاط لخرائط Google 📋'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadAllPhotos}
            disabled={isDownloadingPhotos || !formData.photos || formData.photos.length === 0}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs p-2.5 rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isDownloadingPhotos ? 'جاري تنزيل الصور...' : `تحميل حزمة صور النشاط (${formData.photos?.length || 0}) 📥`}</span>
          </button>
        </div>

        {/* Admin Directory Approval Controls */}
        {isAdminOrFinancial && (
          <div className="pt-2.5 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-amber-400 block">
                🏛️ اعتماد النشر على الدليل العام (مراجعة المسؤول وصحة البيانات):
              </label>
              <span className="text-[10px] text-slate-400 font-bold">
                (لا يشترط توثيق جوجل)
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => handleSetVerificationStatus('in_progress')}
                className={`p-2 rounded-xl text-[11px] sm:text-xs font-black border transition-all cursor-pointer ${
                  formData.verificationStatus === 'in_progress' || formData.verificationStatus === 'pending'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                    : 'bg-slate-800/80 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                }`}
              >
                ⏳ قيد المراجعة
              </button>

              <button
                type="button"
                onClick={() => handleSetVerificationStatus('verified')}
                className={`p-2 rounded-xl text-[11px] sm:text-xs font-black border transition-all cursor-pointer ${
                  formData.verificationStatus === 'verified'
                    ? 'bg-emerald-500 text-white border-emerald-400 shadow'
                    : 'bg-slate-800/80 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                }`}
              >
                🟢 اعتماد ونشر بالدليل
              </button>

              <button
                type="button"
                onClick={() => handleSetVerificationStatus('rejected')}
                className={`p-2 rounded-xl text-[11px] sm:text-xs font-black border transition-all cursor-pointer ${
                  formData.verificationStatus === 'rejected'
                    ? 'bg-rose-600 text-white border-rose-400 shadow'
                    : 'bg-slate-800/80 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
                }`}
              >
                🔴 رفض
              </button>
            </div>
          </div>
        )}
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
              <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-500" />
                <span>1. الموقع الميداني المسجل (من المندوب - غير موثق)</span>
              </span>
              <span className="text-[9.5px] bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/40">
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
                  ⚠️ هذا الرابط مخصص حصرياً للمراجعة الإدارية ولرفع بيانات النشاط، ولا يُعتبر توثيقاً رسمياً ولا يظهر في الدليل العام للجمهور.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 2. رابط خرائط Google المعتمد والموثق */}
        <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-2xl p-3.5 space-y-2 sm:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>2. رابط خرائط Google الرسمي الموثق (تضيفه الإدارة بعد التوثيق والظهور)</span>
            </span>
            <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${formData.googleMapsUrl ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40' : 'bg-slate-500/15 text-slate-400 border-slate-500/30'}`}>
              {formData.googleMapsUrl ? 'مفعل على الدليل ✅' : 'معطل بانتظار التوثيق ⏳'}
            </span>
          </div>

          {isEditMode ? (
            isAdminOrFinancial ? (
              <input
                type="url"
                dir="ltr"
                value={formData.googleMapsUrl || ''}
                onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })}
                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-emerald-500 text-[var(--text-primary)] font-mono text-xs rounded-xl p-2 focus:outline-none shadow-inner text-right"
                placeholder="https://maps.app.goo.gl/... أو https://www.google.com/maps/place/..."
              />
            ) : (
              <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-muted)] space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[var(--text-primary)]">رابط خرائط Google المعتمد:</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 font-black">
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
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                    متاح للجمهور والزوار على الدليل
                  </span>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-muted)] space-y-1">
                  <span className="font-bold text-amber-600 dark:text-amber-400 block">
                    ⏳ لم يتم إدخال رابط خرائط Google الموثق بعد.
                  </span>
                  <span className="text-[10.5px] block leading-relaxed">
                    🔒 لا يتم تفعيل عرض موقع النشاط على الدليل العام للجمهور إلا بعد إدخال هذا الرابط المعتمد بعد توثيق النشاط وظهوره في خرائط Google.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
