import React, { useMemo } from 'react';
import { Search, Building2 } from 'lucide-react';
import { Business } from '../../../types';
import { UniversalListingCard } from '../../design-system/UniversalListingCard';
import { SupervisorMetrics } from '../types';
import { SupervisorSubViewHeader } from '../components/SupervisorSubViewHeader';

export interface SupervisorBusinessesViewProps {
  selectedGov: string;
  scopedBusinesses: Business[];
  metrics: SupervisorMetrics;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  bizStatusFilter: 'all' | 'pending' | 'verified' | 'unpaid';
  setBizStatusFilter: (status: 'all' | 'pending' | 'verified' | 'unpaid') => void;
  onBack: () => void;
  onSelectDrawerBiz: (biz: Business) => void;
}

export const SupervisorBusinessesView: React.FC<SupervisorBusinessesViewProps> = ({
  selectedGov,
  scopedBusinesses,
  metrics,
  searchQuery,
  setSearchQuery,
  bizStatusFilter,
  setBizStatusFilter,
  onBack,
  onSelectDrawerBiz,
}) => {
  const filteredBusinesses = useMemo(() => {
    return scopedBusinesses.filter((b) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          b.nameAr.toLowerCase().includes(q) ||
          (b.nameEn && b.nameEn.toLowerCase().includes(q)) ||
          b.city.toLowerCase().includes(q) ||
          b.phone.includes(q) ||
          b.invoiceNumber.toLowerCase().includes(q) ||
          (b.repName && b.repName.toLowerCase().includes(q));
        if (!match) return false;
      }
      if (bizStatusFilter === 'pending') {
        return b.verificationStatus === 'pending' || b.verificationStatus === 'in_progress';
      }
      if (bizStatusFilter === 'verified') {
        return b.verificationStatus === 'verified';
      }
      if (bizStatusFilter === 'unpaid') {
        return b.paymentStatus === 'unpaid';
      }
      return true;
    });
  }, [scopedBusinesses, searchQuery, bizStatusFilter]);

  return (
    <div className="space-y-4 animate-fade-in">
      <SupervisorSubViewHeader
        title={`منشآت محافظة ${selectedGov}`}
        count={filteredBusinesses.length}
        badge={`${metrics.pendingBusinesses} قيد المراجعة`}
        selectedGov={selectedGov}
        onBack={onBack}
      />

      {/* Filter Bar */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-3 rounded-2xl shadow-xs space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم المنشأة، المندوب، الهاتف..."
            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl pr-9 pl-3 py-2 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setBizStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
              bizStatusFilter === 'all'
                ? 'bg-amber-500 text-slate-950 border-amber-500 font-black'
                : 'bg-[var(--input-bg)] text-[var(--text-muted)] border-[var(--border-color)]'
            }`}
          >
            الكل ({scopedBusinesses.length})
          </button>
          <button
            type="button"
            onClick={() => setBizStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
              bizStatusFilter === 'pending'
                ? 'bg-amber-500 text-slate-950 border-amber-500 font-black'
                : 'bg-[var(--input-bg)] text-amber-700 border-[var(--border-color)]'
            }`}
          >
            بانتظار الفحص ({metrics.pendingBusinesses})
          </button>
          <button
            type="button"
            onClick={() => setBizStatusFilter('verified')}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
              bizStatusFilter === 'verified'
                ? 'bg-amber-500 text-slate-950 border-amber-500 font-black'
                : 'bg-[var(--input-bg)] text-emerald-700 border-[var(--border-color)]'
            }`}
          >
            معتمد ({metrics.verifiedBusinesses})
          </button>
          <button
            type="button"
            onClick={() => setBizStatusFilter('unpaid')}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
              bizStatusFilter === 'unpaid'
                ? 'bg-amber-500 text-slate-950 border-amber-500 font-black'
                : 'bg-[var(--input-bg)] text-rose-700 border-[var(--border-color)]'
            }`}
          >
            غير مسدد ({metrics.unpaidBusinesses})
          </button>
        </div>
      </div>

      {/* Businesses Listing */}
      <div className="space-y-2.5">
        {filteredBusinesses.map((biz) => (
          <UniversalListingCard
            key={biz.id}
            business={biz}
            variant="row"
            showAdminMetrics={true}
            onClick={(b) => onSelectDrawerBiz(b)}
          />
        ))}

        {filteredBusinesses.length === 0 && (
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-8 text-center text-xs font-bold text-[var(--text-muted)] space-y-2">
            <Building2 className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-50" />
            <p>لا توجد منشآت مطابقة للبحث في محافظة {selectedGov}</p>
          </div>
        )}
      </div>
    </div>
  );
};
