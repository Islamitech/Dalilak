import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Business, VerificationStatus } from '../types';
import { EGYPT_GOVERNORATES, PACKAGES, EXEMPT_PACKAGE, ALREADY_ON_GOOGLE_PACKAGE, CATEGORY_GROUPS, getGroupFromCategory } from '../data/mockData';
import { compressImageFile } from '../utils/imageCompressor';
import { validateAndProcessShortVideo, convertVideoToDataUrl } from '../utils/videoProcessor';
import { uploadMediaToSupabaseStorage } from '../services/storage';
import {
  Store,
  User,
  MapPin,
  DollarSign,
  Image as ImageIcon,
  Film,
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
  Gift,
  Check,
  CheckCircle2,
  MessageCircle,
  Pencil,
  ExternalLink,
  Phone,
  Mail,
  Building,
  Navigation,
  Globe,
  Tag,
  Copy,
  X,
  Send,
  TrendingUp,
  ShieldCheck,
  QrCode,
} from 'lucide-react';

import { downloadSinglePhoto, downloadAllBusinessPhotos } from '../utils/photoDownloader';
import { VideoWatermarkBadge } from './VideoWatermarkBadge';
import {
  CATEGORY_MOTIVATIONAL_DATA,
  getMotivationalGroupByBusiness,
  getCategoryMotivationalWhatsAppUrl,
  CategoryMotivationalModel,
} from '../utils/categoryMotivationalMessages';
import {
  getWelcomeAlreadyOnGoogleWhatsAppUrl,
  generateWelcomeAlreadyOnGoogleWhatsAppMessage,
  getInvoiceWhatsAppUrl,
  generateInvoiceWhatsAppMessage,
  getGoogleMapsVerifiedWhatsAppUrl,
  generateGoogleMapsVerifiedWhatsAppMessage,
  getPaymentReceiptWhatsAppUrl,
  generatePaymentReceiptWhatsAppMessage,
  getOverdueWarningWhatsAppUrl,
  generateOverdueWarningWhatsAppMessage,
  getFreeQrGiftWhatsAppUrl,
  generateFreeQrGiftWhatsAppMessage,
  getQrImportanceWhatsAppUrl,
  generateQrImportanceWhatsAppMessage,
  getVisualConsultingWhatsAppUrl,
  generateVisualConsultingWhatsAppMessage,
  getBusinessCheckupWhatsAppUrl,
  generateBusinessCheckupWhatsAppMessage,
  getSocialProofUpgradeWhatsAppUrl,
  generateSocialProofUpgradeWhatsAppMessage,
} from '../utils/whatsappMessages';

import { fetchBusinessPhotosOnDemand } from '../services/db';

