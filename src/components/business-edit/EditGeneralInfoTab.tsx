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
