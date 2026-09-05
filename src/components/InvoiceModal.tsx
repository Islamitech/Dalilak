import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { toPng } from 'html-to-image';
import { Business, AdditionalServiceInvoice } from '../types';
import { Logo } from './Logo';
import { AddServiceInvoiceModal } from './modals/AddServiceInvoiceModal';
import { 
  Printer, 
  Share2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  MapPin, 
  Copy, 
  Check, 
  Zap, 
  Gift,
  Download,
  DollarSign,
  Send,
  ExternalLink,
  FilePlus,
  CreditCard,
  FileText,
} from 'lucide-react';
import { downloadSinglePhoto } from '../utils/photoDownloader';
import {
  getInvoiceWhatsAppUrl,
  generateInvoiceWhatsAppMessage,
  getUpgradeOffersWhatsAppUrl,
  generateUpgradeOffersWhatsAppMessage,
  getAdditionalInvoiceWhatsAppUrl,
  generateAdditionalInvoiceWhatsAppMessage,
} from '../utils/whatsappMessages';
import { generateQrDataUrl } from '../utils/qrGenerator';
import { triggerHaptic } from '../utils/haptics';

interface InvoiceModalProps {
  business: Business | null;
  selectedAdditionalInvoiceId?: string;
  onClose: () => void;
  isExternalView?: boolean;
  userRole?: string;
  isAdmin?: boolean;
  currentUserName?: string;
  onUpdateBusiness?: (updatedBusiness: Business) => void;
  onCollectPayment?: (business: Business) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ 
  business, 
  selectedAdditionalInvoiceId,
  onClose, 
  isExternalView = false,
  userRole,
  isAdmin = false,
  currentUserName,
  onUpdateBusiness,
  onCollectPayment,
}) => {
  const isPrivilegedUser = isAdmin || userRole === 'admin' || userRole === 'supervisor' || userRole === 'accountant';
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedOffers, setCopiedOffers] = useState<boolean>(false);
  const [currentBiz, setCurrentBiz] = useState<Business | null>(business);
  const [selectedInvoiceTab, setSelectedInvoiceTab] = useState<string>(selectedAdditionalInvoiceId || 'primary');
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState<boolean>(false);
  const [isSavingImage, setIsSavingImage] = useState<boolean>(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentBiz(business);
  }, [business]);

  useEffect(() => {
    if (selectedAdditionalInvoiceId) {
      setSelectedInvoiceTab(selectedAdditionalInvoiceId);
    }
  }, [selectedAdditionalInvoiceId]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Safe early exit if neither business prop nor currentBiz state is present
  const activeBusiness = business || currentBiz;
  if (!activeBusiness) return null;

  const currentAdditionalInvoice = activeBusiness.additionalInvoices?.find(
    (inv) => inv.id === selectedInvoiceTab
  );
  const isAdditional = Boolean(currentAdditionalInvoice && selectedInvoiceTab !== 'primary');

  const isFeeExempt = Boolean(!isAdditional && (activeBusiness.isFeeExempt || activeBusiness.packagePrice === 0));
  const pkgPrice = isAdditional
    ? (currentAdditionalInvoice?.amount || 0)
    : isFeeExempt ? 0 : (activeBusiness.packagePrice || 250);
  const amtPaid = isAdditional
    ? (currentAdditionalInvoice?.amountPaid || 0)
    : isFeeExempt ? 0 : (activeBusiness.amountPaid || 0);
  const remaining = isFeeExempt ? 0 : Math.max(0, pkgPrice - amtPaid);
  const effectivePaymentStatus = isAdditional
    ? (currentAdditionalInvoice?.paymentStatus || 'unpaid')
    : activeBusiness.paymentStatus;
  const effectiveInvoiceNumber = isAdditional
    ? (currentAdditionalInvoice?.invoiceNumber || 'ADD-2026-000')
    : activeBusiness.invoiceNumber;
  const effectiveInvoiceDate = isAdditional
    ? (currentAdditionalInvoice?.issueDate || new Date().toISOString().split('T')[0])
    : (activeBusiness.invoiceDate || new Date().toISOString().split('T')[0]);

  const directoryUrl = 'https://www.dalilaak.com/';

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

  const handleCopyInvoice = () => {
    if (isAdditional && currentAdditionalInvoice) {
      navigator.clipboard.writeText(generateAdditionalInvoiceWhatsAppMessage(activeBusiness, currentAdditionalInvoice));
    } else {
      navigator.clipboard.writeText(generateInvoiceWhatsAppMessage(activeBusiness));
    }
    triggerHaptic('light');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const whatsappShareUrl = isAdditional && currentAdditionalInvoice
    ? getAdditionalInvoiceWhatsAppUrl(activeBusiness, currentAdditionalInvoice)
    : getInvoiceWhatsAppUrl(activeBusiness);

  // Dynamic QR Code URL to open the invoice online
  const baseUrl = typeof window !== 'undefined' && window.location.origin.includes('localhost') ? window.location.origin : 'https://www.dalilaak.com';
  const qrUrl = isAdditional && currentAdditionalInvoice
    ? `${baseUrl}/?view=invoice&id=${activeBusiness.id}&invId=${currentAdditionalInvoice.id}`
    : `${baseUrl}/?view=invoice&id=${activeBusiness.id}`;
  const qrImageUrl = generateQrDataUrl(qrUrl, 250);

  // Pixel-Perfect DOM Screenshot Downloader using html-to-image (Adaptive pixelRatio to protect mobile RAM)
  const handleSaveInvoiceImage = async () => {
    if (!invoiceRef.current) return;
    try {
      setIsSavingImage(true);
      triggerHaptic('selection');
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
      const dataUrl = await toPng(invoiceRef.current, {
        cacheBust: true,
        pixelRatio: isMobile ? 2 : 2.5, // Protect mobile RAM while keeping high resolution
        backgroundColor: '#ffffff',
      });
      downloadSinglePhoto(
        dataUrl,
        `فاتورة-${activeBusiness.nameAr || 'نشاط'}-${activeBusiness.invoiceNumber || 'INV'}.png`
      );
      triggerHaptic('success');
    } catch (err) {
      console.warn('html-to-image capture error, falling back to print:', err);
      window.print();
    } finally {
      setIsSavingImage(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto" dir="rtl">
      <div 
        className="bg-[var(--modal-bg)] border border-[var(--modal-border)] rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 my-0 sm:my-auto relative text-[var(--text-primary)] modal-content transition-colors duration-300 overflow-y-auto max-h-[94vh]"
      >
        {/* Mobile Pull-Down Handle */}
        <div 
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="w-full sm:hidden flex justify-center pt-1 pb-1 cursor-grab active:cursor-grabbing select-none"
          title="اسحب لأسفل للإغلاق"
        >
          <div className="w-12 h-1.5 bg-slate-400/40 rounded-full" />
        </div>
        {/* Header Action Bar */}
        <div className="flex items-center justify-between no-print border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="bg-[var(--input-bg)] hover:bg-amber-500/15 text-[var(--text-primary)] w-8 h-8 rounded-full flex items-center justify-center transition-colors text-xs font-bold border border-[var(--border-color)] cursor-pointer"
              title="طباعة الفاتورة"
            >
              <Printer className="w-4 h-4 text-amber-500" />
            </button>
            <button
              type="button"
              onClick={handleSaveInvoiceImage}
              disabled={isSavingImage}
              className="bg-[var(--input-bg)] hover:bg-amber-500/15 text-[var(--text-primary)] w-8 h-8 rounded-full flex items-center justify-center transition-colors text-xs font-bold border border-[var(--border-color)] cursor-pointer"
              title="حفظ الفاتورة كصورة"
            >
              <Download className="w-4 h-4 text-amber-500" />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="bg-[var(--input-bg)] hover:bg-rose-500/15 text-[var(--text-muted)] hover:text-rose-500 w-8 h-8 rounded-full flex items-center justify-center transition-colors text-xs font-bold border border-[var(--border-color)] cursor-pointer"
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>

        {/* Invoice Tabs Selector (When Additional Invoices Exist or for Privileged Users) */}
        {activeBusiness.additionalInvoices && activeBusiness.additionalInvoices.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar no-print">
            <button
              type="button"
              onClick={() => setSelectedInvoiceTab('primary')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedInvoiceTab === 'primary'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'bg-[var(--input-bg)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:text-[var(--text-primary)]'
              }`}
            >
              📋 الفاتورة الأساسية ({activeBusiness.invoiceNumber})
            </button>
            {activeBusiness.additionalInvoices.map((inv) => (
              <button
                key={inv.id}
                type="button"
                onClick={() => setSelectedInvoiceTab(inv.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedInvoiceTab === inv.id
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'bg-[var(--input-bg)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:text-[var(--text-primary)]'
                }`}
              >
                🧾 {inv.serviceTitle} ({inv.invoiceNumber})
              </button>
            ))}
            {isPrivilegedUser && onUpdateBusiness && (
              <button
                type="button"
                onClick={() => setShowAddInvoiceModal(true)}
                className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1"
                title="إصدار فاتورة خدمة إضافية جديدة"
              >
                <FilePlus className="w-3.5 h-3.5" />
                <span>+ فاتورة خدمة</span>
              </button>
            )}
          </div>
        )}

        {/* ── PRINTABLE INVOICE CARD CONTAINER ────────────────────────── */}
        <div 
          ref={invoiceRef}
          className="bg-white text-slate-900 rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-md space-y-4 print:border-none print:shadow-none print:p-0"
        >
          {/* Top Header */}
          <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4 gap-3">
            <div className="flex items-center">
              <Logo size="md" showSubtitle={true} variant="full" />
            </div>

            <div className="text-left space-y-1">
              <span className={`inline-block text-[10.5px] font-black px-3 py-1 rounded-full border shadow-2xs ${
                isAdditional
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : activeBusiness.isAlreadyOnGoogle || activeBusiness.packageId === 'pkg_already_on_google'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : isFeeExempt
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : 'bg-amber-50 text-amber-900 border-amber-300'
              }`}>
                {isAdditional
                  ? 'فاتورة خدمة إضافية معتمدة (منصة دليلك) 🧾'
                  : activeBusiness.isAlreadyOnGoogle || activeBusiness.packageId === 'pkg_already_on_google'
                  ? 'فاتورة ترحيبية وإشعار انضمام بالدليل 🌟'
                  : isFeeExempt
                  ? 'فاتورة إلكترونية معتمدة (إدراج مجاني)'
                  : 'فاتورة إلكترونية معتمدة'}
              </span>
              <div className="text-xs font-mono font-black text-slate-700" dir="ltr">
                {effectiveInvoiceNumber}
              </div>
              <div className="text-[10.5px] font-bold text-slate-400">
                {effectiveInvoiceDate}
              </div>
            </div>
          </div>

          {/* Client & Business Info Card */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50/90 p-4 rounded-2xl border border-slate-200 text-xs shadow-2xs">
            <div className="text-right space-y-1">
              <span className="text-[10.5px] text-slate-400 font-bold block">النشاط التجاري:</span>
              <span className="font-black text-slate-900 text-sm block truncate">{activeBusiness.nameAr}</span>
              <span className="text-[11px] text-amber-700 font-bold block truncate">{activeBusiness.category}</span>
              <span className="text-[10.5px] text-slate-500 font-medium block">{activeBusiness.governorate} - {activeBusiness.city}</span>
            </div>

            <div className="text-right space-y-1 border-r border-slate-200 pr-3">
              <span className="text-[10.5px] text-slate-400 font-bold block">صاحب النشاط / العميل:</span>
              <span className="font-black text-slate-900 text-sm block truncate">{activeBusiness.ownerName || 'صاحب النشاط'}</span>
              <span className="text-xs text-slate-700 font-mono font-bold block" dir="ltr">{activeBusiness.ownerPhone || activeBusiness.phone}</span>
              <span className="text-[10.5px] text-slate-500 font-bold block truncate">
                {isAdditional 
                  ? `الجهة المصدرة: إدارة منصة دليلك (${currentAdditionalInvoice?.issuedByName || 'الإدارة'})`
                  : `المندوب: ${activeBusiness.repName || 'مندوب معتمد'}`}
              </span>
            </div>
          </div>

          {/* Package Details Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs shadow-2xs">
            <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between font-black text-slate-700 text-[11px]">
              <span>الخدمة / الباقة المختارة</span>
              <span>القيمة</span>
            </div>
            <div className="p-3.5 flex items-center justify-between bg-white">
              <div className="space-y-0.5">
                <span className="font-black text-slate-900 text-xs sm:text-sm block">
                  {isAdditional
                    ? currentAdditionalInvoice?.serviceTitle
                    : activeBusiness.isAlreadyOnGoogle || activeBusiness.packageId === 'pkg_already_on_google'
                    ? 'إدراج وربط النشاط في دليل دليلك المعتمد'
                    : activeBusiness.packageName || (isFeeExempt ? 'نشاط رائج بالمنطقة (إدراج مجاني بدون رسوم)' : 'باقة التوثيق الأساسي')}
                </span>
                <span className="text-[10.5px] text-slate-500 font-medium block">
                  {isAdditional
                    ? (currentAdditionalInvoice?.notes || 'خدمة إضافية معتمدة صادرة حصرياً عن إدارة منصة دليلك ومحصلة إلكترونياً')
                    : activeBusiness.isAlreadyOnGoogle || activeBusiness.packageId === 'pkg_already_on_google'
                    ? 'إدراج وتوثيق النشاط التجاري بالدليل الميداني مجاناً 100% بدون أي مقابل مالي لتعزيز وصول العملاء والزوار'
                    : isFeeExempt 
                    ? 'إدراج وتوثيق النشاط التجاري الرائج بالدليل والخرائط مجاناً وبدون أي مقابل مالي'
                    : 'توثيق واستخراج الإحداثيات والظهور على خرائط Google والدليل'}
                </span>
              </div>
              <span className="font-black text-slate-950 font-mono text-sm shrink-0 mr-2">
                {isFeeExempt ? '0 ج.م (مجاناً)' : `${pkgPrice} ج.م`}
              </span>
            </div>
          </div>

          {/* Financial Summary Box */}
          <div className="space-y-2 bg-slate-50/90 p-4 rounded-2xl border border-slate-200 text-xs font-bold shadow-2xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>إجمالي قيمة الخدمة:</span>
              <span className="font-mono text-slate-900">
                {isFeeExempt ? '0 جنيه مصري (مجاناً)' : `${pkgPrice} جنيه مصري`}
              </span>
            </div>
            <div className="flex items-center justify-between text-emerald-700 font-black">
              <span>المبلغ المسدد إلكترونياً:</span>
              <span className="font-mono">
                {isFeeExempt ? '0 جنيه مصري (معفى بالكامل)' : `${amtPaid} جنيه مصري`}
              </span>
            </div>
            <div className="border-t border-slate-200/80 pt-1.5 flex items-center justify-between">
              <span className={remaining > 0 ? (amtPaid === 0 ? 'text-amber-800 font-black' : 'text-rose-700 font-black') : 'text-slate-500 font-bold'}>
                {remaining > 0 ? (amtPaid === 0 ? 'المبلغ المستحق:' : 'المبلغ المتبقي:') : 'المبلغ المتبقي:'}
              </span>
              <span className={`font-mono ${remaining > 0 ? (amtPaid === 0 ? 'text-amber-800 font-black text-sm' : 'text-rose-700 font-black text-sm') : 'text-slate-500'}`}>
                {remaining} جنيه مصري
              </span>
            </div>
          </div>

          {/* Official Electronic Payment channels box for Additional Invoices */}
          {isAdditional && (
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300 rounded-2xl p-3.5 text-xs text-emerald-950 font-bold shadow-2xs space-y-1 text-right">
              <div className="flex items-center gap-1.5 text-emerald-900 font-black text-xs">
                <CreditCard className="w-4 h-4 text-emerald-700" />
                <span>قنوات التحصيل والسداد الإلكتروني المعتمدة لحسابات المنصة:</span>
              </div>
              <div className="text-[11px] text-emerald-800 space-y-0.5 pt-1 border-t border-emerald-200">
                <div>📱 محفظة فودافون كاش: <span className="font-mono font-black" dir="ltr">01143888355 / 01556221141</span></div>
                <div>⚡ إنستاباي InstaPay: <span className="font-mono font-black" dir="ltr">@daz31181</span></div>
              </div>
            </div>
          )}

          {/* QR Code and Status Row */}
          <div className="flex items-center justify-between pt-0.5 gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">حالة الفاتورة:</span>
              <span className={`text-xs font-black px-3.5 py-1.5 rounded-xl border flex items-center gap-1.5 shadow-2xs ${
                effectivePaymentStatus === 'fully_paid' || isFeeExempt
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : effectivePaymentStatus === 'partially_paid'
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-amber-50 text-amber-900 border-amber-300'
              }`}>
                {isFeeExempt
                  ? 'معفى بالكامل (مجاني) ✓'
                  : effectivePaymentStatus === 'fully_paid'
                  ? 'مدفوعة بالكامل إلكترونياً ✓'
                  : effectivePaymentStatus === 'partially_paid'
                  ? `متبقي ${remaining} ج`
                  : 'غير مدفوعة ⏳'}
              </span>
            </div>

            <div className="p-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs shrink-0">
              <img src={qrImageUrl} alt="QR Code" className="w-14 h-14 rounded-lg block" />
            </div>
          </div>

          {/* Directory Portal Link Notice */}
          <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border border-amber-300 rounded-2xl p-3 text-center text-[11px] text-amber-950 font-bold shadow-2xs space-y-0.5">
            <div>
              {activeBusiness.isAlreadyOnGoogle || activeBusiness.packageId === 'pkg_already_on_google'
                ? '🌟 يسعدنا الترحيب بنشاطكم في منصة دليلك! نؤكد لكم أن رسوم الظهور والإدراج في الدليل مجانية تماماً:'
                : isFeeExempt
                ? '🌟 نشاطكم مسجل كمعلم رائج ومعفى مجاناً في دليل الأنشطة المعتمد بمصر:'
                : '✨ نشاطكم التجاري منشور ومتاح في دليل الأنشطة المعتمد في مصر:'}
            </div>
            <div>
              <a href={directoryUrl} target="_blank" rel="noreferrer" className="text-amber-800 hover:text-amber-900 underline font-mono font-black">
                {directoryUrl}
              </a>
            </div>
          </div>
        </div>

        {/* Action Buttons Box */}
        <div className="space-y-2 no-print">
          {isPrivilegedUser ? (
            <>
              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-sm py-3 px-4 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>إرسال الفاتورة عبر واتساب الرسمي</span>
              </a>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopyInvoice}
                  className="bg-[var(--input-bg)] hover:bg-amber-500/15 text-[var(--text-primary)] font-bold text-xs py-2.5 px-3 rounded-xl border border-[var(--border-color)] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-amber-500" />}
                  <span>{copied ? 'تم النسخ!' : 'نسخ نص الفاتورة'}</span>
                </button>

                {remaining > 0 && onCollectPayment && !isAdditional && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onCollectPayment(activeBusiness);
                    }}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black text-xs py-2.5 px-3 rounded-xl shadow flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>تحصيل الفاتورة 💳</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 text-center text-xs space-y-1.5 animate-fade-in">
              <div className="font-black text-amber-800 dark:text-amber-300 flex items-center justify-center gap-1.5 text-xs sm:text-sm">
                <span>📷 يرجى الطلب من صاحب النشاط تصوير شاشة الفاتورة بهاتفه</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] font-bold leading-relaxed">
                يتم إرسال الفاتورة الرسمية وتأكيد التوثيق والمتابعة حصرياً من خلال <strong>حساب المنصة الرسمي عبر الواتساب</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Modal for issuing new additional service invoice */}
        {showAddInvoiceModal && (
          <AddServiceInvoiceModal
            business={activeBusiness}
            isOpen={showAddInvoiceModal}
            onClose={() => setShowAddInvoiceModal(false)}
            onSaveInvoice={(newInv) => {
              const updated = {
                ...activeBusiness,
                additionalInvoices: [newInv, ...(activeBusiness.additionalInvoices || [])],
              };
              if (onUpdateBusiness) {
                onUpdateBusiness(updated);
              }
              setSelectedInvoiceTab(newInv.id);
            }}
            currentUserName={currentUserName}
            currentUserRole={userRole}
          />
        )}

        {/* Upgrade Offers Box */}
        {isPrivilegedUser && (
          <div className="bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 p-3 rounded-2xl border border-amber-500/30 no-print space-y-1.5 text-right">
            <div className="flex items-center justify-between">
              <span className="font-black text-xs text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-amber-500" />
                <span>عروض الترقية والتطوير (فرص مبيعات إضافية)</span>
              </span>
              <a
                href={getUpgradeOffersWhatsAppUrl(activeBusiness)}
                target="_blank"
                rel="noreferrer"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10.5px] px-3 py-1 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <Zap className="w-3 h-3" />
                <span>إرسال العروض</span>
              </a>
            </div>
          </div>
        )}

        {/* Mobile One-Hand Close Button */}
        <div className="pt-1 sm:hidden no-print">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-full py-2.5 rounded-xl bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] font-bold text-xs border border-[var(--border-color)] transition-colors cursor-pointer text-center"
          >
            إغلاق الفاتورة
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
