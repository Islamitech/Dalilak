import React, { useState } from 'react';
import { Business } from '../../../types';
import {
  generateInvoiceWhatsAppMessage,
  getInvoiceWhatsAppUrl,
  generatePaymentReceiptWhatsAppMessage,
  getPaymentReceiptWhatsAppUrl,
  generateOverdueWarningWhatsAppMessage,
  getOverdueWarningWhatsAppUrl,
  generateLegalActionExecutedWhatsAppMessage,
  getLegalActionExecutedWhatsAppUrl,
} from '../../../utils/whatsappMessages';
import {
  MessageCircle,
  FileText,
  Eye,
  EyeOff,
  Check,
  Copy,
  Send,
  CheckCircle2,
  Lock,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';

export interface FinancialWhatsAppMessagesSectionProps {
  formData: Business;
  remainingDebt: number;
  copiedField?: string | null;
  handleCopyText?: (text: string, fieldName: string) => void;
}

export const FinancialWhatsAppMessagesSection: React.FC<FinancialWhatsAppMessagesSectionProps> = ({
  formData,
  remainingDebt,
  copiedField,
  handleCopyText,
}) => {
  const [expandedFinancialWaPreview, setExpandedFinancialWaPreview] = useState<string | null>(null);

  const isFullyPaid =
    formData.isFeeExempt || remainingDebt === 0 || formData.paymentStatus === 'fully_paid';

  const hasVerifiedGoogleMap = Boolean(
    formData.googleMapsUrl &&
      formData.googleMapsUrl.trim().startsWith('http') &&
      !formData.googleMapsUrl.includes('search/?api=1&query=')
  );
  const isVerifiedWithDebt = hasVerifiedGoogleMap && remainingDebt > 0 && !formData.isFeeExempt;

  return (
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
              onClick={() =>
                setExpandedFinancialWaPreview(
                  expandedFinancialWaPreview === 'fin_inv' ? null : 'fin_inv'
                )
              }
              className="bg-[var(--bg-card)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold py-1.5 px-2.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              title="معاينة نص الرسالة"
            >
              {expandedFinancialWaPreview === 'fin_inv' ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
              <span className="text-[10px] hidden sm:inline">
                {expandedFinancialWaPreview === 'fin_inv' ? 'إخفاء' : 'معاينة'}
              </span>
            </button>
            {handleCopyText && (
              <button
                type="button"
                onClick={() =>
                  handleCopyText(generateInvoiceWhatsAppMessage(formData), 'fin_inv')
                }
                className="bg-[var(--bg-card)] hover:bg-amber-500/15 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
                title="نسخ نص الرسالة"
              >
                {copiedField === 'fin_inv' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-amber-500" />
                )}
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

        {/* 2. رسالة إيصال السداد والمخالصة المالية */}
        <div
          className={`border rounded-xl p-3 space-y-2 transition-all ${
            isFullyPaid
              ? 'bg-[var(--input-bg)]/80 border-emerald-500/40 shadow-xs'
              : 'bg-[var(--input-bg)]/30 border-[var(--border-color)] opacity-60'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5 flex-wrap">
            <div className="flex items-center gap-1.5 font-black text-xs text-[var(--text-primary)]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>2. إيصال السداد والمخالصة المالية الرسمية ✅</span>
            </div>
            <span
              className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                isFullyPaid
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-500/20 text-slate-500 dark:text-slate-400'
              }`}
            >
              {isFullyPaid ? (
                'مسدد بالكامل ✓'
              ) : (
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
              onClick={() =>
                setExpandedFinancialWaPreview(
                  expandedFinancialWaPreview === 'fin_receipt' ? null : 'fin_receipt'
                )
              }
              className="bg-[var(--bg-card)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold py-1.5 px-2.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              title="معاينة نص الرسالة"
            >
              {expandedFinancialWaPreview === 'fin_receipt' ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
              <span className="text-[10px] hidden sm:inline">
                {expandedFinancialWaPreview === 'fin_receipt' ? 'إخفاء' : 'معاينة'}
              </span>
            </button>
            {handleCopyText && (
              <button
                type="button"
                onClick={() =>
                  handleCopyText(generatePaymentReceiptWhatsAppMessage(formData), 'fin_receipt')
                }
                disabled={!isFullyPaid}
                className="bg-[var(--bg-card)] hover:bg-emerald-500/15 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold p-1.5 rounded-xl transition-colors cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                title="نسخ نص الإيصال"
              >
                {copiedField === 'fin_receipt' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-emerald-500" />
                )}
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

        {/* 3 & 4. رسائل الإنذار والملاحقة القضائية (مقتصرة على الأنشطة الموثقة ذات المديونية) */}
        {isVerifiedWithDebt && (
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
                  onClick={() =>
                    setExpandedFinancialWaPreview(
                      expandedFinancialWaPreview === 'fin_warn' ? null : 'fin_warn'
                    )
                  }
                  className="bg-[var(--bg-card)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold py-1.5 px-2.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  title="معاينة نص الرسالة"
                >
                  {expandedFinancialWaPreview === 'fin_warn' ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                  <span className="text-[10px] hidden sm:inline">
                    {expandedFinancialWaPreview === 'fin_warn' ? 'إخفاء' : 'معاينة'}
                  </span>
                </button>
                {handleCopyText && (
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyText(generateOverdueWarningWhatsAppMessage(formData), 'fin_warn')
                    }
                    className="bg-[var(--bg-card)] hover:bg-rose-500/15 text-rose-600 border border-rose-500/30 text-xs font-bold p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
                    title="نسخ نص الإنذار"
                  >
                    {copiedField === 'fin_warn' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-rose-500" />
                    )}
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
                  onClick={() =>
                    setExpandedFinancialWaPreview(
                      expandedFinancialWaPreview === 'fin_legal' ? null : 'fin_legal'
                    )
                  }
                  className="bg-[var(--bg-card)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold py-1.5 px-2.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  title="معاينة نص الرسالة"
                >
                  {expandedFinancialWaPreview === 'fin_legal' ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                  <span className="text-[10px] hidden sm:inline">
                    {expandedFinancialWaPreview === 'fin_legal' ? 'إخفاء' : 'معاينة'}
                  </span>
                </button>
                {handleCopyText && (
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyText(
                        generateLegalActionExecutedWhatsAppMessage(formData),
                        'fin_legal'
                      )
                    }
                    className="bg-[var(--bg-card)] hover:bg-red-500/15 text-red-600 border border-red-500/30 text-xs font-bold p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
                    title="نسخ نص الإشعار القضائي"
                  >
                    {copiedField === 'fin_legal' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-red-500" />
                    )}
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
        )}
      </div>
    </div>
  );
};
