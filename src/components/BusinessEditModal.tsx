import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Business, VerificationStatus } from '../types';
import { PACKAGES, EXEMPT_PACKAGE } from '../data/mockData';
import { compressImageFile } from '../utils/imageCompressor';
import { validateAndProcessShortVideo, convertVideoToDataUrl } from '../utils/videoProcessor';
import { uploadMediaToSupabaseStorage } from '../services/storage';
import {
  Store,
  MapPin,
  DollarSign,
  Image as ImageIcon,
  Save,
  Trash2,
  FileText,
  AlertCircle,
  AlertTriangle,
  Download,
  Gift,
  Check,
  CheckCircle2,
  MessageCircle,
  Pencil,
  ExternalLink,
  Phone,
  Tag,
  Copy,
  X,
  ClipboardList,
} from 'lucide-react';

import { downloadSinglePhoto, downloadAllBusinessPhotos } from '../utils/photoDownloader';
import { triggerHaptic } from '../utils/haptics';
import { EditGeneralInfoTab } from './business-edit/EditGeneralInfoTab';
import { EditLocationTab } from './business-edit/EditLocationTab';
import { EditPackagePaymentTab } from './business-edit/EditPackagePaymentTab';
import { EditMediaTab } from './business-edit/EditMediaTab';
import { EditMarketingTab } from './business-edit/EditMarketingTab';
import { EditFollowUpsTab } from './business-edit/EditFollowUpsTab';


import { fetchBusinessPhotosOnDemand } from '../services/db';

