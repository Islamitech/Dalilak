import React from 'react';
import { ArrowRight } from 'lucide-react';
import { triggerHaptic } from '../../../utils/haptics';

export interface SupervisorSubViewHeaderProps {
  title: string;
  count?: number;
  badge?: string;
  selectedGov: string;
  onBack: () => void;
}

export const SupervisorSubViewHeader: React.FC<SupervisorSubViewHeaderProps> = ({
  title,
  count,
  badge,
  selectedGov,
  onBack,
}) => {
  const handleBack = () => {
    triggerHaptic('selection');
    onBack();
  };

  return (
    <div className="flex items-center justify-between gap-3 mb-4 bg-[var(--bg-card)] border border-[var(--border-color)] p-3.5 sm:p-4 rounded-3xl shadow-xs">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={handleBack}
          className="p-2 sm:p-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-all active:scale-95 cursor-pointer shrink-0"
          aria-label="العودة للمركز الإشرافي"
          title="العودة للمركز الإشرافي"
        >
          <ArrowRight className="w-5 h-5 text-amber-600" />
        </button>
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-black text-[var(--text-primary)] truncate flex items-center gap-2">
            <span>{title}</span>
            {count !== undefined && (
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 border border-amber-500/20 font-mono">
                {count}
              </span>
            )}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {badge && (
          <span className="text-xs font-bold text-[var(--text-muted)] hidden sm:inline">
            {badge}
          </span>
        )}
        <span className="text-xs font-black bg-amber-500/15 text-amber-800 px-2.5 py-1 rounded-xl border border-amber-500/20">
          {selectedGov}
        </span>
      </div>
    </div>
  );
};
