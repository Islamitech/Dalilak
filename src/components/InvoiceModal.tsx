import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { toPng } from 'html-to-image';
import { Business } from '../types';
import { calculateBusinessCommission } from '../utils/commission';
import { Logo } from './Logo';
import { 
  Printer, 
  Share2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  MapPin, 
  ExternalLink, 
  ShieldCheck, 
  QrCode, 
  Copy, 
  Check, 
  CloudUpload, 
  Sparkles, 
  Zap, 
  Gift,
  Download,
  Save,
  Loader2
} from 'lucide-react';
import { GoogleMapsSyncModal } from './GoogleMapsSyncModal';
import { generateUpgradeOffersWhatsAppMessage, getUpgradeOffersWhatsAppUrl } from '../utils/packageOffers';
import { downloadSinglePhoto } from '../utils/photoDownloader';

interface InvoiceModalProps {
  business: Business | null;
  onClose: () => void;
  isExternalView?: boolean;
  userRole?: string;
  isAdmin?: boolean;
  onUpdateBusiness?: (updatedBusiness: Business) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ 
  business, 
  onClose, 
  isExternalView = false,
  userRole,
  isAdmin = false,
  onUpdateBusiness,
}) => {
  const isPrivilegedUser = isAdmin || userRole === 'admin' || userRole === 'supervisor' || userRole === 'accountant';
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedOffers, setCopiedOffers] = useState<boolean>(false);
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
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

  const pkgPrice = activeBusiness.packagePrice || 0;
  const amtPaid = activeBusiness.amountPaid || 0;
  const remaining = Math.max(0, pkgPrice - amtPaid);

  const invoiceRawText = 
    `*فاتورة توثيق نشاط تجاري - شركة دليلك لخرائط جوجل* 🗺️\n` +
    `-----------------------------------------\n` +
    `📋 *اسم النشاط:* ${activeBusiness.nameAr || ''}\n` +
    `👤 *صاحب النشاط:* ${activeBusiness.ownerName || ''}\n` +
    `📍 *الموقع:* ${activeBusiness.governorate || ''} - ${activeBusiness.city || ''}\n` +
    `🧾 *رقم الفاتورة:* ${activeBusiness.invoiceNumber || ''}\n` +
    `📅 *تاريخ الإصدار:* ${activeBusiness.invoiceDate || ''}\n\n` +
    `📦 *الباقة المختارة:* ${activeBusiness.packageName || ''}\n` +
    `💰 *إجمالي قيمة الباقة:* ${pkgPrice} ج.م\n` +
    `✅ *المبلغ المدفوع:* ${amtPaid} ج.م\n` +
    `⏳ *المبلغ المتبقي:* ${remaining} ج.م\n` +
    `📌 *حالة الدفع:* ${
      activeBusiness.paymentStatus === 'fully_paid'
        ? 'مدفوعة بالكامل ✅'
        : activeBusiness.paymentStatus === 'partially_paid'
        ? 'مدفوع جزء منها (متبقي ' + remaining + ' ج.م) ⏳'
        : 'لم يتم الدفع نهائياً ❌'
    }\n\n` +
    `📍 *رابط الخريطة المباشر:* ${activeBusiness.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${activeBusiness.lat || 0},${activeBusiness.lng || 0}`}\n\n` +
    `*ملاحظة:* سيتم متابعة مراجعة وتوثيق النشاط حتى ظهوره رسمياً على خرائط جوجل. شكرًا لثقتكم بشركة دليلك!`;

  // WhatsApp formatted Arabic message text
  const waMessage = encodeURIComponent(invoiceRawText);

  const formattedPhone = (activeBusiness.ownerPhone || '').replace(/^0/, '');
  const whatsappUrl = `https://wa.me/20${formattedPhone}?text=${waMessage}`;

  const handleCopyInvoice = () => {
    navigator.clipboard.writeText(invoiceRawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Dynamic QR Code URL to open the invoice online
  const qrUrl = `${window.location.origin}/?view=invoice&id=${activeBusiness.id}`;
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
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div 
        className="bg-[var(--modal-bg)] border border-[var(--modal-border)] rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 my-auto relative text-[var(--text-primary)] modal-content transition-colors duration-300 overflow-y-auto"
        style={{ maxHeight: '92vh' }}
      >
        {/* Top Header Bar: Close Button + Simple Actions */}
        <div className="flex items-center justify-between no-print mb-1">
          {!isExternalView ? (
            <button
              onClick={onClose}
              className="bg-[var(--input-bg)] hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-500 w-8 h-8 rounded-full flex items-center justify-center transition-colors text-xs font-bold border border-[var(--border-color)] cursor-pointer"
              title="إغلاق"
            >
              ✕
            </button>
          ) : <div />}

          {/* Simple Top Actions (Save / Print) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveInvoiceImage}
              disabled={isSavingImage}
              className="bg-[var(--input-bg)] hover:bg-amber-500/15 text-[var(--text-primary)] hover:text-amber-500 w-8 h-8 rounded-full flex items-center justify-center transition-colors border border-[var(--border-color)] cursor-pointer shadow-xs disabled:opacity-50"
              title="حفظ الفاتورة كصورة"
            >
              {isSavingImage ? (
                <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-amber-500" />
              )}
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="bg-[var(--input-bg)] hover:bg-amber-500/15 text-[var(--text-primary)] hover:text-amber-500 w-8 h-8 rounded-full flex items-center justify-center transition-colors border border-[var(--border-color)] cursor-pointer shadow-xs"
              title="طباعة الفاتورة"
            >
              <Printer className="w-4 h-4 text-amber-500" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div ref={invoiceRef} className="space-y-4 bg-white text-slate-900 p-5 rounded-2xl shadow-inner border border-slate-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <Logo size="sm" />

            <div className="text-left">
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-300 inline-block">
                فاتورة إلكترونية معتمدة
              </span>
              <p className="text-xs font-mono font-bold text-slate-700 mt-1">{activeBusiness.invoiceNumber}</p>
              <p className="text-[10px] text-slate-500">{activeBusiness.invoiceDate}</p>
            </div>
          </div>

          {/* Business & Owner Info */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <p className="text-[10px] text-slate-500 font-bold">النشاط التجاري:</p>
              <p className="font-black text-slate-900">{activeBusiness.nameAr}</p>
              <p className="text-[11px] text-slate-600">{activeBusiness.category}</p>
              <p className="text-[10px] text-slate-500 mt-1">
                {activeBusiness.governorate} - {activeBusiness.city}
              </p>
            </div>

            <div>
              <p className="text-[10px] text-slate-500 font-bold">صاحب النشاط / العميل:</p>
              <p className="font-bold text-slate-900">{activeBusiness.ownerName}</p>
              <p className="text-[11px] text-slate-700 dir-ltr text-right">{activeBusiness.ownerPhone}</p>
              <p className="text-[10px] text-slate-500 mt-1">المندوب: {activeBusiness.repName}</p>
            </div>
          </div>

          {/* Invoice Table */}
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <th className="p-2 font-bold">الخدمة / الباقة</th>
                <th className="p-2 font-bold text-center">القيمة</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="p-2">
                  <span className="font-bold text-slate-900">{activeBusiness.packageName}</span>
                  <p className="text-[10px] text-slate-500">توثيق واستخراج الإحداثيات على خرائط جوجل</p>
                </td>
                <td className="p-2 font-black text-slate-900 text-center">{pkgPrice} ج.م</td>
              </tr>
            </tbody>
          </table>

          {/* Financial Totals */}
          <div className="bg-slate-100 text-slate-900 p-3 rounded-xl space-y-1.5 text-xs border border-slate-200">
            <div className="flex justify-between font-bold">
              <span className="text-slate-600">إجمالي الباقة:</span>
              <span>{pkgPrice} جنيه مصري</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-slate-200">
              <span>المبلغ المدفوع:</span>
              <span>{amtPaid} جنيه مصري</span>
            </div>
            <div className="flex justify-between text-rose-600 font-black pt-1 border-t border-slate-200">
              <span>المبلغ المتبقي:</span>
              <span>{remaining} جنيه مصري</span>
            </div>
          </div>

          {/* Payment Status & Follow Up note */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600">حالة الفاتورة:</span>
              {activeBusiness.paymentStatus === 'fully_paid' && (
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black px-3 py-1 rounded-full border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>مدفوعة بالكامل</span>
                </span>
              )}

              {activeBusiness.paymentStatus === 'partially_paid' && (
                <span className="bg-amber-100 text-amber-800 text-[11px] font-black px-3 py-1 rounded-full border border-amber-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>مدفوع جزء منها</span>
                </span>
              )}

              {activeBusiness.paymentStatus === 'unpaid' && (
                <span className="bg-rose-100 text-rose-800 text-[11px] font-black px-3 py-1 rounded-full border border-rose-300 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>لم يتم الدفع نهائياً</span>
                </span>
              )}
            </div>

            {/* Electronic QR Code */}
            <div className="flex items-center gap-2">
              <img src={qrImageUrl} crossOrigin="anonymous" alt="QR Code" className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg border border-slate-300 p-1 bg-white" />
            </div>
          </div>

          <div className="text-[10px] text-slate-500 bg-amber-50 border border-amber-200 p-2 rounded-lg text-center font-medium">
            سيتم مراجعة وتدقيق البيانات وتوثيق النشاط ليظهر رسمياً على خرائط جوجل فور استكمال المراجعة.
          </div>
        </div>

        {/* Google Maps Auto-Sync & Place ID Button (Admins only) */}
        {isPrivilegedUser && (
          <div className="no-print">
            <button
              onClick={() => setShowSyncModal(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm py-3.5 px-4 rounded-2xl shadow-lg hover:shadow-blue-500/20 flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer border border-blue-400/30"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-white/15 rounded-xl flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5">
                    <span>مزامنة وتوثيق على خرائط جوجل</span>
                    <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">API</span>
                  </div>
                  <p className="text-[10px] text-blue-100 font-normal">إرسال البيانات والصور وتوليد معرّف Place ID الرسمي</p>
                </div>
              </div>

              <div className="bg-white/20 px-2.5 py-1 rounded-xl text-[11px] font-bold">
                {activeBusiness.googleSyncStatus === 'synced' ? 'مُوثق ومعتمد ✅' : 'مزامنة الآن ⚡'}
              </div>
            </button>
          </div>
        )}

        {/* Package Upgrade Offers Box (Admins only) */}
        {isPrivilegedUser && (
          <div className="bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 p-3 rounded-2xl border border-amber-500/30 no-print space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-800 dark:text-amber-300">
                <Gift className="w-4 h-4 text-amber-500" />
                <span>عروض الترقية والتطوير الحصرية للعميل</span>
              </div>
              <span className="text-[10px] bg-amber-500/20 text-amber-900 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold">
                فرص مبيعات إضافية 🚀
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] font-medium">
              يمكنك إرسال تفاصيل ومميزات الباقات الأخرى (عرض التأسيس والربط الذكي أو باقة الدعم الميداني VIP) مباشرة لصاحب النشاط عبر واتساب.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <a
                href={getUpgradeOffersWhatsAppUrl(activeBusiness)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs py-2.5 px-3.5 rounded-xl shadow flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>إرسال عروض الترقية (واتساب)</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(generateUpgradeOffersWhatsAppMessage(activeBusiness));
                  setCopiedOffers(true);
                  setTimeout(() => setCopiedOffers(false), 2500);
                }}
                className="w-full sm:w-auto bg-[var(--input-bg)] hover:bg-amber-500/20 text-[var(--text-primary)] font-bold text-xs py-2.5 px-3 rounded-xl border border-[var(--border-color)] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedOffers ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-amber-500" />}
                <span>{copiedOffers ? 'تم نسخ العروض!' : 'نسخ نص العروض'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons for Admins only (Reps use the clean header icons) */}
        {isPrivilegedUser && (
          <div className="no-print pt-1">
            <div className="flex items-center gap-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-2.5 sm:py-3 px-3 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>إرسال بالواتساب</span>
              </a>

              <button
                type="button"
                onClick={handleCopyInvoice}
                className="bg-[var(--input-bg)] hover:bg-amber-500/15 text-[var(--text-primary)] font-bold text-xs py-2.5 sm:py-3 px-3 rounded-xl border border-[var(--border-color)] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                title="نسخ نص الفاتورة للحافظة"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-amber-500" />}
                <span className="hidden sm:inline">{copied ? 'تم النسخ!' : 'نسخ'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveInvoiceImage}
                disabled={isSavingImage}
                className="bg-[var(--input-bg)] hover:bg-amber-500/10 text-[var(--text-primary)] font-bold text-xs py-2.5 sm:py-3 px-3 rounded-xl border border-[var(--border-color)] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                title="حفظ الفاتورة كصورة"
              >
                <Download className="w-4 h-4 text-amber-500" />
                <span className="hidden sm:inline">حفظ</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="bg-[var(--input-bg)] hover:bg-amber-500/10 text-[var(--text-primary)] font-bold text-xs py-2.5 sm:py-3 px-3 rounded-xl border border-[var(--border-color)] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                title="طباعة الفاتورة"
              >
                <Printer className="w-4 h-4 text-amber-500" />
                <span className="hidden sm:inline">طباعة</span>
              </button>
            </div>
          </div>
        )}

        {/* Google Maps Sync Modal (Admins only) */}
        {isPrivilegedUser && (
          <GoogleMapsSyncModal
            business={activeBusiness}
            isOpen={showSyncModal}
            onClose={() => setShowSyncModal(false)}
            onUpdateBusiness={(updated) => {
              setCurrentBiz(updated);
              if (onUpdateBusiness) onUpdateBusiness(updated);
            }}
          />
        )}
      </div>
    </div>,
    document.body
  );
};
