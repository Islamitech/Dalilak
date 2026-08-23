import React, { useState, useEffect } from 'react';
import { Business, VerificationStatus, PaymentStatus } from '../types';
import { EGYPT_GOVERNORATES, PACKAGES, BUSINESS_CATEGORIES } from '../data/mockData';
import { compressImageFile } from '../utils/imageCompressor';
import {
  Store,
  User,
  MapPin,
  DollarSign,
  Image as ImageIcon,
  UploadCloud,
  Save,
  Eye,
  Trash2,
  X,
  FileText,
  Clock,
  Sparkles,
  AlertCircle,
  CloudUpload,
} from 'lucide-react';
import { GoogleMapsSyncModal } from './GoogleMapsSyncModal';

interface BusinessEditModalProps {
  business: Business | null;
  onClose: () => void;
  onSave: (updatedBiz: Business) => void;
  userRole?: string;
  canEdit?: boolean;
  onShowInvoice?: (business: Business) => void;
  onCollectPayment?: (business: Business) => void;
  onDeleteBusiness?: (id: string) => void;
  businesses: Business[];
}

export const BusinessEditModal: React.FC<BusinessEditModalProps> = ({
  business,
  onClose,
  onSave,
  userRole,
  canEdit = true,
  onShowInvoice,
  onCollectPayment,
  onDeleteBusiness,
  businesses,
}) => {
  const [formData, setFormData] = useState<Business | null>(null);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showMapsSyncModal, setShowMapsSyncModal] = useState<boolean>(false);

  useEffect(() => {
    if (business) {
      setFormData({ ...business });
    } else {
      setFormData(null);
    }
  }, [business]);

  if (!formData) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validate phone number uniqueness
    const normalizedPhone = formData.phone?.trim();
    if (normalizedPhone) {
      const isDuplicate = businesses.some(
        (b) => b.id !== formData.id && ((b.phone && b.phone.trim() === normalizedPhone) || (b.ownerPhone && b.ownerPhone.trim() === normalizedPhone))
      );
      if (isDuplicate) {
        setErrorMsg('رقم هاتف النشاط هذا مسجل بالفعل لنشاط تجاري آخر!');
        return;
      }
    }

    const normalizedOwnerPhone = formData.ownerPhone?.trim();
    if (normalizedOwnerPhone) {
      const isDuplicate = businesses.some(
        (b) => b.id !== formData.id && ((b.phone && b.phone.trim() === normalizedOwnerPhone) || (b.ownerPhone && b.ownerPhone.trim() === normalizedOwnerPhone))
      );
      if (isDuplicate) {
        setErrorMsg('رقم هاتف مالك النشاط مسجل بالفعل لنشاط تجاري آخر!');
        return;
      }
    }

    onSave(formData);
    onClose();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsUploading(true);
      const newCompressed: string[] = [];
      for (let i = 0; i < files.length; i++) {
        try {
          const compressed = await compressImageFile(files[i]);
          newCompressed.push(compressed);
        } catch (err) {
          console.warn('Image upload compression error:', err);
        }
      }
      if (newCompressed.length > 0) {
        const currentPhotos = formData.photos || [];
        setFormData({
          ...formData,
          photos: [...currentPhotos, ...newCompressed],
        });
      }
      e.target.value = '';
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    const currentPhotos = formData.photos || [];
    setFormData({
      ...formData,
      photos: currentPhotos.filter((_, idx) => idx !== indexToRemove),
    });
  };


  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-3xl w-full p-5 sm:p-6 space-y-5 text-xs my-auto text-[var(--text-primary)] shadow-2xl transition-colors duration-300 max-h-[90vh] overflow-y-auto"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 sticky top-0 bg-[var(--bg-card)] z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-[var(--text-primary)]">
                  عرض وتفاصيل النشاط: {formData.nameAr}
                </h3>
                <span className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 font-mono font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  {formData.invoiceNumber}
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] font-bold mt-0.5">
                المندوب المسجل: <strong className="text-[var(--text-primary)]">{formData.repName}</strong> (ID: {formData.repId})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] w-9 h-9 rounded-full flex items-center justify-center text-xs font-black border border-[var(--border-color)] cursor-pointer"
          >
            ✕
          </button>
        </div>

        {!canEdit && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 p-4 rounded-2xl flex items-center gap-2.5 font-bold text-xs leading-relaxed">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              وضع القراءة فقط: تعديل بيانات هذا النشاط متاح فقط للمندوب الذي قام بتسجيله أو لمدير النظام المسؤول.
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-400 p-4 rounded-2xl flex items-center gap-2.5 text-xs font-bold animate-pulse-subtle">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <fieldset disabled={!canEdit} className="border-none p-0 m-0 space-y-5">
          {/* SECTION 1: 🏢 البيانات الأساسية للنشاط التجاري والتصنيف */}
        <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-3">
          <h4 className="font-black text-xs text-amber-500 flex items-center gap-1.5 border-b border-[var(--border-color)] pb-2">
            <Store className="w-4 h-4 text-amber-500" />
            <span>1. البيانات الأساسية للنشاط التجاري والتصنيف</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-extrabold mb-1">اسم النشاط بالعربي *</label>
              <input
                type="text"
                required
                value={formData.nameAr}
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block font-extrabold mb-1">اسم النشاط بالإنجليزي</label>
              <input
                type="text"
                placeholder="English Commercial Name"
                value={formData.nameEn || ''}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block font-extrabold mb-1">فئة وتصنيف النشاط *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-sm"
              >
                {BUSINESS_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-extrabold mb-1">مواعيد وساعات العمل</label>
              <input
                type="text"
                value={formData.workingHours || ''}
                onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-extrabold mb-1">الوصف التفصيلي للنشاط والخدمات</label>
              <textarea
                rows={2}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-sm leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: 👤 بيانات صاحب النشاط ورقم الهاتف والهوية */}
        <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-3">
          <h4 className="font-black text-xs text-amber-500 flex items-center gap-1.5 border-b border-[var(--border-color)] pb-2">
            <User className="w-4 h-4 text-amber-500" />
            <span>2. بيانات صاحب النشاط والهوية الشخصية</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-extrabold mb-1">اسم صاحب النشاط *</label>
              <input
                type="text"
                required
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block font-extrabold mb-1">رقم هاتف صاحب النشاط (الواتساب) *</label>
              <input
                type="tel"
                required
                value={formData.ownerPhone}
                onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-amber-800 dark:text-amber-300 font-mono font-black rounded-xl p-2.5 focus:outline-none focus:border-amber-500 dir-ltr text-right shadow-sm"
              />
            </div>

            <div>
              <label className="block font-extrabold mb-1">هاتف المحل الرئيسي</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-mono font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 dir-ltr text-right shadow-sm"
              />
            </div>

            <div>
              <label className="block font-extrabold mb-1">هاتف إضافي / أرضي</label>
              <input
                type="tel"
                value={formData.secondaryPhone || ''}
                onChange={(e) => setFormData({ ...formData, secondaryPhone: e.target.value })}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-mono font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 dir-ltr text-right shadow-sm"
              />
            </div>

            <div>
              <label className="block font-extrabold mb-1">الرقم القومي لمالك المحل</label>
              <input
                type="text"
                maxLength={14}
                placeholder="2990101010xxxx"
                value={formData.nationalId || ''}
                onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-mono font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block font-extrabold mb-1">البريد الإلكتروني لمالك المحل</label>
              <input
                type="email"
                placeholder="owner@example.com"
                value={formData.ownerEmail || ''}
                onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-mono font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: 📍 العنوان التفصيلي وإحداثيات الخريطة */}
        <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-3">
          <h4 className="font-black text-xs text-amber-500 flex items-center gap-1.5 border-b border-[var(--border-color)] pb-2">
            <MapPin className="w-4 h-4 text-amber-500" />
            <span>3. العنوان الميداني التفصيلي وإحداثيات الموقع (GPS)</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-extrabold mb-1">المحافظة *</label>
              <select
                value={formData.governorate}
                onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-sm"
              >
                {EGYPT_GOVERNORATES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-extrabold mb-1">المدينة / الحي *</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block font-extrabold mb-1">الشارع الرئيسي *</label>
              <input
                type="text"
                required
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-sm"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block font-extrabold mb-1">علامة مميزة (أقرب مبنى أو ميدان)</label>
              <input
                type="text"
                value={formData.landmark || ''}
                onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block font-extrabold mb-1">خط العرض (Latitude)</label>
              <input
                type="number"
                step="any"
                value={formData.lat}
                onChange={(e) => setFormData({ ...formData, lat: Number(e.target.value) })}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-mono rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block font-extrabold mb-1">خط الطول (Longitude)</label>
              <input
                type="number"
                step="any"
                value={formData.lng}
                onChange={(e) => setFormData({ ...formData, lng: Number(e.target.value) })}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-mono rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block font-extrabold mb-1">رابط خريطة جوجل (Google Maps Link)</label>
              <input
                type="url"
                value={formData.googleMapsUrl || ''}
                onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-mono text-xs rounded-xl p-2.5 focus:outline-none focus:border-amber-500 dir-ltr text-right shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: 💰 بيانات الباقة والماليات وحالة الدفع */}
        <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-3">
          <h4 className="font-black text-xs text-amber-500 flex items-center gap-1.5 border-b border-[var(--border-color)] pb-2">
            <DollarSign className="w-4 h-4 text-amber-500" />
            <span>4. الباقة والمدفوعات وحالة الدفع والتوثيق</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-extrabold mb-1">الباقة المختارة *</label>
              <select
                value={formData.packageId}
                onChange={(e) => {
                  const selectedPkg = PACKAGES.find((p) => p.id === e.target.value);
                  if (selectedPkg) {
                    setFormData({
                      ...formData,
                      packageId: selectedPkg.id,
                      packageName: selectedPkg.title,
                      packagePrice: selectedPkg.price,
                    });
                  }
                }}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-sm"
              >
                {PACKAGES.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.title} ({pkg.price} ج.م)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-extrabold mb-1">المبلغ المحصل فعلياً (ج.م) *</label>
              <input
                type="number"
                required
                value={formData.amountPaid}
                onChange={(e) => {
                  const paid = Number(e.target.value);
                  const status: PaymentStatus =
                    paid >= formData.packagePrice
                      ? 'fully_paid'
                      : paid > 0
                      ? 'partially_paid'
                      : 'unpaid';
                  setFormData({
                    ...formData,
                    amountPaid: paid,
                    paymentStatus: status,
                  });
                }}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-emerald-800 dark:text-emerald-400 font-mono font-black rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block font-extrabold mb-1">حالة الدفع</label>
              <select
                value={formData.paymentStatus}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    paymentStatus: e.target.value as PaymentStatus,
                  })
                }
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-sm"
              >
                <option value="fully_paid">مدفوع بالكامل</option>
                <option value="partially_paid">مدفوع جزء منه</option>
                <option value="unpaid">لم يدفع</option>
              </select>
            </div>

            <div>
              <label className="block font-extrabold mb-1">حالة التوثيق والبث على الخريطة *</label>
              <select
                value={formData.verificationStatus}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    verificationStatus: e.target.value as VerificationStatus,
                  })
                }
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-sm"
              >
                <option value="verified">🟢 تم التوثيق والظهور رسمياً</option>
                <option value="in_progress">🟡 جاري التوثيق والمراجعة</option>
                <option value="pending">🟠 معلق</option>
                <option value="rejected">🔴 مرفوض</option>
              </select>
            </div>

            <div>
              <label className="block font-extrabold mb-1">المندوب الميداني المسجل</label>
              <input
                type="text"
                readOnly
                value={`${formData.repName} (ID: ${formData.repId})`}
                className="w-full bg-[var(--input-bg)] opacity-70 border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5"
              />
            </div>

            <div>
              <label className="block font-extrabold mb-1">تاريخ التسجيل الميداني</label>
              <input
                type="text"
                readOnly
                value={formData.createdDate || formData.invoiceDate}
                className="w-full bg-[var(--input-bg)] opacity-70 border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="block font-extrabold mb-1">ملاحظات المندوب الميداني</label>
            <textarea
              rows={2}
              placeholder="لا توجد ملاحظات إضافية"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-sm"
            />
          </div>
        </div>

        {/* SECTION 5: 📸 معرض الصور والمستندات المرفوعة أثناء التسجيل الميداني */}
        <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-color)] pb-2">
            <h4 className="font-black text-xs text-amber-500 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-amber-500" />
              <span>5. الصور والمستندات المرفوعة بواسطة المندوب ({formData.photos?.length || 0})</span>
            </h4>

            {canEdit && (
              <div className="flex items-center gap-2">
                <label className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1 shadow-sm transition-transform active:scale-95">
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>📸 إرفاق صورة جديدة</span>
                  <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                </label>


              </div>
            )}
          </div>

          {formData.photos && formData.photos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {formData.photos.map((photo, idx) => (
                <div
                  key={`photo_${idx}`}
                  className="relative group rounded-xl overflow-hidden border border-[var(--border-color)] bg-[var(--input-bg)] aspect-video shadow-sm"
                >
                  <img
                    src={photo}
                    alt={`معاينة الصورة ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => setSelectedPhotoPreview(photo)}
                  />

                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] w-6 h-6 rounded-full flex items-center justify-center font-black shadow cursor-pointer transition-transform active:scale-95 z-10"
                      title="حذف هذه الصورة"
                    >
                      ✕
                    </button>
                  )}

                  <div
                    onClick={() => setSelectedPhotoPreview(photo)}
                    className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-black transition-opacity cursor-pointer pointer-events-none"
                  >
                    🔍 معاينة وتكبير
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-[var(--input-bg)] rounded-xl border border-[var(--border-color)] text-xs text-[var(--text-muted)] font-bold space-y-2">
              <p>لم يتم إرفاق صور واجهة النشاط لهذا التسجيل بعد.</p>
              <p className="text-[11px] text-amber-500 font-normal">
                يمكنك استخدام زر <strong className="font-black">"📸 إرفاق صورة جديدة"</strong> أعلاه لإدخال الصورة وتوثيق النشاط الآن.
              </p>
            </div>
          )}
        </div>
        </fieldset>

        {/* SECTION: 🛠️ خيارات وإجراءات سريعة */}
        <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-3">
          <h4 className="font-black text-xs text-amber-500 flex items-center gap-1.5 border-b border-[var(--border-color)] pb-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>أدوات وإجراءات سريعة للنشاط</span>
          </h4>
          <div className="flex flex-wrap gap-2 text-xs">
            {onShowInvoice && (
              <button
                type="button"
                onClick={() => onShowInvoice(formData)}
                className="bg-amber-500/15 hover:bg-amber-500 text-amber-900 dark:text-amber-300 hover:text-slate-950 font-black px-3.5 py-2 rounded-xl flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
              >
                <FileText className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <span>الفاتورة الإلكترونية</span>
              </button>
            )}

            {onCollectPayment && Math.max(0, formData.packagePrice - formData.amountPaid) > 0 && (
              <button
                type="button"
                onClick={() => onCollectPayment(formData)}
                className="bg-emerald-500/15 text-emerald-900 dark:text-emerald-300 border border-emerald-500/40 font-black px-3.5 py-2 rounded-xl flex items-center gap-1 hover:bg-emerald-600 hover:text-white transition-colors shadow-sm cursor-pointer"
              >
                <DollarSign className="w-4 h-4" />
                <span>تحصيل المبلغ المتبقي ({Math.max(0, formData.packagePrice - formData.amountPaid)} ج.م)</span>
              </button>
            )}

            {(formData.googleMapsUrl || (formData.lat && formData.lng)) && (
              <a
                href={formData.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${formData.lat},${formData.lng}`}
                target="_blank"
                rel="noreferrer"
                className="bg-[var(--input-bg)] text-[var(--text-primary)] hover:text-amber-500 font-bold px-3.5 py-2 rounded-xl border border-[var(--border-color)] flex items-center gap-1 transition-colors text-center"
              >
                <MapPin className="w-4 h-4 text-amber-500" />
                <span>فتح الموقع في الخريطة</span>
              </a>
            )}

            <button
              type="button"
              onClick={() => setShowMapsSyncModal(true)}
              className="bg-blue-600/15 hover:bg-blue-600 text-blue-900 dark:text-blue-300 hover:text-white font-black px-3.5 py-2 rounded-xl border border-blue-500/40 flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
            >
              <CloudUpload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>مزامنة مع Google Maps ({formData.googleSyncStatus === 'synced' ? 'مُوثق ✅' : 'مزامنة ⚡'})</span>
            </button>

            {onDeleteBusiness && canEdit && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`هل أنت متأكد من حذف النشاط "${formData.nameAr}" نهائياً من النظام؟`)) {
                    onDeleteBusiness(formData.id);
                    onClose();
                  }
                }}
                className="bg-rose-500/15 hover:bg-rose-600 text-rose-900 dark:text-rose-300 hover:text-white font-black px-3.5 py-2 rounded-xl border border-rose-500/40 flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-700 dark:text-rose-400 hover:text-white" />
                <span>حذف النشاط</span>
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-color)] sticky bottom-0 bg-[var(--bg-card)] z-10">
          <button
            type="button"
            onClick={onClose}
            className="bg-[var(--input-bg)] text-[var(--text-secondary)] font-bold px-4 py-2.5 rounded-xl border border-[var(--border-color)] cursor-pointer"
          >
            إغلاق
          </button>
          {canEdit && (
            <button
              type="submit"
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black px-6 py-2.5 rounded-xl shadow-lg cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>حفظ التعديلات في النظام</span>
            </button>
          )}
        </div>
      </form>

      {/* Lightbox Photo Preview */}
      {selectedPhotoPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full max-h-[85vh] flex flex-col items-center">
            <button
              onClick={() => setSelectedPhotoPreview(null)}
              className="absolute -top-10 left-0 bg-white/20 hover:bg-white/40 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-black cursor-pointer"
            >
              ✕
            </button>
            <img
              src={selectedPhotoPreview}
              alt="معاينة الصورة المرفوعة"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl border-2 border-amber-500 shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Google Maps Sync Modal */}
      {formData && (
        <GoogleMapsSyncModal
          business={formData}
          isOpen={showMapsSyncModal}
          onClose={() => setShowMapsSyncModal(false)}
          onUpdateBusiness={(updated) => {
            setFormData(updated);
            onSave(updated);
          }}
        />
      )}
    </div>
  );
};