interface BusinessEditModalProps {
  business: Business | null;
  onClose: () => void;
  onSave: (updatedBiz: Business) => void;
  userRole?: string;
  currentRoleTitle?: string;
  currentUserName?: string;
  currentUserId?: string;
  initialTab?: string;
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
  currentRoleTitle,
  currentUserName,
  currentUserId,
  initialTab,
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
  const [formData, setFormData] = useState<Business | null>(business);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isDownloadingPhotos, setIsDownloadingPhotos] = useState<boolean>(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  // Tab navigation: default to 'admin_followup' as requested for admins/supervisors/accountants
  const [activeSection, setActiveSection] = useState<'info' | 'owner' | 'location' | 'payment' | 'photos' | 'whatsapp' | 'admin_followup'>(
    (initialTab as any) || (isAdminOrFinancial ? 'admin_followup' : 'info')
  );
  useEffect(() => {
    if (initialTab && ['info', 'owner', 'location', 'payment', 'photos', 'whatsapp', 'admin_followup'].includes(initialTab)) {
      setActiveSection(initialTab as any);
    } else if (!initialTab) {
      setActiveSection(isAdminOrFinancial ? 'admin_followup' : 'info');
    }
  }, [initialTab, business?.id, isAdminOrFinancial]);

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

  // Also proactively fetch on-demand photos when user navigates to the Media/Photos tab
  useEffect(() => {
    if (activeSection === 'photos' && formData?.id && (!formData.photos || formData.photos.length === 0)) {
      fetchBusinessPhotosOnDemand(formData.id).then((photos) => {
        if (photos && photos.length > 0) {
          setFormData((prev) => (prev ? { ...prev, photos } : null));
        }
      });
    }
  }, [activeSection, formData?.id]);

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

    setFormData(updatedFormData);
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
        setStatusNotification('تمت إضافة الصور بنجاح! اضغط على "حفظ التعديلات" بالأسفل لتأكيد الحفظ في السحابة 💾');
        setTimeout(() => setStatusNotification(null), 5000);
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

          const publicVideoUrl = await uploadMediaToSupabaseStorage(file, 'videos');
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
    key: 'info' | 'owner' | 'location' | 'payment' | 'photos' | 'whatsapp' | 'admin_followup';
    label: string;
    icon: React.ReactNode;
    count?: number;
  }

  const TABS: TabItem[] = [
    ...(isAdminOrFinancial
      ? [
          {
            key: 'admin_followup',
            label: 'المتابعات',
            icon: <ClipboardList className="w-4 h-4 text-amber-500" />,
            count: (formData.adminFollowUps || []).length,
          } as TabItem,
        ]
      : []),
    { key: 'info', label: 'البيانات', icon: <Store className="w-4 h-4" /> },
    { key: 'location', label: 'الخرائط', icon: <MapPin className="w-4 h-4" /> },
    { key: 'payment', label: 'المالية', icon: <DollarSign className="w-4 h-4" /> },
    { key: 'photos', label: 'الوسائط', icon: <ImageIcon className="w-4 h-4" />, count: totalMediaCount },
    ...(isAdminOrFinancial
      ? [
          { key: 'whatsapp', label: 'واتساب', icon: <MessageCircle className="w-4 h-4 text-emerald-500" /> } as TabItem,
        ]
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
  const mapsUrl = hasVerifiedGoogleMap && formData.googleMapsUrl ? formData.googleMapsUrl.trim() : '';

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchEndY - touchStartY;
    if (diff > 75) {
      triggerHaptic('light');
      onClose();
    }
    setTouchStartY(null);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in" dir="rtl">
      <div className="bg-[var(--bg-card)] border-t sm:border border-[var(--border-color)] rounded-t-[28px] sm:rounded-3xl w-full max-w-3xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh] sm:max-h-[90vh] transition-all">
        
        {/* ── 0. MOBILE DRAG HANDLE ───────────────────────────────────── */}
        <div 
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="w-full sm:hidden flex justify-center pt-2 pb-1.5 cursor-grab active:cursor-grabbing select-none"
          title="اسحب لأسفل للإغلاق"
        >
          <div className="w-12 h-1.5 bg-slate-500/60 rounded-full" />
        </div>

        {/* ── 1. COMPACT & HIGH-CONTRAST HEADER ───────────────────────── */}
        <div className="p-3 sm:p-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white flex items-start justify-between gap-2 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-500 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0 border border-amber-400/40">
              <Store className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>

            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-black text-xs sm:text-base text-white truncate max-w-[160px] xs:max-w-[220px] sm:max-w-none">
                  {formData.nameAr || formData.nameEn || 'تفاصيل النشاط'}
                </h3>
                <span className="text-[9px] sm:text-[10px] font-mono text-slate-300 bg-slate-800/90 px-1 py-0.5 rounded border border-slate-700 shrink-0">
                  {formData.invoiceNumber}
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap text-[10px] sm:text-[11px] text-slate-300">
                <span className="flex items-center gap-1 font-bold truncate max-w-[130px] sm:max-w-none">
                  <MapPin className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                  <span className="truncate">{formData.governorate} - {formData.city}</span>
                </span>
                <span className="text-slate-600 hidden xs:inline">•</span>
                <span className="flex items-center gap-1 font-bold truncate max-w-[120px] sm:max-w-none">
                  <Tag className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                  <span className="truncate">{formData.category}</span>
                </span>
              </div>

              <div className="flex items-center gap-1 flex-wrap pt-0.5">
                <span className={`text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full border ${directoryBadge.cls}`} title="حالة الاعتماد للظهور على دليل المنصة">
                  {directoryBadge.label}
                </span>
                <span className={`text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full border ${paymentBadge.cls}`}>
                  {paymentBadge.label}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 pt-0.5">
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
                className={`text-[11px] sm:text-xs font-black px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-sm active:scale-95 ${
                  isEditMode
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/50'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                }`}
                title={isEditMode ? 'حفظ التعديلات' : 'تعديل البيانات'}
              >
                {isEditMode ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Pencil className="w-3 h-3 stroke-[2.5]" />}
                <span>{isEditMode ? 'حفظ' : 'تعديل'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              title="إغلاق النافذة"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* ── 2. STREAMLINED QUICK ACTIONS STRIP ──────────────────────── */}
        <div className="px-2.5 sm:px-4 py-1.5 bg-[var(--input-bg)]/90 border-b border-[var(--border-color)] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {cleanPhone && (
            <a
              href={`tel:${cleanPhone}`}
              className="bg-[var(--bg-card)] hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-bold px-2.5 py-1 rounded-xl transition-transform active:scale-95 flex items-center gap-1 shrink-0 shadow-2xs"
            >
              <Phone className="w-3 h-3" />
              <span>اتصال</span>
            </a>
          )}

          {onShowInvoice && (
            <button
              type="button"
              onClick={() => onShowInvoice(formData)}
              className="bg-[var(--bg-card)] hover:bg-amber-500/10 text-[var(--text-primary)] border border-[var(--border-color)] text-[11px] font-bold px-2.5 py-1 rounded-xl transition-transform active:scale-95 flex items-center gap-1 shrink-0 shadow-2xs cursor-pointer"
            >
              <FileText className="w-3 h-3 text-amber-500" />
              <span>فاتورة</span>
            </button>
          )}

          {mapsUrl ? (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-[var(--bg-card)] hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-[11px] font-bold px-2.5 py-1 rounded-xl transition-transform active:scale-95 flex items-center gap-1 shrink-0 shadow-2xs"
              title="فتح موقع النشاط الموثق على خرائط Google"
            >
              <ExternalLink className="w-3 h-3 text-blue-500" />
              <span>الخريطة</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={() => setActiveSection('location')}
              className="bg-[var(--bg-card)] hover:bg-blue-500/10 text-slate-500 dark:text-slate-400 border border-slate-700/40 text-[11px] font-medium px-2.5 py-1 rounded-xl flex items-center gap-1 shrink-0 cursor-pointer"
              title="انقر لإضافة وتوثيق رابط خرائط Google"
            >
              <MapPin className="w-3 h-3 text-amber-500" />
              <span>إضافة خريطة</span>
            </button>
          )}

          {/* Pulsing Red Financial Alert Indicator - Strictly for activities verified on Google with valid Google link and unpaid */}
          {isGoogleVerifiedAndUnpaid && (
            <button
              type="button"
              onClick={() => {
                if (onCollectPayment) {
                  onCollectPayment(formData);
                } else {
                  setActiveSection('payment');
                }
              }}
              className="relative flex items-center gap-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-700 dark:text-rose-300 border border-rose-500/50 text-[11px] font-black px-2.5 py-1 rounded-xl transition-all active:scale-95 shrink-0 cursor-pointer shadow-xs animate-pulse"
              title={`تنبيه مالي: النشاط موثق على Google وغير مسدد (متبقي ${remainingDebt} ج.م)`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
              </span>
              <AlertTriangle className="w-3 h-3 text-rose-500 stroke-[2.5]" />
              <span>تنبيه ({remainingDebt} ج)</span>
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
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black text-[11px] px-3 py-1 rounded-xl shadow-xs transition-transform active:scale-95 flex items-center gap-1 shrink-0 cursor-pointer mr-auto"
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

          {errorMsg && (
            <div className="bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-400 p-3 rounded-2xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ── TAB 1: تفاصيل وبيانات النشاط ──────────────────────────── */}
          {activeSection === 'info' && (
            <EditGeneralInfoTab
              formData={formData}
              setFormData={setFormData}
              isEditMode={isEditMode}
              copiedField={copiedField}
              handleCopyText={handleCopyText}
              isAdminOrFinancial={isAdminOrFinancial}
              onNavigateToWhatsApp={() => setActiveSection('whatsapp')}
            />
          )}

          {/* ── TAB 2: الموقع وخرائط Google ───────────────────────────── */}
          {activeSection === 'location' && (
            <EditLocationTab
              formData={formData}
              setFormData={setFormData}
              isEditMode={isEditMode}
              isAdminOrFinancial={isAdminOrFinancial}
              googleBadge={googleBadge}
              handleCopyGoogleDetails={handleCopyGoogleDetails}
              handleDownloadAllPhotos={handleDownloadAllPhotos}
              handleSetVerificationStatus={handleSetVerificationStatus}
              copiedField={copiedField}
              isDownloadingPhotos={isDownloadingPhotos}
            />
          )}

          {/* ── TAB 3: الباقة والبيانات المالية ───────────────────────── */}
          {activeSection === 'payment' && (
            <EditPackagePaymentTab
              formData={formData}
              setFormData={setFormData}
              isEditMode={isEditMode}
              isAdminOrFinancial={isAdminOrFinancial}
              canEdit={canEdit}
              remainingDebt={remainingDebt}
              handleToggleFeeExempt={handleToggleFeeExempt}
            />
          )}

          {/* ── TAB 4: معرض الصور والفيديو ────────────────────────────── */}
          {activeSection === 'photos' && (
            <EditMediaTab
              formData={formData}
              totalMediaCount={totalMediaCount}
              isUploading={isUploading}
              isUploadingVideo={isUploadingVideo}
              handlePhotoUpload={handlePhotoUpload}
              handleVideoUpload={handleVideoUpload}
              handleRemovePhoto={handleRemovePhoto}
              handleRemoveVideo={handleRemoveVideo}
              setSelectedPhotoPreview={setSelectedPhotoPreview}
            />
          )}

          {/* ── TAB 5: مركز رسائل الواتساب والتسويق ────────────────────── */}
          {activeSection === 'whatsapp' && (
            <EditMarketingTab
              formData={formData}
              isAdminOrFinancial={isAdminOrFinancial}
              isAlreadyOnGoogle={Boolean(formData.isAlreadyOnGoogle || formData.packageId === 'pkg_already_on_google' || formData.registrationType === 'already_on_google')}
              hasVerifiedGoogleMap={Boolean(formData.googleMapsUrl && formData.googleMapsUrl.trim().startsWith('http'))}
              isGoogleVerifiedAndUnpaid={Boolean(formData.verificationStatus === 'verified' && formData.paymentStatus !== 'fully_paid')}
              copiedField={copiedField}
              handleCopyText={handleCopyText}
            />
          )}

          {/* ── TAB 6: سجل المتابعات الإدارية CRM ─────────────────────── */}
          {activeSection === 'admin_followup' && (
            <EditFollowUpsTab
              formData={formData}
              setFormData={setFormData}
              onSave={onSave}
              currentUserName={currentUserName}
              currentUserId={currentUserId}
              userRole={userRole}
              currentRoleTitle={currentRoleTitle}
              onShowNotification={(msg) => {
                setStatusNotification(msg);
                setTimeout(() => setStatusNotification(null), 3000);
              }}
            />
          )}
        </div>

        {/* ── 5. CLEAN & ERGONOMIC BOTTOM SHEET FOOTER ────────────────── */}
        <div className="p-2.5 sm:p-3 bg-[var(--input-bg)] border-t border-[var(--border-color)] flex items-center justify-between gap-2 shrink-0 pb-[max(0.6rem,env(safe-area-inset-bottom))]">
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
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-500/15 border border-rose-500/20 text-xs font-bold p-2 sm:px-3 sm:py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                title="حذف النشاط"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">حذف النشاط</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
            <button
              type="button"
              onClick={onClose}
              className="bg-[var(--bg-card)] hover:bg-slate-500/10 text-[var(--text-secondary)] border border-[var(--border-color)] text-xs font-bold px-3.5 py-2 rounded-xl transition-colors cursor-pointer active:scale-95 shrink-0"
            >
              إغلاق
            </button>

            {canEdit && (
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 sm:flex-initial bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 text-xs sm:text-sm font-black px-4 sm:px-5 py-2 rounded-xl shadow-md transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>حفظ التعديلات</span>
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
