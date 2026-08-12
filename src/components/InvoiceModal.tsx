import React from 'react';
import { Business } from '../types';
import { calculateBusinessCommission } from '../utils/commission';
import { Logo } from './Logo';
import { Printer, Share2, CheckCircle2, Clock, AlertCircle, MapPin, ExternalLink, ShieldCheck, QrCode } from 'lucide-react';

interface InvoiceModalProps {
  business: Business | null;
  onClose: () => void;
  isExternalView?: boolean;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ business, onClose, isExternalView = false }) => {
  if (!business) return null;

  const remaining = Math.max(0, business.packagePrice - business.amountPaid);

  // WhatsApp formatted Arabic message text
  const waMessage = encodeURIComponent(
    `*فاتورة توثيق نشاط تجاري - شركة دليلك لخرائط جوجل* 🗺️\n` +
    `-----------------------------------------\n` +
    `📋 *اسم النشاط:* ${business.nameAr}\n` +
    `👤 *صاحب النشاط:* ${business.ownerName}\n` +
    `📍 *الموقع:* ${business.governorate} - ${business.city}\n` +
    `🧾 *رقم الفاتورة:* ${business.invoiceNumber}\n` +
    `📅 *تاريخ الإصدار:* ${business.invoiceDate}\n\n` +
    `📦 *الباقة المختارة:* ${business.packageName}\n` +
    `💰 *إجمالي قيمة الباقة:* ${business.packagePrice} ج.م\n` +
    `✅ *المبلغ المدفوع:* ${business.amountPaid} ج.م\n` +
    `⏳ *المبلغ المتبقي:* ${remaining} ج.م\n` +
    `📌 *حالة الدفع:* ${
      business.paymentStatus === 'fully_paid'
        ? 'مدفوعة بالكامل ✅'
        : business.paymentStatus === 'partially_paid'
        ? 'مدفوع جزء منها (متبقي ' + remaining + ' ج.م) ⏳'
        : 'لم يتم الدفع نهائياً ❌'
    }\n\n` +
    `📍 *رابط الإحداثيات ورابط الخريطة:* https://www.google.com/maps/search/?api=1&query=${business.lat},${business.lng}\n\n` +
    `*ملاحظة:* سيتم متابعة مراجعة وتوثيق النشاط حتى ظهوره رسمياً على خرائط جوجل. شكرًا لثقتكم بشركة دليلك!`
  );

  const formattedPhone = business.ownerPhone.replace(/^0/, '');
  const whatsappUrl = `https://wa.me/20${formattedPhone}?text=${waMessage}`;

  // Dynamic QR Code URL to open the invoice online
  const qrUrl = `${window.location.origin}/?view=invoice&id=${business.id}`;
  const qrData = encodeURIComponent(qrUrl);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${qrData}`;

  return (
    <div className="fixed inset-0 z-50 bg-[var(--modal-overlay)] backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto modal-overlay">
      <div className="bg-[var(--modal-bg)] border border-[var(--modal-border)] rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-5 my-auto relative text-[var(--text-primary)] modal-content transition-colors duration-300">
        {/* Close Button */}
        {!isExternalView && (
          <button
            onClick={onClose}
            className="absolute top-4 left-4 bg-[var(--input-bg)] hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-500 w-8 h-8 rounded-full flex items-center justify-center transition-colors text-xs font-bold no-print border border-[var(--border-color)] cursor-pointer">
            ✕
          </button>
        )}

        {/* Printable Invoice Container */}
        <div className="space-y-4 bg-white text-slate-900 p-5 rounded-2xl shadow-inner border border-slate-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <Logo size="sm" />

            <div className="text-left">
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-300 inline-block">
                فاتورة إلكترونية معتمدة
              </span>
              <p className="text-xs font-mono font-bold text-slate-700 mt-1">{business.invoiceNumber}</p>
              <p className="text-[10px] text-slate-500">{business.invoiceDate}</p>
            </div>
          </div>

          {/* Business & Owner Info */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <p className="text-[10px] text-slate-500 font-bold">النشاط التجاري:</p>
              <p className="font-black text-slate-900">{business.nameAr}</p>
              <p className="text-[11px] text-slate-600">{business.category}</p>
              <p className="text-[10px] text-slate-500 mt-1">
                {business.governorate} - {business.city}
              </p>
            </div>

            <div>
              <p className="text-[10px] text-slate-500 font-bold">صاحب النشاط / العميل:</p>
              <p className="font-bold text-slate-900">{business.ownerName}</p>
              <p className="text-[11px] text-slate-700 dir-ltr text-right">{business.ownerPhone}</p>
              <p className="text-[10px] text-slate-500 mt-1">المندوب: {business.repName}</p>
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
                  <span className="font-bold text-slate-900">{business.packageName}</span>
                  <p className="text-[10px] text-slate-500">توثيق واستخراج الإحداثيات على خرائط جوجل</p>
                </td>
                <td className="p-2 font-black text-slate-900 text-center">{business.packagePrice} ج.م</td>
              </tr>
            </tbody>
          </table>

          {/* Financial Totals */}
          <div className="bg-slate-100 text-slate-900 p-3 rounded-xl space-y-1.5 text-xs border border-slate-200">
            <div className="flex justify-between font-bold">
              <span className="text-slate-600">إجمالي الباقة:</span>
              <span>{business.packagePrice} جنيه مصري</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-slate-200">
              <span>المبلغ المدفوع:</span>
              <span>{business.amountPaid} جنيه مصري</span>
            </div>
            <div className="flex justify-between text-rose-600 font-black pt-1 border-t border-slate-200">
              <span>المبلغ المتبقي:</span>
              <span>{remaining} جنيه مصري</span>
            </div>
            <div className="flex justify-between text-amber-700 font-bold pt-1 border-t border-slate-200 text-[11px] no-print">
              <span>عمولة المندوب:</span>
              <span>{calculateBusinessCommission(business.packagePrice, business.amountPaid)} جنيه مصري</span>
            </div>
          </div>

          {/* Payment Status & Follow Up note */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600">حالة الفاتورة:</span>
              {business.paymentStatus === 'fully_paid' && (
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black px-3 py-1 rounded-full border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>مدفوعة بالكامل</span>
                </span>
              )}

              {business.paymentStatus === 'partially_paid' && (
                <span className="bg-amber-100 text-amber-800 text-[11px] font-black px-3 py-1 rounded-full border border-amber-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>مدفوع جزء منها</span>
                </span>
              )}

              {business.paymentStatus === 'unpaid' && (
                <span className="bg-rose-100 text-rose-800 text-[11px] font-black px-3 py-1 rounded-full border border-rose-300 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>لم يتم الدفع نهائياً</span>
                </span>
              )}
            </div>

            {/* Electronic QR Code */}
            <div className="flex items-center gap-2">
              <img src={qrImageUrl} alt="QR Code" className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg border border-slate-300 p-1 bg-white" />
            </div>
          </div>

          <div className="text-[10px] text-slate-500 bg-amber-50 border border-amber-200 p-2 rounded-lg text-center font-medium">
            سيتم مراجعة وتدقيق البيانات وتوثيق النشاط ليظهر رسمياً على خرائط جوجل فور استكمال المراجعة.
          </div>
        </div>

        {/* Dispatch Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2 no-print">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>إرسال الفاتورة الآن عبر واتساب العميل</span>
          </a>

          <button
            onClick={() => window.print()}
            className="w-full sm:w-auto bg-[var(--input-bg)] hover:bg-amber-500/10 text-[var(--text-primary)] font-bold text-xs py-3 px-4 rounded-xl border border-[var(--border-color)] flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة</span>
          </button>
        </div>
      </div>
    </div>
  );
};
