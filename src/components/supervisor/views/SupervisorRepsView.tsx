import React, { useMemo } from 'react';
import { Search, UserPlus, Phone, Send } from 'lucide-react';
import { Representative, Business, PayoutRequest } from '../../../types';
import { calculateRepSettlement } from '../../../utils/commission';
import { SupervisorSubViewHeader } from '../components/SupervisorSubViewHeader';

export interface SupervisorRepsViewProps {
  selectedGov: string;
  scopedReps: Representative[];
  scopedBusinesses: Business[];
  scopedPayoutRequests: PayoutRequest[];
  activeRepsCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onBack: () => void;
  onAddRepClick: () => void;
  onSelectDossierRep: (rep: Representative) => void;
}

export const SupervisorRepsView: React.FC<SupervisorRepsViewProps> = ({
  selectedGov,
  scopedReps,
  scopedBusinesses,
  scopedPayoutRequests,
  activeRepsCount,
  searchQuery,
  setSearchQuery,
  onBack,
  onAddRepClick,
  onSelectDossierRep,
}) => {
  const filteredReps = useMemo(() => {
    return scopedReps.filter((r) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        (r.email && r.email.toLowerCase().includes(q))
      );
    });
  }, [scopedReps, searchQuery]);

  return (
    <div className="space-y-4 animate-fade-in">
      <SupervisorSubViewHeader
        title={`فريق مناديب ${selectedGov}`}
        count={filteredReps.length}
        badge={`${activeRepsCount} نشط`}
        selectedGov={selectedGov}
        onBack={onBack}
      />

      {/* Controls Bar */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-3 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم أو الهاتف..."
            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl pr-9 pl-3 py-2 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-amber-500"
          />
        </div>

        <button
          type="button"
          onClick={onAddRepClick}
          className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-95 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ إضافة مندوب جديد</span>
        </button>
      </div>

      {/* Reps Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredReps.map((rep) => {
          const repBiz = scopedBusinesses.filter(
            (b) => b.repId === rep.id || b.repName === rep.name
          );
          const repSettlement = calculateRepSettlement(
            rep.id,
            repBiz,
            rep.commissionRate || 42.86,
            scopedPayoutRequests,
            0
          );

          return (
            <div
              key={rep.id}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 shadow-xs hover:border-amber-500/40 transition-all space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={
                      rep.avatar ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80'
                    }
                    alt={rep.name}
                    className="w-12 h-12 rounded-2xl object-cover border border-amber-500/40 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-black text-sm text-[var(--text-primary)] truncate">
                        {rep.name}
                      </h3>
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                          rep.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-700'
                            : 'bg-rose-500/10 text-rose-700'
                        }`}
                      >
                        {rep.status === 'active' ? 'نشط' : 'معلق'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] font-mono flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-amber-500" />
                      <span>{rep.phone}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectDossierRep(rep)}
                  className="text-xs font-black px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 border border-amber-500/30 transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  الملف الإداري
                </button>
              </div>

              {/* Quick Stat Pill in Rep Card */}
              <div className="grid grid-cols-3 gap-2 bg-[var(--input-bg)] p-2.5 rounded-2xl text-center border border-[var(--border-color)] text-xs">
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block font-bold">المنشآت</span>
                  <span className="font-black font-mono text-[var(--text-primary)]">
                    {repBiz.length}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block font-bold">التارجت</span>
                  <span className="font-black font-mono text-amber-600">
                    {rep.targetMonth || 25}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block font-bold">عهدة كاش</span>
                  <span
                    className={`font-black font-mono ${
                      repSettlement.totalCashInHand > 0 ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  >
                    {repSettlement.totalCashInHand} ج.م
                  </span>
                </div>
              </div>

              {/* Actions Row */}
              <div className="flex items-center justify-between pt-1 gap-2">
                <a
                  href={`https://wa.me/2${rep.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 text-xs font-black flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>واتساب</span>
                </a>
                <a
                  href={`tel:${rep.phone}`}
                  className="py-1.5 px-3 rounded-xl bg-[var(--input-bg)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-bold border border-[var(--border-color)] flex items-center justify-center gap-1 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-500" />
                  <span>اتصال</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
