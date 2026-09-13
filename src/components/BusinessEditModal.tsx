import React, { useState, useEffect } from 'react';
import { Business, PaymentStatus, User } from '../types';
import { BUSINESS_CATEGORIES, EGYPT_GOVERNORATES } from '../data/mockData';
import {
  X,
  Save,
  Building2,
  MapPin,
  Phone,
  User as UserIcon,
  CreditCard,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export interface BusinessEditModalProps {
  business: Business | null;
  isOpen?: boolean;
  onClose: () => void;
  onSave?: (updatedBusiness: Business) => void;
  currentUser?: User | null;
  userRole?: string;
  currentRoleTitle?: string;
  currentUserName?: string;
  currentUserId?: string;
  initialTab?: string;
  canEdit?: boolean;
  onShowInvoice?: (business: Business, additionalInvoiceId?: string) => void;
  onCollectPayment?: (business: Business) => void;
  onDeleteBusiness?: (id: string) => void;
  businesses?: Business[];
}

export const BusinessEditModal: React.FC<BusinessEditModalProps> = ({
  business,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<Partial<Business>>({});
  const [activeTab, setActiveTab] = useState<'basic' | 'location' | 'contact' | 'owner' | 'media' | 'finance'>('basic');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  const isModalOpen = isOpen !== undefined ? isOpen : Boolean(business);

  useEffect(() => {
    if (business && isModalOpen) {
      setFormData({ ...business });
      setErrorMsg('');
      setIsSavedSuccess(false);
      setActiveTab('basic');
    }
  }, [business, isModalOpen]);

  if (!isModalOpen || !business) return null;

  const handleChange = (field: keyof Business, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameAr?.trim()) {
      setErrorMsg('يرجى إدخال اسم المنشأة باللغة العربية');
      setActiveTab('basic');
      return;
    }
    if (!formData.phone?.trim()) {
      setErrorMsg('يرجى إدخال رقم هاتف المنشأة الأساسي');
      setActiveTab('contact');
      return;
    }

    const price = Number(formData.packagePrice) || 0;
    const paid = Number(formData.amountPaid) || 0;
    let paymentStatus: PaymentStatus = formData.paymentStatus || 'unpaid';
    if (formData.isFeeExempt) {
      paymentStatus = 'fully_paid';
    } else if (paid >= price && price > 0) {
      paymentStatus = 'fully_paid';
    } else if (paid > 0) {
      paymentStatus = 'partially_paid';
    } else {
      paymentStatus = 'unpaid';
    }

    const updatedBusiness: Business = {
      ...business,
      ...(formData as Business),
      packagePrice: price,
      amountPaid: paid,
      paymentStatus
    };

    if (onSave) {
      onSave(updatedBusiness);
    }
    setIsSavedSuccess(true);
    setTimeout(() => {
      setIsSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs font-['Tajawal',sans-serif] animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden text-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                تعديل وتحديث بيانات المنشأة
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {business.nameAr} • كود: {business.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
            title="إغلاق (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-200 bg-white overflow-x-auto text-xs font-bold">
          {[
            { id: 'basic', label: 'البيانات الأساسية', icon: <Building2 className="w-3.5 h-3.5" /> },
            { id: 'location', label: 'العنوان والموقع', icon: <MapPin className="w-3.5 h-3.5" /> },
            { id: 'contact', label: 'التواصل وساعات العمل', icon: <Phone className="w-3.5 h-3.5" /> },
            { id: 'owner', label: 'بيانات المالك', icon: <UserIcon className="w-3.5 h-3.5" /> },
            { id: 'media', label: 'الوسائط والفيديو', icon: <ImageIcon className="w-3.5 h-3.5" /> },
            { id: 'finance', label: 'المالية والباقة', icon: <CreditCard className="w-3.5 h-3.5" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Saved Success Notification */}
        {isSavedSuccess && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>تم حفظ وتحديث بيانات المنشأة بنجاح تام!</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* TAB 1: BASIC INFO */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    اسم المنشأة بالعربية *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nameAr || ''}
                    onChange={(e) => handleChange('nameAr', e.target.value)}
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
                    onChange={(e) => handleChange('nameEn', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500 dir-ltr text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    التصنيف التجاري الأساسي
                  </label>
                  <select
                    value={formData.category || BUSINESS_CATEGORIES[0]}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                  >
                    {BUSINESS_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    التصنيف الفرعي الدقيق
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: أسماك ومأكولات بحرية، ملابس نسائية..."
                    value={formData.subCategory || ''}
                    onChange={(e) => handleChange('subCategory', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  عن المنشأة والوصف التعريفي
                </label>
                <textarea
                  rows={4}
                  placeholder="اكتب نبذة تسويقية وتعريفية شاملة عن النشاط وأبرز الخدمات..."
                  value={formData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* TAB 2: LOCATION */}
          {activeTab === 'location' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">المحافظة</label>
                  <select
                    value={formData.governorate || EGYPT_GOVERNORATES[0]}
                    onChange={(e) => handleChange('governorate', e.target.value)}
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
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">العنوان والشارع التفصيلي</label>
                <input
                  type="text"
                  value={formData.street || ''}
                  onChange={(e) => handleChange('street', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">علامة مميزة (اختياري)</label>
                <input
                  type="text"
                  placeholder="مثال: بجوار البنك الأهلي، أمام محطة المترو..."
                  value={formData.landmark || ''}
                  onChange={(e) => handleChange('landmark', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">خط العرض (Latitude)</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.lat || ''}
                    onChange={(e) => handleChange('lat', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono focus:ring-2 focus:ring-indigo-500 dir-ltr text-right"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">خط الطول (Longitude)</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.lng || ''}
                    onChange={(e) => handleChange('lng', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono focus:ring-2 focus:ring-indigo-500 dir-ltr text-right"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">رابط خرائط Google المباشر</label>
                <input
                  type="url"
                  placeholder="https://maps.google.com/?q=..."
                  value={formData.googleMapsUrl || ''}
                  onChange={(e) => handleChange('googleMapsUrl', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:ring-2 focus:ring-indigo-500 dir-ltr text-right"
                />
              </div>
            </div>
          )}

          {/* TAB 3: CONTACT & HOURS */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    رقم الهاتف الأساسي (واتساب) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-medium focus:ring-2 focus:ring-indigo-500 dir-ltr text-right"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    رقم هاتف بديل / أرضي (اختياري)
                  </label>
                  <input
                    type="tel"
                    value={formData.secondaryPhone || ''}
                    onChange={(e) => handleChange('secondaryPhone', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-medium focus:ring-2 focus:ring-indigo-500 dir-ltr text-right"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">ساعات ومواعيد العمل</label>
                <input
                  type="text"
                  placeholder="مثال: يومياً من 10:00 ص حتى 11:00 م، أو 24 ساعة..."
                  value={formData.workingHours || ''}
                  onChange={(e) => handleChange('workingHours', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* TAB 4: OWNER INFO */}
          {activeTab === 'owner' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    اسم المالك أو المسؤول المعتمد
                  </label>
                  <input
                    type="text"
                    value={formData.ownerName || ''}
                    onChange={(e) => handleChange('ownerName', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    هاتف المالك المباشر
                  </label>
                  <input
                    type="tel"
                    value={formData.ownerPhone || ''}
                    onChange={(e) => handleChange('ownerPhone', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-medium focus:ring-2 focus:ring-indigo-500 dir-ltr text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    البريد الإلكتروني للمالك
                  </label>
                  <input
                    type="email"
                    value={formData.ownerEmail || ''}
                    onChange={(e) => handleChange('ownerEmail', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500 dir-ltr text-right"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    الرقم القومي للمالك / السجل
                  </label>
                  <input
                    type="text"
                    value={formData.nationalId || ''}
                    onChange={(e) => handleChange('nationalId', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-medium focus:ring-2 focus:ring-indigo-500 dir-ltr text-right"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MEDIA & VIDEO */}
          {activeTab === 'media' && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  رابط صورة الغلاف الأساسية (Cover Photo URL)
                </label>
                <input
                  type="url"
                  value={formData.coverPhoto || ''}
                  onChange={(e) => handleChange('coverPhoto', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:ring-2 focus:ring-indigo-500 dir-ltr text-right"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  رابط جولة الفيديو الميدانية المعتمدة (Video URL / YouTube / MP4)
                </label>
                <input
                  type="url"
                  placeholder="https://... أو رابط يوتيوب أو ملف mp4 مباشر"
                  value={formData.videoTourUrl || ''}
                  onChange={(e) => handleChange('videoTourUrl', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:ring-2 focus:ring-indigo-500 dir-ltr text-right"
                />
              </div>

              {formData.coverPhoto && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-slate-600 block">معاينة الغلاف:</span>
                  <img
                    src={formData.coverPhoto}
                    alt="معاينة الغلاف"
                    className="h-36 w-full object-cover rounded-xl border border-slate-200"
                    onError={(e: any) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 6: FINANCE & PACKAGE */}
          {activeTab === 'finance' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">سعر الباقة المقررة (ج.م)</label>
                  <input
                    type="number"
                    value={formData.packagePrice ?? 750}
                    onChange={(e) => handleChange('packagePrice', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">المبلغ المحصل فعلياً (ج.م)</label>
                  <input
                    type="number"
                    value={formData.amountPaid ?? 0}
                    onChange={(e) => handleChange('amountPaid', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-emerald-600 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.isFeeExempt)}
                    onChange={(e) => handleChange('isFeeExempt', e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span className="font-bold text-slate-800 text-xs">
                    مكان رائج معفى رسمياً من الرسوم (إدراج مجاني معتمد)
                  </span>
                </label>

                {formData.isFeeExempt && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      سبب الإعفاء الرسمي
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: منشأة تاريخية رائدة بالمنطقة، إدراج شرفي..."
                      value={formData.feeExemptionReason || ''}
                      onChange={(e) => handleChange('feeExemptionReason', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">المندوب الميداني المسؤول</label>
                  <input
                    type="text"
                    value={formData.repName || ''}
                    onChange={(e) => handleChange('repName', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">كود المندوب (repId)</label>
                  <input
                    type="text"
                    value={formData.repId || ''}
                    onChange={(e) => handleChange('repId', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:ring-2 focus:ring-indigo-500 dir-ltr text-right"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold transition-colors cursor-pointer"
            >
              إلغاء التعديلات
            </button>
            <button
              type="submit"
              className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>حفظ واعتماد التعديلات</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
