import React, { useMemo } from 'react';
import { Search, Send } from 'lucide-react';
import { InterestedLead } from '../../../types';
import { SupervisorSubViewHeader } from '../components/SupervisorSubViewHeader';

export interface SupervisorLeadsViewProps {
  selectedGov: string;
  scopedLeads: InterestedLead[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  leadInterestFilter: 'all' | 'high' | 'medium' | 'trending_free';
  setLeadInterestFilter: (filter: 'all' | 'high' | 'medium' | 'trending_free') => void;
  onBack: () => void;
  onSelectLeadForWhatsApp: (lead: InterestedLead) => void;
  onDirectConvertLead?: (lead: InterestedLead) => void;
}

export const SupervisorLeadsView: React.FC<SupervisorLeadsViewProps> = ({
  selectedGov,
  scopedLeads,
  searchQuery,
  setSearchQuery,
  leadInterestFilter,
  setLeadInterestFilter,
  onBack,
  onSelectLeadForWhatsApp,
  onDirectConvertLead,
}) => {
  const filteredLeads = useMemo(() => {
    return scopedLeads.filter((l) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          l.clientName.toLowerCase().includes(q) ||
          (l.businessName && l.businessName.toLowerCase().includes(q)) ||
          l.phone.includes(q);
        if (!match) return false;
      }
      if (leadInterestFilter === 'all') return true;
      if (leadInterestFilter === 'trending_free') return l.isTrending || l.interestLevel === 'trending_free';
      return l.interestLevel === leadInterestFilter;
    });
  }, [scopedLeads, searchQuery, leadInterestFilter]);

  return (
    <div className="space-y-4 animate-fade-in">
      <SupervisorSubViewHeader
        title={`فرص وعملاء ${selectedGov} (CRM)`}
        count={filteredLeads.length}
        selectedGov={selectedGov}
        onBack={onBack}
      />

      {/* Filter */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-3 rounded-2xl shadow-xs space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم العميل، النشاط، أو الهاتف..."
            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl pr-9 pl-3 py-2 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setLeadInterestFilter('all')}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
              leadInterestFilter === 'all'
                ? 'bg-purple-600 text-white border-purple-600 font-black'
                : 'bg-[var(--input-bg)] text-[var(--text-muted)] border-[var(--border-color)]'
            }`}
          >
            الكل ({scopedLeads.length})
          </button>
          <button
            type="button"
            onClick={() => setLeadInterestFilter('high')}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
              leadInterestFilter === 'high'
                ? 'bg-purple-600 text-white border-purple-600 font-black'
                : 'bg-[var(--input-bg)] text-purple-700 border-[var(--border-color)]'
            }`}
          >
            اهتمام عالي
          </button>
          <button
            type="button"
            onClick={() => setLeadInterestFilter('trending_free')}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
              leadInterestFilter === 'trending_free'
                ? 'bg-purple-600 text-white border-purple-600 font-black'
                : 'bg-[var(--input-bg)] text-amber-700 border-[var(--border-color)]'
            }`}
          >
            منطقة معفاة
          </button>
        </div>
      </div>

      {/* Leads List */}
      <div className="space-y-2.5">
        {filteredLeads.map((lead) => (
          <div
            key={lead.id}
            className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 shadow-xs flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap"
          >
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)] truncate">
                  {lead.clientName}
                </h4>
                {lead.businessName && (
                  <span className="text-[11px] text-[var(--text-muted)] font-bold">
                    ({lead.businessName})
                  </span>
                )}
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700">
                  {lead.interestLevel === 'high'
                    ? 'عالي الاهتمام'
                    : lead.isTrending
                    ? 'منطقة معفاة'
                    : 'عادي'}
                </span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-2">
                <span>الهاتف: {lead.phone}</span>
                {lead.city && <span>• {lead.city}</span>}
                {lead.repName && <span>• المندوب: {lead.repName}</span>}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onSelectLeadForWhatsApp(lead)}
                className="p-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 text-xs font-black flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>مراسلة واتساب</span>
              </button>

              {onDirectConvertLead && (
                <button
                  type="button"
                  onClick={() => onDirectConvertLead(lead)}
                  className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition-all cursor-pointer active:scale-95"
                >
                  تحويل لنشاط
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredLeads.length === 0 && (
          <div className="text-center py-8 text-xs text-[var(--text-muted)] font-bold">
            لا يوجد عملاء مهتمون مسجلون في {selectedGov}
          </div>
        )}
      </div>
    </div>
  );
};
