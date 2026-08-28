import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Business, VerificationStatus, PaymentStatus } from '../types';
import { EGYPT_GOVERNORATES, PACKAGES, BUSINESS_CATEGORIES, CATEGORY_GROUPS, getGroupFromCategory } from '../data/mockData';
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
  AlertTriangle,
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
import { getBusinessPaymentLabel } from '../utils/commission';

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
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const isAdminOrFinancial = userRole === 'admin' || userRole === 'supervisor' || userRole === 'accountant';
  const [formData, setFormData] = useState<Business | null>(null);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [enableWatermark, setEnableWatermark] = useState<boolean>(true);
  const [watermarkPosition, setWatermarkPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showMapsSyncModal, setShowMapsSyncModal] = useState<boolean>(false);
  const [copiedOffers, setCopiedOffers] = useState<boolean>(false);
  const [upgradeNotice, setUpgradeNotice] = useState<string | null>(null);

  // Per-field inline editing state
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editAllMode, setEditAllMode] = useState<boolean>(false);

  // Tab-based navigation — must be declared before early return (Rules of Hooks)
  const [activeSection, setActiveSection] = useState<'info' | 'owner' | 'location' | 'payment' | 'photos'>('info');

  // Keep internal formData in sync when parent business prop changes
  useEffect(() => {
    if (business) {
      setFormData({ ...business });
    }
  }, [business]);

  if (!business || !formData) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const hasNameAr = Boolean(formData.nameAr && formData.nameAr.trim());
    const hasNameEn = Boolean(formData.nameEn && formData.nameEn.trim());

    if (!hasNameAr && !hasNameEn) {
      setErrorMsg('يرجى إدخال اسم النشاط (بالعربية أو بالإنجليزية على الأقل)');
      return;
    }

    const updatedFormData: Business = {
      ...formData,
      nameAr: (formData.nameAr && formData.nameAr.trim()) || (formData.nameEn && formData.nameEn.trim()) || '',
      nameEn: formData.nameEn?.trim() || undefined,
    };

    onSave(updatedFormData);
    onClose();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsUploading(true);
      const newCompressed: string[] = [];
      for (let i = 0; i < files.length; i++) {
        try {
          const compressed = await compressImageFile(files[i], 1200, 1200, 0.8, {
            applyWatermark: enableWatermark,
            position: watermarkPosition,
          });
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
                fieldKey === 'category' ? (
                  <div className="space-y-2 p-1 bg-[var(--bg-card)] rounded-xl border border-amber-500/30">
                    <div>
                      <label className="block text-[10px] text-[var(--text-muted)] font-bold mb-1">
                        1. القسم / النشاط الرئيسي:
                      </label>
                      <select
                        value={getGroupFromCategory(formData.category)?.group || CATEGORY_GROUPS[0].group}
                        onChange={(e) => {
                          const grp = CATEGORY_GROUPS.find((g) => g.group === e.target.value);
                          if (grp && grp.items.length > 0) {
                            setFormData({ ...formData, category: grp.items[0] });
                          }
                        }}
                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2 text-xs focus:outline-none focus:border-amber-500 shadow-inner cursor-pointer"
                      >
                        {CATEGORY_GROUPS.map((g) => (
                          <option key={g.group} value={g.group}>
                            {g.icon} {g.group}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-amber-600 dark:text-amber-400 font-black mb-1">
                        2. التخصص / التصنيف الداخلي:
                      </label>
                      <select
                        value={formData.category || ''}
                        onChange={(e) => {
                          setFormData({ ...formData, category: e.target.value });
                          if (!editAllMode) setEditingField(null);
                        }}
                        autoFocus={editingField === fieldKey}
                        className="w-full bg-[var(--input-bg)] border-2 border-amber-500 text-amber-700 dark:text-amber-300 font-black rounded-xl p-2 text-xs focus:outline-none shadow-inner cursor-pointer"
                      >
                        {(getGroupFromCategory(formData.category) || CATEGORY_GROUPS[0]).items.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
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
                )
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

  const remainingDebt = Math.max(0, (formData.packagePrice || 0) - (formData.amountPaid || 0));

  interface TabItem {
    key: 'info' | 'owner' | 'location' | 'payment' | 'photos';
    label: string;
    icon: React.ReactNode;
    count?: number;
  }

  const TABS: TabItem[] = [
    { key: 'info', label: 'النشاط', icon: <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> },
    { key: 'owner', label: 'المالك', icon: <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> },
    { key: 'location', label: 'الموقع', icon: <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> },
    { key: 'payment', label: 'الدفع', icon: <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> },
    { key: 'photos', label: 'الصور', icon: <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />, count: formData.photos?.length || 0 },
  ];

  const verificationBadge = formData.verificationStatus === 'verified' || formData.googleSyncStatus === 'synced'
    ? { label: 'موثق رسمياً ✓', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' }
    : formData.verificationStatus === 'in_progress'
    ? { label: 'قيد التوثيق', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' }
    : { label: 'غير موثق بعد', cls: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };

  const paymentBadge = formData.paymentStatus === 'fully_paid'
    ? { label: `مدفوع ${formData.amountPaid} ج`, cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' }
    : formData.paymentStatus === 'partially_paid'
    ? { label: `متبقي ${remainingDebt} ج`, cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' }
    : { label: 'غير مسدد', cls: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-t-3xl sm:rounded-3xl w-full max-w-3xl shadow-2xl flex flex-col overflow-hidden max-h-[95vh] sm:max-h-[88vh]"
      >

        {/* ── HEADER ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-2 px-3.5 sm:px-5 py-2.5 sm:py-3.5 border-b border-[var(--border-color)] shrink-0 bg-[var(--bg-card)]/40">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
              <Store className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-black text-xs sm:text-sm text-[var(--text-primary)] truncate">
                {formData.nameAr || formData.nameEn || 'تفاصيل النشاط'}
              </h3>
              <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap mt-0.5">
                <span className="text-[9px] sm:text-[10px] font-mono text-[var(--text-muted)]">{formData.invoiceNumber}</span>
                <span className={`text-[8.5px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.2 rounded-full border ${verificationBadge.cls}`}>{verificationBadge.label}</span>
                <span className={`text-[8.5px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.2 rounded-full border ${paymentBadge.cls}`}>{paymentBadge.label}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Direct Collection Button if debt exists (Visible on Mobile & Desktop) */}
            {canEdit && remainingDebt > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (onCollectPayment) {
                    onCollectPayment(formData);
                  } else {
                    setActiveSection('payment');
                  }
                }}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1 shrink-0"
                title="تحصيل المبلغ المتبقي فوراً"
              >
                <DollarSign className="w-3 h-3" />
                <span>تحصيل ({remainingDebt} ج)</span>
              </button>
            )}

            {/* Quick action buttons — admin only */}
            {onShowInvoice && (
              <button type="button" onClick={() => onShowInvoice(formData)}
                className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)] hover:border-amber-500/50 text-[var(--text-secondary)] hover:text-amber-500 transition-colors cursor-pointer"
                title="الفاتورة">
                <FileText className="w-3.5 h-3.5" /> فاتورة
              </button>
            )}
            {isAdminOrFinancial && (
              <button type="button" onClick={() => setShowMapsSyncModal(true)}
                className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors cursor-pointer"
                title="مزامنة جوجل">
                <CloudUpload className="w-3.5 h-3.5" /> جوجل
              </button>
            )}
            <button type="button" onClick={onClose}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[var(--input-bg)] hover:bg-rose-500/15 border border-[var(--border-color)] text-[var(--text-muted)] hover:text-rose-500 flex items-center justify-center transition-colors cursor-pointer shrink-0">
              <span className="text-xs sm:text-sm font-black">✕</span>
            </button>
          </div>
        </div>

        {/* ── TAB NAV (All 5 options visible at once in balanced grid) ── */}
        <div className="grid grid-cols-5 gap-0.5 sm:gap-1 px-1 sm:px-4 pt-1 pb-0 border-b border-[var(--border-color)] bg-[var(--bg-card)]/40 shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveSection(tab.key)}
              className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1.5 sm:py-2 px-0.5 sm:px-1 text-[10px] sm:text-xs font-bold border-b-2 transition-all cursor-pointer rounded-t-xl ${
                activeSection === tab.key
                  ? 'border-amber-500 text-amber-500 bg-amber-500/10 shadow-xs font-black'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)]'
              }`}
            >
              <span className={activeSection === tab.key ? 'text-amber-500' : 'text-[var(--text-muted)]'}>{tab.icon}</span>
              <span className="truncate">{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`text-[8px] sm:text-[9px] font-black px-1 py-0.2 rounded-full ${
                  activeSection === tab.key ? 'bg-amber-500 text-slate-950' : 'bg-[var(--input-bg)] text-[var(--text-muted)]'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── BODY ─────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-3.5 sm:px-6 py-4 space-y-4 pb-8 sm:pb-6">

          {!canEdit && (
            <div className="flex items-center gap-2.5 p-3 bg-amber-500/8 border border-amber-500/25 rounded-xl text-xs text-amber-700 dark:text-amber-300 font-bold">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>وضع القراءة فقط — تعديل هذا النشاط متاح للمندوب المسجل أو مدير النظام فقط.</span>
            </div>
          )}

          {/* Urgent Warning if Verified but Unpaid */}
          {(formData.verificationStatus === 'verified' || formData.googleSyncStatus === 'synced') && (formData.amountPaid || 0) === 0 && (
            <div className="flex items-center justify-between gap-3 p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-xs font-black text-rose-700 dark:text-rose-300 animate-pulse">
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="truncate">⚠️ تنبيه مالي: تم توثيق هذا النشاط رسمياً ولم يتم تسديد الباقة ({formData.packagePrice || 250} ج.م)!</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (onCollectPayment) {
                    onCollectPayment(formData);
                  } else {
                    setActiveSection('payment');
                  }
                }}
                className="bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black px-3 py-1.5 rounded-lg shrink-0 cursor-pointer"
              >
                تسجيل السداد 💰
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2.5 p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />{errorMsg}
            </div>
          )}

          {/* ── TAB 1: النشاط ──────────────────────────────── */}
          {activeSection === 'info' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {renderInfoItem('nameAr', 'اسم النشاط (عربي)', formData.nameAr, {
                  icon: <Store className="w-3.5 h-3.5 text-amber-500" />,
                  required: true,
                  placeholder: 'اسم النشاط باللغة العربية',
                  displayFormat: (v) => <span className="text-sm font-black text-amber-600 dark:text-amber-400">{v || '—'}</span>,
                })}
                {renderInfoItem('nameEn', 'اسم النشاط (English)', formData.nameEn, {
                  dir: 'ltr', icon: <Globe className="w-3.5 h-3.5 text-blue-500" />, placeholder: 'English name',
                })}
                {renderInfoItem('category', 'التصنيف والفئة', formData.category, {
                  type: 'select', selectOptions: BUSINESS_CATEGORIES, icon: <Tag className="w-3.5 h-3.5 text-emerald-500" />,
                  displayFormat: (v) => {
                    const grp = getGroupFromCategory(v);
                    return (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {grp && (
                          <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md font-bold text-[10.5px] border border-amber-500/20">
                            {grp.icon} {grp.group}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-lg font-black text-xs border border-emerald-500/20">
                          {v || 'عام'}
                        </span>
                      </div>
                    );
                  },
                })}
                {renderInfoItem('workingHours', 'ساعات العمل', formData.workingHours, {
                  icon: <Clock className="w-3.5 h-3.5 text-amber-500" />, placeholder: 'يومياً من 9 ص حتى 11 م',
                })}
                {renderInfoItem('description', 'وصف الخدمات', formData.description, {
                  type: 'textarea', colSpan: 'sm:col-span-2', icon: <FileText className="w-3.5 h-3.5 text-purple-500" />,
                  placeholder: 'تفاصيل الخدمات التي يقدمها النشاط...',
                  displayFormat: (v) => <p className="text-xs font-bold text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{v || <span className="text-[var(--text-muted)] italic font-normal">لا يوجد وصف</span>}</p>,
                })}
              </div>
            </div>
          )}

          {/* ── TAB 2: صاحب المحل ─────────────────────────── */}
          {activeSection === 'owner' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {renderInfoItem('ownerName', 'اسم صاحب النشاط', formData.ownerName, {
                required: true, icon: <User className="w-3.5 h-3.5 text-amber-500" />,
              })}
              {renderInfoItem('ownerPhone', 'هاتف المالك (واتساب)', formData.ownerPhone, {
                required: true, type: 'tel', dir: 'ltr', icon: <Phone className="w-3.5 h-3.5 text-emerald-500" />,
                helperAction: formData.ownerPhone ? (
                  <a href={`https://wa.me/2${formData.ownerPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                    className="p-1 rounded-lg bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/30 transition-colors" title="واتساب">
                    <MessageSquare className="w-3 h-3" />
                  </a>
                ) : null,
                displayFormat: (v) => <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-sm tracking-wider" dir="ltr">{v || '—'}</span>,
              })}
              {renderInfoItem('phone', 'هاتف المحل', formData.phone, {
                type: 'tel', dir: 'ltr', icon: <Phone className="w-3.5 h-3.5 text-blue-500" />,
                helperAction: formData.phone ? (
                  <a href={`tel:${formData.phone}`} className="p-1 rounded-lg bg-blue-500/15 text-blue-600 hover:bg-blue-500/30 transition-colors" title="اتصال">
                    <Phone className="w-3 h-3" />
                  </a>
                ) : null,
                displayFormat: (v) => <span className="font-mono font-bold tracking-wider" dir="ltr">{v || <span className="text-[var(--text-muted)] italic font-normal text-xs">غير مسجل</span>}</span>,
              })}
              {renderInfoItem('secondaryPhone', 'هاتف إضافي', formData.secondaryPhone, {
                type: 'tel', dir: 'ltr', icon: <Phone className="w-3.5 h-3.5 text-slate-400" />,
                displayFormat: (v) => <span className="font-mono font-bold tracking-wider" dir="ltr">{v || <span className="text-[var(--text-muted)] italic font-normal text-xs">لا يوجد</span>}</span>,
              })}
              {renderInfoItem('nationalId', 'الرقم القومي', formData.nationalId, {
                dir: 'ltr', placeholder: '14 رقم', icon: <CreditCard className="w-3.5 h-3.5 text-indigo-500" />,
                displayFormat: (v) => <span className="font-mono font-bold text-xs text-[var(--text-secondary)]" dir="ltr">{v || <span className="text-[var(--text-muted)] italic font-normal">لم يسجل</span>}</span>,
              })}
              {renderInfoItem('ownerEmail', 'البريد الإلكتروني', formData.ownerEmail, {
                type: 'email', dir: 'ltr', placeholder: 'owner@example.com', icon: <Mail className="w-3.5 h-3.5 text-rose-400" />,
                displayFormat: (v) => <span className="font-mono font-bold text-xs text-[var(--text-secondary)]" dir="ltr">{v || <span className="text-[var(--text-muted)] italic font-normal">لا يوجد</span>}</span>,
              })}
            </div>
          )}

          {/* ── TAB 3: الموقع ─────────────────────────────── */}
          {activeSection === 'location' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {renderInfoItem('governorate', 'المحافظة', formData.governorate, {
                  required: true, type: 'select', selectOptions: EGYPT_GOVERNORATES, icon: <MapPin className="w-3.5 h-3.5 text-amber-500" />,
                  displayFormat: (v) => <span className="bg-amber-500/10 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded-lg border border-amber-500/20">{v || '—'}</span>,
                })}
                {renderInfoItem('city', 'المدينة / الحي', formData.city, {
                  required: true, icon: <Building className="w-3.5 h-3.5 text-cyan-500" />,
                })}
                {renderInfoItem('street', 'الشارع', formData.street, {
                  required: true, icon: <Navigation className="w-3.5 h-3.5 text-indigo-500" />,
                })}
                {renderInfoItem('landmark', 'علامة مميزة', formData.landmark, {
                  colSpan: 'sm:col-span-3', icon: <Building className="w-3.5 h-3.5 text-amber-500" />, placeholder: 'أقرب معلم...',
                  displayFormat: (v) => <span className="font-bold text-[var(--text-secondary)]">{v || <span className="text-[var(--text-muted)] italic font-normal">لا توجد علامة</span>}</span>,
                })}
                {renderInfoItem('lat', 'خط العرض', formData.lat, {
                  type: 'number', dir: 'ltr', icon: <MapPin className="w-3.5 h-3.5 text-rose-500" />,
                  displayFormat: (v) => <span className="font-mono text-xs text-[var(--text-secondary)]">{v ?? '—'}</span>,
                })}
                {renderInfoItem('lng', 'خط الطول', formData.lng, {
                  type: 'number', dir: 'ltr', icon: <MapPin className="w-3.5 h-3.5 text-emerald-500" />,
                  displayFormat: (v) => <span className="font-mono text-xs text-[var(--text-secondary)]">{v ?? '—'}</span>,
                })}
              </div>

              {/* Google Maps URL */}
              <div className="bg-[var(--bg-card)] border border-blue-500/25 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-black text-[var(--text-primary)]">رابط خرائط جوجل المباشر</span>
                  </div>
                  {formData.googleMapsUrl && (
                    <a href={formData.googleMapsUrl} target="_blank" rel="noopener noreferrer"
                      className="text-[10px] font-bold text-blue-500 hover:underline flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> فتح
                    </a>
                  )}
                </div>
                <div className="relative">
                  <input type="url" dir="ltr" placeholder="https://maps.app.goo.gl/..."
                    value={formData.googleMapsUrl || ''}
                    onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })}
                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-mono text-xs rounded-lg p-2.5 pr-9 focus:outline-none focus:border-blue-500 shadow-xs"
                  />
                  <Globe className="w-3.5 h-3.5 text-blue-500 absolute right-2.5 top-3" />
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 4: الدفع والتوثيق ─────────────────────── */}
          {activeSection === 'payment' && (
            <div className="space-y-4">

              {/* Package Card */}
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="font-black text-sm text-[var(--text-primary)]">الباقة المختارة</span>
                  </div>
                  {canEdit && (
                    <button type="button" onClick={() => setEditingField(editingField === 'packageId' ? null : 'packageId')}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer flex items-center gap-1">
                      <Pencil className="w-3 h-3" /> تغيير
                    </button>
                  )}
                </div>

                {editingField === 'packageId' || editAllMode ? (
                  <select value={formData.packageId}
                    onChange={(e) => {
                      const p = PACKAGES.find((p) => p.id === e.target.value);
                      if (p) setFormData({ ...formData, packageId: p.id, packageName: p.title, packagePrice: p.price });
                      if (!editAllMode) setEditingField(null);
                    }}
                    className="w-full bg-[var(--input-bg)] border-2 border-amber-500 text-[var(--text-primary)] font-bold rounded-xl p-2 text-xs">
                    {PACKAGES.map((p) => <option key={p.id} value={p.id}>{p.title} — {p.price} ج.م</option>)}
                  </select>
                ) : (
                  <div className="flex items-center justify-between bg-amber-500/8 border border-amber-500/25 rounded-lg px-3.5 py-2.5">
                    <span className="font-black text-amber-600 dark:text-amber-400">{formData.packageName}</span>
                    <span className="font-black font-mono text-sm text-amber-500">{formData.packagePrice} ج.م</span>
                  </div>
                )}
              </div>

              {/* Payment Status */}
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-500" />
                    <span className="font-black text-sm text-[var(--text-primary)]">حالة السداد</span>
                  </div>
                  {canEdit && isAdminOrFinancial && (
                    <button type="button" onClick={() => setEditingField(editingField === 'paymentStatus' ? null : 'paymentStatus')}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer flex items-center gap-1">
                      <Pencil className="w-3 h-3" /> تعديل
                    </button>
                  )}
                </div>

                {isAdminOrFinancial && (editingField === 'paymentStatus' || editAllMode) ? (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-1">حالة السداد:</label>
                      <select value={formData.paymentStatus}
                        onChange={(e) => {
                          const s = e.target.value as PaymentStatus;
                          const price = formData.packagePrice || 250;
                          let paid = formData.amountPaid || 0;
                          let cash = formData.cashCollectedByRep || 0;
                          let method = formData.paymentMethod || 'platform_collected';
                          if (s === 'fully_paid') {
                            paid = price;
                            if (method === 'cash_by_rep') cash = paid;
                            else cash = 0;
                          } else if (s === 'unpaid') { paid = 0; cash = 0; }
                          setFormData({ ...formData, paymentStatus: s, amountPaid: paid, cashCollectedByRep: cash, paymentMethod: method });
                        }}
                        className="w-full bg-[var(--input-bg)] border-2 border-amber-500 text-[var(--text-primary)] font-bold rounded-xl p-2 text-xs">
                        <option value="fully_paid">مدفوع بالكامل (تم السداد)</option>
                        <option value="partially_paid">مدفوع جزء منه</option>
                        <option value="unpaid">لم يدفع (آجل لاحقاً)</option>
                      </select>
                    </div>

                    {formData.paymentStatus !== 'unpaid' && (
                      <div>
                        <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-1">طريقة ومكان الاستلام:</label>
                        <select
                          value={formData.paymentMethod || 'platform_collected'}
                          onChange={(e) => {
                            const method = e.target.value as Business['paymentMethod'];
                            const cash = method === 'cash_by_rep' ? (formData.amountPaid || formData.packagePrice || 250) : 0;
                            setFormData({ ...formData, paymentMethod: method, cashCollectedByRep: cash });
                          }}
                          className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2 text-xs"
                        >
                          <option value="platform_collected">💳 سداد للمنصة مباشرة (إلكتروني / إنستاباي / فودافون كاش)</option>
                          <option value="cash_by_rep">💵 كاش نقداً استلمه المندوب بيده في الميدان</option>
                          <option value="gateway_online">🌐 دفع إلكتروني عبر البوابة البنكية</option>
                          <option value="bank_transfer">🏦 تحويل بنكي رسمي</option>
                        </select>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formData.paymentStatus === 'fully_paid' ? (
                      <div>
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 rounded-lg text-xs font-black">
                          <Check className="w-3.5 h-3.5" /> مدفوع بالكامل — {formData.amountPaid} ج.م
                        </span>
                        <p className="text-[10px] text-[var(--text-muted)] font-bold mt-1 flex items-center gap-1">
                          <span>{formData.paymentMethod === 'cash_by_rep' ? '💵 كاش استلمه المندوب بيده' : '💳 تم السداد للمنصة مباشرة (عمولة المندوب أرباح متاحة)'}</span>
                        </p>
                      </div>
                    ) : formData.paymentStatus === 'partially_paid' ? (
                      <div>
                        <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/25 px-3 py-1 rounded-lg text-xs font-black">
                          مدفوع جزء — {formData.amountPaid} ج.م • متبقي {remainingDebt} ج
                        </span>
                        {!isAdminOrFinancial && <p className="text-[10px] text-amber-600 font-bold mt-1">🔒 تحصيل الباقي عبر الإدارة فقط</p>}
                      </div>
                    ) : (
                      <div>
                        <span className="inline-flex items-center gap-1.5 text-rose-700 dark:text-rose-400 bg-rose-500/10 border border-rose-500/25 px-3 py-1 rounded-lg text-xs font-black">
                          لم يدفع بعد — آجل لاحقاً
                        </span>
                        {!isAdminOrFinancial && <p className="text-[10px] text-amber-600 font-bold mt-1">🔒 التحصيل حصرياً عبر الحسابات الإدارية</p>}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Verification Status */}
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span className="font-black text-sm text-[var(--text-primary)]">حالة التوثيق على Google Maps</span>
                  </div>
                  {!isAdminOrFinancial && <span className="text-[10px] text-[var(--text-muted)] font-bold">🔒 إدارة فقط</span>}
                </div>

                {isAdminOrFinancial ? (
                  <div className="flex flex-wrap gap-2">
                    {([
                      { v: 'pending', gs: 'not_synced', label: '🚨 لم تُرفع', cls: 'rose' },
                      { v: 'in_progress', gs: 'in_progress', label: '⏳ قيد التوثيق', cls: 'amber' },
                      { v: 'verified', gs: 'synced', label: '🟢 موثق رسمياً', cls: 'emerald' },
                    ] as const).map(({ v, gs, label, cls }) => (
                      <button key={v} type="button"
                        onClick={() => setFormData({ ...formData, verificationStatus: v as VerificationStatus, googleSyncStatus: gs as any })}
                        className={`text-xs font-black px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
                          formData.verificationStatus === v
                            ? cls === 'rose' ? 'bg-rose-500 text-white border-rose-600 shadow-md'
                              : cls === 'amber' ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md'
                              : 'bg-emerald-600 text-white border-emerald-700 shadow-md'
                            : 'bg-[var(--input-bg)] text-[var(--text-muted)] border-[var(--border-color)] hover:border-amber-500/40'
                        }`}>{label}</button>
                    ))}
                  </div>
                ) : (
                  <div>
                    {formData.verificationStatus === 'verified' || formData.googleSyncStatus === 'synced' ? (
                      <span className="badge-success inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black"><Check className="w-3.5 h-3.5" /> موثق ومعتمد رسمياً</span>
                    ) : formData.verificationStatus === 'in_progress' ? (
                      <span className="badge-warning inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black">⏳ قيد المراجعة</span>
                    ) : (
                      <span className="badge-danger inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black">🚨 لم تُرفع بعد</span>
                    )}
                  </div>
                )}
              </div>

              {/* Meta info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3.5">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] flex items-center gap-1.5 mb-1"><User className="w-3 h-3" /> المندوب المسجل</span>
                  <p className="font-black text-xs text-[var(--text-primary)]">{formData.repName} <span className="text-[9px] text-[var(--text-muted)] font-normal">({formData.repId})</span></p>
                </div>
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3.5">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] flex items-center gap-1.5 mb-1"><Calendar className="w-3 h-3" /> تاريخ التسجيل</span>
                  <p className="font-black text-xs text-[var(--text-primary)]">{formatActivityDateTime(formData.createdDate || formData.invoiceDate)}</p>
                </div>
              </div>

              {renderInfoItem('notes', 'ملاحظات المندوب', formData.notes, {
                type: 'textarea', icon: <FileText className="w-3.5 h-3.5 text-amber-500" />, placeholder: 'لا توجد ملاحظات',
                displayFormat: (v) => <span className="font-bold text-xs text-[var(--text-secondary)]">{v || <span className="text-[var(--text-muted)] italic font-normal">لا توجد ملاحظات</span>}</span>,
              })}

              {/* Package Upgrades — Admin/Financial only */}
              {isAdminOrFinancial && (
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center gap-2 text-xs font-black text-amber-500">
                  <Zap className="w-3.5 h-3.5" />
                  <span>عروض ترقية الباقة</span>
                </div>
                {upgradeNotice && (
                  <div className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 p-2.5 rounded-xl border border-emerald-500/25 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />{upgradeNotice}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PACKAGES.filter((p) => p.id !== formData.packageId).map((pkg) => {
                    const diff = pkg.price - formData.packagePrice;
                    return (
                      <div key={pkg.id} className="bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border-color)] flex flex-col justify-between gap-2 hover:border-amber-500/40 transition-all">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-black text-xs text-[var(--text-primary)]">{pkg.title}</span>
                            <span className="text-xs font-black text-amber-500 font-mono">{pkg.price} ج.م</span>
                          </div>
                          <p className="text-[10px] text-[var(--text-muted)] mt-0.5 line-clamp-2">{pkg.description}</p>
                          {diff > 0 && <span className="inline-block mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">فرق: +{diff} ج.م</span>}
                        </div>
                        <button type="button"
                          onClick={() => {
                            const s: PaymentStatus = formData.amountPaid >= pkg.price ? 'fully_paid' : formData.amountPaid > 0 ? 'partially_paid' : 'unpaid';
                            setFormData({ ...formData, packageId: pkg.id, packageName: pkg.title, packagePrice: pkg.price, paymentStatus: s });
                            setUpgradeNotice(`تم الترقية إلى "${pkg.title}" ✓`);
                            setTimeout(() => setUpgradeNotice(null), 4000);
                          }}
                          className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer">
                          <Zap className="w-3 h-3" /> ترقية ⚡
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <a href={getUpgradeOffersWhatsAppUrl(formData)} target="_blank" rel="noopener noreferrer"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                    <MessageSquare className="w-3.5 h-3.5" /> إرسال العروض للعميل (واتساب)
                  </a>
                  <button type="button" onClick={() => { navigator.clipboard.writeText(generateUpgradeOffersWhatsAppMessage(formData)); setCopiedOffers(true); setTimeout(() => setCopiedOffers(false), 2500); }}
                    className="bg-[var(--bg-card)] hover:bg-amber-500/10 text-[var(--text-primary)] font-bold text-xs py-2 px-3 rounded-xl border border-[var(--border-color)] flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                    {copiedOffers ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Gift className="w-3.5 h-3.5 text-amber-500" />}
                    {copiedOffers ? 'تم النسخ!' : 'نسخ العروض'}
                  </button>
                </div>
              </div>
              )}
            </div>
          )}

          {/* ── TAB 5: الصور ──────────────────────────────── */}
          {activeSection === 'photos' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-muted)]">{formData.photos?.length || 0} صورة مرفوعة</span>
                <div className="flex items-center gap-2">
                  {formData.photos && formData.photos.length > 0 && (
                    <button type="button" onClick={() => downloadAllBusinessPhotos(formData.photos, formData.nameAr)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors">
                      <Download className="w-3.5 h-3.5" /> تنزيل الكل
                    </button>
                  )}
                  {canEdit && (
                    <label className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors">
                      <UploadCloud className="w-3.5 h-3.5" /> إضافة صور
                      <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              {canEdit && (
                <div className="bg-[var(--input-bg)] border border-amber-500/20 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[11px] font-black text-[var(--text-primary)]">ختم دليلك على الصور</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${enableWatermark ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/25' : 'bg-slate-500/15 text-slate-400'}`}>{enableWatermark ? 'مفعل' : 'معطل'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {enableWatermark && (
                      <div className="flex items-center bg-[var(--bg-card)] rounded-lg p-0.5 border border-[var(--border-color)] text-[10px] font-bold">
                        <button type="button" onClick={() => setWatermarkPosition('bottom-right')} className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${watermarkPosition === 'bottom-right' ? 'bg-amber-500 text-slate-950' : 'text-[var(--text-muted)]'}`}>يمين</button>
                        <button type="button" onClick={() => setWatermarkPosition('bottom-left')} className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${watermarkPosition === 'bottom-left' ? 'bg-amber-500 text-slate-950' : 'text-[var(--text-muted)]'}`}>يسار</button>
                      </div>
                    )}
                    <button type="button" onClick={() => setEnableWatermark(!enableWatermark)}
                      className={`text-[10px] font-black px-2 py-1 rounded-lg border transition-all cursor-pointer ${enableWatermark ? 'bg-amber-500/15 text-amber-600 border-amber-500/30' : 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                      {enableWatermark ? 'تعطيل' : 'تفعيل'}
                    </button>
                  </div>
                </div>
              )}

              {isUploading && (
                <div className="text-center py-4 text-xs text-[var(--text-muted)] font-bold animate-pulse">⏳ جاري رفع ومعالجة الصور...</div>
              )}

              {formData.photos && formData.photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {formData.photos.map((photo, idx) => (
                    <div key={`photo_${idx}`} className="relative group rounded-xl overflow-hidden border border-[var(--border-color)] bg-[var(--input-bg)] aspect-video shadow-sm">
                      <img src={photo} alt={`صورة ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform cursor-pointer" onClick={() => setSelectedPhotoPreview(photo)} />
                      {canEdit && (
                        <button type="button" onClick={() => handleRemovePhoto(idx)}
                          className="absolute top-1.5 right-1.5 bg-rose-600 hover:bg-rose-700 text-white w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] shadow cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity z-10">✕</button>
                      )}
                      <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                        <button type="button" onClick={() => setSelectedPhotoPreview(photo)} className="bg-white/20 hover:bg-white/40 text-white p-1.5 rounded-lg cursor-pointer" title="معاينة">🔍</button>
                        <button type="button" onClick={() => downloadSinglePhoto(photo, `${formData.nameAr}-${idx + 1}`)} className="bg-emerald-600 hover:bg-emerald-500 text-white p-1.5 rounded-lg cursor-pointer" title="تحميل"><Download className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] border-dashed text-xs text-[var(--text-muted)] font-bold space-y-2">
                  <ImageIcon className="w-8 h-8 mx-auto text-[var(--text-muted)] opacity-40" />
                  <p>لم يتم إرفاق صور لهذا النشاط بعد</p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* ── FOOTER ACTIONS ──────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 px-3.5 sm:px-6 py-3 border-t border-[var(--border-color)] bg-[var(--bg-surface)] shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {onDeleteBusiness && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`هل أنت متأكد من حذف نشاط "${formData.nameAr || formData.nameEn}" نهائياً من المنظومة؟`)) {
                    onDeleteBusiness(formData.id);
                    onClose();
                  }
                }}
                className="text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer flex items-center gap-1 shadow-xs shrink-0"
                title="حذف النشاط"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف النشاط</span>
              </button>
            )}
            {canEdit && (
              <button
                type="button"
                onClick={() => setEditAllMode(!editAllMode)}
                className={`text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                  editAllMode
                    ? 'bg-amber-500 text-slate-950 border-amber-600'
                    : 'bg-[var(--input-bg)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-amber-500/40'
                }`}
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>{editAllMode ? 'إنهاء التعديل' : 'تعديل الكل'}</span>
              </button>
            )}
            {(formData.googleMapsUrl || (formData.lat && formData.lng)) && (
              <a
                href={formData.googleMapsUrl || `https://www.google.com/maps/?q=${formData.lat},${formData.lng}`}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-amber-500 flex items-center gap-1 transition-colors shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
                <span>خرائط</span>
              </a>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial text-[11px] sm:text-xs font-bold px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer text-center"
            >
              إغلاق
            </button>
            {canEdit && (
              <button
                type="submit"
                className="flex-1 sm:flex-initial text-[11px] sm:text-xs font-black px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-md cursor-pointer flex items-center justify-center gap-1.5 transition-all active:scale-95 shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                <span>حفظ التعديلات</span>
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Lightbox */}
      {selectedPhotoPreview && (
        <div className="fixed inset-0 z-[10050] bg-slate-950/92 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedPhotoPreview(null)}>
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedPhotoPreview(null)}
              className="absolute -top-10 left-0 bg-white/15 hover:bg-white/30 text-white w-8 h-8 rounded-full flex items-center justify-center font-black cursor-pointer">✕</button>
            <img src={selectedPhotoPreview} alt="معاينة" className="max-w-full max-h-[75vh] object-contain rounded-2xl border-2 border-amber-500/50 shadow-2xl mx-auto" />
            <div className="mt-3 flex justify-center">
              <button type="button" onClick={() => downloadSinglePhoto(selectedPhotoPreview, `${formData.nameAr}-full`)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-4 rounded-xl inline-flex items-center gap-1.5 shadow-lg cursor-pointer">
                <Download className="w-4 h-4" /> تحميل الصورة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Maps Sync Modal */}
      {formData && (
        <GoogleMapsSyncModal business={formData} isOpen={showMapsSyncModal}
          onClose={() => setShowMapsSyncModal(false)}
          onUpdateBusiness={(updated) => { setFormData(updated); onSave(updated); }}
        />
      )}
    </div>,
    document.body
  );
};
