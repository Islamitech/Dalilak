import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Business, VerificationStatus, PaymentStatus } from '../types';
import { EGYPT_GOVERNORATES, PACKAGES, BUSINESS_CATEGORIES, CATEGORY_GROUPS, getGroupFromCategory } from '../data/mockData';
import { compressImageFile } from '../utils/imageCompressor';
import { validateAndProcessShortVideo, convertVideoToDataUrl } from '../utils/videoProcessor';
import { uploadMediaToSupabaseStorage } from '../services/storage';
import {
  Store,
  User,
  MapPin,
  DollarSign,
  Image as ImageIcon,
  Video,
  Film,
  Play,
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
  MessageCircle,
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
  Copy,
  ChevronLeft,
  X,
  Share2,
} from 'lucide-react';
import { GoogleMapsSyncModal } from './GoogleMapsSyncModal';
import { downloadSinglePhoto, downloadAllBusinessPhotos } from '../utils/photoDownloader';
import { formatActivityDateTime } from '../utils/dateFormatters';
import { generateUpgradeOffersWhatsAppMessage, getUpgradeOffersWhatsAppUrl } from '../utils/packageOffers';
import { VideoWatermarkBadge } from './VideoWatermarkBadge';

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
  const [enableWatermark, setEnableWatermark] = useState<boolean>(true);
  const [watermarkPosition, setWatermarkPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showMapsSyncModal, setShowMapsSyncModal] = useState<boolean>(false);
  const [copiedOffers, setCopiedOffers] = useState<boolean>(false);
  const [upgradeNotice, setUpgradeNotice] = useState<string | null>(null);

  // Tab navigation
  const [activeSection, setActiveSection] = useState<'info' | 'owner' | 'location' | 'payment' | 'photos'>('info');

  // Keep internal formData in sync when parent business prop changes
  useEffect(() => {
    if (business) {
      setFormData({ ...business });
    }
  }, [business]);

  if (!business || !formData) return null;

  const handleCopyText = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const hasNameAr = Boolean(formData.nameAr && formData.nameAr.trim());
    const hasNameEn = Boolean(formData.nameEn && formData.nameEn.trim());

    if (!hasNameAr && !hasNameEn) {
      setErrorMsg('يرجى إدخال اسم النشاط (بالعربية أو بالإنجليزية على الأقل)');
      return;
    }

    const hasMapUrl = Boolean(formData.googleMapsUrl && formData.googleMapsUrl.trim().startsWith('http'));
    const updatedFormData: Business = {
      ...formData,
      nameAr: (formData.nameAr && formData.nameAr.trim()) || (formData.nameEn && formData.nameEn.trim()) || 'نشاط تجاري',
      nameEn: formData.nameEn?.trim() || undefined,
      ownerName: (formData.ownerName && formData.ownerName.trim()) || 'صاحب النشاط',
      phone: (formData.phone && formData.phone.trim()) || (formData.ownerPhone && formData.ownerPhone.trim()) || '01000000000',
      ownerPhone: (formData.ownerPhone && formData.ownerPhone.trim()) || (formData.phone && formData.phone.trim()) || '01000000000',
      googleMapsUrl: formData.googleMapsUrl?.trim() || undefined,
      verificationStatus: hasMapUrl ? 'verified' : formData.verificationStatus,
      googleSyncStatus: hasMapUrl ? 'synced' : formData.googleSyncStatus,
      googleSyncDate: hasMapUrl ? (formData.googleSyncDate || new Date().toISOString().split('T')[0]) : formData.googleSyncDate,
      photos: Array.isArray(formData.photos) ? formData.photos : [],
      videos: Array.isArray(formData.videos) ? formData.videos : [],
    };

    onSave(updatedFormData);
    setIsEditMode(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsUploading(true);
      const newCompressed: string[] = [];
      for (let i = 0; i < files.length; i++) {
        try {
          const compressed = await compressImageFile(files[i], 1000, 1000, 0.72, {
            applyWatermark: enableWatermark,
            position: watermarkPosition,
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

  const remainingDebt = Math.max(0, (formData.packagePrice || 0) - (formData.amountPaid || 0));
  const totalMediaCount = (formData.photos?.length || 0) + (formData.videos?.length || 0);

  interface TabItem {
    key: 'info' | 'owner' | 'location' | 'payment' | 'photos';
    label: string;
    icon: React.ReactNode;
    count?: number;
  }

  const TABS: TabItem[] = [
    { key: 'info', label: 'بيانات النشاط', icon: <Store className="w-4 h-4" /> },
    { key: 'owner', label: 'المالك والتواصل', icon: <User className="w-4 h-4" /> },
    { key: 'location', label: 'الموقع والعنوان', icon: <MapPin className="w-4 h-4" /> },
    { key: 'payment', label: 'الباقة والمالية', icon: <DollarSign className="w-4 h-4" /> },
    { key: 'photos', label: 'المعرض والوسائط', icon: <ImageIcon className="w-4 h-4" />, count: totalMediaCount },
  ];

  const verificationBadge = formData.verificationStatus === 'verified' || formData.googleSyncStatus === 'synced'
    ? { label: 'موثق على الخرائط ✓', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30' }
    : formData.verificationStatus === 'in_progress'
    ? { label: 'قيد التوثيق ⏳', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30' }
    : { label: 'بانتظار التوثيق', cls: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30' };

  const paymentBadge = formData.paymentStatus === 'fully_paid'
    ? { label: `مسدد بالكامل (${formData.amountPaid} ج)`, cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30' }
    : formData.paymentStatus === 'partially_paid'
    ? { label: `متبقي دين (${remainingDebt} ج)`, cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30' }
    : { label: `غير مسدد (${formData.packagePrice || 250} ج)`, cls: 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30' };

  const primaryPhone = formData.phone || formData.ownerPhone || '';
  const cleanPhone = primaryPhone.replace(/\D/g, '');
  const mapsUrl = formData.googleMapsUrl || (formData.lat && formData.lng ? `https://www.google.com/maps/?q=${formData.lat},${formData.lng}` : '');

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in" dir="rtl">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-t-3xl sm:rounded-3xl w-full max-w-3xl shadow-2xl flex flex-col overflow-hidden max-h-[94vh] sm:max-h-[90vh]">
        
        {/* ── 1. PREMIUM PROFILE HEADER ───────────────────────────────── */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white flex items-start justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shrink-0 border border-amber-400/40">
              <Store className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-base sm:text-lg text-white truncate">
                  {formData.nameAr || formData.nameEn || 'تفاصيل النشاط'}
                </h3>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                  {formData.invoiceNumber}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap mt-1.5 text-xs text-slate-300">
                <span className="flex items-center gap-1 font-bold">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>{formData.governorate} - {formData.city}</span>
                </span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1 font-bold">
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  <span>{formData.category}</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${verificationBadge.cls}`}>
                  {verificationBadge.label}
                </span>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${paymentBadge.cls}`}>
                  {paymentBadge.label}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
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
                className={`text-xs font-black px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 ${
                  isEditMode
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/50'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                }`}
              >
                {isEditMode ? <Check className="w-4 h-4 stroke-[3]" /> : <Pencil className="w-4 h-4 stroke-[2.5]" />}
                <span>{isEditMode ? 'حفظ' : 'تعديل'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              title="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── 2. ONE-TAP QUICK ACTIONS BAR ───────────────────────────── */}
        <div className="px-3 sm:px-5 py-2.5 bg-[var(--input-bg)]/80 border-b border-[var(--border-color)] flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          {cleanPhone && (
            <a
              href={`tel:${cleanPhone}`}
              className="bg-[var(--bg-card)] hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-1.5 rounded-xl transition-transform active:scale-95 flex items-center gap-1.5 shrink-0 shadow-2xs"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>اتصال فوري</span>
            </a>
          )}

          {cleanPhone && (
            <a
              href={`https://wa.me/2${cleanPhone}`}
              target="_blank"
              rel="noreferrer"
              className="bg-[var(--bg-card)] hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-1.5 rounded-xl transition-transform active:scale-95 flex items-center gap-1.5 shrink-0 shadow-2xs"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>محادثة واتساب</span>
            </a>
          )}

          {onShowInvoice && (
            <button
              type="button"
              onClick={() => onShowInvoice(formData)}
              className="bg-[var(--bg-card)] hover:bg-amber-500/10 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold px-3 py-1.5 rounded-xl transition-transform active:scale-95 flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              <span>الفاتورة الإلكترونية</span>
            </button>
          )}

          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-[var(--bg-card)] hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-xs font-bold px-3 py-1.5 rounded-xl transition-transform active:scale-95 flex items-center gap-1.5 shrink-0 shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
              <span>فتح Google Maps</span>
            </a>
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
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black text-xs px-3 py-1.5 rounded-xl shadow-xs transition-transform active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer mr-auto"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>تسجيل سداد ({remainingDebt} ج)</span>
            </button>
          )}
        </div>

        {/* ── 3. SEGMENTED PILL NAVIGATION TABS ───────────────────────── */}
        <div className="flex items-center gap-1.5 px-3 sm:px-5 py-2.5 border-b border-[var(--border-color)] bg-[var(--bg-card)]/50 overflow-x-auto no-scrollbar shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveSection(tab.key)}
              className={`flex items-center gap-1.5 py-1.5 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
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

        {/* ── 4. BODY CONTENT ────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* Urgent Financial Alert Card (High Contrast) */}
          {(formData.amountPaid || 0) === 0 && (
            <div className="bg-gradient-to-r from-rose-500/20 via-orange-500/15 to-rose-500/20 border-2 border-rose-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm text-right animate-pulse-subtle">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="font-black text-xs sm:text-sm text-rose-800 dark:text-rose-200">
                    تنبيه مالي: النشاط غير مسدد ({formData.packagePrice || 250} ج.م)
                  </h4>
                  <p className="text-[11px] text-rose-700 dark:text-rose-300 font-bold mt-0.5">
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

          {/* ── TAB 1: تفاصيل النشاط ─────────────────────────────────── */}
          {activeSection === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* اسم النشاط عربي */}
                <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3.5 space-y-1 text-right">
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
                    <div className="flex items-center justify-between gap-2 pt-1">
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
                <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3.5 space-y-1 text-right">
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
                    <div className="pt-1 font-bold text-sm text-[var(--text-primary)]" dir="ltr">
                      {formData.nameEn || <span className="text-[var(--text-muted)] font-normal italic text-xs">غير مسجل</span>}
                    </div>
                  )}
                </div>

                {/* التصنيف والفئة */}
                <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3.5 space-y-1 text-right sm:col-span-2">
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
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <span className="bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-black px-3 py-1 rounded-xl border border-amber-500/30">
                        🏷️ {formData.category}
                      </span>
                    </div>
                  )}
                </div>

                {/* مواعيد العمل */}
                <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3.5 space-y-1 text-right sm:col-span-2">
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
                    <div className="font-bold text-xs sm:text-sm text-[var(--text-primary)] pt-1">
                      {formData.workingHours || 'يومياً'}
                    </div>
                  )}
                </div>

                {/* وصف الخدمات */}
                <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3.5 space-y-1 text-right sm:col-span-2">
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
                    <p className="text-xs sm:text-sm font-bold text-[var(--text-secondary)] leading-relaxed pt-1 whitespace-pre-line">
                      {formData.description || 'لم يتم تسجيل وصف تفصيلي للنشاط.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 2: المالك والتواصل ────────────────────────────────── */}
          {activeSection === 'owner' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-right">
              {/* اسم صاحب النشاط */}
              <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3.5 space-y-1">
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
                  <div className="font-black text-sm text-[var(--text-primary)] pt-1">
                    {formData.ownerName || 'صاحب النشاط'}
                  </div>
                )}
              </div>

              {/* رقم الهاتف الأساسي */}
              <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3.5 space-y-1">
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
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="font-black text-sm text-[var(--text-primary)] font-mono" dir="ltr">
                      {formData.phone || 'غير مسجل'}
                    </span>
                    {formData.phone && (
                      <div className="flex items-center gap-1">
                        <a href={`tel:${formData.phone}`} className="p-1 text-emerald-600 hover:bg-emerald-500/15 rounded-lg" title="اتصال">
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <a href={`https://wa.me/2${formData.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="p-1 text-emerald-600 hover:bg-emerald-500/15 rounded-lg" title="واتساب">
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* هاتف إضافي */}
              <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3.5 space-y-1">
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
                  <div className="font-bold text-xs sm:text-sm text-[var(--text-primary)] pt-1 font-mono" dir="ltr">
                    {formData.secondaryPhone || <span className="text-[var(--text-muted)] font-normal italic text-xs">غير مسجل</span>}
                  </div>
                )}
              </div>

              {/* البريد الإلكتروني */}
              <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3.5 space-y-1">
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
                  <div className="font-bold text-xs sm:text-sm text-[var(--text-primary)] pt-1" dir="ltr">
                    {formData.ownerEmail || <span className="text-[var(--text-muted)] font-normal italic text-xs">غير مسجل</span>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB 3: الموقع والعنوان ─────────────────────────────────── */}
          {activeSection === 'location' && (
            <div className="space-y-3.5 text-right">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* المحافظة */}
                <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3.5 space-y-1">
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
                    <div className="font-black text-sm text-[var(--text-primary)] pt-1">{formData.governorate}</div>
                  )}
                </div>

                {/* المدينة / الحي */}
                <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3.5 space-y-1">
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
                    <div className="font-black text-sm text-[var(--text-primary)] pt-1">{formData.city || formData.governorate}</div>
                  )}
                </div>

                {/* الشارع والعنوان بالتفصيل */}
                <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3.5 space-y-1 sm:col-span-2">
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
                    <div className="font-bold text-xs sm:text-sm text-[var(--text-primary)] pt-1">
                      {formData.street || 'الموقع الجغرافي المسجل على الخريطة'}
                    </div>
                  )}
                </div>

                {/* رابط الخرائط */}
                <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3.5 space-y-1 sm:col-span-2">
                  <span className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-500" />
                    <span>رابط الموقع على خرائط Google Maps</span>
                  </span>
                  {isEditMode ? (
                    <input
                      type="url"
                      dir="ltr"
                      value={formData.googleMapsUrl || ''}
                      onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })}
                      className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-amber-500 text-[var(--text-primary)] font-mono text-xs rounded-xl p-2 focus:outline-none shadow-inner mt-1 text-right"
                      placeholder="https://maps.google.com/..."
                    />
                  ) : (
                    <div className="pt-1">
                      {formData.googleMapsUrl ? (
                        <a
                          href={formData.googleMapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 dark:text-blue-400 font-bold text-xs hover:underline flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>فتح الموقع المعتمد على خرائط Google 🗺️</span>
                        </a>
                      ) : (
                        <span className="text-[var(--text-muted)] font-normal italic text-xs">لم يتم ربط رابط خرائط مباشر بعد</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 4: الباقة والمالية ─────────────────────────────────── */}
          {activeSection === 'payment' && (
            <div className="space-y-4 text-right">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* الباقة المختارة */}
                <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3.5 space-y-1">
                  <span className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>باقة التوثيق والخدمات</span>
                  </span>
                  {isEditMode ? (
                    <select
                      value={formData.packageId || PACKAGES[0].id}
                      onChange={(e) => {
                        const pkg = PACKAGES.find((p) => p.id === e.target.value);
                        if (pkg) {
                          setFormData({
                            ...formData,
                            packageId: pkg.id,
                            packageName: pkg.title,
                            packagePrice: pkg.price,
                          });
                        }
                      }}
                      className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] font-black text-xs rounded-xl p-2 focus:outline-none focus:border-amber-500 cursor-pointer mt-1"
                    >
                      {PACKAGES.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.title} ({pkg.price} ج.م)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="font-black text-sm text-[var(--text-primary)] pt-1">{formData.packageName}</div>
                  )}
                </div>

                {/* سعر الباقة */}
                <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3.5 space-y-1">
                  <span className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                    <span>إجمالي قيمة الباقة</span>
                  </span>
                  <div className="font-black text-base text-[var(--text-primary)] pt-1">
                    {formData.packagePrice || 250} ج.م
                  </div>
                </div>

                {/* المبلغ المسدد */}
                <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3.5 space-y-1">
                  <span className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>المبلغ المسدد فعلياً</span>
                  </span>
                  {isEditMode ? (
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
                    <div className="font-black text-base text-emerald-600 dark:text-emerald-400 pt-1">
                      {formData.amountPaid || 0} ج.م
                    </div>
                  )}
                </div>

                {/* المبلغ المتبقي (المديونية) */}
                <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3.5 space-y-1">
                  <span className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>المبلغ المتبقي للتحصيل</span>
                  </span>
                  <div className={`font-black text-base pt-1 ${remainingDebt > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600'}`}>
                    {remainingDebt} ج.م
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 5: المعرض والوسائط ────────────────────────────────── */}
          {activeSection === 'photos' && (
            <div className="space-y-4 text-right">
              {/* Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[var(--input-bg)] p-3.5 rounded-2xl border border-[var(--border-color)]">
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {formData.photos.map((photo, idx) => (
                    <div key={idx} className="relative group rounded-2xl overflow-hidden border border-[var(--border-color)] bg-slate-950 h-32 shadow-sm">
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
        </div>

        {/* ── 5. CLEAN & FOCUSED FOOTER ──────────────────────────────── */}
        <div className="p-3.5 sm:p-4 bg-[var(--input-bg)] border-t border-[var(--border-color)] flex items-center justify-between gap-2 shrink-0">
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
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 text-xs font-bold px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
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
              className="bg-[var(--bg-card)] hover:bg-slate-500/10 text-[var(--text-secondary)] border border-[var(--border-color)] text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              إغلاق
            </button>

            {canEdit && isEditMode && (
              <button
                type="button"
                onClick={handleSubmit}
                className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 text-xs font-black px-5 py-2 rounded-xl shadow-md transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
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
    </div>,
    document.body
  );
};
