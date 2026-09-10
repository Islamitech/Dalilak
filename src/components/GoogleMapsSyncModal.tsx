import React, { useState, useEffect } from 'react';
import { Business, VerificationStatus } from '../types';
import { 
  MapPin, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Check, 
  Clock, 
  Image as ImageIcon, 
  ShieldCheck, 
  Printer,
  AlertCircle,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  MessageCircle,
  Share2,
  FileText,
  Phone,
  Save,
  CheckCheck
} from 'lucide-react';
import { downloadSinglePhoto, downloadAllBusinessPhotos } from '../utils/photoDownloader';
import { 
  getGoogleMapsVerifiedWhatsAppUrl, 
  generateGoogleMapsVerifiedWhatsAppMessage,
  getGoogleVerificationOtpWhatsAppUrl,
  generateGoogleVerificationOtpWhatsAppMessage,
  getGoogleOtpSentAlertWhatsAppUrl,
  generateGoogleOtpSentAlertWhatsAppMessage,
} from '../utils/whatsapp';
import { sanitizeExternalUrl } from '../utils/urlSanitizer';
import { fetchBusinessPhotosOnDemand } from '../services/db';
import { BaseModal, Button, Badge } from './ui';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import { getRepDisplayInfo } from '../utils/repDisplay';

interface GoogleMapsSyncModalProps {
  business: Business;
  isOpen: boolean;
  onClose: () => void;
  onUpdateBusiness: (updatedBusiness: Business) => void;
}

