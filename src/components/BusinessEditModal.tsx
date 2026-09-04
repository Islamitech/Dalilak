import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Business, VerificationStatus, AdminFollowUpNote, AdminFollowUpType, AdminFollowUpStatus } from '../types';
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
  ClipboardList,
  Calendar,
  Search,
  Plus,
  CheckSquare,
  Eye,
  EyeOff,
  Zap,
} from 'lucide-react';

import { downloadSinglePhoto, downloadAllBusinessPhotos } from '../utils/photoDownloader';
import { VideoWatermarkBadge } from './VideoWatermarkBadge';
import { triggerHaptic } from '../utils/haptics';
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
  getLegalActionExecutedWhatsAppUrl,
  generateLegalActionExecutedWhatsAppMessage,
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

  // Tab navigation: default to 'admin_followup' as requested for admins/supervisors/accountants
  const [activeSection, setActiveSection] = useState<'info' | 'owner' | 'location' | 'payment' | 'photos' | 'whatsapp' | 'admin_followup'>(
    (initialTab as any) || (isAdminOrFinancial ? 'admin_followup' : 'info')
  );
  const [selectedMotiGroupName, setSelectedMotiGroupName] = useState<string>('');

  useEffect(() => {
    if (initialTab && ['info', 'owner', 'location', 'payment', 'photos', 'whatsapp', 'admin_followup'].includes(initialTab)) {
      setActiveSection(initialTab as any);
    } else if (!initialTab) {
      setActiveSection(isAdminOrFinancial ? 'admin_followup' : 'info');
    }
  }, [initialTab, business?.id, isAdminOrFinancial]);

  // Admin CRM Follow-ups State
  const [newFollowUpText, setNewFollowUpText] = useState<string>('');
  const [newFollowUpType, setNewFollowUpType] = useState<AdminFollowUpType | null>(null);
  const [newFollowUpStatus, setNewFollowUpStatus] = useState<AdminFollowUpStatus | null>(null);
  const [newFollowUpNextDate, setNewFollowUpNextDate] = useState<string>('');
  const [followUpError, setFollowUpError] = useState<string | null>(null);
  const [followUpFilterType, setFollowUpFilterType] = useState<string>('all');
  const [followUpSearch, setFollowUpSearch] = useState<string>('');
  const [isSavingFollowUp, setIsSavingFollowUp] = useState<boolean>(false);

  // Mobile-first WhatsApp Hub Sub-Tabs & Collapsible Preview State
  const [waSubTab, setWaSubTab] = useState<'operational' | 'motivational' | 'marketing'>('operational');
  const [expandedWaPreview, setExpandedWaPreview] = useState<string | null>(null);
  const [waSearchQuery, setWaSearchQuery] = useState<string>('');

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

  // Admin CRM Follow-up Handlers
  const handleAddFollowUp = () => {
    if (!formData) return;
    if (!newFollowUpText.trim()) {
      setFollowUpError('يرجى كتابة نص الملاحظة أو تفاصيل الإجراء أولاً');
      return;
    }
    if (!newFollowUpType) {
      setFollowUpError('⚠️ خطوة إلزامية: يرجى تحديد طبيعة ونوع الإجراء (اتصال، زيارة، تحصيل...)');
      return;
    }
    if (!newFollowUpStatus) {
      setFollowUpError('⚠️ خطوة إلزامية: يرجى تحديد حالة الإجراء (مكتمل، معلق، عاجل)');
      return;
    }

    setFollowUpError(null);
    setIsSavingFollowUp(true);
    try {
      const newNote: AdminFollowUpNote = {
        id: `af_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        authorId: currentUserId || 'admin_1',
        authorName: currentUserName || currentRoleTitle || (userRole === 'accountant' ? 'المحاسب المعتمد' : userRole === 'supervisor' ? 'المشرف الميداني' : 'مدير النظام'),
        authorRole: userRole || 'admin',
        type: newFollowUpType,
        status: newFollowUpStatus,
        text: newFollowUpText.trim(),
        createdAt: new Date().toISOString(),
        nextFollowUpDate: newFollowUpNextDate ? newFollowUpNextDate : undefined,
      };

      const updatedFollowUps = [newNote, ...(formData.adminFollowUps || [])];
      const updatedBiz: Business = {
        ...formData,
        adminFollowUps: updatedFollowUps,
      };

      setFormData(updatedBiz);
      onSave(updatedBiz);
      setNewFollowUpText('');
      setNewFollowUpType(null);
      setNewFollowUpStatus(null);
      setNewFollowUpNextDate('');
      setFollowUpError(null);
      setStatusNotification('تم تسجيل المتابعة الإدارية وتصنيفها بنجاح 📋');
      setTimeout(() => setStatusNotification(null), 3000);
    } finally {
      setIsSavingFollowUp(false);
    }
  };

  const handleDeleteFollowUp = (noteId: string) => {
    if (!formData) return;
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذه المتابعة الإدارية؟')) return;
    const updatedFollowUps = (formData.adminFollowUps || []).filter((n) => n.id !== noteId);
    const updatedBiz: Business = {
      ...formData,
      adminFollowUps: updatedFollowUps,
    };
    setFormData(updatedBiz);
    onSave(updatedBiz);
    setStatusNotification('تم حذف الملاحظة الإدارية بنجاح');
    setTimeout(() => setStatusNotification(null), 3000);
  };

  const handleToggleFollowUpStatus = (noteId: string) => {
    if (!formData) return;
    const updatedFollowUps = (formData.adminFollowUps || []).map((n) => {
      if (n.id === noteId) {
        return {
          ...n,
          status: (n.status === 'completed' ? 'pending' : 'completed') as AdminFollowUpStatus,
        };
      }
      return n;
    });
    const updatedBiz: Business = {
      ...formData,
      adminFollowUps: updatedFollowUps,
    };
    setFormData(updatedBiz);
    onSave(updatedBiz);
  };

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

  const [touchStartY, setTouchStartY] = useState<number | null>(null);

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

          {/* ── TAB 6: مركز رسائل وإشعارات الواتساب الموحد (MOBILE-FIRST REDESIGNED) ───────────── */}
          {activeSection === 'whatsapp' && isAdminOrFinancial && (
            <div className="space-y-3 text-right">
              {/* Header Info */}
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-black shrink-0">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
                      مركز رسائل WhatsApp المعتمدة
                    </h4>
                    <p className="text-[10px] text-[var(--text-muted)] font-bold">
                      أزرار إرسال سريعة ومنظمة بحسب الحدث وحالة النشاط
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20" dir="ltr">
                  {formData.phone || formData.ownerPhone || 'لا يوجد هاتف'}
                </span>
              </div>

              {/* ── 🚀 SMART 1-TAP QUICK ACTIONS BAR (TOP PRIORITY ON MOBILE) ── */}
              <div className="bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 border border-emerald-500/30 rounded-2xl p-2.5 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between text-[11px] font-black text-emerald-800 dark:text-emerald-300">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>إجراءات فورية سريعة (ضغطة واحدة):</span>
                  </div>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-md font-bold">
                    إرسال فوري
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5">
                  {/* 1. Quick Invoice or Welcome */}
                  {isAlreadyOnGoogle ? (
                    <a
                      href={getWelcomeAlreadyOnGoogleWhatsAppUrl(formData)}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black py-2 px-2 rounded-xl flex items-center justify-center gap-1 shadow-xs transition-transform active:scale-95 text-center"
                      title="إرسال رسالة الترحيب بالدليل"
                    >
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">ترحيب الدليل 🎁</span>
                    </a>
                  ) : (
                    <a
                      href={getInvoiceWhatsAppUrl(formData)}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-black py-2 px-2 rounded-xl flex items-center justify-center gap-1 shadow-xs transition-transform active:scale-95 text-center"
                      title="إرسال الفاتورة الأولية وتأكيد التسجيل"
                    >
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">الفاتورة الأولية 📄</span>
                    </a>
                  )}

                  {/* 2. Google Maps Verified Notice */}
                  {hasVerifiedGoogleMap && (
                    <a
                      href={getGoogleMapsVerifiedWhatsAppUrl(formData)}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black py-2 px-2 rounded-xl flex items-center justify-center gap-1 shadow-xs transition-transform active:scale-95 text-center"
                      title="إرسال إشعار التوثيق على خرائط Google"
                    >
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">توثيق Google 🗺️</span>
                    </a>
                  )}

                  {/* 3. Debt Warning / Judicial notice */}
                  {isGoogleVerifiedAndUnpaid && (
                    <a
                      href={getOverdueWarningWhatsAppUrl(formData)}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-gradient-to-r from-rose-600 to-red-600 text-white text-[11px] font-black py-2 px-2 rounded-xl flex items-center justify-center gap-1 shadow-xs transition-transform active:scale-95 text-center animate-pulse"
                      title="إرسال إنذار سداد المستحقات"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">إنذار سداد ⚠️</span>
                    </a>
                  )}

                  {/* 4. Payment Receipt */}
                  <a
                    href={getPaymentReceiptWhatsAppUrl(formData)}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-black py-2 px-2 rounded-xl flex items-center justify-center gap-1 shadow-xs transition-transform active:scale-95 text-center"
                    title="إرسال إيصال السداد المالي والمخالصة"
                  >
                    <DollarSign className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">إيصال السداد ✅</span>
                  </a>
                </div>
              </div>

              {/* ── 🏷️ SEGMENTED INTERNAL SUB-TABS ── */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-[var(--input-bg)] rounded-2xl border border-[var(--border-color)] text-[11px] font-black shadow-inner">
                <button
                  type="button"
                  onClick={() => setWaSubTab('operational')}
                  className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    waSubTab === 'operational'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>⚡ إجرائية ومالية</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWaSubTab('motivational')}
                  className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    waSubTab === 'motivational'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>🌟 نصائح وتحفيز</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWaSubTab('marketing')}
                  className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    waSubTab === 'marketing'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>🎁 تسويق ومتابعة</span>
                </button>
              </div>

              {/* ── 🔍 OPTIONAL QUICK SEARCH IN MESSAGES ── */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={waSearchQuery}
                  onChange={(e) => setWaSearchQuery(e.target.value)}
                  placeholder="بحث سريع في عناوين الرسائل (مثل: فاتورة، إنذار، باركود)..."
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl pr-8 pl-8 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-emerald-500/50 transition-colors"
                />
                {waSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setWaSearchQuery('')}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* ── 📑 SUB-TAB 1: OPERATIONAL & FINANCIAL MESSAGES ── */}
              {waSubTab === 'operational' && (
                <div className="space-y-2 pt-0.5">
                  {/* Message 1: Welcome or Initial Invoice */}
                  {isAlreadyOnGoogle ? (
                    (!waSearchQuery || 'ترحيب الدليل إدراج مجانا'.includes(waSearchQuery)) && (
                      <div className="bg-[var(--bg-card)] border border-blue-500/30 rounded-2xl p-2.5 space-y-2 transition-all shadow-2xs">
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 font-black text-xs text-[var(--text-primary)] truncate">
                            <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span className="truncate">1. الترحيب وإدراج النشاط بالدليل (مجاناً) 🎁</span>
                          </div>
                          <span className="text-[9px] bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-md shrink-0">
                            مسجل مسبقاً
                          </span>
                        </div>

                        {/* Collapsible Preview Box */}
                        {expandedWaPreview === 'wa_welcome' && (
                          <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-blue-500/20 text-[11px] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto animate-fade-in font-sans">
                            {generateWelcomeAlreadyOnGoogleWhatsAppMessage(formData)}
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 pt-0.5">
                          <button
                            type="button"
                            onClick={() => setExpandedWaPreview(expandedWaPreview === 'wa_welcome' ? null : 'wa_welcome')}
                            className="bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold py-1.5 px-2.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                            title="معاينة نص الرسالة"
                          >
                            {expandedWaPreview === 'wa_welcome' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            <span className="text-[10px] hidden sm:inline">{expandedWaPreview === 'wa_welcome' ? 'إخفاء' : 'معاينة'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyText(generateWelcomeAlreadyOnGoogleWhatsAppMessage(formData), 'wa_welcome')}
                            className="bg-[var(--input-bg)] hover:bg-blue-500/15 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
                            title="نسخ نص الرسالة"
                          >
                            {copiedField === 'wa_welcome' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-blue-500" />}
                          </button>
                          <a
                            href={getWelcomeAlreadyOnGoogleWhatsAppUrl(formData)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white font-black text-xs py-1.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 text-center"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>إرسال عبر WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    )
                  ) : (
                    (!waSearchQuery || 'فاتورة الكترونية تسجيل مبدئية'.includes(waSearchQuery)) && (
                      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-amber-500/40 rounded-2xl p-2.5 space-y-2 transition-all shadow-2xs">
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 font-black text-xs text-[var(--text-primary)] truncate">
                            <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="truncate">1. الفاتورة الإلكترونية الأولية وتأكيد التسجيل 📄</span>
                          </div>
                          <span className="text-[9px] bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold px-2 py-0.5 rounded-md shrink-0">
                            عند التسجيل
                          </span>
                        </div>

                        {/* Collapsible Preview Box */}
                        {expandedWaPreview === 'wa_inv' && (
                          <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-amber-500/20 text-[11px] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto animate-fade-in font-sans">
                            {generateInvoiceWhatsAppMessage(formData)}
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 pt-0.5">
                          <button
                            type="button"
                            onClick={() => setExpandedWaPreview(expandedWaPreview === 'wa_inv' ? null : 'wa_inv')}
                            className="bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold py-1.5 px-2.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                            title="معاينة نص الرسالة"
                          >
                            {expandedWaPreview === 'wa_inv' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            <span className="text-[10px] hidden sm:inline">{expandedWaPreview === 'wa_inv' ? 'إخفاء' : 'معاينة'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyText(generateInvoiceWhatsAppMessage(formData), 'wa_inv')}
                            className="bg-[var(--bg-card)] hover:bg-amber-500/15 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
                            title="نسخ نص الفاتورة"
                          >
                            {copiedField === 'wa_inv' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-amber-500" />}
                          </button>
                          <a
                            href={getInvoiceWhatsAppUrl(formData)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 text-white font-black text-xs py-1.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 text-center"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>إرسال الفاتورة (WhatsApp)</span>
                          </a>
                        </div>
                      </div>
                    )
                  )}

                  {/* Message 2: Google Maps Verification Notice */}
                  {(!waSearchQuery || 'توثيق اعتماد خرائط جوجل maps'.includes(waSearchQuery)) && (
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-blue-500/40 rounded-2xl p-2.5 space-y-2 transition-all shadow-2xs">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 font-black text-xs text-[var(--text-primary)] truncate">
                          <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="truncate">2. إشعار التوثيق والاعتماد على خرائط Google 🗺️</span>
                        </div>
                        <span className="text-[9px] bg-blue-500/15 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-md shrink-0">
                          بعد التوثيق
                        </span>
                      </div>

                      {/* Collapsible Preview Box */}
                      {expandedWaPreview === 'wa_maps' && (
                        <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-blue-500/20 text-[11px] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto animate-fade-in font-sans">
                          {generateGoogleMapsVerifiedWhatsAppMessage(formData)}
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => setExpandedWaPreview(expandedWaPreview === 'wa_maps' ? null : 'wa_maps')}
                          className="bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold py-1.5 px-2.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                          title="معاينة نص الرسالة"
                        >
                          {expandedWaPreview === 'wa_maps' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span className="text-[10px] hidden sm:inline">{expandedWaPreview === 'wa_maps' ? 'إخفاء' : 'معاينة'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyText(generateGoogleMapsVerifiedWhatsAppMessage(formData), 'wa_maps')}
                          className="bg-[var(--bg-card)] hover:bg-blue-500/15 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
                          title="نسخ نص الإشعار"
                        >
                          {copiedField === 'wa_maps' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-blue-500" />}
                        </button>
                        <a
                          href={getGoogleMapsVerifiedWhatsAppUrl(formData)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 text-white font-black text-xs py-1.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 text-center"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>إرسال إشعار التوثيق (Google)</span>
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Message 3: Overdue Warning (Strictly Google Verified and Unpaid) */}
                  {isGoogleVerifiedAndUnpaid && (!waSearchQuery || 'إنذار تحذير سداد مستحقات ديون مهلة'.includes(waSearchQuery)) && (
                    <div className="bg-rose-500/10 border border-rose-500/40 rounded-2xl p-2.5 space-y-2 transition-all shadow-2xs">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 font-black text-xs text-rose-700 dark:text-rose-300 truncate">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 stroke-[2.5]" />
                          <span className="truncate">3. إنذار بسداد المستحقات ({remainingDebt} ج.م) ⚠️</span>
                        </div>
                        <span className="text-[9px] bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold px-2 py-0.5 rounded-md shrink-0">
                          مهلة 24 ساعة
                        </span>
                      </div>

                      {/* Collapsible Preview Box */}
                      {expandedWaPreview === 'wa_warn' && (
                        <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-rose-500/30 text-[11px] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto animate-fade-in font-sans">
                          {generateOverdueWarningWhatsAppMessage(formData)}
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => setExpandedWaPreview(expandedWaPreview === 'wa_warn' ? null : 'wa_warn')}
                          className="bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold py-1.5 px-2.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                          title="معاينة نص الرسالة"
                        >
                          {expandedWaPreview === 'wa_warn' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span className="text-[10px] hidden sm:inline">{expandedWaPreview === 'wa_warn' ? 'إخفاء' : 'معاينة'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyText(generateOverdueWarningWhatsAppMessage(formData), 'wa_warn')}
                          className="bg-[var(--bg-card)] hover:bg-rose-500/15 text-rose-600 border border-rose-500/30 text-xs font-bold p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
                          title="نسخ نص الإنذار"
                        >
                          {copiedField === 'wa_warn' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-rose-500" />}
                        </button>
                        <a
                          href={getOverdueWarningWhatsAppUrl(formData)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 text-white font-black text-xs py-1.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 text-center"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>إرسال إنذار السداد الرسمي</span>
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Message 4: Post-Deadline Executed Actions & Judicial Escalation */}
                  {isGoogleVerifiedAndUnpaid && (!waSearchQuery || 'إشعار تنفيذ إجراءات تحذير قضائي محكمة تروكلر'.includes(waSearchQuery)) && (
                    <div className="bg-red-500/15 border border-red-500/50 rounded-2xl p-2.5 space-y-2 transition-all shadow-2xs">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 font-black text-xs text-red-700 dark:text-red-400 truncate">
                          <ShieldCheck className="w-3.5 h-3.5 text-red-500 shrink-0 stroke-[2.5]" />
                          <span className="truncate">4. إشعار تنفيذ الإجراءات والتحذير القضائي 🛑</span>
                        </div>
                        <span className="text-[9px] bg-red-500/25 text-red-700 dark:text-red-300 font-black px-2 py-0.5 rounded-md animate-pulse shrink-0">
                          بعد انتهاء المهلة
                        </span>
                      </div>

                      {/* Collapsible Preview Box */}
                      {expandedWaPreview === 'wa_legal' && (
                        <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-red-500/40 text-[11px] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto animate-fade-in font-sans">
                          {generateLegalActionExecutedWhatsAppMessage(formData)}
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => setExpandedWaPreview(expandedWaPreview === 'wa_legal' ? null : 'wa_legal')}
                          className="bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold py-1.5 px-2.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                          title="معاينة نص الرسالة"
                        >
                          {expandedWaPreview === 'wa_legal' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span className="text-[10px] hidden sm:inline">{expandedWaPreview === 'wa_legal' ? 'إخفاء' : 'معاينة'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyText(generateLegalActionExecutedWhatsAppMessage(formData), 'wa_legal')}
                          className="bg-[var(--bg-card)] hover:bg-red-500/15 text-red-600 border border-red-500/30 text-xs font-bold p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
                          title="نسخ نص الإشعار القضائي"
                        >
                          {copiedField === 'wa_legal' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-red-500" />}
                        </button>
                        <a
                          href={getLegalActionExecutedWhatsAppUrl(formData)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 bg-gradient-to-r from-red-700 to-rose-900 hover:from-red-600 text-white font-black text-xs py-1.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 text-center"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>إرسال إشعار التنفيذ والملاحقة</span>
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Message 5: Payment Receipt */}
                  {(!waSearchQuery || 'إيصال سداد مخالصة دفع تحصيل'.includes(waSearchQuery)) && (
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-emerald-500/40 rounded-2xl p-2.5 space-y-2 transition-all shadow-2xs">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 font-black text-xs text-[var(--text-primary)] truncate">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">5. إيصال السداد المالي والمخالصة ✅</span>
                        </div>
                        <span className="text-[9px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md shrink-0">
                          المخالصة
                        </span>
                      </div>

                      {/* Collapsible Preview Box */}
                      {expandedWaPreview === 'wa_pay' && (
                        <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-emerald-500/30 text-[11px] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto animate-fade-in font-sans">
                          {generatePaymentReceiptWhatsAppMessage(formData)}
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => setExpandedWaPreview(expandedWaPreview === 'wa_pay' ? null : 'wa_pay')}
                          className="bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold py-1.5 px-2.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                          title="معاينة نص الرسالة"
                        >
                          {expandedWaPreview === 'wa_pay' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span className="text-[10px] hidden sm:inline">{expandedWaPreview === 'wa_pay' ? 'إخفاء' : 'معاينة'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyText(generatePaymentReceiptWhatsAppMessage(formData), 'wa_pay')}
                          className="bg-[var(--bg-card)] hover:bg-emerald-500/15 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
                          title="نسخ نص الإيصال"
                        >
                          {copiedField === 'wa_pay' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-emerald-500" />}
                        </button>
                        <a
                          href={getPaymentReceiptWhatsAppUrl(formData)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 text-white font-black text-xs py-1.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 text-center"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>إرسال إيصال السداد المالي</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── 🌟 SUB-TAB 2: MOTIVATIONAL & CUSTOMER LOYALTY CAMPAIGNS ── */}
              {waSubTab === 'motivational' && (() => {
                const autoGroup = getMotivationalGroupByBusiness(formData);
                const currentGroupName = selectedMotiGroupName || autoGroup.groupName;
                const activeGroupObj = CATEGORY_MOTIVATIONAL_DATA.find((g) => g.groupName === currentGroupName) || autoGroup;

                return (
                  <div className="space-y-2 pt-0.5">
                    {/* Category Selector Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px] font-bold">
                      {CATEGORY_MOTIVATIONAL_DATA.map((grp) => {
                        const isSelected = grp.groupName === currentGroupName;
                        return (
                          <button
                            key={grp.groupName}
                            type="button"
                            onClick={() => setSelectedMotiGroupName(grp.groupName)}
                            className={`px-2.5 py-1 rounded-xl border whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-600 text-white font-black border-emerald-500 shadow-xs'
                                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-emerald-500/40'
                            }`}
                          >
                            <span>{grp.groupIcon}</span>
                            <span>{grp.groupName}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Render Active Category Models (Compact Cards) */}
                    <div className="space-y-2">
                      {activeGroupObj.models.map((m, idx) => {
                        const msgText = m.generateText(formData);
                        const waUrl = getCategoryMotivationalWhatsAppUrl(m, formData);
                        const copyKey = `wa_cat_${m.id}`;
                        const isExpanded = expandedWaPreview === copyKey;

                        if (waSearchQuery && !m.title.includes(waSearchQuery) && !msgText.includes(waSearchQuery)) {
                          return null;
                        }

                        return (
                          <div
                            key={m.id}
                            className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-emerald-500/40 rounded-2xl p-2.5 space-y-2 transition-all shadow-2xs"
                          >
                            <div className="flex items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1.5 font-black text-xs text-[var(--text-primary)] truncate">
                                <span>{m.icon}</span>
                                <span className="truncate">{idx + 1}. {m.title}</span>
                              </div>
                              <span className="text-[9px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md shrink-0">
                                {m.badge}
                              </span>
                            </div>

                            {/* Collapsible Preview Box */}
                            {isExpanded && (
                              <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-emerald-500/20 text-[11px] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto animate-fade-in font-sans">
                                {msgText}
                              </div>
                            )}

                            <div className="flex items-center gap-1.5 pt-0.5">
                              <button
                                type="button"
                                onClick={() => setExpandedWaPreview(isExpanded ? null : copyKey)}
                                className="bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold py-1.5 px-2.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                                title="معاينة نص الرسالة"
                              >
                                {isExpanded ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                <span className="text-[10px] hidden sm:inline">{isExpanded ? 'إخفاء' : 'معاينة'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyText(msgText, copyKey)}
                                className="bg-[var(--input-bg)] hover:bg-emerald-500/15 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
                                title="نسخ نص الرسالة"
                              >
                                {copiedField === copyKey ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-emerald-500" />}
                              </button>
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black text-xs py-1.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 text-center"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>إرسال نصيحة التحفيز 🚀</span>
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* ── 🎁 SUB-TAB 3: MARKETING & NURTURING CAMPAIGNS ── */}
              {waSubTab === 'marketing' && (
                <div className="space-y-2 pt-0.5">
                  {/* Campaign 1: Free QR Stand & 100 EGP Print Delivery */}
                  {(!waSearchQuery || 'هدية باركود استاند طباعة 100'.includes(waSearchQuery)) && (
                    <div className="bg-[var(--bg-card)] border border-amber-500/30 rounded-2xl p-2.5 space-y-2 transition-all shadow-2xs">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 font-black text-xs text-[var(--text-primary)] truncate">
                          <Gift className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate">الحملة 1: 🎁 هدية باركود التقييمات + الطباعة (100 ج)</span>
                        </div>
                        <span className="text-[9px] bg-amber-500/20 text-amber-900 dark:text-amber-300 font-bold px-2 py-0.5 rounded-md shrink-0">
                          هدية ومبيعات
                        </span>
                      </div>

                      {expandedWaPreview === 'wa_qr_gift' && (
                        <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-amber-500/20 text-[11px] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto animate-fade-in font-sans">
                          {generateFreeQrGiftWhatsAppMessage(formData)}
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => setExpandedWaPreview(expandedWaPreview === 'wa_qr_gift' ? null : 'wa_qr_gift')}
                          className="bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold py-1.5 px-2.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                          title="معاينة نص الرسالة"
                        >
                          {expandedWaPreview === 'wa_qr_gift' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span className="text-[10px] hidden sm:inline">{expandedWaPreview === 'wa_qr_gift' ? 'إخفاء' : 'معاينة'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyText(generateFreeQrGiftWhatsAppMessage(formData), 'wa_qr_gift')}
                          className="bg-[var(--bg-card)] hover:bg-amber-500/15 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
                          title="نسخ نص الرسالة"
                        >
                          {copiedField === 'wa_qr_gift' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-amber-500" />}
                        </button>
                        <a
                          href={getFreeQrGiftWhatsAppUrl(formData)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 text-slate-950 font-black text-xs py-1.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1 transition-transform active:scale-95 text-center"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>إرسال هدية الـ QR والطباعة</span>
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Campaign 2: QR Importance & Video Guide */}
                  {(!waSearchQuery || 'أهمية باركود فيديو توضيحي qr'.includes(waSearchQuery)) && (
                    <div className="bg-[var(--bg-card)] border border-blue-500/30 rounded-2xl p-2.5 space-y-2 transition-all shadow-2xs">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 font-black text-xs text-[var(--text-primary)] truncate">
                          <QrCode className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="truncate">الحملة 2: 📲 أهمية الـ QR Code داخل النشاط (فيديو 🎥)</span>
                        </div>
                        <span className="text-[9px] bg-blue-500/20 text-blue-900 dark:text-blue-300 font-bold px-2 py-0.5 rounded-md shrink-0">
                          فيديو توضيحي
                        </span>
                      </div>

                      {expandedWaPreview === 'wa_qr_importance' && (
                        <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-blue-500/20 text-[11px] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto animate-fade-in font-sans">
                          {generateQrImportanceWhatsAppMessage(formData)}
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => setExpandedWaPreview(expandedWaPreview === 'wa_qr_importance' ? null : 'wa_qr_importance')}
                          className="bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold py-1.5 px-2.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                          title="معاينة نص الرسالة"
                        >
                          {expandedWaPreview === 'wa_qr_importance' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span className="text-[10px] hidden sm:inline">{expandedWaPreview === 'wa_qr_importance' ? 'إخفاء' : 'معاينة'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyText(generateQrImportanceWhatsAppMessage(formData), 'wa_qr_importance')}
                          className="bg-[var(--bg-card)] hover:bg-blue-500/15 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
                          title="نسخ نص الرسالة"
                        >
                          {copiedField === 'wa_qr_importance' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-blue-500" />}
                        </button>
                        <a
                          href={getQrImportanceWhatsAppUrl(formData)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white font-black text-xs py-1.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1 transition-transform active:scale-95 text-center"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>إرسال رسالة الـ QR والفيديو</span>
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Campaign 3: Visual Merchandising Consultation */}
                  {(!waSearchQuery || 'استشارة عرض وتنسيق بصري مجانية تسويق'.includes(waSearchQuery)) && (
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-amber-500/40 rounded-2xl p-2.5 space-y-2 transition-all shadow-2xs">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 font-black text-xs text-[var(--text-primary)] truncate">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate">الحملة 3: 💡 استشارة العرض والتنسيق البصري المجانية</span>
                        </div>
                        <span className="text-[9px] bg-blue-500/15 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-md shrink-0">
                          استشارة مجانية
                        </span>
                      </div>

                      {expandedWaPreview === 'wa_visual' && (
                        <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-[var(--border-color)] text-[11px] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto animate-fade-in font-sans">
                          {generateVisualConsultingWhatsAppMessage(formData)}
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => setExpandedWaPreview(expandedWaPreview === 'wa_visual' ? null : 'wa_visual')}
                          className="bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold py-1.5 px-2.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                          title="معاينة نص الرسالة"
                        >
                          {expandedWaPreview === 'wa_visual' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span className="text-[10px] hidden sm:inline">{expandedWaPreview === 'wa_visual' ? 'إخفاء' : 'معاينة'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyText(generateVisualConsultingWhatsAppMessage(formData), 'wa_visual')}
                          className="bg-[var(--bg-card)] hover:bg-amber-500/15 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
                          title="نسخ نص الرسالة"
                        >
                          {copiedField === 'wa_visual' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-amber-500" />}
                        </button>
                        <a
                          href={getVisualConsultingWhatsAppUrl(formData)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 text-white font-black text-xs py-1.5 px-3 rounded-xl border border-slate-700 shadow-xs flex items-center justify-center gap-1 transition-transform active:scale-95 text-center"
                        >
                          <Send className="w-3.5 h-3.5 text-amber-400" />
                          <span>إرسال استشارة التنسيق البصري</span>
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Campaign 4: Business Checkup & Working Hours */}
                  {(!waSearchQuery || 'فحص نبض النشاط تحديث مواعيد اطمئنان'.includes(waSearchQuery)) && (
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-blue-500/40 rounded-2xl p-2.5 space-y-2 transition-all shadow-2xs">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 font-black text-xs text-[var(--text-primary)] truncate">
                          <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="truncate">الحملة 4: ☕ فحص نبض النشاط وتحديث المواعيد</span>
                        </div>
                        <span className="text-[9px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md shrink-0">
                          اطمئنان ودعم
                        </span>
                      </div>

                      {expandedWaPreview === 'wa_checkup' && (
                        <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-[var(--border-color)] text-[11px] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto animate-fade-in font-sans">
                          {generateBusinessCheckupWhatsAppMessage(formData)}
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => setExpandedWaPreview(expandedWaPreview === 'wa_checkup' ? null : 'wa_checkup')}
                          className="bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold py-1.5 px-2.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                          title="معاينة نص الرسالة"
                        >
                          {expandedWaPreview === 'wa_checkup' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span className="text-[10px] hidden sm:inline">{expandedWaPreview === 'wa_checkup' ? 'إخفاء' : 'معاينة'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyText(generateBusinessCheckupWhatsAppMessage(formData), 'wa_checkup')}
                          className="bg-[var(--bg-card)] hover:bg-blue-500/15 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
                          title="نسخ نص الرسالة"
                        >
                          {copiedField === 'wa_checkup' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-blue-500" />}
                        </button>
                        <a
                          href={getBusinessCheckupWhatsAppUrl(formData)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 text-white font-black text-xs py-1.5 px-3 rounded-xl border border-slate-700 shadow-xs flex items-center justify-center gap-1 transition-transform active:scale-95 text-center"
                        >
                          <Send className="w-3.5 h-3.5 text-blue-400" />
                          <span>إرسال رسالة الاطمئنان</span>
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Campaign 5: Social Proof & VIP Upgrade */}
                  {(!waSearchQuery || 'قصة نجاح ترقية باقة vip ارباح عملاء'.includes(waSearchQuery)) && (
                    <div className="bg-[var(--bg-card)] border border-purple-500/30 rounded-2xl p-2.5 space-y-2 transition-all shadow-2xs">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 font-black text-xs text-[var(--text-primary)] truncate">
                          <TrendingUp className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          <span className="truncate">الحملة 5: 📈 قصة نجاح وترقية باقة VIP 🚀</span>
                        </div>
                        <span className="text-[9px] bg-purple-500/15 text-purple-700 dark:text-purple-300 font-bold px-2 py-0.5 rounded-md shrink-0">
                          ترقية باقات
                        </span>
                      </div>

                      {expandedWaPreview === 'wa_social' && (
                        <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-purple-500/20 text-[11px] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto animate-fade-in font-sans">
                          {generateSocialProofUpgradeWhatsAppMessage(formData)}
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => setExpandedWaPreview(expandedWaPreview === 'wa_social' ? null : 'wa_social')}
                          className="bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold py-1.5 px-2.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                          title="معاينة نص الرسالة"
                        >
                          {expandedWaPreview === 'wa_social' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span className="text-[10px] hidden sm:inline">{expandedWaPreview === 'wa_social' ? 'إخفاء' : 'معاينة'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyText(generateSocialProofUpgradeWhatsAppMessage(formData), 'wa_social')}
                          className="bg-[var(--bg-card)] hover:bg-purple-500/15 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
                          title="نسخ نص الرسالة"
                        >
                          {copiedField === 'wa_social' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-purple-500" />}
                        </button>
                        <a
                          href={getSocialProofUpgradeWhatsAppUrl(formData)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-black text-xs py-1.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1 transition-transform active:scale-95 text-center"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>إرسال قصة النجاح وباقة VIP</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── 4.7 STRICT ADMIN/SUPERVISOR/ACCOUNTANT: INTERNAL FOLLOW-UPS & CRM NOTES ── */}
          {activeSection === 'admin_followup' && isAdminOrFinancial && (
            <div className="space-y-4 animate-fade-in">
              {/* Header Card */}
              <div className="bg-gradient-to-r from-amber-500/10 via-[var(--input-bg)] to-amber-500/5 border border-amber-500/30 rounded-2xl p-3 sm:p-4 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between gap-2 border-b border-amber-500/20 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-black shrink-0">
                      <ClipboardList className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
                        سجل المتابعات (CRM)
                      </h4>
                      <span className="text-[9px] bg-amber-500/20 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full font-bold">
                        سري 🔒
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] font-black bg-amber-500 text-slate-950 px-2.5 py-1 rounded-lg shrink-0 shadow-2xs">
                    {(formData.adminFollowUps || []).length} إجراء
                  </span>
                </div>

                {/* Quick CRM Metrics Strip */}
                <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                  <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-1.5 rounded-xl">
                    <span className="text-[9px] text-[var(--text-muted)] block font-bold truncate">📞 اتصالات</span>
                    <span className="font-mono font-black text-xs text-[var(--text-primary)]">
                      {(formData.adminFollowUps || []).filter(f => f.type === 'call').length}
                    </span>
                  </div>
                  <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-1.5 rounded-xl">
                    <span className="text-[9px] text-[var(--text-muted)] block font-bold truncate">🏃 زيارات</span>
                    <span className="font-mono font-black text-xs text-[var(--text-primary)]">
                      {(formData.adminFollowUps || []).filter(f => f.type === 'visit').length}
                    </span>
                  </div>
                  <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-1.5 rounded-xl">
                    <span className="text-[9px] text-[var(--text-muted)] block font-bold truncate">💰 تحصيل</span>
                    <span className="font-mono font-black text-xs text-[var(--text-primary)]">
                      {(formData.adminFollowUps || []).filter(f => f.type === 'payment').length}
                    </span>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/30 p-1.5 rounded-xl">
                    <span className="text-[9px] text-amber-600 dark:text-amber-300 block font-bold truncate">⏳ معلق</span>
                    <span className="font-mono font-black text-xs text-amber-600 dark:text-amber-400">
                      {(formData.adminFollowUps || []).filter(f => f.status === 'pending').length}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── ADD NEW FOLLOW-UP NOTE BOX ── */}
              <div className="bg-[var(--input-bg)] border border-[var(--border-color)] focus-within:border-amber-500/50 rounded-2xl p-3 sm:p-4 space-y-2.5 shadow-2xs transition-colors">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                  <h5 className="font-black text-xs sm:text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-amber-500 stroke-[3]" />
                    <span>إضافة متابعة / ملاحظة</span>
                  </h5>
                  <span className="text-[10px] text-[var(--text-secondary)] font-bold truncate max-w-[180px]">
                    <strong className="text-amber-600 dark:text-amber-400">{currentUserName || currentRoleTitle || 'المسؤول'}</strong>
                  </span>
                </div>

                {/* Quick Templates Buttons */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                  {[
                    '📞 تم الاتصال وأكد السداد غداً',
                    '⏳ طلب مهلة للمراجعة',
                    '📍 تمت المعاينة ومطابقة اللافتة',
                    '🌐 تم رفع وتوثيق الخريطة',
                    '💳 تم إرسال بيانات السداد',
                    '⚠️ لم يرد وتم إرسال واتساب',
                  ].map((tpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setNewFollowUpText(tpl);
                        setFollowUpError(null);
                      }}
                      className="bg-[var(--bg-card)] hover:bg-amber-500/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] hover:border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 whitespace-nowrap cursor-pointer transition-colors"
                    >
                      {tpl}
                    </button>
                  ))}
                </div>

                {/* Textarea Input */}
                <div>
                  <textarea
                    rows={2}
                    value={newFollowUpText}
                    onChange={(e) => {
                      setNewFollowUpText(e.target.value);
                      if (followUpError) setFollowUpError(null);
                    }}
                    placeholder="اكتب ملاحظة أو تفاصيل الإجراء هنا..."
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-amber-500 text-[var(--text-primary)] rounded-xl p-2.5 text-xs font-medium focus:outline-none transition-colors leading-relaxed resize-none"
                  />
                </div>

                {/* Step 2 Box: Appears ONLY when admin starts typing or enters text or has selected a type/status */}
                {(newFollowUpText.trim().length > 0 || newFollowUpType !== null || newFollowUpStatus !== null) && (
                  <div className="bg-[var(--bg-card)] border-2 border-amber-500/40 rounded-2xl p-3 sm:p-3.5 space-y-3 shadow-xs animate-fade-in">
                    <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                      <span className="text-xs font-black text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                        <span>تحديد تصنيف وحالة هذا الإجراء (إلزامي للتذكير):</span>
                      </span>
                      {!newFollowUpType || !newFollowUpStatus ? (
                        <span className="text-[10px] bg-rose-500/15 text-rose-700 dark:text-rose-300 font-black px-2 py-0.5 rounded-md animate-pulse">
                          * مطلوب الاختيار
                        </span>
                      ) : (
                        <span className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-500" /> جاهز للحفظ
                        </span>
                      )}
                    </div>

                    {/* Type Selector Buttons */}
                    <div>
                      <span className="text-[10.5px] text-[var(--text-muted)] font-bold block mb-1.5">
                        1. طبيعة الإجراء (اختر نوع المتابعة):
                      </span>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 text-xs font-bold">
                        {[
                          { type: 'call', label: '📞 اتصال', color: 'bg-emerald-600 text-white' },
                          { type: 'visit', label: '🏃 زيارة', color: 'bg-purple-600 text-white' },
                          { type: 'payment', label: '💰 تحصيل', color: 'bg-amber-600 text-white' },
                          { type: 'verification', label: '🌐 خرائط', color: 'bg-blue-600 text-white' },
                          { type: 'general', label: '📝 عامة', color: 'bg-slate-700 text-white' },
                        ].map((item) => (
                          <button
                            key={item.type}
                            type="button"
                            onClick={() => {
                              setNewFollowUpType(item.type as AdminFollowUpType);
                              setFollowUpError(null);
                            }}
                            className={`py-2 px-2 rounded-xl border text-[11px] font-bold cursor-pointer transition-all text-center ${
                              newFollowUpType === item.type
                                ? `${item.color} font-black ring-2 ring-amber-500 shadow-xs scale-98`
                                : 'bg-[var(--input-bg)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-amber-500/40'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Status Selector Buttons */}
                    <div>
                      <span className="text-[10.5px] text-[var(--text-muted)] font-bold block mb-1.5">
                        2. حالة الإجراء (هل اكتمل أم معلق أم عاجل؟):
                      </span>
                      <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
                        {[
                          { status: 'completed', label: '✅ تم واكتمل', color: 'bg-emerald-600 text-white' },
                          { status: 'pending', label: '⏳ معلق للمتابعة', color: 'bg-amber-500 text-slate-950' },
                          { status: 'urgent', label: '🚨 عاجل وهام', color: 'bg-rose-600 text-white' },
                        ].map((s) => (
                          <button
                            key={s.status}
                            type="button"
                            onClick={() => {
                              setNewFollowUpStatus(s.status as AdminFollowUpStatus);
                              setFollowUpError(null);
                            }}
                            className={`py-2 px-2 rounded-xl border text-[11px] font-bold cursor-pointer transition-all text-center ${
                              newFollowUpStatus === s.status
                                ? `${s.color} font-black ring-2 ring-amber-500 shadow-xs scale-98`
                                : 'bg-[var(--input-bg)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-amber-500/40'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Next follow-up date */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-[var(--border-color)]">
                      <div className="flex items-center gap-2">
                        <span className="text-[10.5px] text-[var(--text-muted)] font-bold whitespace-nowrap">موعد المتابعة القادمة (اختياري):</span>
                        <input
                          type="date"
                          value={newFollowUpNextDate}
                          onChange={(e) => setNewFollowUpNextDate(e.target.value)}
                          className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-2.5 py-1 text-[11px] font-bold text-[var(--text-primary)] focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      {newFollowUpNextDate && (
                        <button
                          type="button"
                          onClick={() => setNewFollowUpNextDate('')}
                          className="text-[10px] text-rose-500 hover:underline font-bold"
                        >
                          إلغاء الموعد ✕
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Validation Error Message */}
                {followUpError && (
                  <div className="bg-rose-500/15 border border-rose-500/40 text-rose-700 dark:text-rose-300 p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{followUpError}</span>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex items-center justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleAddFollowUp}
                    disabled={!newFollowUpText.trim() || isSavingFollowUp}
                    className={`w-full sm:w-auto font-black text-xs px-5 py-2.5 rounded-xl shadow-xs transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
                      !newFollowUpText.trim()
                        ? 'bg-slate-700/40 text-slate-500 cursor-not-allowed'
                        : !newFollowUpType || !newFollowUpStatus
                        ? 'bg-amber-500/50 hover:bg-amber-500/70 text-slate-900 border border-amber-500/40'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>{isSavingFollowUp ? 'جاري الحفظ...' : 'تسجيل المتابعة'}</span>
                  </button>
                </div>
              </div>

              {/* ── FOLLOW-UP HISTORY & TIMELINE ── */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-color)] pb-2.5">
                  <h5 className="font-black text-xs sm:text-sm text-[var(--text-primary)] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>الجدول الزمني للمتابعات السابقة ({(formData.adminFollowUps || []).length})</span>
                  </h5>

                  {/* Filter & Search Bar */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute right-2.5 top-2" />
                      <input
                        type="text"
                        value={followUpSearch}
                        onChange={(e) => setFollowUpSearch(e.target.value)}
                        placeholder="بحث في الملاحظات..."
                        className="bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs rounded-xl pr-8 pl-2 py-1 w-36 sm:w-44 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <select
                      value={followUpFilterType}
                      onChange={(e) => setFollowUpFilterType(e.target.value)}
                      className="bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs rounded-xl px-2 py-1 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="all">كل الأنواع</option>
                      <option value="call">📞 اتصالات</option>
                      <option value="visit">🏃 زيارات</option>
                      <option value="payment">💰 سداد</option>
                      <option value="verification">🌐 خرائط Google</option>
                      <option value="general">📝 ملاحظات عامة</option>
                    </select>
                  </div>
                </div>

                {/* Render Filtered Timeline List */}
                {(() => {
                  const allFollowUps = formData.adminFollowUps || [];
                  const filtered = allFollowUps.filter((f) => {
                    if (followUpFilterType !== 'all' && f.type !== followUpFilterType) return false;
                    if (followUpSearch.trim()) {
                      const q = followUpSearch.trim().toLowerCase();
                      const matchText = f.text.toLowerCase().includes(q);
                      const matchAuthor = f.authorName.toLowerCase().includes(q);
                      if (!matchText && !matchAuthor) return false;
                    }
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-8 text-center space-y-2">
                        <ClipboardList className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-40" />
                        <p className="font-bold text-xs text-[var(--text-secondary)]">
                          {allFollowUps.length === 0
                            ? 'لا توجد متابعات أو ملاحظات إدارية مسجلة بعد لهذا النشاط.'
                            : 'لا توجد ملاحظات مطابقة لمعايير البحث المحددة.'}
                        </p>
                        <p className="text-[10.5px] text-[var(--text-muted)]">
                          استخدم النموذج أعلاه لتوثيق اتصالاتك الهاتفية، المعاينات الميدانية، أو تدقيق التحصيل.
                        </p>
                      </div>
                    );
                  }

                  const getTypeInfo = (type: AdminFollowUpType) => {
                    switch (type) {
                      case 'call':
                        return { label: 'اتصال هاتفي', icon: '📞', bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' };
                      case 'visit':
                        return { label: 'زيارة ميدانية', icon: '🏃', bg: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30' };
                      case 'payment':
                        return { label: 'متابعة سداد', icon: '💰', bg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30' };
                      case 'verification':
                        return { label: 'توثيق الخريطة', icon: '🌐', bg: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30' };
                      default:
                        return { label: 'ملاحظة عامة', icon: '📝', bg: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30' };
                    }
                  };

                  return (
                    <div className="space-y-3">
                      {filtered.map((note) => {
                        const tInfo = getTypeInfo(note.type);
                        const isPending = note.status === 'pending';
                        const isUrgent = note.status === 'urgent';
                        const createdFormatted = new Date(note.createdAt).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        return (
                          <div
                            key={note.id}
                            className={`bg-[var(--bg-card)] border-2 rounded-2xl p-3.5 sm:p-4 space-y-2.5 transition-all shadow-xs ${
                              isUrgent
                                ? 'border-rose-500/50 bg-rose-500/5'
                                : isPending
                                ? 'border-amber-500/40 bg-amber-500/5'
                                : 'border-[var(--border-color)] hover:border-amber-500/30'
                            }`}
                          >
                            {/* Note Card Header */}
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-color)] pb-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${tInfo.bg}`}>
                                  {tInfo.icon} {tInfo.label}
                                </span>

                                <span className="text-[10.5px] font-extrabold text-[var(--text-primary)]">
                                  {note.authorName}
                                </span>

                                <span className="text-[9px] bg-slate-500/15 text-[var(--text-secondary)] font-bold px-1.5 py-0.2 rounded">
                                  {note.authorRole === 'admin' ? 'الإدارة العامة' : note.authorRole === 'accountant' ? 'الحسابات' : 'المشرف'}
                                </span>

                                {/* Clickable Status Toggle */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleFollowUpStatus(note.id)}
                                  className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border cursor-pointer transition-transform active:scale-95 ${
                                    isUrgent
                                      ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40'
                                      : isPending
                                      ? 'bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-500/40'
                                      : 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border-emerald-500/40'
                                  }`}
                                  title="انقر لتغيير حالة المتابعة"
                                >
                                  {isUrgent ? '🚨 عاجلة (انقر للتغيير)' : isPending ? '⏳ قيد المتابعة (انقر للإكمال)' : '✅ مكتملة'}
                                </button>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono font-bold text-[var(--text-muted)]" dir="ltr">
                                  {createdFormatted}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteFollowUp(note.id)}
                                  className="text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                                  title="حذف الملاحظة"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Note Card Body */}
                            <p className="text-xs text-[var(--text-primary)] font-medium leading-relaxed whitespace-pre-wrap">
                              {note.text}
                            </p>

                            {/* Next Follow-up Reminder Badge (if present) */}
                            {note.nextFollowUpDate && (
                              <div className="flex items-center gap-1.5 pt-1 text-[10.5px]">
                                <span className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-lg font-bold inline-flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-amber-500" />
                                  <span>موعد المتابعة القادم: </span>
                                  <strong className="font-mono font-black">{note.nextFollowUpDate}</strong>
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
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