interface BusinessEditModalProps {
  business: Business | null;
  onClose: () => void;
  onSave: (updatedBiz: Business) => void;
  userRole?: string;
  canEdit?: boolean;
  onShowInvoice?: (business: Business) => void;
  onCollectPayment?: (business: Business) => void;
  onDeleteBusiness?: (id: string) => void;
  businesses?: Business[];
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
}) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const isAdminOrFinancial = userRole === 'admin' || userRole === 'supervisor' || userRole === 'accountant';
  const [formData, setFormData] = useState<Business | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isDownloadingPhotos, setIsDownloadingPhotos] = useState<boolean>(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Tab navigation
  const [activeSection, setActiveSection] = useState<'info' | 'owner' | 'location' | 'payment' | 'photos' | 'whatsapp'>('info');
  const [selectedMotiGroupName, setSelectedMotiGroupName] = useState<string>('');

  // Keep internal formData in sync when parent business prop changes & load high-res photos on-demand
  useEffect(() => {
    if (business) {
      setFormData({ ...business });
      if ((!business.photos || business.photos.length === 0) && business.id) {
        fetchBusinessPhotosOnDemand(business.id).then((photos) => {
          if (photos && photos.length > 0) {
            setFormData((prev) => (prev ? { ...prev, photos } : null));
          }
        });
      }
    }
  }, [business]);

  if (!business || !formData) return null;

  const handleCopyText = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  /**
   * Safe Submit with Explicit Validation
   */
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const hasNameAr = Boolean(formData.nameAr && formData.nameAr.trim());
    const hasNameEn = Boolean(formData.nameEn && formData.nameEn.trim());

    if (!hasNameAr && !hasNameEn) {
      setErrorMsg('يرجى إدخال اسم النشاط (بالعربية أو بالإنجليزية على الأقل)');
      return;
    }

    let cleanGoogleMapsUrl: string | undefined = undefined;
    if (formData.googleMapsUrl && typeof formData.googleMapsUrl === 'string') {
      let trimmed = formData.googleMapsUrl.trim();
      if (trimmed) {
        if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
          trimmed = `https://${trimmed}`;
        }
        if (!trimmed.includes('search/?api=1&query=')) {
          cleanGoogleMapsUrl = trimmed;
        }
      }
    }

    let cleanRepUrl: string | undefined = undefined;
    if (formData.repLocationUrl && typeof formData.repLocationUrl === 'string') {
      let trimmed = formData.repLocationUrl.trim();
      if (trimmed) {
        if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
          trimmed = `https://${trimmed}`;
        }
        cleanRepUrl = trimmed;
      }
    }
    const isAlreadyOnGoogle = Boolean(formData.isAlreadyOnGoogle || formData.packageId === 'pkg_already_on_google' || formData.registrationType === 'already_on_google');
    const isFeeExempt = Boolean(isAlreadyOnGoogle || formData.isFeeExempt || formData.packagePrice === 0);

    const updatedFormData: Business = {
      ...formData,
      nameAr: (formData.nameAr && formData.nameAr.trim()) || (formData.nameEn && formData.nameEn.trim()) || 'نشاط تجاري',
      nameEn: formData.nameEn?.trim() || undefined,
      ownerName: (formData.ownerName && formData.ownerName.trim()) || 'صاحب النشاط',
      phone: (formData.phone && formData.phone.trim()) || (formData.ownerPhone && formData.ownerPhone.trim()) || '01000000000',
      ownerPhone: (formData.ownerPhone && formData.ownerPhone.trim()) || (formData.phone && formData.phone.trim()) || '01000000000',
      repLocationUrl: isAlreadyOnGoogle ? undefined : cleanRepUrl,
      googleMapsUrl: cleanGoogleMapsUrl,
      packagePrice: isFeeExempt ? 0 : (formData.packagePrice ?? 250),
      amountPaid: isFeeExempt ? 0 : (formData.amountPaid ?? 0),
      cashCollectedByRep: isFeeExempt ? 0 : (formData.cashCollectedByRep ?? 0),
      isFeeExempt,
      isAlreadyOnGoogle,
      verificationStatus: isAlreadyOnGoogle ? 'verified' : (formData.verificationStatus || 'pending'),
      googleSyncStatus: isAlreadyOnGoogle ? 'synced' : (formData.googleSyncStatus || (formData.verificationStatus === 'verified' ? 'synced' : 'not_synced')),
      photos: Array.isArray(formData.photos) ? formData.photos : [],
      videos: Array.isArray(formData.videos) ? formData.videos : [],
    };

    onSave(updatedFormData);
    setIsEditMode(false);
    setStatusNotification('تم حفظ وتحديث بيانات النشاط في قاعدة البيانات بنجاح ✅');
    setTimeout(() => setStatusNotification(null), 3500);
  };

  const handleToggleFeeExempt = (exempt: boolean) => {
    let updated: Business;
    if (exempt) {
      updated = {
        ...formData,
        isFeeExempt: true,
        feeExemptionReason: 'نشاط رائج ومعلم بالمنطقة (إدراج مجاني بدون مقابل مالي)',
        packageId: EXEMPT_PACKAGE.id,
        packageName: EXEMPT_PACKAGE.title,
        packagePrice: 0,
        amountPaid: 0,
        cashCollectedByRep: 0,
        paymentStatus: 'fully_paid',
      };
    } else {
      updated = {
        ...formData,
        isFeeExempt: false,
        isAlreadyOnGoogle: false,
        feeExemptionReason: undefined,
        packageId: PACKAGES[0].id,
        packageName: PACKAGES[0].title,
        packagePrice: PACKAGES[0].price,
        amountPaid: 0,
        cashCollectedByRep: 0,
        paymentStatus: 'unpaid',
      };
    }
    setFormData(updated);
    onSave(updated);
    setStatusNotification(exempt ? 'تم إعفاء النشاط وتصفير الرسوم وتحديث قاعدة البيانات بنجاح ✅' : 'تم تحويل النشاط إلى نشاط تجاري عادي وتحديث قاعدة البيانات بنجاح ✅');
    setTimeout(() => setStatusNotification(null), 3500);
  };

  const handleSetVerificationStatus = (newStatus: VerificationStatus) => {
    const newGoogleSyncStatus = newStatus === 'verified' ? 'synced' : newStatus === 'in_progress' ? 'in_progress' : 'not_synced';
    const updated: Business = {
      ...formData,
      verificationStatus: newStatus,
      googleSyncStatus: newGoogleSyncStatus,
      googleSyncDate: newStatus === 'verified' ? (formData.googleSyncDate || new Date().toISOString().split('T')[0]) : formData.googleSyncDate,
    };
    setFormData(updated);
    onSave(updated);

    const labels: Record<VerificationStatus, string> = {
      verified: 'تم اعتماد وتوثيق النشاط على خرائط Google بنجاح 🟢',
      in_progress: 'تم تغيير حالة النشاط إلى: قيد المراجعة ⏳',
      pending: 'تم تغيير حالة النشاط إلى: بانتظار الإرسال 📋',
      rejected: 'تم تغيير حالة النشاط إلى: مرفوض 🔴',
      needs_action: 'تم تغيير حالة النشاط إلى: يتطلب إجراء ⚠️',
    };
    setStatusNotification(labels[newStatus] || 'تم تحديث الحالة بنجاح');
    setTimeout(() => setStatusNotification(null), 3000);
  };

  const handleDownloadAllPhotos = async () => {
    if (!formData.photos || formData.photos.length === 0) return;
    try {
      setIsDownloadingPhotos(true);
      await downloadAllBusinessPhotos(formData.photos, formData.nameAr);
    } finally {
      setIsDownloadingPhotos(false);
    }
  };

  const handleCopyGoogleDetails = () => {
    const repMapUrl = formData.repLocationUrl || (formData.lat && formData.lng ? `https://www.google.com/maps?q=${formData.lat},${formData.lng}` : '');
    const verifiedUrl = formData.googleMapsUrl || 'لم يُضف بعد (قيد المراجعة)';

    const fullText = 
      `اسم النشاط: ${formData.nameAr}\n` +
      `الاسم بالإنجليزية: ${formData.nameEn || ''}\n` +
      `التصنيف: ${formData.category}\n` +
      `المحافظة والمدينة: ${formData.governorate} - ${formData.city}\n` +
      `العنوان: ${formData.street || 'الموقع الجغرافي المسجل'}\n` +
      `أوقات العمل: ${formData.workingHours || 'يومياً'}\n` +
      `الهاتف: ${formData.phone} ${formData.secondaryPhone ? `| ${formData.secondaryPhone}` : ''}\n` +
      `الإحداثيات: ${formData.lat}, ${formData.lng}\n` +
      `📍 رابط المعاينة الميدانية (المندوب - غير موثق): ${repMapUrl}\n` +
      `✅ رابط خرائط Google الموثق (الإدارة): ${verifiedUrl}`;

    handleCopyText(fullText, 'google_details');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsUploading(true);
      const newCompressed: string[] = [];
      for (let i = 0; i < files.length; i++) {
        try {
          const compressed = await compressImageFile(files[i], 1000, 1000, 0.72, {
            applyWatermark: true,
            position: 'bottom-right',
          });
          const publicUrl = await uploadMediaToSupabaseStorage(compressed, 'photos');
          newCompressed.push(publicUrl);
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

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    setVideoError(null);
    if (files && files.length > 0) {
      setIsUploadingVideo(true);
      const newVideos: string[] = [];
      let capturedThumbnailUrl: string | null = null;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const validation = await validateAndProcessShortVideo(file, 30.5);
          if (!validation.valid) {
            setVideoError(validation.error || 'الملف غير صالح أو يتجاوز 30 ثانية.');
            continue;
          }

          if (validation.thumbnail && !capturedThumbnailUrl) {
            const thumbUrl = await uploadMediaToSupabaseStorage(validation.thumbnail, 'photos');
            capturedThumbnailUrl = thumbUrl;
          }

          const videoDataUrl = await convertVideoToDataUrl(file);
          const publicVideoUrl = await uploadMediaToSupabaseStorage(videoDataUrl, 'videos');
          if (publicVideoUrl && (publicVideoUrl.startsWith('http://') || publicVideoUrl.startsWith('https://'))) {
            newVideos.push(publicVideoUrl);
          } else {
            setVideoError('تعذر رفع الفيديو سحابياً لضعف شبكة الإنترنت. يرجى إعادة المحاولة.');
          }
        } catch (err) {
          console.warn('Video upload error in edit modal:', err);
          setVideoError('تعذر معالجة ملف الفيديو. يرجى التأكد من تشغيل الصيغة.');
        }
      }

      if (newVideos.length > 0) {
        const currentVideos = formData.videos || [];
        const currentPhotos = formData.photos || [];
        setFormData({
          ...formData,
          videos: [...currentVideos, ...newVideos],
          photos: currentPhotos.length === 0 && capturedThumbnailUrl ? [capturedThumbnailUrl] : currentPhotos,
        });
      }

      e.target.value = '';
      setIsUploadingVideo(false);
    }
  };

  const handleRemoveVideo = (indexToRemove: number) => {
    const currentVideos = formData.videos || [];
    setFormData({
      ...formData,
      videos: currentVideos.filter((_, idx) => idx !== indexToRemove),
    });
  };

  const isAlreadyOnGoogle = Boolean(formData.isAlreadyOnGoogle || formData.packageId === 'pkg_already_on_google' || formData.registrationType === 'already_on_google');
  const isFeeExempt = Boolean(isAlreadyOnGoogle || formData.isFeeExempt || formData.packagePrice === 0);
  const remainingDebt = isFeeExempt ? 0 : Math.max(0, (formData.packagePrice || 0) - (formData.amountPaid || 0));
  const totalMediaCount = (formData.photos?.length || 0) + (formData.videos?.length || 0);

  interface TabItem {
    key: 'info' | 'owner' | 'location' | 'payment' | 'photos' | 'whatsapp';
    label: string;
    icon: React.ReactNode;
    count?: number;
  }

  const TABS: TabItem[] = [
    { key: 'info', label: 'البيانات', icon: <Store className="w-4 h-4" /> },
    { key: 'owner', label: 'المالك', icon: <User className="w-4 h-4" /> },
    { key: 'location', label: 'الموقع والخرائط', icon: <MapPin className="w-4 h-4" /> },
    { key: 'payment', label: 'المالية', icon: <DollarSign className="w-4 h-4" /> },
    { key: 'photos', label: 'الوسائط', icon: <ImageIcon className="w-4 h-4" />, count: totalMediaCount },
    ...(isAdminOrFinancial
      ? [{ key: 'whatsapp', label: 'الواتساب', icon: <MessageCircle className="w-4 h-4 text-emerald-500" /> } as TabItem]
      : []),
  ];

  // 1. Directory Approval Status (خاص بالدليل فقط ومراجعة المسؤول)
  const isDirectoryApproved = formData.verificationStatus === 'verified';
  const directoryBadge = isDirectoryApproved
    ? { label: '🟢 معتمد بالدليل', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-black' }
    : formData.verificationStatus === 'rejected'
    ? { label: '🔴 مرفوض بالدليل', cls: 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold' }
    : { label: '⏳ قيد مراجعة الدليل', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold' };

  // 2. Google Maps Verification Status (خاص بخرائط Google فقط)
  const hasVerifiedGoogleMap = Boolean(
    formData.googleMapsUrl &&
    formData.googleMapsUrl.trim().startsWith('http') &&
    !formData.googleMapsUrl.includes('search/?api=1&query=')
  );
  const isGoogleSynced = hasVerifiedGoogleMap || formData.googleSyncStatus === 'synced';
  const googleBadge = hasVerifiedGoogleMap
    ? { label: '🌐 موثق على Google Maps ✓', cls: 'bg-blue-500/20 text-blue-300 border-blue-500/40 font-black' }
    : formData.googleSyncStatus === 'in_progress'
    ? { label: '⏳ قيد توثيق Google', cls: 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold' }
    : { label: 'غير مدرج بـ Google بعد', cls: 'bg-slate-800/80 text-slate-400 border-slate-700 font-medium' };

  // 3. Payment Status & Alert (تنبيه السداد يرتبط بتوثيق خرائط Google)
  const isUnpaid = !isFeeExempt && (formData.amountPaid || 0) < (formData.packagePrice || 250);
  const isGoogleVerifiedAndUnpaid = hasVerifiedGoogleMap && isUnpaid;

  const paymentBadge = isAlreadyOnGoogle
    ? { label: 'مسجل مسبقاً على Google Maps 📍 (مجاني 0 ج)', cls: 'bg-blue-500/20 text-blue-300 border-blue-500/40 font-black' }
    : isFeeExempt
    ? { label: 'معفى من الرسوم (مجاني 0 ج)', cls: 'bg-teal-500/20 text-teal-300 border-teal-500/40 font-black' }
    : formData.paymentStatus === 'fully_paid'
    ? { label: `مسدد بالكامل (${formData.amountPaid} ج)`, cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-black' }
    : isGoogleVerifiedAndUnpaid
    ? { label: `🚨 موثق بـ Google ولم يُسدد! (${formData.packagePrice || 250} ج)`, cls: 'bg-rose-500/30 text-rose-200 border-rose-500/50 font-black animate-pulse shadow-xs' }
    : formData.paymentStatus === 'partially_paid'
    ? { label: `متبقي دين (${remainingDebt} ج)`, cls: 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold' }
    : { label: `⏳ الدفع عند توثيق Google (${formData.packagePrice || 250} ج)`, cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30 font-bold' };


  const primaryPhone = formData.phone || formData.ownerPhone || '';
  const cleanPhone = primaryPhone.replace(/\D/g, '');
  const mapsUrl = hasVerifiedGoogleMap ? formData.googleMapsUrl.trim() : '';

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in" dir="rtl">
      <div className="bg-[var(--bg-card)] border-t sm:border border-[var(--border-color)] rounded-t-[28px] sm:rounded-3xl w-full max-w-3xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh] sm:max-h-[90vh] transition-all">
        
        {/* ── 0. MOBILE DRAG HANDLE ───────────────────────────────────── */}
        <div className="w-12 h-1 bg-slate-700/80 rounded-full mx-auto mt-2 sm:hidden shrink-0" />

        {/* ── 1. COMPACT & HIGH-CONTRAST HEADER ───────────────────────── */}
        <div className="p-3.5 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white flex items-start justify-between gap-2.5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-500 text-slate-950 flex items-center justify-center font-black text-lg sm:text-xl shadow-md shrink-0 border border-amber-400/40">
              <Store className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-black text-sm sm:text-base text-white truncate max-w-[200px] sm:max-w-none">
                  {formData.nameAr || formData.nameEn || 'تفاصيل النشاط'}
                </h3>
                <span className="text-[10px] font-mono text-slate-300 bg-slate-800/90 px-1.5 py-0.5 rounded border border-slate-700">
                  {formData.invoiceNumber}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-300">
                <span className="flex items-center gap-1 font-bold">
                  <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="truncate">{formData.governorate} - {formData.city}</span>
                </span>
                <span className="text-slate-600 hidden xs:inline">•</span>
                <span className="flex items-center gap-1 font-bold">
                  <Tag className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="truncate">{formData.category}</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className={`text-[9.5px] sm:text-[10px] font-black px-2.5 py-0.5 rounded-full border ${directoryBadge.cls}`} title="حالة الاعتماد للظهور على دليل المنصة">
                  {directoryBadge.label}
                </span>
                <span className={`text-[9.5px] sm:text-[10px] font-black px-2.5 py-0.5 rounded-full border ${paymentBadge.cls}`}>
                  {paymentBadge.label}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  if (isEditMode) {
                    handleSubmit();
                  } else {
                    setIsEditMode(true);
                  }
                }}
                className={`text-xs font-black px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 ${
                  isEditMode
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/50'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                }`}
              >
                {isEditMode ? <Check className="w-4 h-4 stroke-[3]" /> : <Pencil className="w-3.5 h-3.5 stroke-[2.5]" />}
                <span>{isEditMode ? 'حفظ' : 'تعديل'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              title="إغلاق النافذة"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* ── 2. STREAMLINED QUICK ACTIONS STRIP ──────────────────────── */}
        <div className="px-3 sm:px-5 py-2 bg-[var(--input-bg)]/90 border-b border-[var(--border-color)] flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          {cleanPhone && (
            <a
              href={`tel:${cleanPhone}`}
              className="bg-[var(--bg-card)] hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-bold px-2.5 py-1.5 rounded-xl transition-transform active:scale-95 flex items-center gap-1 shrink-0 shadow-2xs"
            >
              <Phone className="w-3 h-3" />
              <span>اتصال</span>
            </a>
          )}

          {onShowInvoice && (
            <button
              type="button"
              onClick={() => onShowInvoice(formData)}
              className="bg-[var(--bg-card)] hover:bg-amber-500/10 text-[var(--text-primary)] border border-[var(--border-color)] text-[11px] font-bold px-2.5 py-1.5 rounded-xl transition-transform active:scale-95 flex items-center gap-1 shrink-0 shadow-2xs cursor-pointer"
            >
              <FileText className="w-3 h-3 text-amber-500" />
              <span>الفاتورة</span>
            </button>
          )}

          {mapsUrl ? (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-[var(--bg-card)] hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-[11px] font-bold px-2.5 py-1.5 rounded-xl transition-transform active:scale-95 flex items-center gap-1 shrink-0 shadow-2xs"
              title="فتح موقع النشاط الموثق على خرائط Google"
            >
              <ExternalLink className="w-3 h-3 text-blue-500" />
              <span>📍 Google Maps</span>
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="bg-[var(--bg-card)] text-slate-400 border border-slate-700/50 text-[11px] font-medium px-2.5 py-1.5 rounded-xl flex items-center gap-1 shrink-0 opacity-50 cursor-not-allowed"
              title="الخريطة غير مفعلة - لم يتم إضافة رابط توثيق Google بعد"
            >
              <ExternalLink className="w-3 h-3 text-slate-500" />
              <span>📍 خريطة غير مفعلة</span>
            </button>
          )}

          {remainingDebt > 0 && (
            <button
              type="button"
              onClick={() => {
                if (onCollectPayment) {
                  onCollectPayment(formData);
                } else {
                  setActiveSection('payment');
                }
              }}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black text-[11px] px-3 py-1.5 rounded-xl shadow-xs transition-transform active:scale-95 flex items-center gap-1 shrink-0 cursor-pointer mr-auto"
            >
              <DollarSign className="w-3 h-3" />
              <span>تحصيل ({remainingDebt} ج)</span>
            </button>
          )}
        </div>

        {/* ── 3. CLEAN SINGLE-ROW SEGMENTED NAVIGATION TABS ─────────── */}
        <div className="flex items-center gap-1.5 px-3 sm:px-5 py-2 border-b border-[var(--border-color)] bg-[var(--bg-card)]/70 overflow-x-auto no-scrollbar shrink-0 snap-x">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveSection(tab.key)}
              className={`flex items-center gap-1.5 py-1.5 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 snap-start ${
                activeSection === tab.key
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                  : 'bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                  activeSection === tab.key ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── 4. SCROLLABLE BODY CONTENT ─────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-3.5 overscroll-contain">
          
          {statusNotification && (
            <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 p-3 rounded-2xl text-xs font-black flex items-center gap-2 animate-fade-in shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{statusNotification}</span>
            </div>
          )}

          {/* Urgent Financial Alert Card (Strictly non-exempt only) */}
          {!isFeeExempt && (formData.amountPaid || 0) === 0 && (
            <div className="bg-gradient-to-r from-rose-500/20 via-orange-500/15 to-rose-500/20 border-2 border-rose-500/40 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm text-right">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="font-black text-xs sm:text-sm text-rose-800 dark:text-rose-200">
                    تنبيه مالي: النشاط غير مسدد ({formData.packagePrice || 250} ج.م)
                  </h4>
                  <p className="text-[10.5px] text-rose-700 dark:text-rose-300 font-bold mt-0.5">
                    يرجى تحصيل قيمة الاشتراك المعتمدة وتسجيل عملية السداد لتأكيد وتفعيل خدمات النشاط.
                  </p>
                </div>
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
                className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white text-xs font-black px-4 py-2 rounded-xl shadow-md cursor-pointer transition-transform active:scale-95 shrink-0 flex items-center justify-center gap-1.5"
              >
                <DollarSign className="w-4 h-4" />
                <span>تسجيل التحصيل الآن</span>
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-400 p-3 rounded-2xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ── TAB 1: تفاصيل وبيانات النشاط ──────────────────────────── */}
          {activeSection === 'info' && (
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
              </div>
            </div>
          )}

          {/* ── TAB 2: المالك والتواصل ────────────────────────────────── */}
          {activeSection === 'owner' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
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
                        {isAdminOrFinancial && (
                          <button
                            type="button"
                            onClick={() => setActiveSection('whatsapp')}
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
          )}

          {/* ── TAB 3: الموقع والخرائط ─────────────────────────────────── */}
          {activeSection === 'location' && (
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

                {/* Admin Directory Approval Controls (مستقل تماماً عن خرائط Google) */}
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
                            href={formData.repLocationUrl || (formData.lat && formData.lng ? `https://www.google.com/maps?q=${formData.lat},${formData.lng}` : '#')}
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

                {/* 2. رابط خرائط Google المعتمد والموثق (تضيفه الإدارة بعد النشر) */}
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
                            href={formData.googleMapsUrl}
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
          )}

          {/* ── TAB 4: الباقة والمالية ─────────────────────────────────── */}
          {activeSection === 'payment' && (
            <div className="space-y-3.5 text-right">
              {/* 🌟 Special Fee Exemption Box for Responsible Accounts */}
              {isAdminOrFinancial && (
                <div className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                  formData.isFeeExempt
                    ? 'bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 border-emerald-500/50 shadow-md'
                    : 'bg-[var(--input-bg)] border-[var(--border-color)]'
                }`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                        formData.isFeeExempt ? 'bg-emerald-500 text-white shadow-sm' : 'bg-emerald-500/10 text-emerald-500'
                      }`}>
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
                            إعفاء النشاط من الرسوم والتحصيل (نشاط رائج ومعلم بالمنطقة)
                          </h4>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-black">
                            صلاحيات الإدارة
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] font-bold mt-0.5">
                          إزالة التحصيل وتصفير الفاتورة (0 ج.م) واستبعاد النشاط وفواتيره تماماً من الإحصائيات والديون
                        </p>
                      </div>
                    </div>

                    {canEdit ? (
                      <button
                        type="button"
                        onClick={() => handleToggleFeeExempt(!formData.isFeeExempt)}
                        className={`text-xs font-black px-4 py-2 rounded-xl border transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 ${
                          formData.isFeeExempt
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-emerald-600/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600'
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${formData.isFeeExempt ? 'bg-white animate-pulse' : 'bg-slate-400'}`}></span>
                        <span>{formData.isFeeExempt ? '✓ نشاط معفى (إدراج مجاني)' : 'نشاط تجاري عادي (اضغط للإعفاء)'}</span>
                      </button>
                    ) : (
                      <span className={`text-xs font-black px-3 py-1.5 rounded-xl border ${
                        formData.isFeeExempt
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-700/40 text-slate-400 border-slate-600'
                      }`}>
                        {formData.isFeeExempt ? '✓ معفى من التحصيل (مجاني)' : 'نشاط تجاري عادي'}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* الباقة المختارة */}
                <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3 space-y-1">
                  <span className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>باقة التوثيق والخدمات</span>
                  </span>
                  {isEditMode ? (
                    <select
                      value={formData.packageId || (formData.isAlreadyOnGoogle ? ALREADY_ON_GOOGLE_PACKAGE.id : PACKAGES[0].id)}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === ALREADY_ON_GOOGLE_PACKAGE.id) {
                          setFormData({
                            ...formData,
                            isFeeExempt: true,
                            isAlreadyOnGoogle: true,
                            packageId: ALREADY_ON_GOOGLE_PACKAGE.id,
                            packageName: ALREADY_ON_GOOGLE_PACKAGE.title,
                            packagePrice: 0,
                            amountPaid: 0,
                            cashCollectedByRep: 0,
                            paymentStatus: 'fully_paid',
                          });
                        } else if (val === EXEMPT_PACKAGE.id) {
                          setFormData({
                            ...formData,
                            isFeeExempt: true,
                            packageId: EXEMPT_PACKAGE.id,
                            packageName: EXEMPT_PACKAGE.title,
                            packagePrice: 0,
                            amountPaid: 0,
                            cashCollectedByRep: 0,
                            paymentStatus: 'fully_paid',
                          });
                        } else {
                          const pkg = PACKAGES.find((p) => p.id === val);
                          if (pkg) {
                            setFormData({
                              ...formData,
                              isFeeExempt: false,
                              packageId: pkg.id,
                              packageName: pkg.title,
                              packagePrice: pkg.price,
                            });
                          }
                        }
                      }}
                      className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] font-black text-xs rounded-xl p-2 focus:outline-none focus:border-amber-500 cursor-pointer mt-1"
                    >
                      <option value={ALREADY_ON_GOOGLE_PACKAGE.id}>
                        {ALREADY_ON_GOOGLE_PACKAGE.title} (0 ج.م - مجاناً)
                      </option>
                      {PACKAGES.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.title} ({pkg.price} ج.م)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="font-black text-sm text-[var(--text-primary)] pt-0.5">{formData.packageName || (formData.isAlreadyOnGoogle ? ALREADY_ON_GOOGLE_PACKAGE.title : formData.isFeeExempt ? 'نشاط رائج بالمنطقة (إدراج مجاني بدون رسوم)' : '1. باقة التوثيق الأساسي')}</div>
                  )}
                </div>

                {/* سعر الباقة */}
                <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3 space-y-1">
                  <span className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                    <span>إجمالي قيمة الباقة</span>
                  </span>
                  <div className="font-black text-base text-[var(--text-primary)] pt-0.5">
                    {formData.isFeeExempt ? '0 ج.م (معفى من الرسوم)' : `${formData.packagePrice ?? 250} ج.م`}
                  </div>
                </div>

                {/* المبلغ المسدد */}
                <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3 space-y-1">
                  <span className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>المبلغ المسدد فعلياً</span>
                  </span>
                  {isEditMode && !formData.isFeeExempt ? (
                    <input
                      type="number"
                      value={formData.amountPaid ?? 0}
                      onChange={(e) => {
                        const paid = Number(e.target.value) || 0;
                        const price = formData.packagePrice || 250;
                        const status = paid >= price ? 'fully_paid' : paid > 0 ? 'partially_paid' : 'unpaid';
                        setFormData({
                          ...formData,
                          amountPaid: paid,
                          paymentStatus: status,
                        });
                      }}
                      className="w-full bg-[var(--bg-card)] border-2 border-emerald-500 text-emerald-600 font-black text-sm rounded-xl p-2 focus:outline-none shadow-inner mt-1"
                    />
                  ) : (
                    <div className="font-black text-base text-emerald-600 dark:text-emerald-400 pt-0.5">
                      {formData.isFeeExempt ? '0 ج.م (معفى)' : `${formData.amountPaid || 0} ج.م`}
                    </div>
                  )}
                </div>

                {/* المبلغ المتبقي */}
                <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3 space-y-1">
                  <span className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>المبلغ المتبقي للتحصيل</span>
                  </span>
                  <div className={`font-black text-base pt-0.5 ${remainingDebt > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600'}`}>
                    {formData.isFeeExempt ? '0 ج.م (لا يوجد دين)' : `${remainingDebt} ج.م`}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 5: المعرض والوسائط ────────────────────────────────── */}
          {activeSection === 'photos' && (
            <div className="space-y-3.5 text-right">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)]">
                <div>
                  <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
                    معرض صور وفيديوهات النشاط ({totalMediaCount})
                  </h4>
                  <p className="text-[10.5px] text-[var(--text-muted)] font-bold mt-0.5">
                    الصور موثقة بعلامة دليلك المائية الرسمية
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <label className="flex-1 sm:flex-none bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-xs font-black py-2 px-3 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95">
                    <UploadCloud className="w-4 h-4" />
                    <span>{isUploading ? 'جاري الرفع...' : 'إضافة صور'}</span>
                    <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" disabled={isUploading} />
                  </label>

                  <label className="flex-1 sm:flex-none bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-bold py-2 px-3 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs hover:bg-amber-500/10">
                    <Film className="w-4 h-4 text-amber-500" />
                    <span>{isUploadingVideo ? 'جاري رفع الفيديو...' : 'فيديو قصير'}</span>
                    <input type="file" accept="video/*" capture="environment" onChange={handleVideoUpload} className="hidden" disabled={isUploadingVideo} />
                  </label>
                </div>
              </div>

              {/* Photos Grid */}
              {formData.photos && formData.photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                  {formData.photos.map((photo, idx) => (
                    <div key={idx} className="relative group rounded-2xl overflow-hidden border border-[var(--border-color)] bg-slate-950 h-28 sm:h-32 shadow-sm">
                      <img
                        src={photo}
                        alt={`صورة ${idx + 1}`}
                        onClick={() => setSelectedPhotoPreview(photo)}
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-1.5 right-1.5 bg-rose-600/90 hover:bg-rose-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow cursor-pointer transition-transform active:scale-90"
                        title="حذف الصورة"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-[var(--border-color)] rounded-2xl p-6 text-center text-xs text-[var(--text-muted)] font-bold">
                  لم يتم رفع صور لهذا النشاط بعد.
                </div>
              )}

              {/* Videos Grid */}
              {formData.videos && formData.videos.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
                  <h5 className="font-black text-xs text-[var(--text-primary)]">الفيديوهات الترويجية:</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {formData.videos.map((vid, idx) => (
                      <div key={idx} className="relative rounded-2xl overflow-hidden border border-[var(--border-color)] bg-slate-950 shadow-md">
                        <video src={vid} controls playsInline preload="metadata" className="w-full h-40 object-cover bg-black" />
                        <VideoWatermarkBadge position="bottom-right" />
                        <button
                          type="button"
                          onClick={() => handleRemoveVideo(idx)}
                          className="absolute top-2 right-2 bg-rose-600 hover:bg-rose-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB 6: مركز رسائل وإشعارات الواتساب الموحد ───────────── */}
          {activeSection === 'whatsapp' && isAdminOrFinancial && (
            <div className="space-y-3 text-right">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-black shrink-0">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
                      مركز رسائل وإشعارات WhatsApp المعتمدة
                    </h4>
                    <p className="text-[10px] text-[var(--text-muted)] font-bold">
                      أزرار إرسال فورية ومنظمة بحسب الحدث وحالة النشاط
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20" dir="ltr">
                  {formData.phone || formData.ownerPhone || 'لا يوجد هاتف'}
                </span>
              </div>

              {/* ── 🌟 CATEGORY-SPECIFIC MOTIVATIONAL CAMPAIGNS (FIRST & PROMINENT) ── */}
              {(() => {
                const autoGroup = getMotivationalGroupByBusiness(formData);
                const currentGroupName = selectedMotiGroupName || autoGroup.groupName;
                const activeGroupObj = CATEGORY_MOTIVATIONAL_DATA.find((g) => g.groupName === currentGroupName) || autoGroup;

                return (
                  <div className="bg-gradient-to-b from-emerald-500/10 via-[var(--input-bg)] to-[var(--input-bg)] border-2 border-emerald-500/40 rounded-3xl p-3.5 sm:p-4 space-y-3 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/20 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/25 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-black text-sm shrink-0">
                          🌟
                        </div>
                        <div>
                          <h4 className="font-black text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                            <span>رسائل التحفيز ونبض النشاط</span>
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full font-bold">
                              نصائح النجاح الذهبية لجميع الأنشطة 💡
                            </span>
                          </h4>
                          <p className="text-[10px] text-[var(--text-muted)] font-bold mt-0.5">
                            استراتيجيات وتوجيهات عملية لزيادة الأرباح، تصدر السوق المحلي، وبناء ولاء دائم للعملاء
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-black bg-emerald-500 text-slate-950 px-2.5 py-1 rounded-xl shrink-0 self-start sm:self-auto shadow-2xs">
                        {activeGroupObj.groupIcon} {activeGroupObj.groupName}
                      </span>
                    </div>

                    {/* Category Selector Tabs */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[var(--text-muted)]">اختر محور النصائح والتحفيز لإرساله عبر WhatsApp:</span>
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar text-[11px] font-bold">
                        {CATEGORY_MOTIVATIONAL_DATA.map((grp) => {
                          const isSelected = grp.groupName === currentGroupName;
                          return (
                            <button
                              key={grp.groupName}
                              type="button"
                              onClick={() => setSelectedMotiGroupName(grp.groupName)}
                              className={`px-2.5 py-1.5 rounded-xl border whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-600 text-white font-black border-emerald-500 shadow-xs scale-102'
                                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-emerald-500/40'
                              }`}
                            >
                              <span>{grp.groupIcon}</span>
                              <span>{grp.groupName}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Render Active Category Models */}
                    <div className="space-y-2.5 pt-1">
                      {activeGroupObj.models.map((m, idx) => {
                        const msgText = m.generateText(formData);
                        const waUrl = getCategoryMotivationalWhatsAppUrl(m, formData);
                        const copyKey = `wa_cat_${m.id}`;

                        return (
                          <div
                            key={m.id}
                            className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-emerald-500/50 rounded-2xl p-3 space-y-2 transition-colors shadow-2xs"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 font-black text-xs text-[var(--text-primary)]">
                                <span>{m.icon}</span>
                                <span>{idx + 1}. {m.title}</span>
                              </div>
                              <span className="text-[9.5px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md">
                                {m.badge}
                              </span>
                            </div>

                            <p className="text-[10.5px] text-[var(--text-muted)] font-medium leading-relaxed">
                              {m.summary}
                            </p>

                            {/* Message Preview Box */}
                            <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-[var(--border-color)]/60 text-[11px] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed max-h-32 overflow-y-auto font-sans">
                              {msgText}
                            </div>

                            <div className="flex items-center gap-2 pt-0.5">
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black text-xs py-2 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 text-center"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>إرسال عبر WhatsApp 🚀</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => handleCopyText(msgText, copyKey)}
                                className="bg-[var(--input-bg)] hover:bg-emerald-500/15 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold p-2 rounded-xl transition-colors cursor-pointer"
                                title="نسخ نص الرسالة"
                              >
                                {copiedField === copyKey ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5 text-emerald-500" />
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* WELCOME MESSAGE FOR ALREADY-ON-GOOGLE BUSINESSES */}
              {(formData.isAlreadyOnGoogle || formData.packageId === 'pkg_already_on_google' || formData.registrationType === 'already_on_google') ? (
                <div className="bg-[var(--input-bg)] border-2 border-blue-500/40 hover:border-blue-500 rounded-2xl p-3.5 space-y-2.5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-black text-xs text-[var(--text-primary)]">
                      <Sparkles className="w-4 h-4 text-blue-500" />
                      <span>رسالة الترحيب الرسمية وإشعار الإدراج بالدليل (Google Maps قائم)</span>
                    </div>
                    <span className="text-[9.5px] bg-blue-500/15 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-md">
                      نشاط مسجل مسبقاً 📍
                    </span>
                  </div>
                  <p className="text-[10.5px] text-[var(--text-muted)] font-medium leading-relaxed">
                    رسالة ترحيبية راقية للمالك تتضمن إشعار إدراج وربط نشاطه القائم على Google Maps بدليل الأنشطة والخدمات المعتمد مجاناً.
                  </p>
                  <div className="flex items-center gap-2 pt-0.5">
                    <a
                      href={getWelcomeAlreadyOnGoogleWhatsAppUrl(formData)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs py-2 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 text-center"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>إرسال رسالة الترحيب والإدراج عبر WhatsApp</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopyText(generateWelcomeAlreadyOnGoogleWhatsAppMessage(formData), 'wa_welcome')}
                      className="bg-[var(--bg-card)] hover:bg-blue-500/15 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold p-2 rounded-xl transition-colors cursor-pointer"
                      title="نسخ نص رسالة الترحيب"
                    >
                      {copiedField === 'wa_welcome' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-blue-500" />}
                    </button>
                  </div>
                </div>
              ) : (
                <>
              {/* Message 1: Initial Invoice */}
              <div className="bg-[var(--input-bg)] border border-[var(--border-color)] hover:border-amber-500/40 rounded-2xl p-3 space-y-2 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-xs text-[var(--text-primary)]">
                    <FileText className="w-4 h-4 text-amber-500" />
                    <span>1. رسالة الفاتورة الإلكترونية الأولية وتأكيد التسجيل</span>
                  </div>
                  <span className="text-[9.5px] bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold px-2 py-0.5 rounded-md">
                    عند التسجيل
                  </span>
                </div>
                <p className="text-[10.5px] text-[var(--text-muted)] font-medium">
                  تتضمن تفاصيل الباقة، المبلغ المدفوع، المتبقي، ورابط الدليل الرسمي مع إشعار جارِ مراجعة التوثيق.
                </p>
                <div className="flex items-center gap-2 pt-0.5">
                  <a
                    href={getInvoiceWhatsAppUrl(formData)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-2 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 text-center"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>إرسال الفاتورة عبر WhatsApp</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopyText(generateInvoiceWhatsAppMessage(formData), 'wa_inv')}
                    className="bg-[var(--bg-card)] hover:bg-amber-500/15 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold p-2 rounded-xl transition-colors cursor-pointer"
                    title="نسخ نص الفاتورة"
                  >
                    {copiedField === 'wa_inv' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-amber-500" />}
                  </button>
                </div>
              </div>

              {/* Message 2: Google Maps Verification */}
              <div className="bg-[var(--input-bg)] border border-[var(--border-color)] hover:border-blue-500/40 rounded-2xl p-3 space-y-2 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-xs text-[var(--text-primary)]">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <span>2. رسالة إشعار التوثيق والاعتماد على خرائط Google 🗺️</span>
                  </div>
                  <span className="text-[9.5px] bg-blue-500/15 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-md">
                    بعد التوثيق
                  </span>
                </div>
                <p className="text-[10.5px] text-[var(--text-muted)] font-medium">
                  تهنئة العميل مع رابط الخريطة المعتمد المباشر، رابط الدليل، وحالة السداد وطرق الدفع للتسوية.
                </p>
                <div className="flex items-center gap-2 pt-0.5">
                  <a
                    href={getGoogleMapsVerifiedWhatsAppUrl(formData)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs py-2 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 text-center"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>إرسال إشعار التوثيق (Google Maps)</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopyText(generateGoogleMapsVerifiedWhatsAppMessage(formData), 'wa_maps')}
                    className="bg-[var(--bg-card)] hover:bg-blue-500/15 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold p-2 rounded-xl transition-colors cursor-pointer"
                    title="نسخ نص الإشعار"
                  >
                    {copiedField === 'wa_maps' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-blue-500" />}
                  </button>
                </div>
              </div>

              {/* Message 4: Overdue Warning (Strictly for activities with remaining debt) */}
              {remainingDebt > 0 && !isFeeExempt && (
                <div className="bg-rose-500/10 border-2 border-rose-500/40 rounded-2xl p-3.5 space-y-2 transition-all shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-black text-xs text-rose-700 dark:text-rose-300">
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 stroke-[2.5]" />
                      <span>4. رسالة إنذار المماطلة في السداد والمساءلة الإدارية ⚠️</span>
                    </div>
                    <span className="text-[9.5px] bg-rose-500/20 text-rose-700 dark:text-rose-300 font-black px-2 py-0.5 rounded-md border border-rose-500/40">
                      إنذار 24 ساعة
                    </span>
                  </div>
                  <p className="text-[10.5px] text-rose-800 dark:text-rose-200 font-bold leading-relaxed">
                    إنذار إداري ومالي رسمي صريح يوضح صدور الفاتورة وتوثيق النشاط بموافقته، مع التنبيه باتخاذ إجراءات خفض التقييم والإدراج بالقائمة السوداء حال المماطلة.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={getOverdueWarningWhatsAppUrl(formData)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-black text-xs py-2 px-3 rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-transform active:scale-95 text-center"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>إرسال إنذار المماطلة الرسمي (WhatsApp) ⚠️</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopyText(generateOverdueWarningWhatsAppMessage(formData), 'wa_warn')}
                      className="bg-[var(--bg-card)] hover:bg-rose-500/15 text-rose-600 border border-rose-500/30 text-xs font-bold p-2 rounded-xl transition-colors cursor-pointer shrink-0"
                      title="نسخ نص الإنذار"
                    >
                      {copiedField === 'wa_warn' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-rose-500" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Message 3: Payment Receipt */}
              <div className="bg-[var(--input-bg)] border border-[var(--border-color)] hover:border-emerald-500/40 rounded-2xl p-3 space-y-2 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-xs text-[var(--text-primary)]">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    <span>3. رسالة إيصال السداد المالي والمخالصة النهائية ✅</span>
                  </div>
                  <span className="text-[9.5px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md">
                    عند السداد الكامل
                  </span>
                </div>
                <p className="text-[10.5px] text-[var(--text-muted)] font-medium">
                  تأكيد سداد المبلغ كاملاً وتصفية الحساب (0 ج.م متبقي) وإصدار الإيصال المعتمد للعميل.
                </p>
                <div className="flex items-center gap-2 pt-0.5">
                  <a
                    href={getPaymentReceiptWhatsAppUrl(formData)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs py-2 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 text-center"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>إرسال إيصال السداد للعميل</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopyText(generatePaymentReceiptWhatsAppMessage(formData), 'wa_pay')}
                    className="bg-[var(--bg-card)] hover:bg-emerald-500/15 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold p-2 rounded-xl transition-colors cursor-pointer"
                    title="نسخ نص الإيصال"
                  >
                    {copiedField === 'wa_pay' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-emerald-500" />}
                  </button>
                </div>
              </div>
                </>
              )}

              {/* ── STRICT ADMIN/SUPERVISOR ONLY: MONTHLY NURTURING CAMPAIGNS ── */}
              {isAdminOrFinancial && (
                <div className="pt-3 border-t border-[var(--border-color)] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center font-black text-xs">
                        🎁
                      </div>
                      <h5 className="font-black text-xs text-amber-700 dark:text-amber-300">
                        حملات الرعاية والمتابعة الشهرية لتنمية الأنشطة (خاص بالإدارة والمشرفين)
                      </h5>
                    </div>
                    <span className="text-[9px] bg-amber-500/20 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full font-bold">
                      أدوات تسويقية ورعاية 4x
                    </span>
                  </div>

                  {/* Campaign 1: Free QR Stand & 100 EGP Print Delivery */}
                  <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 border border-amber-500/30 rounded-2xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-black text-xs text-[var(--text-primary)]">
                        <Gift className="w-4 h-4 text-amber-500" />
                        <span>الحملة 1: 🎁 هدية باركود التقييمات + خدمة الطباعة (100 ج)</span>
                      </div>
                      <span className="text-[9px] bg-amber-500/20 text-amber-900 dark:text-amber-300 font-bold px-2 py-0.5 rounded-md">
                        هدية ومبيعات
                      </span>
                    </div>
                    <p className="text-[10.5px] text-[var(--text-muted)] font-medium">
                      إرسال تصميم الـ QR مجاناً + عرض خدمة الطباعة الفاخرة والتوصيل لموقع المحل في نفس اليوم بتكلفة 100 ج.
                    </p>
                    <div className="flex items-center gap-2 pt-0.5">
                      <a
                        href={getFreeQrGiftWhatsAppUrl(formData)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 text-slate-950 font-black text-xs py-2 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 text-center"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>إرسال هدية الـ QR وعرض الطباعة (100 ج)</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopyText(generateFreeQrGiftWhatsAppMessage(formData), 'wa_qr_gift')}
                        className="bg-[var(--bg-card)] hover:bg-amber-500/15 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold p-2 rounded-xl transition-colors cursor-pointer"
                        title="نسخ نص الرسالة"
                      >
                        {copiedField === 'wa_qr_gift' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-amber-500" />}
                      </button>
                    </div>
                  </div>

                  {/* Campaign: Importance of QR Code & Explanatory Video Guide */}
                  <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-blue-500/10 border border-blue-500/30 rounded-2xl p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-black text-xs text-[var(--text-primary)]">
                        <QrCode className="w-4 h-4 text-blue-500" />
                        <span>📲 أهمية وجود الـ QR Code داخل النشاط + فيديو الشرح</span>
                      </div>
                      <span className="text-[9px] bg-blue-500/20 text-blue-900 dark:text-blue-300 font-black px-2 py-0.5 rounded-md">
                        مرفق فيديو توضيحي 🎥
                      </span>
                    </div>

                    <p className="text-[10.5px] text-[var(--text-muted)] font-medium leading-relaxed">
                      رسالة توعوية احترافية تشرح لصاحب النشاط أهمية وضع الباركود لزيادة التقييمات والحضور الرقمي، مع إرسال فيديو شرح عملي.
                    </p>

                    {/* Admin Visual Notice */}
                    <div className="bg-blue-500/15 border border-blue-500/30 rounded-xl p-2.5 text-[11px] text-blue-900 dark:text-blue-200 font-bold space-y-1">
                      <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-black">
                        <span>🎬</span>
                        <span>تنبيه للإدارة والمشرفين:</span>
                      </div>
                      <p className="text-[10.5px] font-medium leading-relaxed">
                        يُرجى إرفاق <strong>الفيديو التوضيحي</strong> لطريقة استخدام ومسح الباركود للزبائن مع هذه الرسالة عند إرسالها للعميل على الواتساب.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      <a
                        href={getQrImportanceWhatsAppUrl(formData)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white font-black text-xs py-2 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 text-center"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>إرسال رسالة أهمية الـ QR (واتساب)</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopyText(generateQrImportanceWhatsAppMessage(formData), 'wa_qr_importance')}
                        className="bg-[var(--bg-card)] hover:bg-blue-500/15 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold p-2 rounded-xl transition-colors cursor-pointer"
                        title="نسخ نص الرسالة"
                      >
                        {copiedField === 'wa_qr_importance' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-blue-500" />}
                      </button>
                    </div>
                  </div>

                  {/* Campaign 2: Visual Merchandising & Free Consultation */}
                  <div className="bg-[var(--input-bg)] border border-[var(--border-color)] hover:border-amber-500/40 rounded-2xl p-3 space-y-2 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-black text-xs text-[var(--text-primary)]">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>الحملة 2: 💡 نصيحة ذهبية واستشارة العرض البصري المجانية</span>
                      </div>
                      <span className="text-[9px] bg-blue-500/15 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-md">
                        استشارة مجانية
                      </span>
                    </div>
                    <p className="text-[10.5px] text-[var(--text-muted)] font-medium">
                      نصيحة أول 3 ثوانٍ للمشتري + دعوة لإرسال صورة المحل للحصول على تقرير واقتراحات تنسيق مجاناً وبكل سخاء.
                    </p>
                    <div className="flex items-center gap-2 pt-0.5">
                      <a
                        href={getVisualConsultingWhatsAppUrl(formData)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs py-2 px-3 rounded-xl border border-slate-700 shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 text-center"
                      >
                        <Send className="w-3.5 h-3.5 text-amber-400" />
                        <span>إرسال استشارة العرض والتنسيق</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopyText(generateVisualConsultingWhatsAppMessage(formData), 'wa_visual')}
                        className="bg-[var(--bg-card)] hover:bg-amber-500/15 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold p-2 rounded-xl transition-colors cursor-pointer"
                        title="نسخ نص الرسالة"
                      >
                        {copiedField === 'wa_visual' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-amber-500" />}
                      </button>
                    </div>
                  </div>

                  {/* Campaign 3: Business Checkup & Working Hours Update */}
                  <div className="bg-[var(--input-bg)] border border-[var(--border-color)] hover:border-amber-500/40 rounded-2xl p-3 space-y-2 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-black text-xs text-[var(--text-primary)]">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span>الحملة 3: ☕ فحص نبض النشاط وتحديث المواعيد مجاناً</span>
                      </div>
                      <span className="text-[9px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md">
                        اطمئنان ودعم
                      </span>
                    </div>
                    <p className="text-[10.5px] text-[var(--text-muted)] font-medium">
                      متابعة مبيعات العميل والاطمئنان عليه وعرض تحديث أرقامه ومواعيد عمله على الخرائط مجاناً.
                    </p>
                    <div className="flex items-center gap-2 pt-0.5">
                      <a
                        href={getBusinessCheckupWhatsAppUrl(formData)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs py-2 px-3 rounded-xl border border-slate-700 shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 text-center"
                      >
                        <Send className="w-3.5 h-3.5 text-blue-400" />
                        <span>إرسال رسالة الاطمئنان والمتابعة</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopyText(generateBusinessCheckupWhatsAppMessage(formData), 'wa_checkup')}
                        className="bg-[var(--bg-card)] hover:bg-amber-500/15 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold p-2 rounded-xl transition-colors cursor-pointer"
                        title="نسخ نص الرسالة"
                      >
                        {copiedField === 'wa_checkup' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-blue-500" />}
                      </button>
                    </div>
                  </div>

                  {/* Campaign 4: Social Proof & VIP Upgrade */}
                  <div className="bg-[var(--input-bg)] border border-[var(--border-color)] hover:border-purple-500/40 rounded-2xl p-3 space-y-2 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-black text-xs text-[var(--text-primary)]">
                        <TrendingUp className="w-4 h-4 text-purple-500" />
                        <span>الحملة 4: 📈 قصة نجاح وترقية باقة التسويق VIP 🚀</span>
                      </div>
                      <span className="text-[9px] bg-purple-500/15 text-purple-700 dark:text-purple-300 font-bold px-2 py-0.5 rounded-md">
                        ترقية باقات
                      </span>
                    </div>
                    <p className="text-[10.5px] text-[var(--text-muted)] font-medium">
                      قصة نجاح زيادة 40% وعرض فيديو ريلز إعلاني + حملة إعلانات جغرافية مستهدفة لمنطقة المحل.
                    </p>
                    <div className="flex items-center gap-2 pt-0.5">
                      <a
                        href={getSocialProofUpgradeWhatsAppUrl(formData)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-black text-xs py-2 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 text-center"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>إرسال قصة النجاح وعرض باقة VIP</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopyText(generateSocialProofUpgradeWhatsAppMessage(formData), 'wa_social')}
                        className="bg-[var(--bg-card)] hover:bg-purple-500/15 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold p-2 rounded-xl transition-colors cursor-pointer"
                        title="نسخ نص الرسالة"
                      >
                        {copiedField === 'wa_social' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-purple-500" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 5. CLEAN & ERGONOMIC BOTTOM SHEET FOOTER ────────────────── */}
        <div className="p-3 sm:p-4 bg-[var(--input-bg)] border-t border-[var(--border-color)] flex items-center justify-between gap-2 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div>
            {onDeleteBusiness && (userRole === 'admin' || userRole === 'supervisor') && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`هل أنت متأكد من رغبتك في حذف نشاط "${formData.nameAr}" نهائياً من المنظومة؟`)) {
                    onDeleteBusiness(formData.id);
                    onClose();
                  }
                }}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 text-xs font-bold px-2.5 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف النشاط</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-[var(--bg-card)] hover:bg-slate-500/10 text-[var(--text-secondary)] border border-[var(--border-color)] text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer active:scale-95"
            >
              إغلاق
            </button>

            {canEdit && (
              <button
                type="button"
                onClick={handleSubmit}
                className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 text-xs font-black px-5 py-2 rounded-xl shadow-md transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>حفظ التعديلات في السحابة</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Full Photo Lightbox */}
      {selectedPhotoPreview && (
        <div className="fixed inset-0 z-[10050] bg-slate-950/92 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedPhotoPreview(null)}>
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedPhotoPreview(null)} className="absolute -top-10 left-0 bg-white/15 hover:bg-white/30 text-white w-8 h-8 rounded-full flex items-center justify-center font-black cursor-pointer">
              ✕
            </button>
            <img src={selectedPhotoPreview} alt="معاينة" className="max-w-full max-h-[75vh] object-contain rounded-2xl border-2 border-amber-500/50 shadow-2xl mx-auto" />
            <div className="mt-3 flex justify-center">
              <button type="button" onClick={() => downloadSinglePhoto(selectedPhotoPreview, `${formData.nameAr}-full`)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-4 rounded-xl inline-flex items-center gap-1.5 shadow-lg cursor-pointer">
                <Download className="w-4 h-4" /> تحميل الصورة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
