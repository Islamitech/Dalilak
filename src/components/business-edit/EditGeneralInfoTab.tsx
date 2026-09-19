import React from 'react';
import { Business, AdminFollowUpCategory } from '../../types';
import { BUSINESS_CATEGORIES } from '../../data/mockData';
import {
  UploadCloud,
  Loader2,
  ZoomIn,
  Trash2,
} from 'lucide-react';

export interface EditGeneralInfoTabProps {
  formData: Business;
  handleChange?: (field: keyof Business, value: any) => void;
  setFormData?: React.Dispatch<React.SetStateAction<any>>;
  ownerIdCardPhoto?: string;
  isUploadingOwnerId?: boolean;
  handleOwnerIdPhotoUpload?: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  setPreviewLightbox?: (url: string | null) => void;
  setOwnerIdCardPhoto?: (url: string) => void;
  // Optional legacy props to maintain backward compatibility
  isEditMode?: boolean;
  copiedField?: string | null;
  handleCopyText?: (text: string, fieldName: string) => void;
  isAdminOrFinancial?: boolean;
  onNavigateToWhatsApp?: () => void;
  onSave?: (biz: Business) => void;
  currentUserName?: string;
  currentUserId?: string;
  userRole?: string;
  onOpenMasterDrawer?: (category?: AdminFollowUpCategory) => void;
  onShowNotification?: (msg: string) => void;
}

export const EditGeneralInfoTab: React.FC<EditGeneralInfoTabProps> = ({
  formData,
  handleChange: customHandleChange,
  setFormData,
  ownerIdCardPhoto = '',
  isUploadingOwnerId = false,
  handleOwnerIdPhotoUpload,
  setPreviewLightbox,
  setOwnerIdCardPhoto,
}) => {
  const onChange = (field: keyof Business, value: any) => {
    if (customHandleChange) {
      customHandleChange(field, value);
    } else if (setFormData) {
      setFormData((prev: any) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  return (
    <div className="space-y-4 text-right">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-700 font-bold mb-1">
            اسم المنشأة التجاري (بالعربية) *
          </label>
          <input
            type="text"
            required
            value={formData.nameAr || ''}
            onChange={(e) => onChange('nameAr', e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-slate-700 font-bold mb-1">
            الاسم بالإنجليزية (اختياري)
          </label>
          <input
            type="text"
            value={formData.nameEn || ''}
            onChange={(e) => onChange('nameEn', e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500 dir-ltr text-right"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-700 font-bold mb-1">تصنيف النشاط الرئيسي *</label>
          <select
            value={formData.category || BUSINESS_CATEGORIES[0]}
            onChange={(e) => onChange('category', e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
          >
            {BUSINESS_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-slate-700 font-bold mb-1">مواعيد وساعات العمل</label>
          <input
            type="text"
            placeholder="مثال: يومياً من 10 ص إلى 11 م"
            value={formData.workingHours || ''}
            onChange={(e) => onChange('workingHours', e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-700 font-bold mb-1">
            رقم هاتف المنشأة الأساسي (موبايل / واتساب) *
          </label>
          <input
            type="tel"
            required
            value={formData.phone || ''}
            onChange={(e) => onChange('phone', e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-medium focus:ring-2 focus:ring-indigo-500 dir-ltr text-right"
          />
        </div>
        <div>
          <label className="block text-slate-700 font-bold mb-1">هاتف إضافي / أرضي</label>
          <input
            type="tel"
            value={formData.secondaryPhone || ''}
            onChange={(e) => onChange('secondaryPhone', e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-medium focus:ring-2 focus:ring-indigo-500 dir-ltr text-right"
          />
        </div>
      </div>

      <div>
        <label className="block text-slate-700 font-bold mb-1">وصف المنشأة والخدمات المقدمة</label>
        <textarea
          rows={2}
          value={formData.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Owner & KYC Data */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
        <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
          <span>👤</span>
          <span>بيانات المسؤول وبطاقة الهوية الرسمية (سجلات الإدارة فقط)</span>
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-bold mb-1">اسم صاحب النشاط / المدير</label>
            <input
              type="text"
              value={formData.ownerName || ''}
              onChange={(e) => onChange('ownerName', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1">هاتف المالك الشخصي</label>
            <input
              type="tel"
              value={formData.ownerPhone || ''}
              onChange={(e) => onChange('ownerPhone', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-medium focus:ring-2 focus:ring-indigo-500 dir-ltr text-right"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-bold mb-1">البريد الإلكتروني للمالك</label>
            <input
              type="email"
              value={formData.ownerEmail || ''}
              onChange={(e) => onChange('ownerEmail', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500 dir-ltr text-right"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1">الرقم القومي للمالك / السجل</label>
            <input
              type="text"
              value={formData.nationalId || ''}
              onChange={(e) => onChange('nationalId', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-medium focus:ring-2 focus:ring-indigo-500 dir-ltr text-right"
            />
          </div>
        </div>

        {/* Owner ID Card / Document Attachment */}
        <div className="pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <span>🪪</span>
              <span>صورة بطاقة الرقم القومي أو السجل التجاري</span>
            </span>
            {handleOwnerIdPhotoUpload && (
              <label className="cursor-pointer bg-white hover:bg-slate-100 text-indigo-600 border border-indigo-200 font-bold text-[10.5px] px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-2xs">
                {isUploadingOwnerId ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <UploadCloud className="w-3 h-3" />
                )}
                <span>{ownerIdCardPhoto ? 'استبدال الصورة' : 'إرفاق صورة البطاقة'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleOwnerIdPhotoUpload}
                  className="hidden"
                  disabled={isUploadingOwnerId}
                />
              </label>
            )}
          </div>

          {ownerIdCardPhoto ? (
            <div className="relative aspect-[16/9] max-h-36 rounded-xl overflow-hidden bg-slate-900 border border-slate-300 group">
              <img
                src={ownerIdCardPhoto}
                alt="بطاقة الهوية أو السجل"
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {setPreviewLightbox && (
                  <button
                    type="button"
                    onClick={() => setPreviewLightbox(ownerIdCardPhoto)}
                    className="bg-indigo-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <ZoomIn className="w-3 h-3" />
                    <span>تكبير</span>
                  </button>
                )}
                {setOwnerIdCardPhoto && (
                  <button
                    type="button"
                    onClick={() => {
                      setOwnerIdCardPhoto('');
                      onChange('ownerIdCardPhoto' as any, '');
                    }}
                    className="bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>حذف</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-[10.5px] text-slate-400 font-medium">
              لم يتم إرفاق صورة بطاقة الرقم القومي حتى الآن.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
