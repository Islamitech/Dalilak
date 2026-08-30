import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Business, VerificationStatus } from '../types';
import { 
  MapPin, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles, 
  Clock, 
  Image as ImageIcon, 
  ShieldCheck, 
  Printer,
  AlertCircle,
  Download,
  Eye,
  MessageCircle,
  Share2,
  FileText,
  Building2,
  Phone,
} from 'lucide-react';
import { downloadSinglePhoto, downloadAllBusinessPhotos } from '../utils/photoDownloader';

interface GoogleMapsSyncModalProps {
  business: Business;
  isOpen: boolean;
  onClose: () => void;
  onUpdateBusiness?: (updatedBusiness: Business) => void;
}

export const GoogleMapsSyncModal: React.FC<GoogleMapsSyncModalProps> = ({
  business,
  isOpen,
  onClose,
  onUpdateBusiness,
}) => {
  const [activeTab, setActiveTab] = useState<'data_upload' | 'verification_confirm' | 'share_invoice'>('data_upload');
  const [finalMapUrl, setFinalMapUrl] = useState<string>(business.googleMapsUrl || '');
  const [verifiedAddress, setVerifiedAddress] = useState<string>(
    business.street && !business.street.includes('الموقع الجغرافي المسجل') ? business.street : ''
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState<boolean>(false);
  const [currentStatus, setCurrentStatus] = useState<VerificationStatus>(business.verificationStatus || 'pending');
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentStatus(business.verificationStatus || 'pending');
      setFinalMapUrl(business.googleMapsUrl || '');
      setVerifiedAddress(
        business.street && !business.street.includes('الموقع الجغرافي المسجل') ? business.street : ''
      );
    }
  }, [isOpen, business]);

  if (!isOpen) return null;

  const directMapUrl = finalMapUrl.trim() || `https://www.google.com/maps/search/?api=1&query=${business.lat},${business.lng}`;

  const copyToClipboard = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2200);
  };

  const handleDownloadAll = async () => {
    if (!business.photos || business.photos.length === 0) return;
    setIsDownloadingAll(true);
    await downloadAllBusinessPhotos(business.photos, business.nameAr);
    setIsDownloadingAll(false);
  };

  const handleSaveVerification = (targetStatus?: VerificationStatus) => {
    const newStatus = targetStatus || currentStatus;
    let gStatus: 'synced' | 'in_progress' | 'not_synced' | 'failed' = 'not_synced';
    if (newStatus === 'verified') gStatus = 'synced';
    else if (newStatus === 'in_progress') gStatus = 'in_progress';
    else if (newStatus === 'pending') gStatus = 'not_synced';
    else if (newStatus === 'rejected') gStatus = 'failed';

    const updated: Business = {
      ...business,
      googleMapsUrl: finalMapUrl.trim() || business.googleMapsUrl,
      street: verifiedAddress.trim() || business.street,
      verificationStatus: newStatus,
      googleSyncStatus: gStatus,
      googleSyncDate: newStatus === 'verified' ? (business.googleSyncDate || new Date().toISOString().split('T')[0]) : business.googleSyncDate,
    };

    setCurrentStatus(newStatus);
    if (onUpdateBusiness) {
      onUpdateBusiness(updated);
    }

    const label = 
      newStatus === 'verified' ? '🟢 موثق ومعتمد رسمياً على الخريطة' : 
      newStatus === 'in_progress' ? '⏳ أُرسلت للمراجعة' : 
      newStatus === 'rejected' ? '🔴 مرفوض' : '🚨 لم تُرفع بعد';

    setStatusFeedback(`تم حفظ وتحديث بيانات النشاط بنجاح (${label})`);
    setTimeout(() => setStatusFeedback(null), 3500);
  };

  const remainingBalance = Math.max(0, (business.packagePrice || 0) - (business.amountPaid || 0));
  const isFullyPaid = business.paymentStatus === 'fully_paid' || remainingBalance === 0;
  const activeGoogleMapsUrl = finalMapUrl.trim() || business.googleMapsUrl || directMapUrl;
  const directoryUrl = 'https://www.dalilaak.com/';
  const targetAddress = verifiedAddress.trim() || business.street || (business.city ? `${business.city} (${business.governorate})` : business.governorate);

  const allDetailsText = 
    `اسم النشاط: ${business.nameAr}\n` +
    `التصنيف: ${business.category}\n` +
    `العنوان: ${targetAddress}\n` +
    `أوقات العمل: ${business.workingHours || 'يومياً'}\n` +
    `الهاتف: ${business.phone} ${business.secondaryPhone ? `| ${business.secondaryPhone}` : ''}\n` +
    `الإحداثيات: ${business.lat}, ${business.lng}\n` +
    `رابط الخريطة: ${activeGoogleMapsUrl}`;

  const cleanOwnerPhone = (business.ownerPhone || business.phone || '').replace(/\D/g, '').replace(/^0/, '');
  const targetWaPhone = cleanOwnerPhone.startsWith('20') ? cleanOwnerPhone : `20${cleanOwnerPhone}`;

  const verificationWhatsAppMessage = encodeURIComponent(
    `*توثيق واعتماد رسمي على خرائط Google*\n\n` +
    `أهلاً بحضرتك أستاذ *${business.ownerName || 'صاحب النشاط'}*\n` +
    `تم تفعيل ونشر نشاطكم *(${business.nameAr})* رسمياً على خرائط Google.\n\n` +
    (isFullyPaid
      ? `*حالة السداد:* مسدد بالكامل (${business.packagePrice || business.amountPaid || 0} ج.م) ✓\n\n`
      : `*حالة السداد:* متبقي سداد (*${remainingBalance} ج.م*)\n\n` +
        `*طرق الدفع المعتمدة للتسوية:*\n` +
        `- فودافون كاش: 01143888355 أو 01556221141\n` +
        `- إنستاباي (InstaPay): @daz31181\n\n` +
        `*(يرجى إرسال صورة إيصال التحويل بعد الدفع لتأكيد التسوية)*\n\n`) +
    `*رابط موقعكم المباشر على Google Maps:*\n` +
    `${activeGoogleMapsUrl}\n\n` +
    `شكراً لاختياركم منصة دليلك!`
  );

  return createPortal(
    <div className="fixed inset-0 z-[10050] bg-slate-950/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto modal-overlay animate-fade-in">
      <div className="bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-t-3xl sm:rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4 my-0 sm:my-auto relative text-[var(--text-primary)] transition-all duration-300 max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 bg-[var(--input-bg)] hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-500 w-8 h-8 rounded-full flex items-center justify-center transition-colors text-xs font-bold no-print border border-[var(--border-color)] cursor-pointer z-10"
        >
          ✕
        </button>

        {/* ── HEADER ────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3.5 pr-1 pl-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center font-black shadow-inner shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-[var(--text-primary)] leading-none">
                  {business.nameAr}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/10 text-[var(--text-muted)] border border-[var(--border-color)]">
                  {business.governorate} • {business.category}
                </span>
              </div>
              <span className="text-[11px] text-[var(--text-muted)] font-bold mt-1 block">
                مساعد التوثيق ونقل النشاط على خرائط Google 🗺️
              </span>
            </div>
          </div>

          {/* Current Status Pill */}
          <div className="hidden sm:block shrink-0">
            {currentStatus === 'verified' ? (
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-black">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>موثق ومعتمد ✅</span>
              </span>
            ) : currentStatus === 'in_progress' ? (
              <span className="inline-flex items-center gap-1.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-black">
                <Clock className="w-3.5 h-3.5" />
                <span>أُرسلت للمراجعة ⏳</span>
              </span>
            ) : currentStatus === 'rejected' ? (
              <span className="inline-flex items-center gap-1.5 bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-black">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>مرفوض 🔴</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30 px-3 py-1 rounded-full text-xs font-black">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>لم تُرفع بعد 🚨</span>
              </span>
            )}
          </div>
        </div>

        {/* FEEDBACK BANNER */}
        {statusFeedback && (
          <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 py-2 px-3 rounded-2xl text-xs font-black text-center flex items-center justify-center gap-2 animate-fade-in shadow-xs">
            <Check className="w-4 h-4 text-emerald-500" />
            <span>{statusFeedback}</span>
          </div>
        )}

        {/* ── WORKFLOW TABS ─────────────────────────────────────────────────── */}
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
            <span>1. نسخ البيانات والصور 📋</span>
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
            <span>2. تثبيت الرابط والحالة 🔗</span>
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
            <span>3. الفاتورة والشهادة 📄</span>
          </button>
        </div>

        {/* ── TAB 1: DATA COPY & PHOTOS ─────────────────────────────────────── */}
        {activeTab === 'data_upload' && (
          <div className="space-y-3.5 overflow-y-auto pr-1 custom-scrollbar text-xs">
            
            {/* Master Copy Button */}
            <button
              onClick={() => copyToClipboard(allDetailsText, 'all')}
              className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black py-3 px-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-101 active:scale-98 cursor-pointer text-xs sm:text-sm"
            >
              {copiedKey === 'all' ? <Check className="w-4 h-4 text-slate-950 stroke-[3]" /> : <Copy className="w-4 h-4" />}
              <span>{copiedKey === 'all' ? 'تم نسخ جميع بيانات النشاط بنجاح!' : 'نسخ جميع بيانات النشاط كنص كامل بنقرة واحدة 📋'}</span>
            </button>

            {/* Compact Copy Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center justify-between bg-[var(--bg-card)] p-2.5 rounded-xl border border-[var(--border-color)]">
                <div className="truncate pr-1">
                  <span className="text-[10px] text-[var(--text-muted)] font-bold block">🏢 اسم النشاط:</span>
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
                  <span className="text-[10px] text-[var(--text-muted)] font-bold block">📍 العنوان:</span>
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
                  <span className="text-[10px] text-[var(--text-muted)] font-bold block">🏷️ التصنيف:</span>
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
                  <span className="text-[10px] text-[var(--text-muted)] font-bold block">📞 الهاتف:</span>
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
                    صور النشاط الجاهزة للرفع ({business.photos?.length || 0})
                  </span>
                </div>

                {business.photos && business.photos.length > 0 && (
                  <button
                    onClick={handleDownloadAll}
                    disabled={isDownloadingAll}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10.5px] py-1 px-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isDownloadingAll ? 'جاري التنزيل...' : 'تنزيل جميع الصور 📦'}</span>
                  </button>
                )}
              </div>

              {business.photos && business.photos.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                  {business.photos.map((photo, idx) => (
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

            {/* Direct Open in Google Maps Link */}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${business.lat},${business.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-xs py-3 px-4 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer text-center"
            >
              <ExternalLink className="w-4 h-4" />
              <span>فتح إحداثيات المكان على Google Maps لإضافة النشاط ورفع الصور 🗺️</span>
            </a>
          </div>
        )}

        {/* ── TAB 2: VERIFICATION & LIVE URL ────────────────────────────────── */}
        {activeTab === 'verification_confirm' && (
          <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar text-xs">
            
            {/* Status Selector Pills */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-[var(--text-primary)]">
                1. تحديد وتثبيت حالة التوثيق في المنظومة:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStatus('pending')}
                  className={`py-2.5 px-2 rounded-2xl border text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center ${
                    currentStatus === 'pending'
                      ? 'bg-rose-500 text-white border-rose-600 shadow-md scale-102 ring-2 ring-rose-400/40'
                      : 'bg-[var(--bg-card)] text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>لم تُرفع بعد 🚨</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStatus('in_progress')}
                  className={`py-2.5 px-2 rounded-2xl border text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center ${
                    currentStatus === 'in_progress'
                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md scale-102 ring-2 ring-amber-400/40'
                      : 'bg-[var(--bg-card)] text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>أُرسلت للمراجعة ⏳</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStatus('verified')}
                  className={`py-2.5 px-2 rounded-2xl border text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center ${
                    currentStatus === 'verified'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-md scale-102 ring-2 ring-emerald-400/40'
                      : 'bg-[var(--bg-card)] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>موثق ومعتمد ✅</span>
                </button>
              </div>
            </div>

            {/* Inputs: Live URL & Address */}
            <div className="bg-[var(--bg-card)] p-3.5 rounded-2xl border border-[var(--border-color)] space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-[var(--text-primary)]">
                    2. رابط النشاط المباشر الصادر من خرائط Google:
                  </label>
                  {finalMapUrl && (
                    <a
                      href={finalMapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-500 hover:underline text-[10.5px] font-bold flex items-center gap-1"
                    >
                      <span>اختبار الرابط</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <input
                  type="url"
                  dir="ltr"
                  placeholder="https://maps.app.goo.gl/... أو https://goo.gl/maps/..."
                  value={finalMapUrl}
                  onChange={(e) => setFinalMapUrl(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-mono text-xs rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs font-bold text-left"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-[var(--text-primary)]">
                  3. العنوان المعتمد النهائي الصادر من الخريطة:
                </label>
                <input
                  type="text"
                  placeholder="مثال: 15 شارع مصدق، بجوار محطة مترو الدقي، الجيزة"
                  value={verifiedAddress}
                  onChange={(e) => setVerifiedAddress(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs font-bold"
                />
              </div>
            </div>

            {/* Save Button */}
            <button
              type="button"
              onClick={() => handleSaveVerification()}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm py-3.5 px-4 rounded-2xl shadow-lg hover:scale-101 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>حفظ وتثبيت التوثيق في المنظومة 💾</span>
            </button>

            {/* Direct WhatsApp Verification Message Dispatch Button */}
            {currentStatus === 'verified' && (
              <a
                href={`https://wa.me/${targetWaPhone}?text=${verificationWhatsAppMessage}`}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm py-3.5 px-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer text-center"
              >
                <MessageCircle className="w-4 h-4" />
                <span>إرسال رسالة التوثيق والموقع المفعل للعميل عبر WhatsApp 💬</span>
              </a>
            )}

            {/* Warning when verified but unpaid balance remains */}
            {currentStatus === 'verified' && remainingBalance > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl flex items-center gap-2.5 text-xs text-amber-700 dark:text-amber-300">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="font-bold">
                  تنبيه مالي: النشاط موثق رسمياً ولكن متبقي عليه مبلغ تحصيل بقيمة <strong className="font-mono font-black">{remainingBalance.toLocaleString()} ج.م</strong>.
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: INVOICE & SHARE ────────────────────────────────────────── */}
        {activeTab === 'share_invoice' && (
          <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar text-xs">
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2.5">
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] font-bold block">رقم الفاتورة الإلكترونية:</span>
                  <span className="font-black text-sm text-[var(--text-primary)] font-mono">
                    {business.invoiceNumber || `INV-${business.id.substring(0, 8).toUpperCase()}`}
                  </span>
                </div>
                <span className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10.5px] font-black px-2.5 py-1 rounded-xl">
                  {business.paymentStatus === 'fully_paid' ? 'مسدد بالكامل ✓' : `متبقي: ${remainingBalance} ج.م`}
                </span>
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
                  <span>المندوب المسؤول: </span>
                  <strong className="text-[var(--text-primary)] font-black">{business.repName || 'مندوب معتمد'}</strong>
                </div>
              </div>
            </div>

            {/* Direct Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href={`https://wa.me/${targetWaPhone}?text=${verificationWhatsAppMessage}`}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-3 px-4 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 text-center"
              >
                <MessageCircle className="w-4 h-4" />
                <span>إرسال إشعار التوثيق والفاتورة عبر واتساب 💬</span>
              </a>

              <button
                onClick={() => window.print()}
                className="bg-[var(--input-bg)] hover:bg-amber-500/10 text-[var(--text-primary)] font-bold text-xs py-3 px-4 rounded-2xl border border-[var(--border-color)] flex items-center justify-center gap-2 transition-colors cursor-pointer no-print"
              >
                <Printer className="w-4 h-4 text-amber-500" />
                <span>طباعة شهادة التوثيق والفاتورة 🖨️</span>
              </button>
            </div>
          </div>
        )}

        {/* ── PHOTO PREVIEW MODAL ───────────────────────────────────────────── */}
        {previewPhoto && (
          <div className="fixed inset-0 z-[10100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
            <div className="relative max-w-2xl w-full">
              <button
                onClick={() => setPreviewPhoto(null)}
                className="absolute -top-10 left-0 bg-white/20 hover:bg-white/40 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-black cursor-pointer"
              >
                ✕
              </button>
              <img
                src={previewPhoto}
                alt="معاينة الصورة"
                className="max-w-full max-h-[80vh] object-contain rounded-2xl border-2 border-amber-500 shadow-2xl mx-auto"
              />
              <div className="mt-3 text-center">
                <button
                  onClick={() => downloadSinglePhoto(previewPhoto, `${business.nameAr}-photo`)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-4 rounded-xl inline-flex items-center gap-2 shadow-lg cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>تنزيل الصورة بجودة عالية 📥</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
};
