import React from 'react';
import { Award } from 'lucide-react';
import { Representative, Business } from '../../../types';
import { SupervisorMetrics } from '../types';
import { SupervisorSubViewHeader } from '../components/SupervisorSubViewHeader';

export interface SupervisorTargetViewProps {
  selectedGov: string;
  scopedReps: Representative[];
  scopedBusinesses: Business[];
  metrics: SupervisorMetrics;
  onBack: () => void;
}

export const SupervisorTargetView: React.FC<SupervisorTargetViewProps> = ({
  selectedGov,
  scopedReps,
  scopedBusinesses,
  metrics,
  onBack,
}) => {
  return (
    <div className="space-y-4 animate-fade-in">
      <SupervisorSubViewHeader
        title={`إنجاز مستهدف ${selectedGov}`}
        count={metrics.totalBusinesses}
        badge={`المطلوب: ${metrics.effectiveGovTarget} منشأة`}
        selectedGov={selectedGov}
        onBack={onBack}
      />

      {/* Large Target Overview Card */}
      <div className="bg-gradient-to-br from-amber-500/10 via-[var(--bg-card)] to-teal-500/10 border-2 border-amber-500/30 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-black text-[var(--text-primary)]">
              نسبة تحقيق المستهدف الشهري لمحافظة {selectedGov}
            </h3>
            <p className="text-xs text-[var(--text-muted)] font-bold mt-0.5">
              إجمالي التوثيق الميداني المعتمد والمقدم بواسطة المناديب
            </p>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 font-mono">
            {metrics.targetPercent}%
          </div>
        </div>

        <div className="w-full bg-[var(--bg-secondary)] h-3 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-500 h-full rounded-full transition-all duration-700"
            style={{ width: `${metrics.targetPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
          <span>المحقق: {metrics.totalBusinesses} نشاط</span>
          <span>المستهدف: {metrics.effectiveGovTarget} نشاط</span>
        </div>
      </div>

      {/* Reps Leaderboard */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 shadow-xs space-y-3">
        <h3 className="text-xs sm:text-sm font-black text-[var(--text-primary)] flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-500" />
          <span>ترتيب إنتاجية المناديب في {selectedGov}</span>
        </h3>

        <div className="space-y-2">
          {scopedReps
            .map((rep) => {
              const repBizCount = scopedBusinesses.filter(
                (b) => b.repId === rep.id || b.repName === rep.name
              ).length;
              const repTarget = rep.targetMonth || 25;
              const repPercent = Math.min(
                100,
                Math.round((repBizCount / repTarget) * 100)
              );
              return { rep, repBizCount, repTarget, repPercent };
            })
            .sort((a, b) => b.repBizCount - a.repBizCount)
            .map((item, index) => (
              <div
                key={item.rep.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--border-color)] gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-800 font-black text-xs flex items-center justify-center shrink-0">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </span>
                  <div className="min-w-0">
                    <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)] truncate">
                      {item.rep.name}
                    </h4>
                    <span className="text-[10px] text-[var(--text-muted)] font-bold">
                      {item.repBizCount} من {item.repTarget} منشأة
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-20 sm:w-32 bg-[var(--bg-card)] h-2 rounded-full overflow-hidden hidden sm:block">
                    <div
                      className="bg-amber-500 h-full rounded-full"
                      style={{ width: `${item.repPercent}%` }}
                    />
                  </div>
                  <span className="text-xs font-black font-mono text-amber-600">
                    {item.repPercent}%
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
