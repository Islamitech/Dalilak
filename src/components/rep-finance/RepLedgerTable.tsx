import React from 'react';
import { PayoutRequest } from '../../types';
import { PAYOUT_METHOD_LABELS } from '../../utils/commission';
import { formatStandardDateTime } from '../../utils/dateFormatters';
import {
  History as HistoryIcon,
  Calendar,
  FileText,
  Printer,
  CreditCard,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export interface RepLedgerTableProps {
  myPayouts: PayoutRequest[];
  repMonthlyProfits: any[];
  onOpenAnnualStatement: () => void;
}

export const RepLedgerTable: React.FC<RepLedgerTableProps> = ({
  myPayouts,
  repMonthlyProfits,
  onOpenAnnualStatement,
}) => {
  return (
    <>
      {/* 📋 Payout & Remittance Requests History Tracker */}
      <div className="pt-3 border-t border-[var(--border-color)] space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-black text-xs text-[var(--text-primary)] flex items-center gap-1.5">
            <HistoryIcon className="w-4 h-4 text-emerald-500" />
            <span>سجل ومتابعة طلبات سحب العمولات والتوريد ({myPayouts.length})</span>
          </h4>
          <span className="text-[10px] text-[var(--text-muted)] font-bold">تحديث فوري ومباشر</span>
        </div>

        {myPayouts.length > 0 ? (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {myPayouts.map((payout) => {
              const isRemit = payout.type === 'remittance';
              const isPending = payout.status === 'pending';
              const isApproved = payout.status === 'approved';
              const isRejected = payout.status === 'rejected';

              return (
                <div
                  key={payout.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    isPending
                      ? 'bg-amber-500/5 border-amber-500/30'
                      : isApproved
                      ? 'bg-emerald-500/5 border-emerald-500/30'
                      : 'bg-rose-500/5 border-rose-500/30'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                          isRemit ? 'bg-blue-500/15 text-blue-600' : 'bg-emerald-500/15 text-emerald-600'
                        }`}
                      >
                        {isRemit ? <CreditCard className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-xs text-[var(--text-primary)]">
                            {isRemit ? 'إشعار توريد سداد للمنصة' : 'طلب سحب عمولة أرباح'}
                          </span>
                          <span className="font-mono font-black text-xs text-[var(--text-primary)]">
                            {payout.amount.toLocaleString()} ج.م
                          </span>
                        </div>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                          {PAYOUT_METHOD_LABELS[payout.method]} • {payout.accountDetails} •{' '}
                          <span className="font-mono dir-ltr">
                            {formatStandardDateTime(payout.requestDate)}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isPending && (
                        <span className="badge-warning text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3 animate-pulse" />
                          <span>قيد المراجعة ⏳</span>
                        </span>
                      )}
                      {isApproved && (
                        <div className="text-left sm:text-right">
                          <span className="badge-success text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{isRemit ? 'تم اعتماد السداد ✅' : 'تم الصرف والتحويل ✅'}</span>
                          </span>
                          {payout.transactionRef && (
                            <p className="text-[9px] text-[var(--text-muted)] font-mono mt-0.5">
                              رقم المعاملة: {payout.transactionRef}
                            </p>
                          )}
                        </div>
                      )}
                      {isRejected && (
                        <div className="text-left sm:text-right">
                          <span className="badge-danger text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                            <span>مرفوض ❌</span>
                          </span>
                          {payout.adminNotes && (
                            <p className="text-[9px] text-rose-500 font-bold mt-0.5">
                              السبب: {payout.adminNotes}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border border-dashed border-[var(--border-color)] rounded-2xl p-4 text-center text-xs text-[var(--text-muted)] font-bold bg-[var(--input-bg)]/40">
            <p className="text-[var(--text-primary)] font-bold">لا توجد طلبات سحب سابقة مسجلة</p>
          </div>
        )}
      </div>

      {/* ── 📅 MONTHLY PROFITS & EARNINGS BREAKDOWN ── */}
      <div className="pt-4 border-t border-[var(--border-color)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
              سجل الأرباح والدخل الشهري التراكمي ({repMonthlyProfits.length} شهور)
            </h4>
          </div>
          <span className="text-[10.5px] text-[var(--text-muted)] font-bold">
            تحديث فوري لكل فترة
          </span>
        </div>

        {repMonthlyProfits.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {repMonthlyProfits.map((m) => {
              const netRemaining = Math.max(0, m.earnedCommission - m.payoutsReceived);
              return (
                <div
                  key={m.monthKey}
                  className="bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-amber-500/40 rounded-2xl p-3.5 space-y-2.5 shadow-xs transition-all"
                >
                  <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                    <div className="flex items-center gap-1.5 font-black text-xs text-[var(--text-primary)]">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>{m.monthLabel}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700">
                      {m.verifiedBiz} موثق ✅
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-[var(--bg-card)] p-2 rounded-xl border border-[var(--border-color)]">
                      <span className="text-[9.5px] text-[var(--text-muted)] font-bold block">
                        مبيعات الشهر
                      </span>
                      <span className="font-black text-xs text-[var(--text-primary)] font-mono">
                        {m.totalSales.toLocaleString()} ج.م
                      </span>
                    </div>

                    <div className="bg-[var(--bg-card)] p-2 rounded-xl border border-[var(--border-color)]">
                      <span className="text-[9.5px] text-[var(--text-muted)] font-bold block">
                        العمولة المكتسبة
                      </span>
                      <span className="font-black text-xs text-emerald-600 font-mono">
                        {m.earnedCommission.toLocaleString()} ج.م
                      </span>
                    </div>

                    <div className="bg-[var(--bg-card)] p-2 rounded-xl border border-[var(--border-color)]">
                      <span className="text-[9.5px] text-[var(--text-muted)] font-bold block">
                        المصروف بحوالات
                      </span>
                      <span className="font-black text-xs text-blue-600 font-mono">
                        {m.payoutsReceived.toLocaleString()} ج.م
                      </span>
                    </div>

                    <div className="bg-[var(--bg-card)] p-2 rounded-xl border border-[var(--border-color)]">
                      <span className="text-[9.5px] text-[var(--text-muted)] font-bold block">
                        المتبقي الصافي
                      </span>
                      <span className="font-black text-xs text-amber-600 font-mono">
                        {netRemaining.toLocaleString()} ج.م
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-xs text-[var(--text-muted)] py-3">
            لا توجد أرباح مسجلة بعد.
          </p>
        )}
      </div>

      {/* ── 🏛️ ANNUAL STATEMENT & FISCAL ARCHIVE ── */}
      <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 border-2 border-amber-500/30 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-black text-sm text-[var(--text-primary)]">
              كشف الحساب والأرشيف المالي السنوي الرسمي
            </h4>
            <p className="text-[11px] text-[var(--text-muted)] font-medium">
              إصدار كشف حساب سنوي معتمد موثق بختم المنظومة لكافة العمليات والعمولات
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenAnnualStatement}
          className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-95 shrink-0"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة كشف الحساب السنوي</span>
        </button>
      </div>
    </>
  );
};
