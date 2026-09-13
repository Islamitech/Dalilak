import React from 'react';
import {
  ShieldCheck,
  FileText,
  CreditCard,
  Banknote,
  Sparkles,
  Image,
  Upload,
  ExternalLink,
  Receipt,
  Plus,
  Check
} from 'lucide-react';
import { Business, VerificationStatus, PaymentStatus, AdditionalServiceInvoice } from '../../types';
import { Button } from '../design-system/Button';

interface DrawerAdminTabProps {
  business: Business;
  remaining: number;
  earnedCommission: number;
  repCommissionRate: number;
  onStatusClick: (st: VerificationStatus) => void;
  onOpenDocModal?: () => void;
  onOpenInvoiceModal?: () => void;
  onOpenPaymentModal?: () => void;
  onUpdatePayment?: (id: string, status: PaymentStatus) => void;
  onUpdateReceiptPhoto?: (bizId: string, photoUrl: string) => void;
  onOpenAddServiceInvoiceModal?: () => void;
  onSelectInvoiceForView?: (inv: AdditionalServiceInvoice) => void;
}

export const DrawerAdminTab: React.FC<DrawerAdminTabProps> = ({
  business,
  remaining,
  earnedCommission,
  repCommissionRate,
  onStatusClick,
  onOpenDocModal,
  onOpenInvoiceModal,
  onOpenPaymentModal,
  onUpdatePayment,
  onUpdateReceiptPhoto,
  onOpenAddServiceInvoiceModal,
  onSelectInvoiceForView
}) => {
  return (
    <div className="space-y-4 text-sm">
      {/* Status Controls */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>تعديل حالة التوثيق الميداني</span>
          </h4>
          {onOpenDocModal && (
            <button
              type="button"
              onClick={onOpenDocModal}
              className="py-1 px-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] transition-colors flex items-center gap-1 border border-indigo-200 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>فحص الوثائق والسجل التجاري</span>
            </button>
          )}
          {business.isConditionalVerification && (
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
              معتمد بمتأخرات مالية
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(['verified', 'pending', 'in_progress', 'needs_action', 'rejected'] as VerificationStatus[]).map(
            (st) => (
              <button
                key={st}
                type="button"
                onClick={() => onStatusClick(st)}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                  business.verificationStatus === st
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-bold'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>
                  {st === 'verified'
                    ? 'معتمد وموثق'
                    : st === 'pending'
                    ? 'قيد المراجعة'
                    : st === 'in_progress'
                    ? 'جاري الفحص'
                    : st === 'needs_action'
                    ? 'يتطلب إجراء'
                    : 'مرفوض'}
                </span>
                {business.verificationStatus === st && <Check className="w-4 h-4 text-emerald-600" />}
              </button>
            )
          )}
        </div>
      </div>

      {/* Payment & Invoices Section */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-indigo-600" />
            <span>البيانات المالية والفاتورة</span>
          </h4>

          {/* Main Action Buttons */}
          <div className="flex items-center gap-2">
            {onOpenInvoiceModal && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenInvoiceModal}
                leftIcon={<FileText className="w-3.5 h-3.5 text-indigo-600" />}
              >
                معاينة الفاتورة
              </Button>
            )}
            {onOpenPaymentModal && (
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenPaymentModal}
                leftIcon={<Banknote className="w-3.5 h-3.5" />}
              >
                تسجيل سداد
              </Button>
            )}
          </div>
        </div>

        {/* Financial Numbers Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-slate-400 block mb-0.5 text-[11px]">رقم الفاتورة</span>
            <span className="font-bold text-slate-900 font-mono text-[11px]">{business.invoiceNumber}</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-slate-400 block mb-0.5 text-[11px]">سعر الباقة</span>
            <span className="font-bold text-slate-900">{business.packagePrice} ج.م</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-slate-400 block mb-0.5 text-[11px]">المحصل</span>
            <span className="font-bold text-emerald-600">{business.amountPaid} ج.م</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-slate-400 block mb-0.5 text-[11px]">المتبقي</span>
            <span className={`font-bold ${remaining > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
              {business.isFeeExempt ? '0 ج.م (معفى)' : `${remaining} ج.م`}
            </span>
          </div>
        </div>

        {/* Rep Commission & Settlement Live Card */}
        <div className="p-3.5 bg-gradient-to-r from-indigo-50/80 via-white to-emerald-50/80 rounded-xl border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-800 text-xs block">
                عمولة المندوب ({business.repName || 'المندوب'}): {earnedCommission} ج.م
              </span>
              <span className="text-[11px] text-slate-500">
                محسوبة بنسبة {repCommissionRate}% تلقائياً من المبالغ المحصلة
              </span>
            </div>
          </div>

          <div className="text-xs">
            {business.paymentMethod === 'cash_by_rep' ? (
              <span className={`px-2.5 py-1 rounded-lg font-bold inline-flex items-center gap-1 ${
                (business as any).isCashSettledWithAdmin
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {(business as any).isCashSettledWithAdmin ? 'تم التوريد للخزينة' : 'كاش بعهدة المندوب للتوريد'}
              </span>
            ) : (business.amountPaid || 0) > 0 ? (
              <span className="px-2.5 py-1 rounded-lg font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                سداد إلكتروني معتمد
              </span>
            ) : null}
          </div>
        </div>

        {/* Payment status toggle */}
        {onUpdatePayment && (
          <div className="pt-1">
            <span className="text-xs text-slate-500 block mb-1.5 font-medium">تغيير حالة السداد السريعة:</span>
            <div className="flex gap-2">
              {(['fully_paid', 'partially_paid', 'unpaid'] as PaymentStatus[]).map((pst) => (
                <button
                  key={pst}
                  type="button"
                  onClick={() => onUpdatePayment(business.id, pst)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    business.paymentStatus === pst
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {pst === 'fully_paid' ? 'مسدد' : pst === 'partially_paid' ? 'جزئي' : 'غير مسدد'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Payment Receipt Photo Card */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
            <Image className="w-4 h-4 text-indigo-600" />
            <span>إيصال السداد / لقطة الشاشة المرفقة</span>
          </h4>
          {business.paymentReceiptPhoto ? (
            <button
              type="button"
              onClick={() => {
                const newUrl = window.prompt('تحديث رابط صورة إيصال السداد:', business.paymentReceiptPhoto);
                if (newUrl !== null && onUpdateReceiptPhoto) {
                  onUpdateReceiptPhoto(business.id, newUrl);
                }
              }}
              className="text-indigo-600 hover:text-indigo-800 text-[11px] font-bold cursor-pointer"
            >
              تحديث الصورة
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                const newUrl = window.prompt('أدخل رابط صورة إيصال السداد أو لقطة التحويل:');
                if (newUrl && onUpdateReceiptPhoto) {
                  onUpdateReceiptPhoto(business.id, newUrl);
                }
              }}
              className="py-1 px-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] transition-colors flex items-center gap-1 border border-indigo-200 cursor-pointer"
            >
              <Upload className="w-3 h-3" />
              <span>إرفاق إيصال</span>
            </button>
          )}
        </div>

        {business.paymentReceiptPhoto ? (
          <div className="space-y-2">
            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-black/5 max-h-48 flex items-center justify-center">
              <img
                src={business.paymentReceiptPhoto}
                alt="Receipt"
                className="w-full h-auto max-h-48 object-contain"
              />
              <a
                href={business.paymentReceiptPhoto}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-2 left-2 py-1 px-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-white text-[10px] font-bold flex items-center gap-1 backdrop-blur-xs"
              >
                <ExternalLink className="w-3 h-3" />
                <span>عرض الحجم الكامل</span>
              </a>
            </div>
            {business.paymentReceiptDate && (
              <p className="text-[11px] text-slate-400">
                تاريخ إرفاق الإيصال: {new Date(business.paymentReceiptDate).toLocaleString('ar-EG')}
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-400">لم يتم إرفاق صورة إيصال تحويل أو سداد حتى الآن.</p>
        )}
      </div>

      {/* Additional Services Invoices Section */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-indigo-600" />
              <span>فواتير الخدمات الإضافية المخصصة ({business.additionalInvoices?.length || 0})</span>
            </h4>
            <p className="text-[11px] text-slate-400">جلسات التصوير 360، طباعة ستاندات QR، والحملات الممولة</p>
          </div>
          {onOpenAddServiceInvoiceModal && (
            <button
              type="button"
              onClick={onOpenAddServiceInvoiceModal}
              className="py-1 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ إصدار فاتورة خدمة</span>
            </button>
          )}
        </div>

        {business.additionalInvoices && business.additionalInvoices.length > 0 ? (
          <div className="space-y-2">
            {business.additionalInvoices.map((inv) => (
              <div
                key={inv.id}
                className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{inv.serviceTitle}</span>
                    <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                      {inv.invoiceNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.paymentStatus === 'fully_paid'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : inv.paymentStatus === 'partially_paid'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {inv.paymentStatus === 'fully_paid' ? 'مسدد' : inv.paymentStatus === 'partially_paid' ? 'جزئي' : 'غير مسدد'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    المبلغ: <strong>{inv.amount} ج.م</strong> • المسدد: <strong>{inv.amountPaid} ج.م</strong>
                    {inv.paymentMethod && ` • طريقة السداد: ${inv.paymentMethod}`}
                  </p>
                  {inv.notes && <p className="text-[10px] text-slate-400">ملاحظات: {inv.notes}</p>}
                </div>

                {onSelectInvoiceForView && (
                  <button
                    type="button"
                    onClick={() => onSelectInvoiceForView(inv)}
                    className="py-1 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3 h-3 text-indigo-600" />
                    <span>معاينة السند</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-white rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
            لا توجد فواتير خدمات إضافية مصدرة لهذه المنشأة حتى الآن
          </div>
        )}
      </div>
    </div>
  );
};
