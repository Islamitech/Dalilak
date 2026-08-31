import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { toPng } from 'html-to-image';
import { Business } from '../types';
import { Logo } from './Logo';
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
} from 'lucide-react';
import { downloadSinglePhoto } from '../utils/photoDownloader';
import {
  getInvoiceWhatsAppUrl,
  generateInvoiceWhatsAppMessage,
  getUpgradeOffersWhatsAppUrl,
  generateUpgradeOffersWhatsAppMessage,
} from '../utils/whatsappMessages';

interface InvoiceModalProps {
  business: Business | null;
  onClose: () => void;
  isExternalView?: boolean;
  userRole?: string;
  isAdmin?: boolean;
  onUpdateBusiness?: (updatedBusiness: Business) => void;
  onCollectPayment?: (business: Business) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ 
  business, 
  onClose, 
  isExternalView = false,
  userRole,
  isAdmin = false,
  onUpdateBusiness,
  onCollectPayment,
}) => {
  const isPrivilegedUser = isAdmin || userRole === 'admin' || userRole === 'supervisor' || userRole === 'accountant';
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedOffers, setCopiedOffers] = useState<boolean>(false);
  const [currentBiz, setCurrentBiz] = useState<Business | null>(business);
  const [isSavingImage, setIsSavingImage] = useState<boolean>(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentBiz(business);
  }, [business]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Safe early exit if neither business prop nor currentBiz state is present
  const activeBusiness = business || currentBiz;
  if (!activeBusiness) return null;

  const pkgPrice = activeBusiness.packagePrice || 250;
  const amtPaid = activeBusiness.amountPaid || 0;
  const remaining = Math.max(0, pkgPrice - amtPaid);
  const directoryUrl = 'https://www.dalilaak.com/';

  const handleCopyInvoice = () => {
    navigator.clipboard.writeText(generateInvoiceWhatsAppMessage(activeBusiness));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Dynamic QR Code URL to open the invoice online
  const baseUrl = typeof window !== 'undefined' && window.location.origin.includes('localhost') ? window.location.origin : 'https://www.dalilaak.com';
  const qrUrl = `${baseUrl}/?view=invoice&id=${activeBusiness.id}`;
  const qrData = encodeURIComponent(qrUrl);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${qrData}`;

  // Pixel-Perfect DOM Screenshot Downloader using html-to-image
  const handleSaveInvoiceImage = async () => {
    if (!invoiceRef.current) return;
    try {
      setIsSavingImage(true);
      const dataUrl = await toPng(invoiceRef.current, {
        cacheBust: true,
        pixelRatio: 3, // Ultra-sharp resolution
        backgroundColor: '#ffffff',
      });
      downloadSinglePhoto(
        dataUrl,
        `فاتورة-${activeBusiness.nameAr || 'نشاط'}-${activeBusiness.invoiceNumber || 'INV'}.png`
      );
    } catch (err) {
      console.warn('html-to-image capture error, falling back to print:', err);
      window.print();
    } finally {
      setIsSavingImage(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto" dir="rtl">
      <div 
        className="bg-[var(--modal-bg)] border border-[var(--modal-border)] rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 my-auto relative text-[var(--text-primary)] modal-content transition-colors duration-300 overflow-y-auto max-h-[94vh]"
      >
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

        {/* ── PRINTABLE INVOICE CARD CONTAINER ────────────────────────── */}
        <div 
          ref={invoiceRef}
          className="bg-white text-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-5 print:border-none print:shadow-none print:p-0"
        >
          {/* Top Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="text-right">
              <span className="bg-amber-500/15 text-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-500/30">
                فاتورة إلكترونية معتمدة
              </span>
              <div className="text-xs font-mono font-bold text-slate-500 mt-1">
                {activeBusiness.invoiceNumber}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                {activeBusiness.invoiceDate || new Date().toISOString().split('T')[0]}
              </div>
            </div>

            <div className="text-left flex items-center gap-2">
              <div>
                <div className="font-black text-base text-slate-950 flex items-center gap-1">
                  <span>دليلك</span>
                  <span className="text-[10px] bg-amber-500 text-slate-950 px-1 rounded font-black">EG</span>
                </div>
                <div className="text-[9.5px] text-slate-500 font-bold">المنصة الشاملة لإدارة وتوثيق الأنشطة الميدانية</div>
              </div>
              <Logo size="md" />
            </div>
          </div>

          {/* Client & Business Info */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
            <div className="text-right space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold block">النشاط التجاري:</span>
              <span className="font-black text-slate-900 block truncate">{activeBusiness.nameAr}</span>
              <span className="text-[10px] text-slate-500 block truncate">{activeBusiness.category}</span>
              <span className="text-[10px] text-slate-500 block">{activeBusiness.governorate} - {activeBusiness.city}</span>
            </div>

            <div className="text-right space-y-0.5 border-r border-slate-200 pr-3">
              <span className="text-[10px] text-slate-400 font-bold block">صاحب النشاط / العميل:</span>
              <span className="font-black text-slate-900 block truncate">{activeBusiness.ownerName || 'صاحب النشاط'}</span>
              <span className="text-[10px] text-slate-600 font-mono block" dir="ltr">{activeBusiness.ownerPhone || activeBusiness.phone}</span>
              <span className="text-[10px] text-slate-500 block truncate">المندوب: {activeBusiness.repName || 'مندوب معتمد'}</span>
            </div>
          </div>

          {/* Package Details Table */}
          <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
            <div className="bg-slate-100 px-3 py-2 flex items-center justify-between font-bold text-slate-600 text-[11px]">
              <span>الخدمة / الباقة</span>
              <span>القيمة</span>
            </div>
            <div className="p-3 flex items-center justify-between bg-white border-b border-slate-50">
              <div>
                <span className="font-black text-slate-900 block">{activeBusiness.packageName || 'باقة التوثيق الأساسي'}</span>
                <span className="text-[10px] text-slate-500">توثيق واستخراج الإحداثيات على خرائط جوجل والدليل</span>
              </div>
              <span className="font-black text-slate-900 font-mono">{pkgPrice} ج.م</span>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="space-y-1.5 bg-slate-50/80 p-3 rounded-xl border border-slate-100 text-xs font-bold">
            <div className="flex items-center justify-between text-slate-600">
              <span>إجمالي الباقة:</span>
              <span className="font-mono">{pkgPrice} جنيه مصري</span>
            </div>
            <div className="flex items-center justify-between text-emerald-700 font-black">
              <span>المبلغ المدفوع:</span>
              <span className="font-mono">{amtPaid} جنيه مصري</span>
            </div>
            <div className={`flex items-center justify-between font-black ${remaining > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
              <span>المبلغ المتبقي:</span>
              <span className="font-mono">{remaining} جنيه مصري</span>
            </div>
          </div>

          {/* QR Code and Status */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">حالة الفاتورة:</span>
              <span className={`text-xs font-black px-3 py-1 rounded-xl border flex items-center gap-1 ${
                activeBusiness.paymentStatus === 'fully_paid'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : activeBusiness.paymentStatus === 'partially_paid'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {activeBusiness.paymentStatus === 'fully_paid' ? 'مدفوعة بالكامل ✓' : activeBusiness.paymentStatus === 'partially_paid' ? `متبقي ${remaining} ج` : 'غير مسددة'}
              </span>
            </div>

            <img src={qrImageUrl} alt="QR Code" className="w-16 h-16 rounded-lg border border-slate-200 shadow-2xs" />
          </div>

          {/* Directory Portal Link Notice */}
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-2.5 text-center text-[10.5px] text-amber-900 font-bold">
            <span>✨ نشاطكم منشور ومتاح الآن في دليل الأنشطة المعتمد في مصر: </span>
            <a href={directoryUrl} target="_blank" rel="noreferrer" className="text-amber-700 underline font-mono">
              {directoryUrl}
            </a>
          </div>
        </div>

        {/* ── WHATSAPP ACTION CENTER FOR INVOICE ──────────────────────── */}
        <div className="no-print space-y-2 pt-1">
          {isPrivilegedUser ? (
            <>
              <a
                href={getInvoiceWhatsAppUrl(activeBusiness)}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 text-center cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>إرسال الفاتورة الرسمية للعميل عبر WhatsApp 💬</span>
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

                {remaining > 0 && onCollectPayment && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onCollectPayment(activeBusiness);
                    }}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black text-xs py-2.5 px-3 rounded-xl shadow flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>تحصيل ({remaining} ج)</span>
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
      </div>
    </div>,
    document.body
  );
};
