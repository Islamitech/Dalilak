import React from 'react';
import { Business } from '../../types';
import { CATEGORY_GROUPS, getGroupFromCategory } from '../../data/mockData';
import {
  Store,
  Globe,
  Tag,
  Clock,
  FileText,
  User,
  Phone,
  Mail,
  Copy,
  Check,
  MessageCircle,
  Star,
} from 'lucide-react';

interface EditGeneralInfoTabProps {
  formData: Business;
  setFormData: React.Dispatch<React.SetStateAction<Business | null>>;
  isEditMode: boolean;
  copiedField: string | null;
  handleCopyText: (text: string, fieldName: string) => void;
  isAdminOrFinancial: boolean;
  onNavigateToWhatsApp?: () => void;
}

export const EditGeneralInfoTab: React.FC<EditGeneralInfoTabProps> = ({
  formData,
  setFormData,
  isEditMode,
  copiedField,
  handleCopyText,
  isAdminOrFinancial,
  onNavigateToWhatsApp,
}) => {
  return (
    <div className="space-y-3 text-right">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* اسم النشاط عربي */}
        <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3 space-y-1">
          <span className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-amber-500" />
            <span>اسم النشاط (عربي) *</span>
          </span>
          {isEditMode ? (
            <input
              type="text"
              value={formData.nameAr || ''}
              onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
              className="w-full bg-[var(--bg-card)] border-2 border-amber-500 text-[var(--text-primary)] font-black text-sm rounded-xl p-2 focus:outline-none shadow-inner mt-1"
              placeholder="أدخل اسم المحل بالعربي"
            />
          ) : (
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <span className="font-black text-sm text-[var(--text-primary)]">{formData.nameAr || 'غير مسجل'}</span>
              <button
                type="button"
                onClick={() => handleCopyText(formData.nameAr, 'nameAr')}
                className="text-[var(--text-muted)] hover:text-amber-500 p-1 cursor-pointer"
                title="نسخ الاسم"
              >
                {copiedField === 'nameAr' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>

        {/* اسم النشاط إنجليزي */}
        <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3 space-y-1">
          <span className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-blue-500" />
            <span>اسم النشاط (English)</span>
          </span>
          {isEditMode ? (
            <input
              type="text"
              dir="ltr"
              value={formData.nameEn || ''}
              onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-amber-500 text-[var(--text-primary)] font-bold text-sm rounded-xl p-2 focus:outline-none shadow-inner mt-1"
              placeholder="Business Name in English"
            />
          ) : (
            <div className="pt-0.5 font-bold text-sm text-[var(--text-primary)]" dir="ltr">
              {formData.nameEn || <span className="text-[var(--text-muted)] font-normal italic text-xs">غير مسجل</span>}
            </div>
          )}
        </div>

        {/* التصنيف والفئة */}
        <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3 space-y-1 sm:col-span-2">
          <span className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-amber-500" />
            <span>التصنيف والفئة التجارية</span>
          </span>
          {isEditMode ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              <select
                value={getGroupFromCategory(formData.category)?.group || CATEGORY_GROUPS[0].group}
                onChange={(e) => {
                  const grp = CATEGORY_GROUPS.find((g) => g.group === e.target.value);
                  if (grp && grp.items.length > 0) {
                    setFormData({ ...formData, category: grp.items[0] });
                  }
                }}
                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2 text-xs focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {CATEGORY_GROUPS.map((g) => (
                  <option key={g.group} value={g.group}>
                    {g.icon} {g.group}
                  </option>
                ))}
              </select>

              <select
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-[var(--bg-card)] border-2 border-amber-500 text-amber-700 dark:text-amber-300 font-black rounded-xl p-2 text-xs focus:outline-none cursor-pointer"
              >
                {(getGroupFromCategory(formData.category) || CATEGORY_GROUPS[0]).items.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2 pt-0.5 flex-wrap">
              <span className="bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-black px-3 py-1 rounded-xl border border-amber-500/30">
                🏷️ {formData.category}
              </span>
            </div>
          )}
        </div>

        {/* مواعيد العمل */}
        <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3 space-y-1 sm:col-span-2">
          <span className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>مواعيد وساعات العمل</span>
          </span>
          {isEditMode ? (
            <input
              type="text"
              value={formData.workingHours || ''}
              onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-amber-500 text-[var(--text-primary)] font-bold text-xs rounded-xl p-2 focus:outline-none shadow-inner mt-1"
              placeholder="مثال: يومياً من 9:00 صباحاً حتى 11:00 مساءً"
            />
          ) : (
            <div className="font-bold text-xs sm:text-sm text-[var(--text-primary)] pt-0.5">
              {formData.workingHours || 'يومياً'}
            </div>
          )}
        </div>

        {/* وصف الخدمات */}
        <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3 space-y-1 sm:col-span-2">
          <span className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-amber-500" />
            <span>وصف الأنشطة والخدمات</span>
          </span>
          {isEditMode ? (
            <textarea
              rows={3}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-amber-500 text-[var(--text-primary)] font-bold text-xs rounded-xl p-2.5 focus:outline-none shadow-inner mt-1"
              placeholder="وصف تفصيلي للأنشطة والمنتجات والعروض"
            />
          ) : (
            <p className="text-xs sm:text-sm font-bold text-[var(--text-secondary)] leading-relaxed pt-0.5 whitespace-pre-line">
              {formData.description || 'لم يتم تسجيل وصف تفصيلي للنشاط.'}
            </p>
          )}
        </div>

        {/* ── تقييم خرائط Google المعتمد (Google Maps Rating) ── */}
        <div className="bg-gradient-to-br from-amber-500/5 via-[var(--input-bg)] to-emerald-500/5 border border-amber-500/30 rounded-2xl p-3.5 space-y-3 sm:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white shadow-xs p-1.5 flex items-center justify-center shrink-0 border border-slate-200">
                <svg className="w-5 h-5" viewBox="0 0 48 48">
                  <path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
              </div>
              <div>
                <span className="text-xs sm:text-sm font-black text-[var(--text-primary)] block">
                  تقييم النشاط على خرائط Google Maps
                </span>
                <span className="text-[10px] text-[var(--text-muted)] font-bold block">
                  يظهر في تفاصيل النشاط بالدليل العام وفي كارت معاينة الرابط عند إرساله
                </span>
              </div>
            </div>

            {isEditMode ? (
              <label className="flex items-center gap-2 cursor-pointer select-none bg-[var(--bg-card)] px-3 py-1.5 rounded-xl border border-amber-500/30 hover:border-amber-400 shadow-2xs">
                <input
                  type="checkbox"
                  checked={Boolean(formData.googleRatingEnabled)}
                  onChange={(e) => setFormData({ ...formData, googleRatingEnabled: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 accent-amber-500 cursor-pointer"
                />
                <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                  {formData.googleRatingEnabled ? 'مفعل بالدليل ✅' : 'معطل ❌'}
                </span>
              </label>
            ) : (
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${formData.googleRatingEnabled ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30' : 'bg-slate-500/15 text-slate-400 border-slate-500/30'}`}>
                {formData.googleRatingEnabled ? 'مفعل بالدليل ✅' : 'معطل'}
              </span>
            )}
          </div>

          {formData.googleRatingEnabled ? (
            <div className="space-y-3 pt-2 border-t border-[var(--border-color)]/60">
              {isEditMode ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[var(--text-muted)] block">
                      التقييم من 5 نجوم (مثال: 4.8 أو 4.9 أو 5.0)
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
                        placeholder="4.9"
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
                                    : 'text-slate-300 dark:text-slate-700'
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
                            <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
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
              💡 تفعيل هذا الخيار يسمح بإظهار تقييم ونجوم النشاط كما هي ظاهرة على خرائط Google الرسمية في واجهة الدليل العام وفي رسائل مشاركة الروابط.
            </p>
          )}
        </div>

        {/* ── فاصل وقسم بيانات المالك والتواصل ── */}
        <div className="sm:col-span-2 pt-2 border-t border-[var(--border-color)]">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-xs">
              <User className="w-3.5 h-3.5" />
            </div>
            <h5 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">بيانات المالك والتواصل</h5>
          </div>
        </div>

        {/* اسم صاحب النشاط */}
        <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3 space-y-1">
          <span className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-amber-500" />
            <span>اسم صاحب النشاط / المسؤول</span>
          </span>
          {isEditMode ? (
            <input
              type="text"
              value={formData.ownerName || ''}
              onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-amber-500 text-[var(--text-primary)] font-black text-sm rounded-xl p-2 focus:outline-none shadow-inner mt-1"
              placeholder="اسم المسؤول"
            />
          ) : (
            <div className="font-black text-sm text-[var(--text-primary)] pt-0.5">
              {formData.ownerName || 'صاحب النشاط'}
            </div>
          )}
        </div>

        {/* رقم الهاتف الأساسي */}
        <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3 space-y-1">
          <span className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-emerald-500" />
            <span>رقم الهاتف الأساسي (واتساب)</span>
          </span>
          {isEditMode ? (
            <input
              type="tel"
              dir="ltr"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-amber-500 text-[var(--text-primary)] font-black text-sm rounded-xl p-2 focus:outline-none shadow-inner mt-1 text-right"
              placeholder="01xxxxxxxxx"
            />
          ) : (
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <span className="font-black text-sm text-[var(--text-primary)] font-mono" dir="ltr">
                {formData.phone || 'غير مسجل'}
              </span>
              {formData.phone && (
                <div className="flex items-center gap-1">
                  <a href={`tel:${formData.phone}`} className="p-1 text-emerald-600 hover:bg-emerald-500/15 rounded-lg" title="اتصال">
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  {isAdminOrFinancial && onNavigateToWhatsApp && (
                    <button
                      type="button"
                      onClick={onNavigateToWhatsApp}
                      className="p-1 text-emerald-600 hover:bg-emerald-500/15 rounded-lg cursor-pointer"
                      title="فتح رسائل الواتساب"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* هاتف إضافي */}
        <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3 space-y-1">
          <span className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-blue-500" />
            <span>هاتف إضافي / أرضي</span>
          </span>
          {isEditMode ? (
            <input
              type="tel"
              dir="ltr"
              value={formData.secondaryPhone || ''}
              onChange={(e) => setFormData({ ...formData, secondaryPhone: e.target.value })}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-amber-500 text-[var(--text-primary)] font-bold text-xs rounded-xl p-2 focus:outline-none shadow-inner mt-1 text-right"
              placeholder="رقم آخر (اختياري)"
            />
          ) : (
            <div className="font-bold text-xs sm:text-sm text-[var(--text-primary)] pt-0.5 font-mono" dir="ltr">
              {formData.secondaryPhone || <span className="text-[var(--text-muted)] font-normal italic text-xs">غير مسجل</span>}
            </div>
          )}
        </div>

        {/* البريد الإلكتروني */}
        <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3 space-y-1">
          <span className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-purple-500" />
            <span>البريد الإلكتروني</span>
          </span>
          {isEditMode ? (
            <input
              type="email"
              dir="ltr"
              value={formData.ownerEmail || ''}
              onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-amber-500 text-[var(--text-primary)] font-bold text-xs rounded-xl p-2 focus:outline-none shadow-inner mt-1 text-right"
              placeholder="example@mail.com"
            />
          ) : (
            <div className="font-bold text-xs sm:text-sm text-[var(--text-primary)] pt-0.5" dir="ltr">
              {formData.ownerEmail || <span className="text-[var(--text-muted)] font-normal italic text-xs">غير مسجل</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
