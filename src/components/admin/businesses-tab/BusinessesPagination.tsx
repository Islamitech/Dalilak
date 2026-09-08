import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

export interface BusinessesPaginationProps {
  bizPage: number;
  setBizPage: React.Dispatch<React.SetStateAction<number>>;
  totalBizPages: number;
  bizPageSize: number;
  totalFilteredCount: number;
}

export const BusinessesPagination: React.FC<BusinessesPaginationProps> = ({
  bizPage,
  setBizPage,
  totalBizPages,
  bizPageSize,
  totalFilteredCount,
}) => {
  if (totalBizPages <= 1) return null;

  const startIdx = (bizPage - 1) * bizPageSize + 1;
  const endIdx = Math.min(totalFilteredCount, bizPage * bizPageSize);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs">
      <span className="text-[var(--text-muted)] font-bold">
        عرض {startIdx} إلى {endIdx} من {totalFilteredCount} نشاط
      </span>

      <div className="flex items-center gap-1 bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--border-color)]">
        <button
          type="button"
          disabled={bizPage === 1}
          onClick={() => setBizPage((p) => Math.max(1, p - 1))}
          className="px-2.5 py-1 rounded-lg text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-amber-500/10 cursor-pointer flex items-center gap-1"
        >
          <ChevronRight className="w-4 h-4" />
          <span>السابق</span>
        </button>

        <div className="flex items-center gap-1 px-2 font-mono font-bold text-[var(--text-primary)]">
          <span>{bizPage}</span> / <span>{totalBizPages}</span>
        </div>

        <button
          type="button"
          disabled={bizPage === totalBizPages}
          onClick={() => setBizPage((p) => Math.min(totalBizPages, p + 1))}
          className="px-2.5 py-1 rounded-lg text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-amber-500/10 cursor-pointer flex items-center gap-1"
        >
          <span>التالي</span>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
