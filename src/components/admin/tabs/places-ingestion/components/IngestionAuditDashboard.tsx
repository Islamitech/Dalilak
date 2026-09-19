import React from 'react';
import { BarChart3, ShieldCheck } from 'lucide-react';
import { BatchSearchMetrics } from '../types';

interface IngestionAuditDashboardProps {
  metrics: BatchSearchMetrics;
  currentSectorSubZone: string;
  existingSectorBusinessesCount: number;
}

export const IngestionAuditDashboard: React.FC<IngestionAuditDashboardProps> = ({
  metrics,
  currentSectorSubZone,
  existingSectorBusinessesCount,
}) => {
  return (
    <div className="bg-[var(--bg-card)] border border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
          <h4 className="text-sm font-black text-[var(--text-primary)]">
            لوحة تدقيق وتغطية القطاع الميداني: <span className="text-emerald-400">{currentSectorSubZone}</span>
          </h4>
        </div>
        <span className="text-xs font-black bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30">
          تغطية أطلس نشطة ومحققة 100%
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center">
        <div className="p-3 bg-[var(--input-bg)] rounded-2xl border border-[var(--border-color)]">
          <div className="text-[11px] text-[var(--text-muted)] font-bold mb-1">المسجل مسبقاً</div>
          <div className="text-lg font-black text-slate-200 font-mono">{existingSectorBusinessesCount}</div>
        </div>
        <div className="p-3 bg-[var(--input-bg)] rounded-2xl border border-[var(--border-color)]">
          <div className="text-[11px] text-[var(--text-muted)] font-bold mb-1">المكتشف الكلي</div>
          <div className="text-lg font-black text-slate-300 font-mono">{metrics.totalFound}</div>
        </div>
        <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/30">
          <div className="text-[11px] text-emerald-400 font-bold mb-1">🏪 أنشطة تجارية</div>
          <div className="text-lg font-black text-emerald-400 font-mono">{metrics.commercialCount ?? metrics.qualifiedCount}</div>
        </div>
        <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/30">
          <div className="text-[11px] text-blue-400 font-bold mb-1">🏢 مجمعات سكنية</div>
          <div className="text-lg font-black text-blue-400 font-mono">{metrics.residentialCount ?? 0}</div>
        </div>
        <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/30">
          <div className="text-[11px] text-amber-400 font-bold mb-1">🛣️ طرق وبوابات</div>
          <div className="text-lg font-black text-amber-400 font-mono">{metrics.infrastructureCount ?? 0}</div>
        </div>
        <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/30">
          <div className="text-[11px] text-purple-400 font-bold mb-1">🏛️ معالم مدنية</div>
          <div className="text-lg font-black text-purple-400 font-mono">{metrics.civicCount ?? 0}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs font-bold text-[var(--text-muted)]">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>
            إجمالي منشآت {currentSectorSubZone} في دليلك بعد الاستيراد:{' '}
            <strong>{existingSectorBusinessesCount + metrics.qualifiedCount}</strong> منشأة موثقة
          </span>
        </div>
        <div className="font-mono text-amber-400">
          التكلفة الفعلية المقدرة: {metrics.estimatedCost}
        </div>
      </div>
    </div>
  );
};
