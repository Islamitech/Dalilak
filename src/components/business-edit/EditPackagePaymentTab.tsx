import React, { useState } from 'react';
import { Business, AdditionalServiceInvoice } from '../../types';
import { PACKAGES, EXEMPT_PACKAGE, ALREADY_ON_GOOGLE_PACKAGE } from '../../data/mockData';
import { compressImageFile } from '../../utils/imageCompressor';
import { AdminReceiptModal } from '../admin/modals/AdminReceiptModal';
import { ConfirmDialog } from '../ConfirmDialog';
import { AddServiceInvoiceModal } from '../modals/AddServiceInvoiceModal';
import { getAdditionalInvoiceWhatsAppUrl, getConsolidatedCollectionWhatsAppUrl } from '../../utils/whatsappMessages';
import { formatStandardDateTime } from '../../utils/dateFormatters';
import {
  ShieldCheck,
  Sparkles,
  DollarSign,
  CheckCircle2,
  Clock,
  Camera,
  Trash2,
  Eye,
  EyeOff,
  FileCheck,
  Loader2,
  CreditCard,
  FilePlus,
  FileText,
  Send,
  MessageCircle,
  AlertTriangle,
  Copy,
  Check,
  Lock,
} from 'lucide-react';
import {
  generateInvoiceWhatsAppMessage,
  getInvoiceWhatsAppUrl,
  generatePaymentReceiptWhatsAppMessage,
  getPaymentReceiptWhatsAppUrl,
  generateOverdueWarningWhatsAppMessage,
  getOverdueWarningWhatsAppUrl,
  generateLegalActionExecutedWhatsAppMessage,
  getLegalActionExecutedWhatsAppUrl,
} from '../../utils/whatsappMessages';

interface EditPackagePaymentTabProps {
  formData: Business;
  setFormData: React.Dispatch<React.SetStateAction<Business | null>>;
  isEditMode: boolean;
  isAdminOrFinancial: boolean;
  canEdit: boolean;
  remainingDebt: number;
  handleToggleFeeExempt: (isExempt: boolean) => void;
  onShowInvoice?: (business: Business, additionalInvoiceId?: string) => void;
  onSaveAdditionalInvoice?: (newInv: AdditionalServiceInvoice) => void;
  onDeleteAdditionalInvoice?: (invoiceId: string) => void;
  onPayAdditionalInvoice?: (invoiceId: string) => void;
  copiedField?: string | null;
  handleCopyText?: (text: string, fieldName: string) => void;
  currentUserName?: string;
  currentUserRole?: string;
}

