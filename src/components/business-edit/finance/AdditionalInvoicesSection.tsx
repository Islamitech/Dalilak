import React from 'react';
import { Business, AdditionalServiceInvoice } from '../../../types';
import {
  getAdditionalInvoiceWhatsAppUrl,
  getConsolidatedCollectionWhatsAppUrl,
} from '../../../utils/whatsappMessages';
import { FilePlus, Send, DollarSign, FileText, Trash2 } from 'lucide-react';

export interface AdditionalInvoicesSectionProps {
  formData: Business;
  isAdminOrFinancial: boolean;
  onOpenAddInvoiceModal: () => void;
  onPayClick: (invoice: AdditionalServiceInvoice) => void;
  onDeleteClick: (invoice: AdditionalServiceInvoice) => void;
  onShowInvoice?: (business: Business, additionalInvoiceId?: string) => void;
}

export const AdditionalInvoicesSection: React.FC<AdditionalInvoicesSectionProps> = ({
  formData,
  isAdminOrFinancial,
  onOpenAddInvoiceModal,
  onPayClick,
  onDeleteClick,
  onShowInvoice,
}) => {
  return (
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
              onClick={onOpenAddInvoiceModal}
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
            const isPaid =
              inv.paymentStatus === 'fully_paid' || (inv.amountPaid || 0) >= (inv.amount || 0);
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
                    <span
                      className="font-mono text-[10px] text-slate-400 font-bold bg-[var(--input-bg)] px-2 py-0.5 rounded-md"
                      dir="ltr"
                    >
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
                      {isPaid
                        ? 'مدفوعة بالكامل إلكترونياً ✓'
                        : (inv.amountPaid || 0) > 0
                        ? `متبقي ${remaining} ج`
                        : 'غير مسددة ⏳'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)] font-bold flex-wrap">
                    <span>
                      القيمة:{' '}
                      <strong className="text-[var(--text-primary)] font-mono font-black">
                        {inv.amount} ج.م
                      </strong>
                    </span>
                    <span>
                      المسدد:{' '}
                      <strong className="text-emerald-600 font-mono font-black">
                        {inv.amountPaid || 0} ج.م
                      </strong>
                    </span>
                    {remaining > 0 && (
                      <span>
                        المتبقي:{' '}
                        <strong className="text-rose-600 font-mono font-black">
                          {remaining} ج.م
                        </strong>
                      </span>
                    )}
                    <span>التاريخ: {inv.issueDate}</span>
                    {inv.issuedByName && (
                      <span className="text-[10px] text-slate-400">
                        بواسطة: {inv.issuedByName}
                      </span>
                    )}
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
                      onClick={() => onPayClick(inv)}
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
                  {isAdminOrFinancial &&
                    (isPartiallyOrFullyPaid ? (
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
                        onClick={() => onDeleteClick(inv)}
                        className="p-1.5 text-rose-500 hover:bg-rose-500/15 rounded-xl transition-colors cursor-pointer"
                        title="حذف الفاتورة غير المسددة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ))}
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
  );
};
