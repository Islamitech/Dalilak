import React from 'react';
import { Business, AdminFollowUpCategory } from '../../types';
import { EGYPT_GOVERNORATES } from '../../data/mockData';

export interface EditLocationTabProps {
  formData: Business;
  handleChange?: (field: keyof Business, value: any) => void;
  setFormData?: React.Dispatch<React.SetStateAction<any>>;
  // Legacy optional props
  isEditMode?: boolean;
  isAdminOrFinancial?: boolean;
  googleBadge?: { label: string; cls: string };
  handleCopyGoogleDetails?: () => void;
  handleDownloadAllPhotos?: () => void;
  copiedField?: string | null;
  handleCopyText?: (text: string, fieldName: string) => void;
  isDownloadingPhotos?: boolean;
  onSave?: (biz: Business) => void;
  currentUserName?: string;
  currentUserId?: string;
  userRole?: string;
  onOpenMasterDrawer?: (category?: AdminFollowUpCategory) => void;
  onShowNotification?: (msg: string) => void;
}

export const EditLocationTab: React.FC<EditLocationTabProps> = ({
  formData,
  handleChange: customHandleChange,
  setFormData,
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
          <label className="block text-slate-700 font-bold mb-1">المحافظة</label>
          <select
            value={formData.governorate || EGYPT_GOVERNORATES[0]}
            onChange={(e) => onChange('governorate', e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
          >
            {EGYPT_GOVERNORATES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-slate-700 font-bold mb-1">المدينة / الحي</label>
          <input
            type="text"
            value={formData.city || ''}
            onChange={(e) => onChange('city', e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-slate-700 font-bold mb-1">العنوان والشارع التفصيلي</label>
        <input
          type="text"
          value={formData.street || ''}
          onChange={(e) => onChange('street', e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-slate-700 font-bold mb-1">علامة مميزة (اختياري)</label>
        <input
          type="text"
          placeholder="مثال: بجوار البنك الأهلي، أمام محطة المترو..."
          value={formData.landmark || ''}
          onChange={(e) => onChange('landmark', e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-slate-700 font-bold mb-1">
          رابط موقع النقطة من المندوب (الموقع الميداني)
        </label>
        <input
          type="url"
          placeholder="https://maps.google.com/?q=... أو رابط الموقع المسجل من المندوب"
          value={formData.repLocationUrl || ''}
          onChange={(e) => onChange('repLocationUrl', e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:ring-2 focus:ring-indigo-500 dir-ltr text-right"
        />
      </div>

      <div>
        <label className="block text-slate-700 font-bold mb-1">
          رابط خرائط Google المباشر (المعتمد)
        </label>
        <input
          type="url"
          placeholder="https://maps.google.com/?q=... أو رابط المنشأة المعتمد على Google Maps"
          value={formData.googleMapsUrl || ''}
          onChange={(e) => onChange('googleMapsUrl', e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:ring-2 focus:ring-indigo-500 dir-ltr text-right"
        />
      </div>
    </div>
  );
};
