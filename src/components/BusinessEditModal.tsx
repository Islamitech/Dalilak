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
  Trash2,
  FileText,
  Clock,
  Sparkles,
  AlertCircle,
  CloudUpload,
  Download,
  Zap,
  Gift,
  Check,
  CheckCircle2,
  MessageSquare,
  Pencil,
  ExternalLink,
  Phone,
  Mail,
  CreditCard,
  Building,
  Navigation,
  Globe,
  Tag,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { GoogleMapsSyncModal } from './GoogleMapsSyncModal';
import { downloadSinglePhoto, downloadAllBusinessPhotos } from '../utils/photoDownloader';
import { formatActivityDateTime } from '../utils/dateFormatters';
import { generateUpgradeOffersWhatsAppMessage, getUpgradeOffersWhatsAppUrl } from '../utils/packageOffers';

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
  const [copiedOffers, setCopiedOffers] = useState<boolean>(false);
  const [upgradeNotice, setUpgradeNotice] = useState<string | null>(null);

  // Per-field inline editing state
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editAllMode, setEditAllMode] = useState<boolean>(false);

  // Collapsible accordion sections state (all open by default or toggleable)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    sec1: true,
    sec2: false,
    sec3: false,
    sec4: false,
    sec5: false,
  });

  const toggleSection = (secKey: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [secKey]: !prev[secKey],
    }));
  };

  const toggleAllSections = (expand: boolean) => {
    setOpenSections({
      sec1: expand,
      sec2: expand,
      sec3: expand,
      sec4: expand,
      sec5: expand,
    });
  };

  useEffect(() => {
    if (business) {
      setFormData({ ...business });
    } else {
      setFormData(null);
    }
  }, [business]);

  if (!formData) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  // Helper renderer for info items with pencil edit icon
  const renderInfoItem = (
    fieldKey: string,
    label: string,
    value: string | number | undefined | null,
    options?: {
      icon?: React.ReactNode;
      type?: 'text' | 'tel' | 'email' | 'number' | 'textarea' | 'select' | 'url';
      selectOptions?: { value: string; label: string }[] | string[];
      placeholder?: string;
      displayFormat?: (val: any) => React.ReactNode;
      dir?: 'ltr' | 'rtl';
      colSpan?: string;
      required?: boolean;
      readOnly?: boolean;
      helperAction?: React.ReactNode;
    }
  ) => {
    const isEditing = canEdit && !options?.readOnly && (editAllMode || editingField === fieldKey);
    const colClass = options?.colSpan || 'col-span-1';

    const handleCloseEdit = () => {
      setEditingField(null);
    };

    return (
      <div
        className={`${colClass} bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-amber-500/40 rounded-2xl p-3 sm:p-3.5 transition-all shadow-sm flex flex-col justify-between gap-1.5 relative group`}
      >
        {/* Header: Label + Icon + Edit Pencil */}
        <div className="flex items-center justify-between gap-1">
          <span className="text-[11px] font-extrabold text-[var(--text-muted)] flex items-center gap-1.5">
            {options?.icon}
            <span>{label}</span>
            {options?.required && <span className="text-rose-500 font-black">*</span>}
          </span>

          <div className="flex items-center gap-1">
            {options?.helperAction}

            {canEdit && !options?.readOnly && (
              <button
                type="button"
                onClick={() => setEditingField(isEditing ? null : fieldKey)}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isEditing
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 group-hover:scale-105'
                }`}
                title={isEditing ? 'حفظ الحقل' : `تعديل ${label}`}
              >
                {isEditing ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Body: Display or Active Edit Field */}
        <div className="mt-0.5">
          {isEditing ? (
            <div className="space-y-1.5 animate-fade-in">
              {options?.type === 'textarea' ? (
                <textarea
                  rows={3}
                  value={(formData as any)[fieldKey] || ''}
                  onChange={(e) => setFormData({ ...formData, [fieldKey]: e.target.value })}
                  placeholder={options?.placeholder}
                  autoFocus={editingField === fieldKey}
                  className="w-full bg-[var(--input-bg)] border-2 border-amber-500/60 text-[var(--text-primary)] font-bold rounded-xl p-2 focus:outline-none focus:border-amber-500 text-xs shadow-inner"
                />
              ) : options?.type === 'select' ? (
                <select
                  value={(formData as any)[fieldKey] || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, [fieldKey]: e.target.value });
                    if (!editAllMode) setEditingField(null);
                  }}
                  autoFocus={editingField === fieldKey}
                  className="w-full bg-[var(--input-bg)] border-2 border-amber-500/60 text-[var(--text-primary)] font-bold rounded-xl p-2 focus:outline-none focus:border-amber-500 text-xs shadow-inner"
                >
                  {options.selectOptions?.map((opt: any) => {
                    const val = typeof opt === 'object' ? opt.value : opt;
                    const lbl = typeof opt === 'object' ? opt.label : opt;
                    return (
                      <option key={val} value={val}>
                        {lbl}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <div className="flex items-center gap-1.5">
                  <input
                    type={options?.type || 'text'}
                    dir={options?.dir || 'rtl'}
                    value={(formData as any)[fieldKey] ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [fieldKey]: options?.type === 'number' ? Number(e.target.value) : e.target.value,
                      })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCloseEdit();
                      }
                    }}
                    placeholder={options?.placeholder}
                    autoFocus={editingField === fieldKey}
                    className="w-full bg-[var(--input-bg)] border-2 border-amber-500/60 text-[var(--text-primary)] font-bold rounded-xl p-2 focus:outline-none focus:border-amber-500 text-xs shadow-inner"
                  />
                  {!editAllMode && (
                    <button
                      type="button"
                      onClick={handleCloseEdit}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-xl text-xs font-black cursor-pointer shadow shrink-0"
                      title="تم"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div
              onClick={() => canEdit && !options?.readOnly && setEditingField(fieldKey)}
              className={`text-xs sm:text-sm font-black text-[var(--text-primary)] break-words ${
                canEdit && !options?.readOnly ? 'cursor-pointer hover:text-amber-500 transition-colors' : ''
              }`}
            >
              {options?.displayFormat ? (
                options.displayFormat(value)
              ) : value !== undefined && value !== null && String(value).trim() !== '' ? (
                <span dir={options?.dir || 'rtl'}>{String(value)}</span>
              ) : (
                <span className="text-[var(--text-muted)] font-normal italic text-xs flex items-center gap-1">
                  <span>غير مسجل</span>
                  {canEdit && !options?.readOnly && <span className="text-[10px] text-amber-500 font-bold">(انقر للإدخال)</span>}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const isAllOpen = Object.values(openSections).every(Boolean);
  const remainingDebt = Math.max(0, (formData.packagePrice || 0) - (formData.amountPaid || 0));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-5 overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl max-w-3xl w-full p-4 sm:p-6 space-y-3.5 text-xs my-auto text-[var(--text-primary)] shadow-2xl transition-colors duration-300 max-h-[92vh] overflow-y-auto"
      >
        {/* ========================================================
            MODAL HEADER: Business Name, Status Badges, & Direct Actions
            ======================================================== */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-3.5 sm:p-4 sticky top-0 z-20 shadow-md space-y-3">
          {/* Top Line: Name + Invoice + Action/Payment Status Badges + Close */}
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-base sm:text-lg text-[var(--text-primary)] truncate">
                    {formData.nameAr || 'عرض وتفاصيل النشاط'}
                  </h3>
                  <span className="text-[10px] bg-amber-500/15 text-amber-800 dark:text-amber-300 font-mono font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                    {formData.invoiceNumber}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] font-bold mt-0.5">
                  المندوب: <strong className="text-[var(--text-primary)]">{formData.repName}</strong>
                </p>
              </div>
            </div>

            {/* Close Modal Button */}
            <button
              type="button"
              onClick={onClose}
              className="bg-[var(--input-bg)] hover:bg-rose-500/20 text-[var(--text-muted)] hover:text-rose-600 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border border-[var(--border-color)] cursor-pointer shrink-0 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Status Badges Row: Action Status + Invoice Payment Status */}
          <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-[var(--border-color)]">
            {/* 1. Verification & Map Status Badge */}
            {formData.verificationStatus === 'verified' || formData.googleSyncStatus === 'synced' ? (
              <span className="badge-success inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-black text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>موثق ومعتمد رسمياً على الخريطة</span>
              </span>
            ) : formData.verificationStatus === 'in_progress' || formData.googleSyncStatus === 'in_progress' ? (
              <span className="badge-warning inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-black text-xs">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>أُرسل للتوثيق (بانتظار موافقة جوجل)</span>
              </span>
            ) : (
              <span className="badge-danger inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-black text-xs">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>لم يُرفع للتوثيق بعد</span>
              </span>
            )}

            {/* 2. Invoice Payment Status Badge */}
            {formData.paymentStatus === 'fully_paid' ? (
              <span className="badge-success inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-black text-xs">
                <Check className="w-3.5 h-3.5" />
                <span>سداد الفاتورة: مدفوع بالكامل ({formData.amountPaid} ج.م)</span>
              </span>
            ) : formData.paymentStatus === 'partially_paid' ? (
              <span className="badge-warning inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-black text-xs">
                <DollarSign className="w-3.5 h-3.5" />
                <span>سداد الفاتورة: مدفوع جزء منه (متبقي {remainingDebt} ج.م)</span>
              </span>
            ) : (
              <span className="badge-danger inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-black text-xs">
                <CreditCard className="w-3.5 h-3.5" />
                <span>سداد الفاتورة: غير مسدد (مطلوب {formData.packagePrice} ج.م)</span>
              </span>
            )}
          </div>

          {/* CLARIFICATION BANNER: When Verified with Unpaid/Remaining Balance */}
          {(formData.verificationStatus === 'verified' || formData.googleSyncStatus === 'synced') && remainingDebt > 0 && (
            <div className="alert-card-warning border-2 p-3 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs animate-fade-in shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="alert-icon-box w-7 h-7 rounded-xl flex items-center justify-center shrink-0 font-bold">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <span className="alert-title font-black block text-sm">
                    تنبيه مالي: هذا النشاط موثق رسمياً على الخريطة ولكن ما زال عليه متبقي سداد!
                  </span>
                  <span className="alert-desc text-[11px] font-bold mt-0.5 block">
                    تم اعتماد ونشر النشاط على Google Maps، والمتبقي للتحصيل: <strong className="font-mono font-black">{remainingDebt.toLocaleString()} ج.م</strong> من قيمة باقة ({formData.packageTitle || 'الاشتراك'}).
                  </span>
                </div>
              </div>
              {onCollectPayment && (
                <button
                  type="button"
                  onClick={() => onCollectPayment(formData)}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl shadow-xs shrink-0 cursor-pointer transition-transform active:scale-95 flex items-center gap-1"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>تحصيل المتبقي الآن</span>
                </button>
              )}
            </div>
          )}

          {/* Action Buttons Integrated Directly Inside the Header */}
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-[var(--border-color)]">
            {onShowInvoice && (
              <button
                type="button"
                onClick={() => onShowInvoice(formData)}
                className="bg-amber-500/15 hover:bg-amber-500 text-amber-900 dark:text-amber-300 hover:text-slate-950 font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                title="عرض وتحميل الفاتورة الإلكترونية للنشاط"
              >
                <FileText className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                <span>الفاتورة الإلكترونية</span>
              </button>
            )}

            {onCollectPayment && remainingDebt > 0 && (
              <button
                type="button"
                onClick={() => onCollectPayment(formData)}
                className="bg-emerald-500/15 hover:bg-emerald-600 text-emerald-900 dark:text-emerald-300 hover:text-white border border-emerald-500/40 font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                title="تحصيل المبلغ المتبقي من العميل"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>تحصيل المتبقي ({remainingDebt} ج.م)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowMapsSyncModal(true)}
              className="bg-blue-600/15 hover:bg-blue-600 text-blue-900 dark:text-blue-300 hover:text-white font-black px-3 py-1.5 rounded-xl border border-blue-500/40 flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              title="مزامنة وتوثيق النشاط على Google Maps"
            >
              <CloudUpload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>مزامنة Google Maps ({formData.googleSyncStatus === 'synced' ? 'مُوثق ✅' : 'مزامنة ⚡'})</span>
            </button>

            {(formData.googleMapsUrl || (formData.lat && formData.lng)) && (
              <a
                href={formData.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${formData.lat},${formData.lng}`}
                target="_blank"
                rel="noreferrer"
                className="bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-amber-500 font-bold px-3 py-1.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1.5 transition-colors"
                title="فتح الموقع على تطبيق خرائط جوجل"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
                <span>فتح بالخرائط</span>
              </a>
            )}

            {canEdit && (
              <button
                type="button"
                onClick={() => setEditAllMode(!editAllMode)}
                className={`font-black px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                  editAllMode
                    ? 'bg-amber-500 text-slate-950 border-amber-600 shadow'
                    : 'bg-[var(--input-bg)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-amber-500/50'
                }`}
                title={editAllMode ? 'العودة لوضع العرض المنظم' : 'تعديل كافة الخانات مرة واحدة'}
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>{editAllMode ? 'إنهاء التعديل' : 'تعديل الكل'}</span>
              </button>
            )}

            {onDeleteBusiness && canEdit && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`هل أنت متأكد من حذف النشاط "${formData.nameAr}" نهائياً من النظام؟`)) {
                    onDeleteBusiness(formData.id);
                    onClose();
                  }
                }}
                className="bg-rose-500/15 hover:bg-rose-600 text-rose-900 dark:text-rose-300 hover:text-white font-black px-3 py-1.5 rounded-xl border border-rose-500/40 flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                title="حذف هذا النشاط من قاعدة البيانات"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-700 dark:text-rose-400 hover:text-white" />
                <span>حذف النشاط</span>
              </button>
            )}

            {/* Quick Expand / Collapse All Accordions Button */}
            <button
              type="button"
              onClick={() => toggleAllSections(!isAllOpen)}
              className="mr-auto text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              {isAllOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              <span>{isAllOpen ? 'طي جميع الأقسام' : 'فتح جميع الأقسام'}</span>
            </button>
          </div>
        </div>

        {!canEdit && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 p-3 rounded-2xl flex items-center gap-2 font-bold text-xs">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <div>وضع القراءة فقط: تعديل بيانات هذا النشاط متاح فقط للمندوب المسجل أو لمدير النظام.</div>
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-400 p-3 rounded-2xl flex items-center gap-2 text-xs font-bold">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ========================================================
            COLLAPSIBLE ACCORDION SECTIONS
            ======================================================== */}

        {/* SECTION 1: 🏢 البيانات الأساسية للنشاط التجاري والتصنيف */}
        <div className="bg-[var(--bg-surface)]/70 rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggleSection('sec1')}
            className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-2 bg-[var(--bg-card)]/50 hover:bg-amber-500/5 transition-colors cursor-pointer text-right"
          >
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
                1. البيانات الأساسية للنشاط التجاري والتصنيف
              </span>
              <span className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
                {formData.category || 'عام'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[var(--text-muted)] font-bold hidden sm:inline">
                {openSections.sec1 ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
              </span>
              <div
                className={`w-6 h-6 rounded-full bg-[var(--input-bg)] flex items-center justify-center text-amber-500 transition-transform duration-300 ${
                  openSections.sec1 ? 'rotate-180' : ''
                }`}
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          </button>

          {openSections.sec1 && (
            <div className="p-3 sm:p-4 border-t border-[var(--border-color)] space-y-2.5 animate-fade-in bg-[var(--bg-surface)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {renderInfoItem('nameAr', 'اسم النشاط بالعربي', formData.nameAr, {
                  required: true,
                  icon: <Store className="w-3.5 h-3.5 text-amber-500" />,
                  displayFormat: (val) => <span className="text-sm font-black text-amber-600 dark:text-amber-400">{val || '—'}</span>,
                })}

                {renderInfoItem('nameEn', 'اسم النشاط بالإنجليزي', formData.nameEn, {
                  dir: 'ltr',
                  placeholder: 'English Commercial Name',
                  icon: <Globe className="w-3.5 h-3.5 text-blue-500" />,
                })}

                {renderInfoItem('category', 'فئة وتصنيف النشاط', formData.category, {
                  type: 'select',
                  selectOptions: BUSINESS_CATEGORIES,
                  icon: <Tag className="w-3.5 h-3.5 text-emerald-500" />,
                  displayFormat: (val) => (
                    <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-lg font-black text-xs border border-emerald-500/20">
                      {val || 'غير مصنف'}
                    </span>
                  ),
                })}

                {renderInfoItem('workingHours', 'مواعيد وساعات العمل', formData.workingHours, {
                  placeholder: 'مثال: يومياً من 9:00 ص حتى 11:00 م',
                  icon: <Clock className="w-3.5 h-3.5 text-amber-500" />,
                })}

                {renderInfoItem('description', 'الوصف والخدمات المقدمة', formData.description, {
                  type: 'textarea',
                  colSpan: 'sm:col-span-2',
                  placeholder: 'أدخل تفاصيل الخدمات والنشاط...',
                  icon: <FileText className="w-3.5 h-3.5 text-purple-500" />,
                  displayFormat: (val) => (
                    <p className="text-xs font-bold text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                      {val || <span className="text-[var(--text-muted)] italic font-normal">لا يوجد وصف مسجل للنشاط</span>}
                    </p>
                  ),
                })}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: 👤 بيانات صاحب النشاط والهوية الشخصية */}
        <div className="bg-[var(--bg-surface)]/70 rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggleSection('sec2')}
            className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-2 bg-[var(--bg-card)]/50 hover:bg-amber-500/5 transition-colors cursor-pointer text-right"
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
                2. بيانات صاحب النشاط والهوية الشخصية
              </span>
              <span className="text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-500/20">
                {formData.ownerName || 'بيانات الاتصال'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[var(--text-muted)] font-bold hidden sm:inline">
                {openSections.sec2 ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
              </span>
              <div
                className={`w-6 h-6 rounded-full bg-[var(--input-bg)] flex items-center justify-center text-amber-500 transition-transform duration-300 ${
                  openSections.sec2 ? 'rotate-180' : ''
                }`}
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          </button>

          {openSections.sec2 && (
            <div className="p-3 sm:p-4 border-t border-[var(--border-color)] space-y-2.5 animate-fade-in bg-[var(--bg-surface)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {renderInfoItem('ownerName', 'اسم صاحب النشاط', formData.ownerName, {
                  required: true,
                  icon: <User className="w-3.5 h-3.5 text-amber-500" />,
                })}

                {renderInfoItem('ownerPhone', 'رقم هاتف صاحب النشاط (واتساب)', formData.ownerPhone, {
                  required: true,
                  type: 'tel',
                  dir: 'ltr',
                  icon: <Phone className="w-3.5 h-3.5 text-emerald-500" />,
                  helperAction: formData.ownerPhone ? (
                    <a
                      href={`https://wa.me/2${formData.ownerPhone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                      title="مراسلة واتساب"
                    >
                      <MessageSquare className="w-3 h-3" />
                    </a>
                  ) : null,
                  displayFormat: (val) => (
                    <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-sm tracking-wider" dir="ltr">
                      {val || '—'}
                    </span>
                  ),
                })}

                {renderInfoItem('phone', 'هاتف المحل الرئيسي', formData.phone, {
                  type: 'tel',
                  dir: 'ltr',
                  icon: <Phone className="w-3.5 h-3.5 text-blue-500" />,
                  helperAction: formData.phone ? (
                    <a
                      href={`tel:${formData.phone}`}
                      className="p-1 rounded-lg bg-blue-500/15 text-blue-700 dark:text-blue-400 hover:bg-blue-500/30 transition-colors"
                      title="اتصال هاتفي"
                    >
                      <Phone className="w-3 h-3" />
                    </a>
                  ) : null,
                  displayFormat: (val) => (
                    <span className="font-mono font-bold tracking-wider" dir="ltr">
                      {val || <span className="text-[var(--text-muted)] italic font-normal text-xs">غير مسجل</span>}
                    </span>
                  ),
                })}

                {renderInfoItem('secondaryPhone', 'هاتف إضافي / أرضي', formData.secondaryPhone, {
                  type: 'tel',
                  dir: 'ltr',
                  icon: <Phone className="w-3.5 h-3.5 text-slate-400" />,
                  displayFormat: (val) => (
                    <span className="font-mono font-bold tracking-wider" dir="ltr">
                      {val || <span className="text-[var(--text-muted)] italic font-normal text-xs">لا يوجد هاتف إضافي</span>}
                    </span>
                  ),
                })}

                {renderInfoItem('nationalId', 'الرقم القومي لمالك المحل', formData.nationalId, {
                  dir: 'ltr',
                  placeholder: '2990101010xxxx',
                  icon: <CreditCard className="w-3.5 h-3.5 text-indigo-500" />,
                  displayFormat: (val) => (
                    <span className="font-mono font-bold text-xs text-[var(--text-secondary)]" dir="ltr">
                      {val || <span className="text-[var(--text-muted)] italic font-normal">لم يسجل الرقم القومي</span>}
                    </span>
                  ),
                })}

                {renderInfoItem('ownerEmail', 'البريد الإلكتروني', formData.ownerEmail, {
                  type: 'email',
                  dir: 'ltr',
                  placeholder: 'owner@example.com',
                  icon: <Mail className="w-3.5 h-3.5 text-rose-400" />,
                  displayFormat: (val) => (
                    <span className="font-mono font-bold text-xs text-[var(--text-secondary)]" dir="ltr">
                      {val || <span className="text-[var(--text-muted)] italic font-normal">لا يوجد بريد إلكتروني</span>}
                    </span>
                  ),
                })}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: 📍 العنوان الميداني وإحداثيات الموقع (GPS) */}
        <div className="bg-[var(--bg-surface)]/70 rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggleSection('sec3')}
            className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-2 bg-[var(--bg-card)]/50 hover:bg-amber-500/5 transition-colors cursor-pointer text-right"
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
                3. العنوان الميداني وإحداثيات الموقع (GPS)
              </span>
              <span className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
                {formData.governorate} - {formData.city}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[var(--text-muted)] font-bold hidden sm:inline">
                {openSections.sec3 ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
              </span>
              <div
                className={`w-6 h-6 rounded-full bg-[var(--input-bg)] flex items-center justify-center text-amber-500 transition-transform duration-300 ${
                  openSections.sec3 ? 'rotate-180' : ''
                }`}
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          </button>

          {openSections.sec3 && (
            <div className="p-3 sm:p-4 border-t border-[var(--border-color)] space-y-2.5 animate-fade-in bg-[var(--bg-surface)]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {renderInfoItem('governorate', 'المحافظة', formData.governorate, {
                  required: true,
                  type: 'select',
                  selectOptions: EGYPT_GOVERNORATES,
                  icon: <MapPin className="w-3.5 h-3.5 text-amber-500" />,
                  displayFormat: (val) => (
                    <span className="bg-amber-500/10 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded-lg border border-amber-500/20">
                      {val || '—'}
                    </span>
                  ),
                })}

                {renderInfoItem('city', 'المدينة / الحي', formData.city, {
                  required: true,
                  icon: <Building className="w-3.5 h-3.5 text-cyan-500" />,
                })}

                {renderInfoItem('street', 'الشارع الرئيسي', formData.street, {
                  required: true,
                  icon: <Navigation className="w-3.5 h-3.5 text-indigo-500" />,
                })}

                {renderInfoItem('landmark', 'علامة مميزة (أقرب مبنى أو ميدان)', formData.landmark, {
                  colSpan: 'sm:col-span-3',
                  placeholder: 'أقرب معلم أو ميدان معروف...',
                  icon: <Building className="w-3.5 h-3.5 text-amber-500" />,
                  displayFormat: (val) => (
                    <span className="font-bold text-[var(--text-secondary)]">
                      {val || <span className="text-[var(--text-muted)] italic font-normal">لا توجد علامة مميزة مسجلة</span>}
                    </span>
                  ),
                })}

                {renderInfoItem('lat', 'خط العرض (Lat)', formData.lat, {
                  type: 'number',
                  dir: 'ltr',
                  icon: <MapPin className="w-3.5 h-3.5 text-rose-500" />,
                  displayFormat: (val) => <span className="font-mono text-xs text-[var(--text-secondary)]">{val ?? '—'}</span>,
                })}

                {renderInfoItem('lng', 'خط الطول (Lng)', formData.lng, {
                  type: 'number',
                  dir: 'ltr',
                  icon: <MapPin className="w-3.5 h-3.5 text-emerald-500" />,
                  displayFormat: (val) => <span className="font-mono text-xs text-[var(--text-secondary)]">{val ?? '—'}</span>,
                })}

                {renderInfoItem('googleMapsUrl', 'رابط خريطة جوجل', formData.googleMapsUrl, {
                  type: 'url',
                  dir: 'ltr',
                  icon: <Globe className="w-3.5 h-3.5 text-blue-500" />,
                  displayFormat: (val) =>
                    val ? (
                      <a
                        href={String(val)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-mono truncate block max-w-[200px]"
                      >
                        {String(val)}
                      </a>
                    ) : (
                      <span className="text-[var(--text-muted)] italic font-normal text-xs">لا يوجد رابط مخصص</span>
                    ),
                })}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4: 💰 الباقة والمدفوعات وعروض الترقية */}
        <div className="bg-[var(--bg-surface)]/70 rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggleSection('sec4')}
            className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-2 bg-[var(--bg-card)]/50 hover:bg-amber-500/5 transition-colors cursor-pointer text-right"
          >
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
                4. الباقة والمدفوعات وحالة التوثيق
              </span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                {formData.packageName} ({formData.packagePrice} ج.م)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[var(--text-muted)] font-bold hidden sm:inline">
                {openSections.sec4 ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
              </span>
              <div
                className={`w-6 h-6 rounded-full bg-[var(--input-bg)] flex items-center justify-center text-amber-500 transition-transform duration-300 ${
                  openSections.sec4 ? 'rotate-180' : ''
                }`}
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          </button>

          {openSections.sec4 && (
            <div className="p-3 sm:p-4 border-t border-[var(--border-color)] space-y-3 animate-fade-in bg-[var(--bg-surface)]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Package display / edit */}
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-[var(--text-muted)] flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>الباقة المختارة</span>
                    </span>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setEditingField(editingField === 'packageId' ? null : 'packageId')}
                        className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 cursor-pointer"
                        title="تغيير الباقة"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {editingField === 'packageId' || editAllMode ? (
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
                        if (!editAllMode) setEditingField(null);
                      }}
                      className="w-full bg-[var(--input-bg)] border-2 border-amber-500 text-[var(--text-primary)] font-bold rounded-xl p-2 text-xs"
                    >
                      {PACKAGES.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.title} ({pkg.price} ج.م)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-[var(--text-primary)]">{formData.packageName}</span>
                      <span className="text-xs font-black font-mono text-amber-500">{formData.packagePrice} ج.م</span>
                    </div>
                  )}
                </div>

                {/* Paid Amount */}
                {renderInfoItem('amountPaid', 'المبلغ المحصل فعلياً', `${formData.amountPaid} ج.م`, {
                  type: 'number',
                  dir: 'ltr',
                  required: true,
                  icon: <DollarSign className="w-3.5 h-3.5 text-emerald-500" />,
                  displayFormat: () => (
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                        {formData.amountPaid} ج.م
                      </span>
                      {formData.packagePrice - formData.amountPaid > 0 && (
                        <span className="text-[10px] text-rose-500 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded">
                          متبقي: {formData.packagePrice - formData.amountPaid} ج.م
                        </span>
                      )}
                    </div>
                  ),
                })}

                {/* Payment Status */}
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-[var(--text-muted)] flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                      <span>حالة الدفع</span>
                    </span>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setEditingField(editingField === 'paymentStatus' ? null : 'paymentStatus')}
                        className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 cursor-pointer"
                        title="تعديل حالة السداد"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {editingField === 'paymentStatus' || editAllMode ? (
                    <select
                      value={formData.paymentStatus}
                      onChange={(e) => {
                        setFormData({ ...formData, paymentStatus: e.target.value as PaymentStatus });
                        if (!editAllMode) setEditingField(null);
                      }}
                      className="w-full bg-[var(--input-bg)] border-2 border-amber-500 text-[var(--text-primary)] font-bold rounded-xl p-2 text-xs"
                    >
                      <option value="fully_paid">مدفوع بالكامل</option>
                      <option value="partially_paid">مدفوع جزء منه</option>
                      <option value="unpaid">لم يدفع</option>
                    </select>
                  ) : (
                    <div>
                      {formData.paymentStatus === 'fully_paid' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg text-xs font-black">
                          <Check className="w-3 h-3" /> مدفوع بالكامل
                        </span>
                      ) : formData.paymentStatus === 'partially_paid' ? (
                        <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-lg text-xs font-black">
                          مدفوع جزء منه ({formData.amountPaid} ج.م)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 rounded-lg text-xs font-black">
                          لم يدفع بعد
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Verification status quick selector */}
                <div className="sm:col-span-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-3 sm:p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-[var(--text-muted)] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>تحديد حالة التوثيق على Google Maps</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          verificationStatus: 'pending',
                          googleSyncStatus: 'not_synced',
                        })
                      }
                      className={`text-xs font-black px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 ${
                        formData.verificationStatus === 'pending'
                          ? 'bg-rose-500 text-white border-rose-600 shadow-md scale-105'
                          : 'bg-[var(--input-bg)] text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10'
                      }`}
                    >
                      🚨 لم تُرفع للتوثيق
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          verificationStatus: 'in_progress',
                          googleSyncStatus: 'in_progress',
                        })
                      }
                      className={`text-xs font-black px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 ${
                        formData.verificationStatus === 'in_progress'
                          ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md scale-105'
                          : 'bg-[var(--input-bg)] text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10'
                      }`}
                    >
                      ⏳ أُرسلت لجوجل ماب
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          verificationStatus: 'verified',
                          googleSyncStatus: 'synced',
                        })
                      }
                      className={`text-xs font-black px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 ${
                        formData.verificationStatus === 'verified'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-md scale-105'
                          : 'bg-[var(--input-bg)] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10'
                      }`}
                    >
                      🟢 موثق ومعتمد رسمياً
                    </button>
                  </div>
                </div>

                {/* Field Rep Info (Readonly) */}
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-3 sm:p-3.5">
                  <span className="text-[11px] font-extrabold text-[var(--text-muted)] flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>المندوب المسجل</span>
                  </span>
                  <p className="font-bold text-xs text-[var(--text-primary)] mt-1">
                    {formData.repName} <span className="text-[10px] text-[var(--text-muted)]">({formData.repId})</span>
                  </p>
                </div>

                {/* Registration Date (Readonly) */}
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-3 sm:p-3.5">
                  <span className="text-[11px] font-extrabold text-[var(--text-muted)] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>وقت وتاريخ التسجيل الميداني</span>
                  </span>
                  <p className="font-bold text-xs text-[var(--text-primary)] mt-1 font-sans">
                    {formatActivityDateTime(formData.createdDate || formData.invoiceDate)}
                  </p>
                </div>

                {/* Rep Notes */}
                {renderInfoItem('notes', 'ملاحظات المندوب الميداني', formData.notes, {
                  type: 'textarea',
                  colSpan: 'sm:col-span-3',
                  placeholder: 'لا توجد ملاحظات إضافية',
                  icon: <FileText className="w-3.5 h-3.5 text-amber-500" />,
                  displayFormat: (val) => (
                    <span className="font-bold text-xs text-[var(--text-secondary)]">
                      {val || <span className="text-[var(--text-muted)] italic font-normal">لا توجد ملاحظات إضافية</span>}
                    </span>
                  ),
                })}
              </div>

              {/* Interactive Package Upgrades & Offers Dispatch */}
              <div className="mt-2 pt-3 border-t border-[var(--border-color)] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black text-amber-500">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>عروض الترقية والتطوير المتاحة لهذا النشاط</span>
                  </div>
                  <span className="text-[10px] bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full">
                    تفعيل مباشر
                  </span>
                </div>

                {upgradeNotice && (
                  <div className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 p-2.5 rounded-xl border border-emerald-500/30 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{upgradeNotice}</span>
                  </div>
                )}

                {/* Other Packages Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PACKAGES.filter((p) => p.id !== formData.packageId).map((pkg) => {
                    const diff = pkg.price - formData.packagePrice;
                    return (
                      <div
                        key={pkg.id}
                        className="bg-[var(--bg-card)] p-2.5 rounded-2xl border border-[var(--border-color)] flex flex-col justify-between space-y-1.5 hover:border-amber-500/40 transition-all shadow-sm"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <h5 className="font-extrabold text-xs text-[var(--text-primary)]">{pkg.title}</h5>
                            <span className="text-xs font-black text-amber-500 font-mono">{pkg.price} ج.م</span>
                          </div>
                          <p className="text-[10px] text-[var(--text-muted)] mt-0.5 line-clamp-2">{pkg.description}</p>
                          {diff > 0 && (
                            <span className="inline-block mt-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">
                              فرق السداد: +{diff} ج.م
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const newPrice = pkg.price;
                            const newPaid = formData.amountPaid;
                            const status: PaymentStatus =
                              newPaid >= newPrice ? 'fully_paid' : newPaid > 0 ? 'partially_paid' : 'unpaid';

                            setFormData({
                              ...formData,
                              packageId: pkg.id,
                              packageName: pkg.title,
                              packagePrice: newPrice,
                              paymentStatus: status,
                            });
                            setUpgradeNotice(`تم تفعيل وترقية الباقة إلى "${pkg.title}" بنجاح!`);
                            setTimeout(() => setUpgradeNotice(null), 4000);
                          }}
                          className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs py-1.5 px-2.5 rounded-xl shadow-sm flex items-center justify-center gap-1 transition-all cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>ترقية لهذه الباقة ⚡</span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* WhatsApp Pitch Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <a
                    href={getUpgradeOffersWhatsAppUrl(formData)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-2 px-3 rounded-xl shadow flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>إرسال تفاصيل الباقات للعميل (واتساب) 💬</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generateUpgradeOffersWhatsAppMessage(formData));
                      setCopiedOffers(true);
                      setTimeout(() => setCopiedOffers(false), 2500);
                    }}
                    className="w-full sm:w-auto bg-[var(--bg-card)] hover:bg-amber-500/20 text-[var(--text-primary)] font-bold text-xs py-2 px-3 rounded-xl border border-[var(--border-color)] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedOffers ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Gift className="w-3.5 h-3.5 text-amber-500" />}
                    <span>{copiedOffers ? 'تم نسخ النص!' : 'نسخ العروض'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 5: 📸 صور ومستندات النشاط */}
        <div className="bg-[var(--bg-surface)]/70 rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggleSection('sec5')}
            className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-2 bg-[var(--bg-card)]/50 hover:bg-amber-500/5 transition-colors cursor-pointer text-right"
          >
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
                5. صور ومستندات النشاط ({formData.photos?.length || 0})
              </span>
              <span className="text-[10px] bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold px-2 py-0.5 rounded-full border border-purple-500/20">
                {formData.photos?.length || 0} صور مرفوعة
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[var(--text-muted)] font-bold hidden sm:inline">
                {openSections.sec5 ? 'إخفاء الصور' : 'عرض الصور'}
              </span>
              <div
                className={`w-6 h-6 rounded-full bg-[var(--input-bg)] flex items-center justify-center text-amber-500 transition-transform duration-300 ${
                  openSections.sec5 ? 'rotate-180' : ''
                }`}
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          </button>

          {openSections.sec5 && (
            <div className="p-3 sm:p-4 border-t border-[var(--border-color)] space-y-3 animate-fade-in bg-[var(--bg-surface)]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-[var(--text-muted)] font-bold">
                  إجمالي الصور المرفوعة: <strong className="text-[var(--text-primary)]">{formData.photos?.length || 0}</strong>
                </span>

                <div className="flex items-center gap-2">
                  {formData.photos && formData.photos.length > 0 && (
                    <button
                      type="button"
                      onClick={() => downloadAllBusinessPhotos(formData.photos, formData.nameAr)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] px-2.5 py-1 rounded-xl cursor-pointer flex items-center gap-1 shadow-sm transition-transform active:scale-95"
                      title="تنزيل جميع صور النشاط لحفظها ورفعها على جوجل ماب"
                    >
                      <Download className="w-3 h-3" />
                      <span>تنزيل الكل 📦</span>
                    </button>
                  )}

                  {canEdit && (
                    <label className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] px-2.5 py-1 rounded-xl cursor-pointer flex items-center gap-1 shadow-sm transition-transform active:scale-95">
                      <UploadCloud className="w-3 h-3" />
                      <span>📸 إضافة صورة</span>
                      <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              {formData.photos && formData.photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
                          className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black shadow cursor-pointer transition-transform active:scale-95 z-10"
                          title="حذف الصورة"
                        >
                          ✕
                        </button>
                      )}

                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                        <button
                          type="button"
                          onClick={() => setSelectedPhotoPreview(photo)}
                          className="bg-white/20 hover:bg-white/40 text-white p-1 rounded-lg text-xs font-bold cursor-pointer"
                          title="معاينة وتكبير"
                        >
                          🔍
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadSinglePhoto(photo, `${formData.nameAr}-photo-${idx + 1}`)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white p-1 rounded-lg text-xs font-bold cursor-pointer"
                          title="تحميل الصورة للجهاز"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] text-xs text-[var(--text-muted)] font-bold">
                  لم يتم إرفاق صور واجهة النشاط لهذا التسجيل بعد.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions Bottom Bar */}
        <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-color)] sticky bottom-0 bg-[var(--bg-surface)] z-20">
          <button
            type="button"
            onClick={onClose}
            className="bg-[var(--input-bg)] hover:bg-slate-200 dark:hover:bg-slate-800 text-[var(--text-secondary)] font-bold px-4 py-2 rounded-xl border border-[var(--border-color)] cursor-pointer"
          >
            إغلاق
          </button>
          {canEdit && (
            <button
              type="submit"
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black px-5 py-2 rounded-xl shadow-lg cursor-pointer flex items-center gap-1.5 transition-transform active:scale-95"
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
              className="max-w-full max-h-[75vh] object-contain rounded-2xl border-2 border-amber-500 shadow-2xl"
            />
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => downloadSinglePhoto(selectedPhotoPreview, `${formData.nameAr}-photo-full`)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-4 rounded-xl inline-flex items-center gap-1.5 shadow-lg cursor-pointer transition-transform active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>تحميل هذه الصورة بجودة عالية للرفع على جوجل</span>
              </button>
            </div>
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