export const GoogleMapsSyncModal: React.FC<GoogleMapsSyncModalProps> = ({
  business,
  isOpen,
  onClose,
  onUpdateBusiness,
}) => {
  type GoogleSyncMode = 'not_synced' | 'in_progress' | 'synced';

  const [activeTab, setActiveTab] = useState<'data_upload' | 'verification_confirm' | 'share_invoice'>('data_upload');
  const [finalMapUrl, setFinalMapUrl] = useState<string>(business.googleMapsUrl || '');
  const [verifiedAddress, setVerifiedAddress] = useState<string>(
    business.street && !business.street.includes('الموقع الجغرافي المسجل') ? business.street : ''
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState<boolean>(false);
  const [currentStatus, setCurrentStatus] = useState<GoogleSyncMode>(() => {
    const hasMap = Boolean(
      business.googleMapsUrl &&
      business.googleMapsUrl.trim().startsWith('http') &&
      !business.googleMapsUrl.includes('search/?api=1&query=')
    );
    if (hasMap || business.googleSyncStatus === 'synced') return 'synced';
    if (business.googleSyncStatus === 'in_progress') return 'in_progress';
    return 'not_synced';
  });
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);
  const [modalPhotos, setModalPhotos] = useState<string[]>(business.photos || []);
  const [expandedOtpPreview, setExpandedOtpPreview] = useState<'step1' | 'step2' | null>(null);

  const { copy } = useCopyToClipboard();

  useEffect(() => {
    if (isOpen) {
      const hasMap = Boolean(
        business.googleMapsUrl &&
        business.googleMapsUrl.trim().startsWith('http') &&
        !business.googleMapsUrl.includes('search/?api=1&query=')
      );
      const initialGStatus: GoogleSyncMode =
        hasMap || business.googleSyncStatus === 'synced'
          ? 'synced'
          : business.googleSyncStatus === 'in_progress'
          ? 'in_progress'
          : 'not_synced';
      setCurrentStatus(initialGStatus);
      setFinalMapUrl(business.googleMapsUrl || '');
      setVerifiedAddress(
        business.street && !business.street.includes('الموقع الجغرافي المسجل') ? business.street : ''
      );
      setModalPhotos(business.photos || []);

      if ((!business.photos || business.photos.length === 0) && business.id) {
        fetchBusinessPhotosOnDemand(business.id).then((photos) => {
          if (photos && photos.length > 0) {
            setModalPhotos(photos);
            if (onUpdateBusiness) {
              onUpdateBusiness({ ...business, photos });
            }
          }
        });
      }
    }
  }, [isOpen, business]);

  if (!isOpen) return null;

  const activePhotos = modalPhotos && modalPhotos.length > 0 ? modalPhotos : (business.photos || []);
  const repFieldMapUrl = business.repLocationUrl || (business.lat && business.lng ? `https://www.google.com/maps?q=${business.lat},${business.lng}` : '');

  const copyToClipboard = async (text: string, key: string) => {
    if (!text) return;
    await copy(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2200);
  };

  const handleDownloadAll = async () => {
    if (!activePhotos || activePhotos.length === 0) return;
    setIsDownloadingAll(true);
    await downloadAllBusinessPhotos(activePhotos, business.nameAr);
    setIsDownloadingAll(false);
  };

  const isRawCoordinatesUrl = (url?: string | null): boolean => {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim().toLowerCase();
    return (
      trimmed.includes('search/?api=1&query=') ||
      trimmed.includes('maps?q=') ||
      trimmed.includes('google.com/maps?q=') ||
      /[?&]q=[-0-9.,]+/.test(trimmed)
    );
  };

  const formatValidGoogleMapsUrl = (url?: string | null): string | undefined => {
    if (!url || typeof url !== 'string') return undefined;
    let trimmed = url.trim();
    if (!trimmed) return undefined;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      trimmed = `https://${trimmed}`;
    }
    if (trimmed.includes('search/?api=1&query=')) return undefined;
    if (isRawCoordinatesUrl(trimmed)) return undefined;
    return trimmed;
  };

  const handleSaveVerification = (targetStatus?: GoogleSyncMode) => {
    const newStatus: GoogleSyncMode = targetStatus || currentStatus;
    const cleanVerifiedUrl = formatValidGoogleMapsUrl(finalMapUrl);

    if (newStatus === 'synced') {
      if (!cleanVerifiedUrl || isRawCoordinatesUrl(finalMapUrl)) {
        setStatusFeedback('تنبيه أمان: لا يمكن تعيين الحالة "موثقة برابط خرائط Google" إلا بإدخال رابط معتمد وصحيح من الخريطة (وليس إحداثيات GPS خام).');
        setTimeout(() => setStatusFeedback(null), 5000);
        return;
      }
    }

    const updated: Business = {
      ...business,
      repLocationUrl: business.repLocationUrl || repFieldMapUrl || undefined,
      googleMapsUrl: newStatus === 'synced' ? (cleanVerifiedUrl || business.googleMapsUrl) : cleanVerifiedUrl,
      street: verifiedAddress.trim() || business.street,
      verificationStatus: business.verificationStatus,
      googleSyncStatus: newStatus,
      googleSyncDate: newStatus === 'synced' ? (business.googleSyncDate || new Date().toISOString().split('T')[0]) : business.googleSyncDate,
    };

    setCurrentStatus(newStatus);
    if (onUpdateBusiness) {
      onUpdateBusiness(updated);
    }

    const label = 
      newStatus === 'synced' ? 'موثقة برابط خرائط Google' : 
      newStatus === 'in_progress' ? 'قيد مراجعة جوجل' : 'لم تُرفع لخرائط Google';

    setStatusFeedback(`تم حفظ وتحديث بيانات المكان بنجاح (${label})`);
    setTimeout(() => setStatusFeedback(null), 3500);
  };

  const verifiedMapUrlDisplay = business.googleMapsUrl || 'لم يتم إدراج رابط التوثيق بعد';
  const targetAddress = verifiedAddress.trim() || business.street || (business.city ? `${business.city} (${business.governorate})` : business.governorate);

  const allDetailsText = 
    `ملخص بيانات المكان للتوثيق على خرائط Google:\n` +
    `-----------------------------------------\n` +
    `اسم المكان: ${business.nameAr}\n` +
    `التصنيف: ${business.category}\n` +
    `العنوان: ${targetAddress}\n` +
    `أوقات العمل: ${business.workingHours || 'يومياً'}\n` +
    `الهاتف: ${business.phone} ${business.secondaryPhone ? `| ${business.secondaryPhone}` : ''}\n` +
    `الإحداثيات: ${business.lat}, ${business.lng}\n` +
    `رابط موقع المعاينة الميدانية (المندوب): ${repFieldMapUrl}\n` +
    `رابط خرائط Google الموثق (الإدارة): ${verifiedMapUrlDisplay}`;

  const remainingBalance = Math.max(0, (business.packagePrice || 0) - (business.amountPaid || 0));
  const isFullyPaid = business.paymentStatus === 'fully_paid' || remainingBalance === 0;
  const verificationWhatsAppUrl = getGoogleMapsVerifiedWhatsAppUrl(business);

  const headerActions = (
    <div className="flex items-center gap-2">
      {currentStatus === 'synced' ? (
        <Badge variant="success" size="sm" dot>
          موثقة بالرابط
        </Badge>
      ) : currentStatus === 'in_progress' ? (
        <Badge variant="warning" size="sm" dot>
          قيد مراجعة جوجل
        </Badge>
      ) : (
        <Badge variant="danger" size="sm" dot>
          لم تُرفع بعد
        </Badge>
      )}
    </div>
  );

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title={business.nameAr}
        subtitle={`${business.governorate} • ${business.category} • مساعد التوثيق ونقل المكان على خرائط Google`}
        icon={<MapPin className="w-5 h-5 text-amber-500" />}
        headerActions={headerActions}
        size="lg"
      >
        <div className="space-y-4 text-xs" dir="rtl">
          {/* Feedback Banner */}
          {statusFeedback && (
            <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 py-2.5 px-3 rounded-2xl text-xs font-black text-center flex items-center justify-center gap-2 animate-fade-in shadow-xs">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>{statusFeedback}</span>
            </div>
          )}

          {/* Workflow Tabs */}
          <div className="flex bg-[var(--input-bg)] p-1 rounded-2xl border border-[var(--border-color)] text-xs font-black">
            <button
              onClick={() => setActiveTab('data_upload')}
              className={`flex-1 py-2 px-2 sm:px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'data_upload'
                  ? 'bg-amber-500 text-slate-950 shadow-md scale-101'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Copy className="w-3.5 h-3.5" />
              <span>1. نسخ البيانات والصور</span>
            </button>
            
            <button
              onClick={() => setActiveTab('verification_confirm')}
              className={`flex-1 py-2 px-2 sm:px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'verification_confirm'
                  ? 'bg-amber-500 text-slate-950 shadow-md scale-101'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>2. تثبيت الرابط والحالة</span>
            </button>

            <button
              onClick={() => setActiveTab('share_invoice')}
              className={`flex-1 py-2 px-2 sm:px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'share_invoice'
                  ? 'bg-amber-500 text-slate-950 shadow-md scale-101'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>3. الفاتورة والشهادة</span>
            </button>
          </div>

          {/* TAB 1: DATA COPY & PHOTOS */}
          {activeTab === 'data_upload' && (
            <div className="space-y-3.5 text-xs animate-fade-in">
              {/* Master Copy Button */}
              <Button
                variant="primary"
                size="lg"
                onClick={() => copyToClipboard(allDetailsText, 'all')}
                icon={copiedKey === 'all' ? <CheckCheck className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4" />}
                className="w-full font-black text-xs sm:text-sm"
              >
                {copiedKey === 'all' ? 'تم نسخ جميع بيانات المكان بنجاح' : 'نسخ جميع بيانات المكان بنقرة واحدة'}
              </Button>

              {/* GOOGLE VERIFICATION OTP WORKFLOW */}
              <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-blue-950/40 border border-blue-500/40 rounded-2xl p-3.5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-black text-xs text-[var(--text-primary)]">
                        إجراءات طلب كود التحقق من Google
                      </h4>
                      <p className="text-[10.5px] text-[var(--text-muted)] font-medium">
                        خطوة 1: استئذان وتنسيق مسبق ← خطوة 2: إشعار فوري لحظة طلب الكود
                      </p>
                    </div>
                  </div>
                  <Badge variant="info" size="sm">
                    صلاحية مؤقتة
                  </Badge>
                </div>

                {/* Preview Box if opened */}
                {expandedOtpPreview && (
                  <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-blue-500/30 text-[11px] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto animate-fade-in font-sans">
                    {expandedOtpPreview === 'step1'
                      ? generateGoogleVerificationOtpWhatsAppMessage(business)
                      : generateGoogleOtpSentAlertWhatsAppMessage(business)}
                  </div>
                )}

                {/* STEP 1: PRE-COORDINATION */}
                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-black text-blue-400">
                    <span>الخطوة 1: التنسيق المسبق مع العميل</span>
                    <span className="text-[10px] text-blue-300 font-bold">قبل طلب كود التحقق</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedOtpPreview(expandedOtpPreview === 'step1' ? null : 'step1')}
                      icon={expandedOtpPreview === 'step1' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    >
                      <span className="text-[10px]">{expandedOtpPreview === 'step1' ? 'إخفاء' : 'معاينة'}</span>
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => copyToClipboard(generateGoogleVerificationOtpWhatsAppMessage(business), 'otp_step1')}
                      icon={copiedKey === 'otp_step1' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    >
                      <span className="text-[10px]">{copiedKey === 'otp_step1' ? 'تم النسخ' : 'نسخ'}</span>
                    </Button>

                    <a
                      href={getGoogleVerificationOtpWhatsAppUrl(business)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white font-black text-xs py-2 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-98 text-center"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-white/20" />
                      <span>إرسال إشعار التنسيق المسبق</span>
                    </a>
                  </div>
                </div>

                {/* STEP 2: INSTANT ALERT UPON OTP DISPATCH */}
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-black text-amber-400">
                    <span>الخطوة 2: إشعار إرسال كود Google</span>
                    <span className="text-[10px] text-amber-300 font-bold">بمجرد الضغط على إرسال SMS</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedOtpPreview(expandedOtpPreview === 'step2' ? null : 'step2')}
                      icon={expandedOtpPreview === 'step2' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    >
                      <span className="text-[10px]">{expandedOtpPreview === 'step2' ? 'إخفاء' : 'معاينة'}</span>
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => copyToClipboard(generateGoogleOtpSentAlertWhatsAppMessage(business), 'otp_step2')}
                      icon={copiedKey === 'otp_step2' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    >
                      <span className="text-[10px]">{copiedKey === 'otp_step2' ? 'تم النسخ' : 'نسخ'}</span>
                    </Button>

                    <a
                      href={getGoogleOtpSentAlertWhatsAppUrl(business)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 text-white font-black text-xs py-2 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-98 text-center"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>إرسال إشعار طلب الكود</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Compact Copy Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center justify-between bg-[var(--bg-card)] p-2.5 rounded-xl border border-[var(--border-color)]">
                  <div className="truncate pr-1">
                    <span className="text-[10px] text-[var(--text-muted)] font-bold block">اسم النشاط:</span>
                    <span className="font-black truncate block text-[var(--text-primary)]">{business.nameAr}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(business.nameAr, 'name')}
                    className="p-1.5 text-amber-500 hover:bg-amber-500/10 rounded-lg cursor-pointer"
                    title="نسخ الاسم"
                  >
                    {copiedKey === 'name' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center justify-between bg-[var(--bg-card)] p-2.5 rounded-xl border border-[var(--border-color)]">
                  <div className="truncate pr-1">
                    <span className="text-[10px] text-[var(--text-muted)] font-bold block">العنوان:</span>
                    <span className="font-bold truncate block text-[var(--text-primary)]">
                      {business.governorate} - {business.city} {business.street ? `- ${business.street}` : ''}
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(`${business.governorate} - ${business.city} - ${business.street || ''}`, 'addr')}
                    className="p-1.5 text-amber-500 hover:bg-amber-500/10 rounded-lg cursor-pointer"
                    title="نسخ العنوان"
                  >
                    {copiedKey === 'addr' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center justify-between bg-[var(--bg-card)] p-2.5 rounded-xl border border-[var(--border-color)]">
                  <div className="truncate pr-1">
                    <span className="text-[10px] text-[var(--text-muted)] font-bold block">التصنيف:</span>
                    <span className="font-bold truncate block text-[var(--text-primary)]">{business.category}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(business.category, 'cat')}
                    className="p-1.5 text-amber-500 hover:bg-amber-500/10 rounded-lg cursor-pointer"
                    title="نسخ التصنيف"
                  >
                    {copiedKey === 'cat' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center justify-between bg-[var(--bg-card)] p-2.5 rounded-xl border border-[var(--border-color)]">
                  <div className="truncate pr-1">
                    <span className="text-[10px] text-[var(--text-muted)] font-bold block">الهاتف:</span>
                    <span className="font-bold truncate block text-[var(--text-primary)] font-mono">{business.phone}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(business.phone, 'phone')}
                    className="p-1.5 text-amber-500 hover:bg-amber-500/10 rounded-lg cursor-pointer"
                    title="نسخ الهاتف"
                  >
                    {copiedKey === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Photos Gallery */}
              <div className="bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)] space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-[var(--border-color)]">
                  <div className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-amber-500" />
                    <span className="font-black text-xs text-[var(--text-primary)]">
                      صور النشاط الجاهزة للرفع ({activePhotos.length})
                    </span>
                  </div>

                  {activePhotos && activePhotos.length > 0 && (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={handleDownloadAll}
                      disabled={isDownloadingAll}
                      loading={isDownloadingAll}
                      icon={<Download className="w-3.5 h-3.5" />}
                      className="text-[10.5px]"
                    >
                      تنزيل جميع الصور
                    </Button>
                  )}
                </div>

                {activePhotos && activePhotos.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                    {activePhotos.map((photo, idx) => (
                      <div 
                        key={idx}
                        className="group relative bg-[var(--bg-card)] rounded-xl overflow-hidden border border-[var(--border-color)] aspect-square flex items-center justify-center shadow-xs"
                      >
                        <img 
                          src={photo} 
                          alt={`صورة ${idx + 1}`} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                          <button
                            onClick={() => setPreviewPhoto(photo)}
                            className="bg-white/20 hover:bg-white/40 text-white p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="معاينة مكبرة"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => downloadSinglePhoto(photo, `${business.nameAr}-photo-${idx + 1}`)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="تنزيل الصورة"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-400 font-bold text-xs">
                    لم يتم إرفاق صور لهذا النشاط.
                  </div>
                )}
              </div>

              {/* Rep Unverified Field Location Link */}
              <div className="space-y-1.5 pt-1">
                <a
                  href={sanitizeExternalUrl(repFieldMapUrl || (business.lat && business.lng ? `https://www.google.com/maps?q=${business.lat},${business.lng}` : ''))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-3 px-4 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer text-center"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>فتح موقع المعاينة الميدانية (إحداثيات المندوب)</span>
                </a>
                <p className="text-[10.5px] text-[var(--text-muted)] text-center font-medium">
                  هذا الرابط مخصص للمراجعة الإدارية والرفع إلى الخرائط.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: VERIFICATION & LIVE URL */}
          {activeTab === 'verification_confirm' && (
            <div className="space-y-4 text-xs animate-fade-in">
              {/* Status Selector Pills */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-[var(--text-primary)]">
                  1. تحديد وتثبيت حالة توثيق خرائط Google:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStatus('not_synced')}
                    className={`py-2.5 px-2 rounded-2xl border text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center ${
                      currentStatus === 'not_synced'
                        ? 'bg-rose-500 text-white border-rose-600 shadow-md scale-102 ring-2 ring-rose-400/40'
                        : 'bg-[var(--bg-card)] text-rose-600 border-rose-500/30 hover:bg-rose-500/10'
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>لم تُرفع بعد</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStatus('in_progress')}
                    className={`py-2.5 px-2 rounded-2xl border text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center ${
                      currentStatus === 'in_progress'
                        ? 'bg-purple-500 text-white border-purple-600 shadow-md scale-102 ring-2 ring-purple-400/40'
                        : 'bg-[var(--bg-card)] text-purple-600 border-purple-500/30 hover:bg-purple-500/10'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>قيد مراجعة جوجل</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const validUrl = formatValidGoogleMapsUrl(finalMapUrl);
                      if (!validUrl || isRawCoordinatesUrl(finalMapUrl)) {
                        setStatusFeedback('يتطلب إدخال رابط معتمد من خرائط Google لتفعيل حالة التوثيق.');
                        setTimeout(() => setStatusFeedback(null), 4000);
                        return;
                      }
                      setCurrentStatus('synced');
                    }}
                    className={`py-2.5 px-2 rounded-2xl border text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center ${
                      currentStatus === 'synced'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-md scale-102 ring-2 ring-emerald-400/40'
                        : 'bg-[var(--bg-card)] text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10'
                    }`}
                    title={!formatValidGoogleMapsUrl(finalMapUrl) ? 'يرجى إدخال رابط الخريطة المعتمد أولاً' : 'موثقة برابط خرائط Google'}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>موثقة بالرابط</span>
                  </button>
                </div>
              </div>

              {/* Verified URL Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-[var(--text-primary)]">
                  2. رابط خرائط Google المعتمد (الموثق على الخريطة):
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={finalMapUrl}
                    onChange={(e) => setFinalMapUrl(e.target.value)}
                    placeholder="https://maps.app.goo.gl/..."
                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-mono text-xs rounded-xl p-3 pr-9 pl-10 focus:outline-none focus:border-amber-500 dir-ltr text-right"
                  />
                  <MapPin className="w-4 h-4 text-amber-500 absolute right-3 top-3.5" />
                  {finalMapUrl && (
                    <a
                      href={sanitizeExternalUrl(finalMapUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute left-3 top-3 text-amber-500 hover:text-amber-600"
                      title="فتح الرابط للتأكد"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Verified Street Address */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-[var(--text-primary)]">
                  3. العنوان التفصيلي المعتمد بعد التوثيق:
                </label>
                <input
                  type="text"
                  value={verifiedAddress}
                  onChange={(e) => setVerifiedAddress(e.target.value)}
                  placeholder="مثال: شارع مصطفى النحاس، أمام محطة الوقود"
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-xs rounded-xl p-3 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Save Button */}
              <Button
                variant="primary"
                size="lg"
                onClick={() => handleSaveVerification()}
                icon={<Save className="w-4 h-4" />}
                className="w-full font-black text-xs sm:text-sm"
              >
                تحديث وحفظ بيانات التوثيق
              </Button>

              {/* WhatsApp Notification */}
              {currentStatus === 'synced' ? (
                <a
                  href={verificationWhatsAppUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm py-3.5 px-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer text-center"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>إرسال إشعار التوثيق ورابط الخريطة عبر واتساب</span>
                </a>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <a
                    href={getGoogleVerificationOtpWhatsAppUrl(business)}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 text-white font-black text-xs sm:text-sm py-3 px-3 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer text-center"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>إرسال إشعار التنسيق المسبق</span>
                  </a>
                  <a
                    href={getGoogleOtpSentAlertWhatsAppUrl(business)}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 text-white font-black text-xs sm:text-sm py-3 px-3 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer text-center"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>إرسال إشعار طلب الكود</span>
                  </a>
                </div>
              )}

              {/* Warning when verified but unpaid balance remains */}
              {currentStatus === 'synced' && remainingBalance > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl flex items-center gap-2.5 text-xs text-amber-700 dark:text-amber-400">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="font-bold">
                    تنبيه مالي: المكان موثق رسمياً ولكن متبقي عليه مبلغ تحصيل بقيمة <strong className="font-mono font-black">{remainingBalance.toLocaleString()} ج.م</strong>.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INVOICE & SHARE */}
          {activeTab === 'share_invoice' && (
            <div className="space-y-4 text-xs animate-fade-in">
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2.5">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] font-bold block">رقم الفاتورة الإلكترونية:</span>
                    <span className="font-black text-sm text-[var(--text-primary)] font-mono">
                      {business.invoiceNumber || `INV-${business.id.substring(0, 8).toUpperCase()}`}
                    </span>
                  </div>
                  <Badge variant={business.paymentStatus === 'fully_paid' ? 'success' : 'warning'} size="sm">
                    {business.paymentStatus === 'fully_paid' ? 'مسدد بالكامل' : `متبقي: ${remainingBalance} ج.م`}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-[var(--text-muted)] font-bold">
                  <div>
                    <span>الباقة المعتمدة: </span>
                    <strong className="text-[var(--text-primary)] font-black">{business.packageName || 'باقة التوثيق'}</strong>
                  </div>
                  <div>
                    <span>المبلغ الإجمالي: </span>
                    <strong className="text-[var(--text-primary)] font-mono font-black">{business.packagePrice || 0} ج.م</strong>
                  </div>
                  <div>
                    <span>تاريخ الفاتورة: </span>
                    <strong className="text-[var(--text-primary)] font-mono">{business.invoiceDate || new Date().toISOString().split('T')[0]}</strong>
                  </div>
                  <div>
                    {(() => {
                      const repInfo = getRepDisplayInfo(business.repName, {
                        repId: business.repId,
                        isFeeExempt: business.isFeeExempt,
                        packageId: business.packageId,
                      });
                      return (
                        <>
                          <span>{repInfo.roleLabel} </span>
                          <strong className="text-[var(--text-primary)] font-black">{repInfo.displayName}</strong>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Direct Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href={verificationWhatsAppUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-3 px-4 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 text-center"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>إرسال إشعار التوثيق والفاتورة عبر واتساب</span>
                </a>

                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => window.print()}
                  icon={<Printer className="w-4 h-4 text-amber-500" />}
                  className="font-bold text-xs"
                >
                  طباعة شهادة التوثيق والفاتورة
                </Button>
              </div>
            </div>
          )}
        </div>
      </BaseModal>

      {/* PHOTO PREVIEW MODAL */}
      {previewPhoto && (
        <BaseModal
          isOpen={true}
          onClose={() => setPreviewPhoto(null)}
          title="معاينة الصورة"
          size="lg"
          zIndex={80}
        >
          <div className="space-y-3">
            <div className="max-h-[75vh] overflow-hidden rounded-2xl flex items-center justify-center bg-slate-950 p-2">
              <img src={previewPhoto} alt="معاينة" className="max-h-[70vh] w-auto object-contain rounded-lg" />
            </div>
            <div className="text-center">
              <Button
                variant="success"
                size="md"
                onClick={() => downloadSinglePhoto(previewPhoto, `${business.nameAr}-photo`)}
                icon={<Download className="w-4 h-4" />}
              >
                تنزيل الصورة
              </Button>
            </div>
          </div>
        </BaseModal>
      )}
    </>
  );
};
