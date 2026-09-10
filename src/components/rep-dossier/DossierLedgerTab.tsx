import React from 'react';
import { PayoutRequest } from '../../types';
import { RepSettlementSummary, PAYOUT_METHOD_LABELS } from '../../utils/commission';
import { formatActivityDateTime } from '../../utils/dateFormatters';
import {
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  CreditCard,
} from 'lucide-react';

export interface DossierLedgerTabProps {
  settlement: RepSettlementSummary;
  effectiveRate: number;
  repPayouts: PayoutRequest[];
  onApprovePayout?: (payout: PayoutRequest) => void;
  onRejectPayout?: (payout: PayoutRequest) => void;
}

export const DossierLedgerTab: React.FC<DossierLedgerTabProps> = ({
  settlement,
  effectiveRate,
  repPayouts,
  onApprovePayout,
  onRejectPayout,
}) => {
  return (
    <div className="space-y-4">
      {/* Detailed Mathematical Statement */}
      <div className="bg-[var(--input-bg)] p-4 sm:p-5 rounded-3xl border border-[var(--border-color)] space-y-3.5">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2.5">
          <h4 className="font-black text-sm text-[var(--text-primary)] flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-500" />
            <span>كشف الحساب التفصيلي والتسوية المحاسبية للمندوب</span>
          </h4>
          <span className="text-[10px] font-bold text-[var(--text-muted)]">النسبة المعتمدة: {effectiveRate}%</span>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] font-bold">
            <span>1. إجمالي المبالغ النقدية المحصلة بيد المندوب في الشارع:</span>
            <span className="font-mono text-blue-600 font-black text-sm">
              {settlement.totalCashInHand.toLocaleString()} ج.م
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] font-bold">
            <span>2. استقطاع عمولة المندوب المستحقة فورياً من الكاش ({effectiveRate}%):</span>
            <span className="font-mono text-amber-600 font-black text-sm">
              - {settlement.repShareFromCash.toLocaleString()} ج.م
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] font-bold">
            <span>3. حصة المنصة المستحقة من الكاش المحصل:</span>
            <span className="font-mono text-[var(--text-primary)] font-black text-sm">
              = {settlement.platformShareFromCash.toLocaleString()} ج.م
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] font-bold">
            <span>4. توريدات الكاش المحولة والمعتمدة من المندوب للمنصة:</span>
            <span className="font-mono text-emerald-600 font-black text-sm">
              - {settlement.totalRemittedToPlatform.toLocaleString()} ج.م
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 font-black">
            <span className="text-amber-900">5. المتبقي الفعلي من عهدة الكاش المستحقة للمنصة:</span>
            <span className="font-mono text-amber-700 text-base">
              {settlement.remainingCashDebt.toLocaleString()} ج.م
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] font-bold">
            <span>6. عمولات المندوب من مدفوعات المنصة الإلكترونية + أرباح الإحالة:</span>
            <span className="font-mono text-indigo-600 font-black text-sm">
              + {(settlement.totalEarnedCommission - settlement.repShareFromCash).toLocaleString()} ج.م
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] font-bold">
            <span>7. الحوالات المنصرفة فعلياً للمندوب (فودافون كاش / إنستاباي / بنك):</span>
            <span className="font-mono text-rose-600 font-black text-sm">
              - {settlement.totalPaidOut.toLocaleString()} ج.م
            </span>
          </div>

          {/* Net Ledger Result Card */}
          <div
            className={`p-3.5 rounded-2xl border-2 flex items-center justify-between text-sm font-black ${
              settlement.isDebtToPlatform
                ? 'bg-rose-500/15 border-rose-500/60 text-rose-700 shadow-md'
                : 'bg-emerald-500/15 border-emerald-500/60 text-emerald-700 shadow-md'
            }`}
          >
            <div className="flex items-center gap-2">
              {settlement.isDebtToPlatform ? (
                <AlertTriangle className="w-5 h-5 text-rose-500" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              )}
              <span>
                {settlement.isDebtToPlatform
                  ? 'الموقف النهائي: عهدة كاش مستحقة على المندوب مطلوب توريدها'
                  : 'الموقف النهائي: رصيد دائن مستحق للمندوب متاح للسحب'}
              </span>
            </div>
            <span className="font-mono text-lg">
              {settlement.isDebtToPlatform
                ? settlement.debtToPlatformAmount.toLocaleString()
                : settlement.withdrawableBalance.toLocaleString()}{' '}
              ج.م
            </span>
          </div>
        </div>
      </div>

      {/* Transactions History Table */}
      <div className="bg-[var(--input-bg)] p-4 rounded-3xl border border-[var(--border-color)] space-y-3">
        <h4 className="font-black text-sm text-[var(--text-primary)] flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-amber-500" />
          <span>سجل طلبات السحب والحوالات وتوريدات الكاش ({repPayouts.length})</span>
        </h4>

        {repPayouts.length === 0 ? (
          <p className="text-center text-xs text-[var(--text-muted)] font-bold py-4">
            لا توجد طلبات سحب أو توريدات مسجلة لهذا الحساب حتى الآن
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[var(--border-color)]">
            <table className="w-full text-xs text-right border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-[var(--bg-card)] text-[var(--text-secondary)] border-b border-[var(--border-color)] font-bold">
                  <th className="p-2.5">رقم الطلب والتاريخ</th>
                  <th className="p-2.5">النوع والوسيلة</th>
                  <th className="p-2.5">المبلغ</th>
                  <th className="p-2.5">الحالة</th>
                  <th className="p-2.5 text-center">التحكم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {repPayouts.map((p) => {
                  const isRemittance = p.type === 'remittance';
                  const isApproved = p.status === 'approved';
                  const isPending = p.status === 'pending';

                  return (
                    <tr key={p.id} className="hover:bg-amber-500/5">
                      <td className="p-2.5">
                        <span className="font-mono font-bold text-[var(--text-primary)]">{p.id}</span>
                        <p className="text-[10px] text-[var(--text-muted)]">{formatActivityDateTime(p.requestDate)}</p>
                      </td>

                      <td className="p-2.5">
                        <span className={`font-bold ${isRemittance ? 'text-blue-600' : 'text-purple-600'}`}>
                          {isRemittance ? 'توريد كاش للمنصة' : 'سحب عمولة للمندوب'}
                        </span>
                        <p className="text-[10px] text-[var(--text-muted)] font-mono">
                          {PAYOUT_METHOD_LABELS[p.method] || p.method}
                        </p>
                      </td>

                      <td className="p-2.5 font-black font-mono text-sm text-emerald-600">
                        {p.amount.toLocaleString()} ج.م
                      </td>

                      <td className="p-2.5">
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                            isApproved
                              ? 'badge-success'
                              : isPending
                              ? 'badge-warning animate-pulse'
                              : 'badge-danger'
                          }`}
                        >
                          {isApproved ? 'مكتمل ومعتمد' : isPending ? 'قيد المراجعة' : 'مرفوض'}
                        </span>
                      </td>

                      <td className="p-2.5 text-center">
                        {isPending && (
                          <div className="flex items-center justify-center gap-1.5">
                            {onApprovePayout && (
                              <button
                                type="button"
                                onClick={() => onApprovePayout(p)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-2 py-1 rounded-lg cursor-pointer transition-colors"
                              >
                                اعتماد
                              </button>
                            )}
                            {onRejectPayout && (
                              <button
                                type="button"
                                onClick={() => onRejectPayout(p)}
                                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] px-2 py-1 rounded-lg cursor-pointer transition-colors"
                              >
                                رفض
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