export const EditPackagePaymentTab: React.FC<EditPackagePaymentTabProps> = ({
  formData,
  setFormData,
  isEditMode,
  isAdminOrFinancial,
  canEdit,
  remainingDebt,
  handleToggleFeeExempt,
  onShowInvoice,
  onSaveAdditionalInvoice,
  onDeleteAdditionalInvoice,
  onPayAdditionalInvoice,
  copiedField,
  handleCopyText,
  currentUserName,
  currentUserRole,
}) => {
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<AdditionalServiceInvoice | null>(null);
  const [invoiceToPay, setInvoiceToPay] = useState<AdditionalServiceInvoice | null>(null);
  const [expandedFinancialWaPreview, setExpandedFinancialWaPreview] = useState<string | null>(null);
  const [isCompressingReceipt, setIsCompressingReceipt] = useState(false);
  const [selectedReceiptPreview, setSelectedReceiptPreview] = useState<string | null>(null);
  const [receiptError, setReceiptError] = useState<string>('');
  const [showConfirmRemoveReceipt, setShowConfirmRemoveReceipt] = useState(false);

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptError('');
    try {
      setIsCompressingReceipt(true);
      const compressed = await compressImageFile(file, 1400, 1400, 0.82, { applyWatermark: false });
      setFormData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          paymentReceiptPhoto: compressed,
          paymentReceiptDate: new Date().toISOString(),
        };
      });
    } catch (err) {
      console.error('Error compressing receipt image:', err);
      setReceiptError('حدث خطأ أثناء معالجة الصورة، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsCompressingReceipt(false);
    }
  };

  const handleRemoveReceipt = () => {
    setShowConfirmRemoveReceipt(true);
  };
  return (
    <div className="space-y-3.5 text-right">
      {/* 🔐 Notice for Representatives */}
      {!isAdminOrFinancial && (
        <div className="bg-sky-500/10 border border-sky-500/30 text-sky-800 dark:text-sky-300 p-3.5 rounded-2xl text-xs font-bold leading-relaxed flex items-center gap-2.5 shadow-2xs">
          <ShieldCheck className="w-5 h-5 text-sky-500 shrink-0" />
          <span>تنبيه: الفاتورة مؤجلة السداد لحين اكتمال التوثيق. التحصيل والسداد المالي يتم إلكترونياً ويُدار حصرياً من قِبل إدارة المنظومة ومسؤولي الحسابات.</span>
        </div>
      )}

      {/* 🌟 Special Fee Exemption Box for Responsible Accounts */}
      {isAdminOrFinancial && (
        <div
          className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
            formData.isFeeExempt
              ? 'bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 border-emerald-500/50 shadow-md'
              : 'bg-[var(--input-bg)] border-[var(--border-color)]'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                  formData.isFeeExempt ? 'bg-emerald-500 text-white shadow-sm' : 'bg-emerald-500/10 text-emerald-500'
                }`}
              >
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
              <span
                className={`text-xs font-black px-3 py-1.5 rounded-xl border ${
                  formData.isFeeExempt
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-700/40 text-slate-400 border-slate-600'
                }`}
              >
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
          {isEditMode && isAdminOrFinancial ? (
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
            <div className="font-black text-sm text-[var(--text-primary)] pt-0.5">
              {formData.packageName ||
                (formData.isAlreadyOnGoogle
                  ? ALREADY_ON_GOOGLE_PACKAGE.title
                  : formData.isFeeExempt
                  ? 'نشاط رائج بالمنطقة (إدراج مجاني بدون رسوم)'
                  : '1. باقة التوثيق الأساسي')}
            </div>
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
          {isEditMode && isAdminOrFinancial && !formData.isFeeExempt ? (
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
          <div
            className={`font-black text-base pt-0.5 ${
              remainingDebt > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600'
            }`}
          >
            {formData.isFeeExempt ? '0 ج.م (لا يوجد دين)' : `${remainingDebt} ج.م`}
          </div>
        </div>
      </div>

      {/* طريقة الاستلام والسداد */}
      <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3.5 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-emerald-500" />
            <span>طريقة الاستلام والتحصيل المالي:</span>
          </span>
          {isEditMode && isAdminOrFinancial && !formData.isFeeExempt ? (
            <select
              value={formData.paymentMethod || 'platform_collected'}
              onChange={(e) => {
                const meth = e.target.value as Business['paymentMethod'];
                setFormData({
                  ...formData,
                  paymentMethod: meth,
                  cashCollectedByRep: meth === 'cash_by_rep' ? (formData.amountPaid || 0) : 0,
                });
              }}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="platform_collected">تحويل مباشر لحسابات المنصة (إلكتروني / إنستاباي / فودافون كاش)</option>
              <option value="cash_by_rep">كاش مستلم باليد في الشارع بواسطة المندوب</option>
              <option value="gateway_online">بوابة دفع إلكترونية أونلاين</option>
              <option value="bank_transfer">تحويل بنكي رسمي</option>
            </select>
          ) : (
            <span className="text-xs font-black text-amber-700 dark:text-amber-300 bg-amber-500/15 px-2.5 py-1 rounded-lg border border-amber-500/30">
              {formData.paymentMethod === 'cash_by_rep'
                ? '💵 كاش محصل بيد المندوب'
                : formData.paymentMethod === 'bank_transfer'
                ? '🏦 تحويل بنكي'
                : '💳 تحويل لمنظومة المنصة (إنستاباي / كاش)'}
            </span>
          )}
        </div>
      </div>

      {/* ── قسم فواتير الخدمات الإضافية الصادرة عن المنصة (أعلى إيصال السداد لسهولة الوصول) ── */}
      <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-4 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold shrink-0">
              <FilePlus className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
                  فواتير الخدمات الإضافية الصادرة عن المنصة 🧾
                </h4>
                {formData.additionalInvoices && formData.additionalInvoices.length > 0 && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 font-black px-2 py-0.5 rounded-full">
                    {formData.additionalInvoices.length} فاتورة
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] font-bold mt-0.5">
                فواتير إلكترونية لخدمات إضافية تم تحصيلها لحسابات المنصة وتُسجل بالتحصيل العام
              </p>
            </div>
          </div>

          {isAdminOrFinancial && (
            <div className="flex items-center gap-2 flex-wrap">
              {formData.additionalInvoices && formData.additionalInvoices.length > 0 && (
                <a
                  href={getConsolidatedCollectionWhatsAppUrl(formData)}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
                  title="إرسال كشف حساب ومطالبة مالية شاملة بالباقة والخدمات الإضافية عبر واتساب"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>مطالبة واتساب شاملة 💬</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => setShowAddInvoiceModal(true)}
                className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer shrink-0"
              >
                <FilePlus className="w-3.5 h-3.5" />
                <span>إصدار فاتورة خدمة إضافية ➕</span>
              </button>
            </div>
          )}
        </div>

        {/* List of Additional Invoices */}
        {formData.additionalInvoices && formData.additionalInvoices.length > 0 ? (
          <div className="space-y-2.5">
            {formData.additionalInvoices.map((inv) => {
              const remaining = Math.max(0, (inv.amount || 0) - (inv.amountPaid || 0));
              const isPaid = inv.paymentStatus === 'fully_paid' || (inv.amountPaid || 0) >= (inv.amount || 0);
              const isPartiallyOrFullyPaid = isPaid || (inv.amountPaid || 0) > 0;
              const waUrl = getAdditionalInvoiceWhatsAppUrl(formData, inv);

              return (
                <div
                  key={inv.id}
                  className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-amber-500/40 transition-colors"
                >
                  <div className="space-y-1 text-right">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
                        {inv.serviceTitle}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 font-bold bg-[var(--input-bg)] px-2 py-0.5 rounded-md" dir="ltr">
                        {inv.invoiceNumber}
                      </span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          isPaid
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : (inv.amountPaid || 0) > 0
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {isPaid ? 'مدفوعة بالكامل إلكترونياً ✓' : (inv.amountPaid || 0) > 0 ? `متبقي ${remaining} ج` : 'غير مسددة ⏳'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)] font-bold flex-wrap">
                      <span>القيمة: <strong className="text-[var(--text-primary)] font-mono font-black">{inv.amount} ج.م</strong></span>
                      <span>المسدد: <strong className="text-emerald-600 font-mono font-black">{inv.amountPaid || 0} ج.م</strong></span>
                      {remaining > 0 && <span>المتبقي: <strong className="text-rose-600 font-mono font-black">{remaining} ج.م</strong></span>}
                      <span>التاريخ: {inv.issueDate}</span>
                      {inv.issuedByName && <span className="text-[10px] text-slate-400">بواسطة: {inv.issuedByName}</span>}
                    </div>

                    {inv.notes && (
                      <p className="text-[10.5px] text-[var(--text-muted)] bg-[var(--input-bg)] p-1.5 rounded-lg">
                        {inv.notes}
                      </p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 flex-wrap">
                    {/* Individual Invoice Payment Button */}
                    {isAdminOrFinancial && !isPaid && remaining > 0 && (
                      <button
                        type="button"
                        onClick={() => setInvoiceToPay(inv)}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-2xs cursor-pointer active:scale-95"
                        title={`تسجيل سداد الفاتورة إلكترونياً لحسابات المنصة (${remaining} ج.م)`}
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>سداد ({remaining} ج)</span>
                      </button>
                    )}

                    {onShowInvoice && (
                      <button
                        type="button"
                        onClick={() => onShowInvoice(formData, inv.id)}
                        className="bg-[var(--input-bg)] hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-[var(--border-color)] px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                        title="معاينة وطباعة الفاتورة"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>معاينة</span>
                      </button>
                    )}

                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-2xs"
                      title="مشاركة الفاتورة عبر واتساب"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>واتساب</span>
                    </a>

                    {/* Accounting Guardrail: Disable delete for paid invoices */}
                    {isAdminOrFinancial && (
                      isPartiallyOrFullyPaid ? (
                        <button
                          type="button"
                          disabled
                          className="p-1.5 text-slate-500/30 dark:text-slate-600 cursor-not-allowed rounded-xl"
                          title="محظور الحذف: لا يمكن حذف فاتورة تم تحصيلها أو سدادها حفاظاً على النزاهة المحاسبية 🔒"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setInvoiceToDelete(inv)}
                          className="p-1.5 text-rose-500 hover:bg-rose-500/15 rounded-xl transition-colors cursor-pointer"
                          title="حذف الفاتورة غير المسددة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-5 bg-[var(--bg-card)]/50 rounded-2xl border border-dashed border-[var(--border-color)] space-y-1">
            <p className="text-xs font-bold text-[var(--text-muted)]">
              لا توجد فواتير خدمات إضافية صادرة لهذا النشاط حتى الآن.
            </p>
            {isAdminOrFinancial && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                يمكن لإدارة المنصة إصدار فواتير للخدمات المستقلة والتحصيل الإلكتروني عبر الزر أعلاه.
              </p>
            )}
          </div>
        )}
      </div>

      {/* صورة إيصال / لقطة شاشة السداد والتحصيل */}
      <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2.5">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-amber-500" />
            <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
              صورة إيصال / لقطة شاشة سداد النشاط 🧾
            </h4>
          </div>
          {formData.paymentReceiptPhoto && (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-black border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>مرفق ومسجل بالنظام</span>
            </span>
          )}
        </div>

        {formData.paymentReceiptPhoto ? (
          <div className="bg-[var(--bg-card)] border border-emerald-500/40 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <img
                src={formData.paymentReceiptPhoto}
                alt="صورة إيصال التحصيل"
                className="w-16 h-16 object-cover rounded-xl border border-slate-600 bg-slate-900 cursor-pointer hover:opacity-85 transition-opacity shrink-0"
                onClick={() => setSelectedReceiptPreview(formData.paymentReceiptPhoto!)}
                title="اضغط للتكبير والمعاينة"
              />
              <div className="space-y-0.5">
                <p className="text-xs font-black text-[var(--text-primary)] flex items-center gap-1">
                  <FileCheck className="w-4 h-4 text-emerald-500" />
                  <span>تم حفظ وتوثيق إيصال السداد المالي</span>
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {formData.paymentReceiptDate
                    ? `تاريخ الإرفاق: ${formatStandardDateTime(formData.paymentReceiptDate)}`
                    : 'صورة المعاملة والتحويل معتمدة في قسم المالية'}
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedReceiptPreview(formData.paymentReceiptPhoto!)}
                  className="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer pt-0.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>معاينة الإيصال بالحجم الكامل</span>
                </button>
              </div>
            </div>

            {canEdit && (
              <button
                type="button"
                onClick={handleRemoveReceipt}
                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 border border-rose-500/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف الإيصال</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              يرجى إرفاق صورة إيصال التحويل، لقطة شاشة إنستاباي، أو إيصال فودافون كاش لتوثيق وتأكيد سداد النشاط في السجلات المحاسبية.
            </p>

            {canEdit && (
              <label className="border-2 border-dashed border-amber-500/40 hover:border-amber-500 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-[var(--bg-card)]/50 transition-colors hover:bg-amber-500/5">
                {isCompressingReceipt ? (
                  <div className="flex flex-col items-center gap-1.5 py-2">
                    <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                    <span className="text-xs text-amber-500 font-bold">جارٍ معالجة وضغط الصورة...</span>
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-bold text-[var(--text-primary)] block">
                        اضغط هنا لرفع صورة إيصال أو لقطة شاشة السداد
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        يدعم ملفات الصور JPG و PNG
                      </span>
                    </div>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptUpload}
                  disabled={isCompressingReceipt}
                  className="hidden"
                />
              </label>
            )}

            {receiptError && (
              <p className="text-xs text-rose-500 font-bold flex items-center gap-1.5 mt-1" role="alert">
                <span>⚠️</span>
                <span>{receiptError}</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── 💲 قسم رسائل ومطالبات WhatsApp المالية والقانونية ── */}
      {isAdminOrFinancial && (
        <div className="bg-[var(--bg-card)] border border-emerald-500/30 rounded-2xl p-3.5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-black shrink-0">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
                  المراسلات والمطالبات المالية عبر WhatsApp 💲
                </h4>
                <p className="text-[10px] text-[var(--text-muted)] font-bold">
                  إرسال الفواتير، المطالبات، إيصالات السداد، والإنذارات الرسمية
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {/* 1. الفاتورة الإلكترونية الأولية وتأكيد التسجيل */}
            <div className="bg-[var(--input-bg)]/80 border border-[var(--border-color)] hover:border-amber-500/40 rounded-xl p-3 space-y-2 transition-all">
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <div className="flex items-center gap-1.5 font-black text-xs text-[var(--text-primary)]">
                  <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>1. الفاتورة الإلكترونية الأولية وتأكيد التسجيل 📄</span>
                </div>
                <span className="text-[9.5px] bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold px-2 py-0.5 rounded-md">
                  عند التسجيل
                </span>
              </div>

              {expandedFinancialWaPreview === 'fin_inv' && (
                <div className="bg-[var(--bg-card)] p-2.5 rounded-xl border border-[var(--border-color)] text-[11px] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto animate-fade-in font-sans">
                  {generateInvoiceWhatsAppMessage(formData)}
                </div>
              )}

              <div className="flex items-center gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setExpandedFinancialWaPreview(expandedFinancialWaPreview === 'fin_inv' ? null : 'fin_inv')}
                  className="bg-[var(--bg-card)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold py-1.5 px-2.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  title="معاينة نص الرسالة"
                >
                  {expandedFinancialWaPreview === 'fin_inv' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span className="text-[10px] hidden sm:inline">{expandedFinancialWaPreview === 'fin_inv' ? 'إخفاء' : 'معاينة'}</span>
                </button>
                {handleCopyText && (
                  <button
                    type="button"
                    onClick={() => handleCopyText(generateInvoiceWhatsAppMessage(formData), 'fin_inv')}
                    className="bg-[var(--bg-card)] hover:bg-amber-500/15 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
                    title="نسخ نص الرسالة"
                  >
                    {copiedField === 'fin_inv' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-amber-500" />}
                  </button>
                )}
                <a
                  href={getInvoiceWhatsAppUrl(formData)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs py-1.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 text-center"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال الفاتورة للعميل عبر WhatsApp</span>
                </a>
              </div>
            </div>

            {/* 2. رسالة إيصال السداد والمخالصة المالية (مشروطة بسداد كامل المديونية) */}
            {(() => {
              const isFullyPaid = formData.isFeeExempt || remainingDebt === 0 || formData.paymentStatus === 'fully_paid';
              return (
                <div className={`border rounded-xl p-3 space-y-2 transition-all ${
                  isFullyPaid
                    ? 'bg-[var(--input-bg)]/80 border-emerald-500/40 shadow-xs'
                    : 'bg-[var(--input-bg)]/30 border-[var(--border-color)] opacity-60'
                }`}>
                  <div className="flex items-center justify-between gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1.5 font-black text-xs text-[var(--text-primary)]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>2. إيصال السداد والمخالصة المالية الرسمية ✅</span>
                    </div>
                    <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                      isFullyPaid
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-500/20 text-slate-500 dark:text-slate-400'
                    }`}>
                      {isFullyPaid ? 'مسدد بالكامل ✓' : (
                        <>
                          <Lock className="w-2.5 h-2.5" />
                          <span>معطل (بانتظار السداد)</span>
                        </>
                      )}
                    </span>
                  </div>

                  {expandedFinancialWaPreview === 'fin_receipt' && (
                    <div className="bg-[var(--bg-card)] p-2.5 rounded-xl border border-emerald-500/20 text-[11px] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto animate-fade-in font-sans">
                      {generatePaymentReceiptWhatsAppMessage(formData)}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setExpandedFinancialWaPreview(expandedFinancialWaPreview === 'fin_receipt' ? null : 'fin_receipt')}
                      className="bg-[var(--bg-card)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold py-1.5 px-2.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                      title="معاينة نص الرسالة"
                    >
                      {expandedFinancialWaPreview === 'fin_receipt' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span className="text-[10px] hidden sm:inline">{expandedFinancialWaPreview === 'fin_receipt' ? 'إخفاء' : 'معاينة'}</span>
                    </button>
                    {handleCopyText && (
                      <button
                        type="button"
                        onClick={() => handleCopyText(generatePaymentReceiptWhatsAppMessage(formData), 'fin_receipt')}
                        disabled={!isFullyPaid}
                        className="bg-[var(--bg-card)] hover:bg-emerald-500/15 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold p-1.5 rounded-xl transition-colors cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                        title="نسخ نص الإيصال"
                      >
                        {copiedField === 'fin_receipt' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-emerald-500" />}
                      </button>
                    )}
                    {isFullyPaid ? (
                      <a
                        href={getPaymentReceiptWhatsAppUrl(formData)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black text-xs py-1.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 text-center"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>إرسال إيصال السداد والمخالصة للعميل</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="flex-1 bg-slate-800/50 text-slate-500 font-bold text-xs py-1.5 px-3 rounded-xl border border-slate-700/40 cursor-not-allowed text-center"
                        title="تنشط تلقائياً وتضيء بالأخضر فور سداد كامل مستحقات النشاط وتصفير المديونية"
                      >
                        <span>🔒 يتاح فور إتمام سداد كامل المديونية (متبقي {remainingDebt} ج)</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* 3 & 4. رسائل الإنذار والملاحقة القضائية (مقتصرة تماماً على الأنشطة الموثقة ذات المديونية) */}
            {(() => {
              const hasVerifiedGoogleMap = Boolean(
                formData.googleMapsUrl &&
                formData.googleMapsUrl.trim().startsWith('http') &&
                !formData.googleMapsUrl.includes('search/?api=1&query=')
              );
              const isVerifiedWithDebt = hasVerifiedGoogleMap && remainingDebt > 0 && !formData.isFeeExempt;
              if (!isVerifiedWithDebt) return null;

              return (
                <div className="space-y-2.5 pt-1 border-t border-rose-500/20 animate-fade-in">
                  <div className="flex items-center gap-1.5 text-xs font-black text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>رسائل الإنذار والمطالبة القانونية (تظهر فقط للأنشطة الموثقة المتأخرة):</span>
                  </div>

                  {/* إنذار مهلة السداد 24 ساعة */}
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 space-y-2 transition-all">
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5 font-black text-xs text-rose-700 dark:text-rose-400">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>3. إنذار رسمي بانتهاء مهلة السداد بعد التوثيق ⚠️</span>
                      </div>
                      <span className="text-[9.5px] bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold px-2 py-0.5 rounded-md">
                        مهلة 24 ساعة
                      </span>
                    </div>

                    {expandedFinancialWaPreview === 'fin_warn' && (
                      <div className="bg-[var(--bg-card)] p-2.5 rounded-xl border border-rose-500/30 text-[11px] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto animate-fade-in font-sans">
                        {generateOverdueWarningWhatsAppMessage(formData)}
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setExpandedFinancialWaPreview(expandedFinancialWaPreview === 'fin_warn' ? null : 'fin_warn')}
                        className="bg-[var(--bg-card)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold py-1.5 px-2.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                        title="معاينة نص الرسالة"
                      >
                        {expandedFinancialWaPreview === 'fin_warn' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span className="text-[10px] hidden sm:inline">{expandedFinancialWaPreview === 'fin_warn' ? 'إخفاء' : 'معاينة'}</span>
                      </button>
                      {handleCopyText && (
                        <button
                          type="button"
                          onClick={() => handleCopyText(generateOverdueWarningWhatsAppMessage(formData), 'fin_warn')}
                          className="bg-[var(--bg-card)] hover:bg-rose-500/15 text-rose-600 border border-rose-500/30 text-xs font-bold p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
                          title="نسخ نص الإنذار"
                        >
                          {copiedField === 'fin_warn' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-rose-500" />}
                        </button>
                      )}
                      <a
                        href={getOverdueWarningWhatsAppUrl(formData)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 text-white font-black text-xs py-1.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 text-center"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>إرسال إنذار السداد الرسمي</span>
                      </a>
                    </div>
                  </div>

                  {/* إشعار التحذير القضائي والملاحقة */}
                  <div className="bg-red-500/15 border border-red-500/40 rounded-xl p-3 space-y-2 transition-all">
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5 font-black text-xs text-red-700 dark:text-red-400">
                        <ShieldCheck className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <span>4. إشعار تنفيذ الإجراءات والتحذير القضائي 🛑</span>
                      </div>
                      <span className="text-[9.5px] bg-red-500/25 text-red-700 dark:text-red-300 font-black px-2 py-0.5 rounded-md animate-pulse">
                        بعد انتهاء المهلة
                      </span>
                    </div>

                    {expandedFinancialWaPreview === 'fin_legal' && (
                      <div className="bg-[var(--bg-card)] p-2.5 rounded-xl border border-red-500/40 text-[11px] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto animate-fade-in font-sans">
                        {generateLegalActionExecutedWhatsAppMessage(formData)}
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setExpandedFinancialWaPreview(expandedFinancialWaPreview === 'fin_legal' ? null : 'fin_legal')}
                        className="bg-[var(--bg-card)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold py-1.5 px-2.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                        title="معاينة نص الرسالة"
                      >
                        {expandedFinancialWaPreview === 'fin_legal' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span className="text-[10px] hidden sm:inline">{expandedFinancialWaPreview === 'fin_legal' ? 'إخفاء' : 'معاينة'}</span>
                      </button>
                      {handleCopyText && (
                        <button
                          type="button"
                          onClick={() => handleCopyText(generateLegalActionExecutedWhatsAppMessage(formData), 'fin_legal')}
                          className="bg-[var(--bg-card)] hover:bg-red-500/15 text-red-600 border border-red-500/30 text-xs font-bold p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
                          title="نسخ نص الإشعار القضائي"
                        >
                          {copiedField === 'fin_legal' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-red-500" />}
                        </button>
                      )}
                      <a
                        href={getLegalActionExecutedWhatsAppUrl(formData)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 bg-gradient-to-r from-red-700 to-rose-800 hover:from-red-600 text-white font-black text-xs py-1.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 text-center"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>إرسال إشعار التنفيذ والملاحقة</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Modal for issuing a new additional service invoice */}
      <AddServiceInvoiceModal
        business={formData}
        isOpen={showAddInvoiceModal}
        onClose={() => setShowAddInvoiceModal(false)}
        onSaveInvoice={(newInv) => {
          if (onSaveAdditionalInvoice) {
            onSaveAdditionalInvoice(newInv);
          } else {
            setFormData((prev) => {
              if (!prev) return prev;
              const existing = prev.additionalInvoices || [];
              return {
                ...prev,
                additionalInvoices: [newInv, ...existing],
              };
            });
          }
        }}
        currentUserName={currentUserName}
        currentUserRole={currentUserRole}
      />

      {/* Confirm Pay Additional Invoice */}
      <ConfirmDialog
        isOpen={Boolean(invoiceToPay)}
        title="تأكيد سداد الفاتورة الإضافية"
        message={`هل تم استلام وتحصيل مبلغ (${Math.max(0, (invoiceToPay?.amount || 0) - (invoiceToPay?.amountPaid || 0))} ج.م) لحساب المنصة إلكترونياً عن فاتورة "${invoiceToPay?.serviceTitle}"؟ سيتم خصم المبلغ فورياً من إجمالي المديونية وتحديث الحسابات.`}
        confirmLabel="تأكيد السداد والتحصيل ✓"
        cancelLabel="إلغاء"
        variant="warning"
        onConfirm={() => {
          if (!invoiceToPay) return;
          if (onPayAdditionalInvoice) {
            onPayAdditionalInvoice(invoiceToPay.id);
          } else {
            setFormData((prev) => {
              if (!prev) return prev;
              const existing = prev.additionalInvoices || [];
              return {
                ...prev,
                additionalInvoices: existing.map((inv) =>
                  inv.id === invoiceToPay.id
                    ? {
                        ...inv,
                        amountPaid: inv.amount,
                        paymentStatus: 'fully_paid',
                        paymentMethod: 'platform_collected',
                      }
                    : inv
                ),
              };
            });
          }
          setInvoiceToPay(null);
        }}
        onCancel={() => setInvoiceToPay(null)}
      />

      {/* Confirm Delete Additional Invoice */}
      <ConfirmDialog
        isOpen={Boolean(invoiceToDelete)}
        title="حذف فاتورة الخدمة الإضافية"
        message={`هل أنت متأكد من حذف فاتورة "${invoiceToDelete?.serviceTitle}" بقيمة ${invoiceToDelete?.amount} ج.م؟ سيتم خصمها من التحصيل العام للمنظومة.`}
        confirmLabel="حذف الفاتورة"
        cancelLabel="إلغاء"
        variant="danger"
        onConfirm={() => {
          if (!invoiceToDelete) return;
          if (invoiceToDelete.paymentStatus === 'fully_paid' || (invoiceToDelete.amountPaid || 0) > 0) {
            setInvoiceToDelete(null);
            return;
          }
          if (onDeleteAdditionalInvoice) {
            onDeleteAdditionalInvoice(invoiceToDelete.id);
          } else {
            setFormData((prev) => {
              if (!prev) return prev;
              const existing = prev.additionalInvoices || [];
              return {
                ...prev,
                additionalInvoices: existing.filter((inv) => inv.id !== invoiceToDelete.id),
              };
            });
          }
          setInvoiceToDelete(null);
        }}
        onCancel={() => setInvoiceToDelete(null)}
      />

      {/* Lightbox Modal for Receipt Photo Preview */}
      <AdminReceiptModal
        receiptPhoto={selectedReceiptPreview}
        onClose={() => setSelectedReceiptPreview(null)}
      />

      {/* Confirm remove receipt dialog */}
      <ConfirmDialog
        isOpen={showConfirmRemoveReceipt}
        title="حذف إيصال السداد"
        message="هل أنت متأكد من حذف صورة إيصال السداد المرفقة؟"
        confirmLabel="حذف الإيصال"
        cancelLabel="إلغاء"
        variant="danger"
        onConfirm={() => {
          setFormData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              paymentReceiptPhoto: undefined,
              paymentReceiptDate: undefined,
            };
          });
          setShowConfirmRemoveReceipt(false);
        }}
        onCancel={() => setShowConfirmRemoveReceipt(false)}
      />
    </div>
  );
};
