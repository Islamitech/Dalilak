import React from 'react';
import { Banknote, Eye } from 'lucide-react';
import { PayoutRequest } from '../../../types';
import { SupervisorMetrics } from '../types';
import { SupervisorSubViewHeader } from '../components/SupervisorSubViewHeader';

export interface SupervisorFinanceViewProps {
  selectedGov: string;
  scopedPayoutRequests: PayoutRequest[];
  metrics: SupervisorMetrics;
  onBack: () => void;
  onUpdatePayoutRequest?: (payout: PayoutRequest) => void;
  onSelectReceiptPhoto: (photo: string) => void;
  onSetPayoutActionModalData: (data: { payout: PayoutRequest; action: 'approve' | 'reject' } | null) => void;
}

export const SupervisorFinanceView: React.FC<SupervisorFinanceViewProps> = ({
  selectedGov,
  scopedPayoutRequests,
  metrics,
  onBack,
  onUpdatePayoutRequest,
  onSelectReceiptPhoto,
  onSetPayoutActionModalData,
}) => {
  return (
    <div className="space-y-4 animate-fade-in">
      <SupervisorSubViewHeader
        title={`العهد والتحصيلات في ${selectedGov}`}
        count={metrics.totalCashInRepsHands}
        badge={`${metrics.pendingPayoutsCount} طلبات سحب`}
        selectedGov={selectedGov}
        onBack={onBack}
      />

      {/* Finance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-3xl shadow-xs space-y-1 text-right">
          <span className="text-[11px] font-bold text-[var(--text-muted)]">
            إجمالي عهد الكاش بيد المناديب
          </span>
          <div className="text-xl sm:text-2xl font-black text-blue-600 font-mono">
            {metrics.totalCashInRepsHands.toLocaleString()} ج.م
          </div>
          <span className="text-[10px] text-blue-700 font-bold block">
            مبالغ محصلة نقداً تستوجب التوريد
          </span>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-3xl shadow-xs space-y-1 text-right">
          <span className="text-[11px] font-bold text-[var(--text-muted)]">
            مستحقات للمنصة (صافي مديونيات)
          </span>
          <div className="text-xl sm:text-2xl font-black text-amber-600 font-mono">
            {metrics.totalDebtToPlatform.toLocaleString()} ج.م
          </div>
          <span className="text-[10px] text-amber-700 font-bold block">
            مطلوب تحصيلها وتوريدها للشركة
          </span>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-3xl shadow-xs space-y-1 text-right">
          <span className="text-[11px] font-bold text-[var(--text-muted)]">
            طلبات سحب العمولات المعلقة
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 font-mono">
            {metrics.pendingPayoutsAmount.toLocaleString()} ج.م
          </div>
          <span className="text-[10px] text-emerald-700 font-bold block">
            {metrics.pendingPayoutsCount} طلبات بانتظار الاعتماد
          </span>
        </div>
      </div>

      {/* Pending Payout Requests for this governorate */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 shadow-xs space-y-3">
        <h3 className="text-xs sm:text-sm font-black text-[var(--text-primary)] flex items-center gap-2">
          <Banknote className="w-4 h-4 text-emerald-500" />
          <span>طلبات السحب والتوريد بالمحافظة</span>
        </h3>

        <div className="space-y-2">
          {scopedPayoutRequests.map((payout) => (
            <div
              key={payout.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--border-color)] gap-3 flex-wrap sm:flex-nowrap"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
                    {payout.repName || payout.repId}
                  </span>
                  <span
                    className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                      payout.status === 'approved'
                        ? 'bg-emerald-500/10 text-emerald-700'
                        : payout.status === 'rejected'
                        ? 'bg-rose-500/10 text-rose-700'
                        : 'bg-amber-500/10 text-amber-700'
                    }`}
                  >
                    {payout.status === 'approved'
                      ? 'معتمد'
                      : payout.status === 'rejected'
                      ? 'مرفوض'
                      : 'قيد الانتظار'}
                  </span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
                  {payout.method} • {payout.accountDetails || 'بدون تفاصيل'}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs sm:text-sm font-black font-mono text-emerald-600">
                  {payout.amount} ج.م
                </span>

                {payout.receiptPhoto && (
                  <button
                    type="button"
                    onClick={() => onSelectReceiptPhoto(payout.receiptPhoto!)}
                    className="p-1.5 rounded-xl bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 text-xs font-bold cursor-pointer"
                    title="عرض الإيصال"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}

                {payout.status === 'pending' && onUpdatePayoutRequest && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        onSetPayoutActionModalData({ payout, action: 'approve' })
                      }
                      className="px-2.5 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs cursor-pointer"
                    >
                      اعتماد
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onSetPayoutActionModalData({ payout, action: 'reject' })
                      }
                      className="px-2.5 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 font-black text-xs cursor-pointer"
                    >
                      رفض
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {scopedPayoutRequests.length === 0 && (
            <div className="text-center py-6 text-xs text-[var(--text-muted)] font-bold">
              لا توجد طلبات سحب حالياً لمناديب {selectedGov}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
